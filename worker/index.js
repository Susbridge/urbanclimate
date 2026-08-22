/**
 * Cloudflare Worker — Groq API proxy for Urban Climate Signals
 *
 * Deploy:
 *   1. npm install -g wrangler
 *   2. wrangler login
 *   3. wrangler deploy worker/index.js --name urban-climate-insights --compatibility-date 2024-01-01
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
const MODEL = "llama-3.1-8b-instant";

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
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
          messages: [{ role: "user", content: buildPrompt({ city, aqi, weather }) }],
          max_tokens: 600,
          temperature: 0.4,
          response_format: { type: "json_object" },
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
