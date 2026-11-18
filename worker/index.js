/**
 * Cloudflare Worker — weather and Groq API proxy for Urban Climate Signals
 *
 * Deploy:
 *   1. npm install -g wrangler
 *   2. wrangler login
 *   3. wrangler deploy worker/index.js --name urban-climate --compatibility-date 2024-01-01
 *   4. wrangler secret put GROQ_API_KEY   (paste your key when prompted)
 *
 * The GROQ_API_KEY is stored as a Cloudflare secret — it never appears in
 * source code or the built frontend bundle.
 */

const ALLOWED_ORIGINS = [
  "https://tomiabe.github.io",
  "https://urbanclimate.susbridge.xyz",
  "http://localhost:3000",
  "http://localhost:4173",
];

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

async function fetchForecast(url, timeoutMs) {
  const response = await fetch(url.toString(), {
    signal: AbortSignal.timeout(timeoutMs),
    cf: { cacheTtl: 180, cacheEverything: true },
  });
  if (!response.ok) throw new Error(`Open-Meteo returned ${response.status}`);
  return response.json();
}

function hasCurrentWeather(data) {
  return Number.isFinite(data?.current?.temperature_2m) &&
    Number.isFinite(data?.current?.relative_humidity_2m) &&
    Number.isFinite(data?.current?.wind_speed_10m);
}

function currentFromHourlyForecast(data) {
  if (!Number.isFinite(data.utc_offset_seconds) || !Array.isArray(data.hourly?.time)) {
    throw new Error("Open-Meteo returned incomplete hourly weather data");
  }

  const localHour = new Date(Date.now() + data.utc_offset_seconds * 1000).toISOString().slice(0, 13);
  const index = data.hourly.time.findLastIndex((time) => time <= `${localHour}:00`);
  if (index < 0) throw new Error("Open-Meteo did not return the current hour");

  const current = {
    time: data.hourly.time[index],
    temperature_2m: data.hourly.temperature_2m?.[index],
    relative_humidity_2m: data.hourly.relative_humidity_2m?.[index],
    wind_speed_10m: data.hourly.wind_speed_10m?.[index],
    is_day: data.hourly.is_day?.[index],
  };
  const weather = { current, source: "historical-forecast" };
  if (!hasCurrentWeather(weather)) throw new Error("Open-Meteo returned incomplete hourly weather data");
  return weather;
}

async function fetchWeather(request, headers) {
  const params = new URL(request.url).searchParams;
  const latitude = Number(params.get("latitude"));
  const longitude = Number(params.get("longitude"));
  const timezone = params.get("timezone") || "UTC";

  if (
    !params.has("latitude") || !params.has("longitude") ||
    !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 || Math.abs(longitude) > 180 ||
    timezone.length > 100
  ) {
    return new Response(JSON.stringify({ error: "Invalid weather location" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }

  const upstream = new URL("https://api.open-meteo.com/v1/forecast");
  upstream.searchParams.set("latitude", String(latitude));
  upstream.searchParams.set("longitude", String(longitude));
  upstream.searchParams.set("current", "temperature_2m,relative_humidity_2m,wind_speed_10m,is_day");
  upstream.searchParams.set("timezone", timezone);

  const hourlyFallback = new URL("https://historical-forecast-api.open-meteo.com/v1/forecast");
  hourlyFallback.searchParams.set("latitude", String(latitude));
  hourlyFallback.searchParams.set("longitude", String(longitude));
  hourlyFallback.searchParams.set("hourly", "temperature_2m,relative_humidity_2m,wind_speed_10m,is_day");
  hourlyFallback.searchParams.set("timezone", timezone);
  hourlyFallback.searchParams.set("forecast_days", "1");

  try {
    let data;
    try {
      data = await fetchForecast(upstream, 4000);
      if (!hasCurrentWeather(data)) throw new Error("Open-Meteo returned incomplete weather data");
    } catch (error) {
      console.warn("Current forecast unavailable, using hourly forecast:", error);
      data = currentFromHourlyForecast(await fetchForecast(hourlyFallback, 8000));
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "public, max-age=180" },
    });
  } catch (error) {
    console.error("Weather proxy failed:", error);
    return new Response(JSON.stringify({ error: "Weather data unavailable" }), {
      status: 502,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
}

function buildPrompt({ city, aqi, weather }) {
  const { us_aqi, pm10, pm2_5, nitrogen_dioxide, ozone, carbon_monoxide } = aqi.current;
  const { temperature_2m, relative_humidity_2m, wind_speed_10m } = weather.current;

  return `You are an urban climate analyst. Given real-time environmental data for ${city.name}, ${city.country}, provide location-specific insights.

LIVE DATA:
- City: ${city.name}, ${city.country}
- US AQI: ${us_aqi}
- PM2.5: ${pm2_5} µg/m³
- PM10: ${pm10} µg/m³
- NO₂: ${nitrogen_dioxide} µg/m³
- Ozone: ${ozone} µg/m³
- CO: ${carbon_monoxide} µg/m³
- Temperature: ${temperature_2m}°C
- Humidity: ${relative_humidity_2m}%
- Wind: ${wind_speed_10m} km/h

Respond with a JSON object (no markdown, just raw JSON) with exactly these fields:
{
  "healthImpact": "1-2 sentence health advisory specific to ${city.name} residents and this city's known vulnerabilities (mention city/country by name)",
  "mainDrivers": ["2-4 specific pollution sources most likely for ${city.name} based on the data — reference local context like geography, industry, or climate"],
  "policyInsights": "1-2 sentence policy recommendation most relevant to ${city.name}'s urban context",
  "sdgImpact": "1 sentence on how current conditions affect SDG 3 (Health) and SDG 11 (Sustainable Cities) for ${city.country}",
  "regionalEvents": [
    { "title": "short event headline specific to current conditions in ${city.name}", "type": "Dust|Fire|Heat|Traffic|Air" }
  ]
}

Be specific to ${city.name} — do not give generic advice. Reference local context where possible.`;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders(origin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (request.method === "GET" && new URL(request.url).pathname === "/weather") {
      return fetchWeather(request, headers);
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const { city, aqi, weather } = body;
    if (!city || !aqi || !weather) {
      return new Response(JSON.stringify({ error: "Missing required fields: city, aqi, weather" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    let groqRes;
    try {
      groqRes = await fetch(GROQ_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: "system", content: "Return only JSON that matches the provided schema. Do not include markdown." },
            { role: "user", content: buildPrompt({ city, aqi, weather }) },
          ],
          max_completion_tokens: 2000,
          temperature: 0.2,
          reasoning_effort: "low",
          reasoning_format: "hidden",
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "urban_climate_insight",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  healthImpact: { type: "string" },
                  mainDrivers: { type: "array", items: { type: "string" } },
                  policyInsights: { type: "string" },
                  sdgImpact: { type: "string" },
                  regionalEvents: {
                    type: "array",
                    items: {
                      type: "object",
                      additionalProperties: false,
                      properties: {
                        title: { type: "string" },
                        type: { type: "string", enum: ["Dust", "Fire", "Heat", "Traffic", "Air"] },
                      },
                      required: ["title", "type"],
                    },
                  },
                },
                required: ["healthImpact", "mainDrivers", "policyInsights", "sdgImpact", "regionalEvents"],
              },
            },
          },
        }),
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: "Failed to reach Groq API" }), {
        status: 502,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return new Response(JSON.stringify({ error: "Groq API error", detail: errText }), {
        status: groqRes.status,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const groqData = await groqRes.json();
    const content = groqData.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: "Empty response from Groq" }), {
        status: 502,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return new Response(JSON.stringify({ error: "Groq returned non-JSON content" }), {
        status: 502,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  },
};
