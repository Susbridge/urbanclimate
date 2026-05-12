import { AirQualityData, EnvironmentalData, City } from "../services/api";

export interface Insights {
  status: string;
  color: string;
  textColor: string;
  healthImpact: string;
  mainDrivers: string[];
  policyInsights: string;
  sdgImpact: string;
}

export interface AIInsights {
  healthImpact: string;
  mainDrivers: string[];
  policyInsights: string;
  sdgImpact: string;
  regionalEvents: { title: string; type: string }[];
}

// Synchronous fallback — runs immediately with rule-based heuristics.
export function generateInsights(data: AirQualityData, city?: City): Insights {
  const { us_aqi: aqi, pm10, pm2_5, nitrogen_dioxide: no2 } = data.current;
  const cityName = city?.name ?? "this city";
  const country = city?.country ?? "";

  let status = "Good";
  let color = "bg-emerald-500";
  let textColor = "text-emerald-500";
  let healthImpact = pm2_5 >= 15
    ? `Generally good in ${cityName}, but PM2.5 levels are rising. Sensitive groups (asthma, elderly, pregnancy) should monitor for symptoms.`
    : `Air quality in ${cityName} is satisfactory. Enjoy outdoor activities.`;

  if (aqi > 50 && aqi <= 100) {
    status = "Moderate";
    color = "bg-yellow-500";
    textColor = "text-yellow-500";
    healthImpact = `Acceptable in ${cityName}, but unusually sensitive people should consider reducing prolonged outdoor exertion.`;
  } else if (aqi > 100 && aqi <= 150) {
    status = "Unhealthy for Sensitive Groups";
    color = "bg-orange-500";
    textColor = "text-orange-500";
    healthImpact = `In ${cityName}, children, active adults, and people with respiratory conditions should limit prolonged outdoor exertion.`;
  } else if (aqi > 150 && aqi <= 200) {
    status = "Unhealthy";
    color = "bg-red-500";
    textColor = "text-red-500";
    healthImpact = `Everyone in ${cityName} may begin to experience health effects; sensitive groups should avoid outdoor exertion.`;
  } else if (aqi > 200 && aqi <= 300) {
    status = "Very Unhealthy";
    color = "bg-purple-600";
    textColor = "text-purple-600";
    healthImpact = `Health alert in ${cityName}: The risk of health effects is increased for everyone.`;
  } else if (aqi > 300) {
    status = "Hazardous";
    color = "bg-rose-900";
    textColor = "text-rose-900";
    healthImpact = `Health emergency in ${cityName}: everyone is more likely to be affected. Avoid all outdoor exposure.`;
  }

  const drivers: string[] = [];

  if (pm10 > pm2_5 * 1.8 && pm10 > 40) {
    drivers.push("Dust Transport (Harmattan / Regional)");
    drivers.push("Unpaved Road Dust");
  }

  if (no2 > 30) {
    drivers.push("Heavy Traffic Congestion");
    drivers.push("Diesel Generator Emissions");
  }

  if (pm2_5 > 35 && no2 < 20) {
    drivers.push("Biomass & Waste Burning");
    drivers.push("Regional Haze");
  }

  if (drivers.length === 0) {
    if (pm2_5 > 15) drivers.push("Mixed Urban Emissions");
    else drivers.push("Normal Background Levels");
  }

  let policyInsights = `Investing in continuous air quality monitoring in ${cityName} is the first step to targeted policy.`;
  if (drivers.some(d => d.includes("Diesel"))) {
    policyInsights = `Reducing generator dependence in ${country} through grid reliability improvements could cut local NO₂ and PM2.5 significantly.`;
  } else if (drivers.includes("Biomass & Waste Burning")) {
    policyInsights = `Implementing municipal waste collection and banning open burning near ${cityName} can rapidly improve neighborhood air quality.`;
  } else if (drivers.some(d => d.includes("Dust"))) {
    policyInsights = `While natural dust is hard to control in ${cityName}, early warning systems can help vulnerable populations prepare during high-dust seasons.`;
  }

  let sdgImpact = `Air pollution in ${cityName} directly impacts SDG 3 (Good Health) and SDG 11 (Sustainable Cities).`;
  if (aqi > 100) {
    sdgImpact = `Current levels in ${cityName} pose a direct threat to SDG 3 targets. High PM2.5 exposure is linked to increased respiratory and cardiovascular diseases in ${country}.`;
  }

  return { status, color, textColor, healthImpact, mainDrivers: drivers, policyInsights, sdgImpact };
}

const WORKER_URL = import.meta.env.VITE_INSIGHTS_WORKER_URL as string | undefined;

// Async — calls the Cloudflare Worker proxy which holds the Groq API key server-side.
// Returns null if the worker URL is not configured or the call fails (graceful fallback).
export async function generateAIInsights(
  envData: EnvironmentalData,
  city: City,
): Promise<AIInsights | null> {
  if (!WORKER_URL) return null;

  try {
    const res = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city, aqi: envData.aqi, weather: envData.weather }),
    });

    if (!res.ok) return null;

    const data = await res.json() as AIInsights;

    if (
      typeof data.healthImpact !== "string" ||
      !Array.isArray(data.mainDrivers) ||
      typeof data.policyInsights !== "string" ||
      typeof data.sdgImpact !== "string"
    ) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}
