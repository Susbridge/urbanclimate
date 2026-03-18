import { AirQualityData } from "../services/api";

export interface Insights {
  status: string;
  color: string;
  textColor: string;
  healthImpact: string;
  mainDrivers: string[];
  policyInsights: string;
  sdgImpact: string;
}

export function generateInsights(data: AirQualityData): Insights {
  const { european_aqi: aqi, pm10, pm2_5, nitrogen_dioxide: no2 } = data.current;

  let status = "Good";
  let color = "bg-emerald-500";
  let textColor = "text-emerald-500";
  let healthImpact = pm2_5 >= 15
    ? "Generally good, but PM2.5 levels are creeping up. Sensitive groups (asthma, elderly, pregnancy) should monitor for symptoms."
    : "Air quality is satisfactory. Enjoy outdoor activities.";

  if (aqi > 50 && aqi <= 100) {
    status = "Moderate";
    color = "bg-yellow-500";
    textColor = "text-yellow-500";
    healthImpact = "Acceptable, but unusually sensitive people should consider reducing prolonged outdoor exertion.";
  } else if (aqi > 100 && aqi <= 150) {
    status = "Unhealthy for Sensitive Groups";
    color = "bg-orange-500";
    textColor = "text-orange-500";
    healthImpact = "Children, active adults, and people with respiratory disease should limit prolonged outdoor exertion.";
  } else if (aqi > 150 && aqi <= 200) {
    status = "Unhealthy";
    color = "bg-red-500";
    textColor = "text-red-500";
    healthImpact = "Everyone may begin to experience health effects; sensitive groups should avoid outdoor exertion.";
  } else if (aqi > 200) {
    status = "Very Unhealthy / Hazardous";
    color = "bg-purple-600";
    textColor = "text-purple-600";
    healthImpact = "Health warnings of emergency conditions. The entire population is more likely to be affected.";
  }

  const drivers: string[] = [];

  // Logic to determine likely sources (simplified heuristic for MVP)
  if (pm10 > pm2_5 * 1.8 && pm10 > 40) {
    drivers.push("Harmattan / Saharan Dust Transport");
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

  // Policy insights based on drivers
  let policyInsights = "Investing in continuous air quality monitoring infrastructure is the first step to targeted policy.";
  if (drivers.includes("Diesel Generator Emissions")) {
    policyInsights = "Reducing generator dependence through grid reliability could cut local NO₂ and PM2.5 pollution significantly.";
  } else if (drivers.includes("Biomass & Waste Burning")) {
    policyInsights = "Implementing municipal waste collection and banning open burning can rapidly improve neighborhood air quality.";
  } else if (drivers.includes("Harmattan / Saharan Dust Transport")) {
    policyInsights = "While natural dust is hard to control, early warning systems can help vulnerable populations prepare during high-dust seasons.";
  }

  // SDG Impact
  let sdgImpact = "Air pollution directly impacts SDG 3 (Good Health) and SDG 11 (Sustainable Cities).";
  if (aqi > 100) {
    sdgImpact = "Current levels pose a direct threat to SDG 3 targets. High PM2.5 exposure is linked to increased respiratory and cardiovascular diseases.";
  }

  return {
    status,
    color,
    textColor,
    healthImpact,
    mainDrivers: drivers,
    policyInsights,
    sdgImpact
  };
}
