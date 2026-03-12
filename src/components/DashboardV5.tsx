import React, { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  MapPin,
  AlertTriangle,
  Globe2,
  ChevronDown,
  Activity,
  Wind,
  Droplets,
  ThermometerSun,
  Building,
  Flame,
  HeartPulse,
  TrendingUp,
} from "lucide-react";
import { CITIES, fetchAirQuality, EnvironmentalData } from "../services/api";
import { generateInsights, Insights } from "../lib/insightEngine";
import { cn } from "../lib/utils";

import { ModeToggle } from "./ModeToggle";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

import SystemsMap from "./SystemsMap";
import PolicySimulator from "./PolicySimulator";
import PMChart from "./PMChart";
import SDGTracker from "./SDGTracker";

const AQIGauge = ({ aqi, colorClass }: { aqi: number; colorClass: string }) => {
  const percentage = Math.min((aqi / 300) * 100, 100);

  return (
    <svg viewBox="0 0 36 36" className="w-48 h-48 -rotate-90 drop-shadow-2xl">
      <path
        className="text-black/5 dark:text-white/5"
        strokeWidth="2"
        stroke="currentColor"
        fill="none"
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
      />
      <path
        className={colorClass}
        strokeDasharray={`${percentage}, 100`}
        strokeWidth="2.5"
        strokeLinecap="round"
        stroke="currentColor"
        fill="none"
        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
      />
    </svg>
  );
};

const getBlobColor = (aqi: number) => {
  if (aqi <= 50) return "bg-emerald-400";
  if (aqi <= 100) return "bg-yellow-400";
  if (aqi <= 150) return "bg-orange-500";
  if (aqi <= 200) return "bg-red-500";
  return "bg-purple-600";
};

// Simplified Heat Index calculation (Rothfusz regression approximation)
const calculateHeatIndex = (temp: number, rh: number) => {
  if (temp < 27 || rh < 40) return temp;
  
  const c1 = -8.78469475556;
  const c2 = 1.61139411;
  const c3 = 2.33854883889;
  const c4 = -0.14611605;
  const c5 = -0.012308094;
  const c6 = -0.0164248277778;
  const c7 = 0.002211732;
  const c8 = 0.00072546;
  const c9 = -0.000003582;

  const hi = c1 + (c2 * temp) + (c3 * rh) + (c4 * temp * rh) + (c5 * temp * temp) + (c6 * rh * rh) + (c7 * temp * temp * rh) + (c8 * temp * rh * rh) + (c9 * temp * temp * rh * rh);
  
  return Math.round(hi * 10) / 10;
};

const getAQILabel = (aqi: number) => {
  if (aqi <= 50) return { text: "Good", color: "text-emerald-500", bg: "bg-emerald-500/10" };
  if (aqi <= 100) return { text: "Moderate", color: "text-yellow-500", bg: "bg-yellow-500/10" };
  if (aqi <= 150) return { text: "Unhealthy for Sensitive Groups", color: "text-orange-500", bg: "bg-orange-500/10" };
  if (aqi <= 200) return { text: "Unhealthy", color: "text-red-500", bg: "bg-red-500/10" };
  return { text: "Very Unhealthy", color: "text-purple-600", bg: "bg-purple-600/10" };
};

const getHeatLabel = (temp: number) => {
  if (temp <= 32) return { text: "Safe", color: "text-emerald-500", bg: "bg-emerald-500/10" };
  if (temp <= 39) return { text: "Extreme Caution", color: "text-yellow-500", bg: "bg-yellow-500/10" };
  if (temp <= 51) return { text: "Danger", color: "text-orange-500", bg: "bg-orange-500/10" };
  return { text: "Extreme Danger", color: "text-red-500", bg: "bg-red-500/10" };
};

const getSystemDrivers = (temp: number, humidity: number, wind: number, pm25: number, pm10: number) => {
  const drivers = [];
  
  if (humidity > 55) {
    drivers.push({
      id: 'humidity',
      label: "High Humidity",
      effect: "Heat Stress",
      value: `+${Math.min(45, Math.round((humidity - 50) * 0.8))}%`,
      icon: Droplets,
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    });
  } else if (humidity < 30) {
    drivers.push({
      id: 'dry',
      label: "Extreme Dryness",
      effect: "Dust Suspension",
      value: `+${Math.round((30 - humidity) * 1.2)}%`,
      icon: Wind,
      color: "text-yellow-500",
      bg: "bg-yellow-500/10"
    });
  }

  if (wind < 12) {
    drivers.push({
      id: 'wind',
      label: "Low Wind Speed",
      effect: "Pollution Retention",
      value: `+${Math.min(40, Math.round((12 - wind) * 3.5))}%`,
      icon: Activity,
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    });
  }

  if (pm10 > pm25 * 1.5 && pm10 > 30) {
    drivers.push({
      id: 'dust',
      label: "Coarse Dust (PM10)",
      effect: "AQI Worsening",
      value: `+${Math.round(((pm10 - pm25) / pm10) * 100)}%`,
      icon: AlertTriangle,
      color: "text-orange-500",
      bg: "bg-orange-500/10"
    });
  }

  if (temp > 28) {
    drivers.push({
      id: 'uhi',
      label: "Urban Heat Island",
      effect: "Nighttime Cooling Loss",
      value: `+${Math.min(35, 10 + Math.round((temp - 28) * 1.5))}%`,
      icon: Building,
      color: "text-slate-500",
      bg: "bg-slate-500/10"
    });
  }
  
  // If we don't have enough drivers, add some default ones based on the city
  if (drivers.length < 2) {
     drivers.push({
      id: 'emissions',
      label: "Traffic Emissions",
      effect: "Base Pollution",
      value: `+22%`,
      icon: Activity,
      color: "text-red-500",
      bg: "bg-red-500/10"
    });
  }

  return drivers.slice(0, 4);
};

const STORIES = [
  { id: 1, title: "Saharan dust plume moving toward West Africa", type: "Dust", icon: Wind, color: "text-orange-500", bg: "bg-orange-500/10" },
  { id: 2, title: "Major fire cluster detected in DR Congo", type: "Fire", icon: Flame, color: "text-red-500", bg: "bg-red-500/10" },
  { id: 3, title: "Heatwave intensifying in the Sahel", type: "Heat", icon: ThermometerSun, color: "text-yellow-500", bg: "bg-yellow-500/10" },
];

export default function DashboardV5() {
  const [selectedCityId, setSelectedCityId] = useState<string>(CITIES[0].id);
  const selectedCity = CITIES.find((c) => c.id === selectedCityId) || CITIES[0];
  const [openCitySelector, setOpenCitySelector] = useState(false);

  const [data, setData] = useState<EnvironmentalData | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchAirQuality(selectedCity);
        if (mounted) {
          setData(result);
          setInsights(generateInsights(result.aqi));
        }
      } catch (err) {
        if (mounted) setError("Failed to load environmental data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [selectedCity]);

  // Extract live data
  const liveTemp = data?.weather.current.temperature_2m || 0;
  const liveHumidity = data?.weather.current.relative_humidity_2m || 0;
  const liveWind = data?.weather.current.wind_speed_10m || 0;
  const liveAQI = data?.aqi.current.european_aqi || 0;
  
  const heatIndex = calculateHeatIndex(liveTemp, liveHumidity);

  // Format local time
  const localTime = data?.weather.current.time 
    ? format(parseISO(data.weather.current.time), "h:mm a")
    : "";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-foreground font-sans pb-32 relative overflow-hidden transition-colors duration-500">
      {/* Dynamic Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className={cn(
            "absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-30 dark:opacity-20 transition-colors duration-1000",
            getBlobColor(liveAQI),
          )}
        />
        <div
          className={cn(
            "absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-20 dark:opacity-10 transition-colors duration-1000",
            getBlobColor(liveAQI + 20),
          )}
        />
      </div>

      {/* Header */}
      <header className="relative z-40 pt-6 pb-12 px-6 flex justify-between items-center max-w-5xl mx-auto">
        <div className="flex-1 flex items-center gap-2">
          <Globe2 className="w-6 h-6 text-primary" />
          <span className="font-bold tracking-tight text-lg hidden sm:inline-block">Urban Climate Signals</span>
        </div>
        <Popover open={openCitySelector} onOpenChange={setOpenCitySelector}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 text-xl font-semibold tracking-tight hover:opacity-70 transition-opacity">
              {selectedCity.name} <ChevronDown className="w-5 h-5 opacity-50" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-0 rounded-2xl shadow-2xl border-white/60 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl">
            <Command>
              <CommandInput
                placeholder="Search city..."
                className="border-none focus:ring-0"
              />
              <CommandList>
                <CommandEmpty>No city found.</CommandEmpty>
                <CommandGroup>
                  {CITIES.map((city) => (
                    <CommandItem
                      key={city.id}
                      value={city.name}
                      onSelect={() => {
                        setSelectedCityId(city.id);
                        setOpenCitySelector(false);
                      }}
                      className="rounded-xl my-1 cursor-pointer"
                    >
                      <MapPin className="mr-2 h-4 w-4 opacity-50" />
                      {city.name}, {city.country}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <div className="flex-1 flex justify-end items-center gap-4">
          {!loading && localTime && (
            <span className="text-sm font-medium text-muted-foreground bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full">
              {localTime}
            </span>
          )}
          <ModeToggle />
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        {loading && (
          <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="bg-destructive/10 text-destructive p-6 rounded-3xl border border-destructive/20 flex items-start space-x-3 backdrop-blur-xl mt-8">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Connection Error</h3>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {!loading && !error && data && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-24">
            
            {/* SECTION 1: LIVE DATA */}
            <section className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">1</div>
                  <h2 className="text-3xl font-bold tracking-tight">The Current Reality</h2>
                </div>
                <p className="text-muted-foreground font-medium max-w-2xl text-lg">
                  Real-time environmental conditions in {selectedCity.name}.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Heat Index Explanation */}
                <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-8 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <ThermometerSun className="w-4 h-4 text-orange-500" /> The "Feels-Like" Reality
                      </h3>
                      <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider", getHeatLabel(heatIndex).bg, getHeatLabel(heatIndex).color)}>
                        {getHeatLabel(heatIndex).text}
                      </span>
                    </div>
                    
                    <div className="flex items-baseline gap-4 mb-8">
                      <div className="text-center">
                        <span className="text-6xl font-light tracking-tighter">{liveTemp}°</span>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-2">Air Temp</p>
                      </div>
                      <span className="text-4xl font-light text-muted-foreground/30">→</span>
                      <div className="text-center">
                        <span className="text-6xl font-light tracking-tighter text-red-500">{heatIndex}°</span>
                        <p className="text-xs font-bold uppercase tracking-wider text-red-500 mt-2">Feels Like</p>
                      </div>
                    </div>

                    <p className="text-lg font-medium leading-relaxed mb-6">
                      Why does {liveTemp}°C feel like {heatIndex}°C today?
                    </p>
                    
                    <ul className="space-y-4">
                      {liveHumidity > 60 && (
                        <li className="flex gap-3 items-start">
                          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 flex-shrink-0">
                            <Droplets className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">High Humidity ({liveHumidity}%)</p>
                            <p className="text-sm font-medium leading-snug">Coastal moisture prevents sweat from evaporating, trapping heat against your body.</p>
                          </div>
                        </li>
                      )}
                      
                      {liveHumidity <= 40 && liveTemp > 30 && (
                        <li className="flex gap-3 items-start">
                          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500 flex-shrink-0">
                            <ThermometerSun className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">Dry Heat & Radiation</p>
                            <p className="text-sm font-medium leading-snug">Low humidity combined with intense solar radiation creates a harsh, baking environment.</p>
                          </div>
                        </li>
                      )}

                      <li className="flex gap-3 items-start">
                        <div className="p-2 rounded-xl bg-slate-500/10 text-slate-500 flex-shrink-0">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">Urban Heat Island</p>
                          <p className="text-sm font-medium leading-snug">Concrete and asphalt absorb heat during the day and release it slowly at night, preventing cooling.</p>
                        </div>
                      </li>

                      {liveWind < 15 && (
                        <li className="flex gap-3 items-start">
                          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 flex-shrink-0">
                            <Wind className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">Low Wind Speed ({liveWind} km/h)</p>
                            <p className="text-sm font-medium leading-snug">Stagnant air prevents the dispersal of heat and traps pollutants near the surface.</p>
                          </div>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* AQI & Pollution Feedback Loop */}
                <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-8 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Activity className="w-4 h-4 text-purple-500" /> The Pollution Feedback Loop
                      </h3>
                      <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider", getAQILabel(liveAQI).bg, getAQILabel(liveAQI).color)}>
                        {getAQILabel(liveAQI).text}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-6 mb-8">
                      <div className="relative flex items-center justify-center">
                        <AQIGauge aqi={liveAQI} colorClass={getAQILabel(liveAQI).color} />
                        <div className="absolute flex flex-col items-center">
                          <span className="text-5xl font-light tracking-tighter">{liveAQI}</span>
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AQI</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-medium leading-relaxed mb-6">
                          Heat doesn't just feel bad—it actively worsens air quality.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-8">
                      <div className="bg-white/50 dark:bg-zinc-800/50 rounded-xl p-3 text-center border border-white/40 dark:border-zinc-700">
                        <p className="text-xs font-bold uppercase text-muted-foreground mb-1">PM2.5</p>
                        <p className="text-lg font-semibold">{data.aqi.current.pm2_5}</p>
                        <p className="text-[10px] text-muted-foreground">µg/m³</p>
                      </div>
                      <div className="bg-white/50 dark:bg-zinc-800/50 rounded-xl p-3 text-center border border-white/40 dark:border-zinc-700">
                        <p className="text-xs font-bold uppercase text-muted-foreground mb-1">PM10</p>
                        <p className="text-lg font-semibold">{data.aqi.current.pm10}</p>
                        <p className="text-[10px] text-muted-foreground">µg/m³</p>
                      </div>
                      <div className="bg-white/50 dark:bg-zinc-800/50 rounded-xl p-3 text-center border border-white/40 dark:border-zinc-700">
                        <p className="text-xs font-bold uppercase text-muted-foreground mb-1">NO₂</p>
                        <p className="text-lg font-semibold">{data.aqi.current.nitrogen_dioxide}</p>
                        <p className="text-[10px] text-muted-foreground">µg/m³</p>
                      </div>
                      <div className="bg-white/50 dark:bg-zinc-800/50 rounded-xl p-3 text-center border border-white/40 dark:border-zinc-700">
                        <p className="text-xs font-bold uppercase text-muted-foreground mb-1">O₃</p>
                        <p className="text-lg font-semibold">{data.aqi.current.ozone}</p>
                        <p className="text-[10px] text-muted-foreground">µg/m³</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="p-5 rounded-2xl bg-white/50 dark:bg-zinc-800/50 border border-white/40 dark:border-zinc-700">
                        <p className="text-sm font-bold uppercase tracking-wider text-orange-500 mb-2">Photochemical Smog</p>
                        <p className="text-sm font-medium leading-snug">High temperatures and sunlight accelerate chemical reactions between vehicle exhaust and generator emissions, creating ground-level ozone.</p>
                      </div>
                      
                      <div className="p-5 rounded-2xl bg-white/50 dark:bg-zinc-800/50 border border-white/40 dark:border-zinc-700">
                        <p className="text-sm font-bold uppercase tracking-wider text-red-500 mb-2">Temperature Inversion</p>
                        <p className="text-sm font-medium leading-snug">Warm air sits above cooler air near the ground, acting like a lid that traps PM2.5 and PM10 particles from escaping into the upper atmosphere.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's System Drivers */}
              <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-8 shadow-sm mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-bold tracking-tight">Today's System Drivers</h3>
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-6">
                  What's amplifying the environmental stress right now?
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {getSystemDrivers(liveTemp, liveHumidity, liveWind, data.aqi.current.pm2_5, data.aqi.current.pm10).map(driver => (
                    <div key={driver.id} className="bg-white/50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-white/40 dark:border-zinc-700 flex flex-col justify-between">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn("p-2 rounded-xl flex-shrink-0", driver.bg, driver.color)}>
                          <driver.icon className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground leading-tight">{driver.label}</p>
                      </div>
                      <div>
                        <p className={cn("text-2xl font-light tracking-tighter mb-1", driver.color)}>{driver.value}</p>
                        <p className="text-sm font-medium">{driver.effect}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Particulate Matter Chart */}
              <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-8 shadow-sm mt-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-primary" /> Particulate Matter Concentration (Last 24h)
                </h3>
                <p className="text-sm font-medium text-muted-foreground mb-6">
                  Tracking the levels of fine (PM2.5) and coarse (PM10) particulate matter over the last 24 hours.
                </p>
                <PMChart hourlyData={data.aqi.hourly} />
              </div>

              {/* Primary Sources Strip */}
              <div className="mt-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                  Primary Sources & Live Events
                </h3>
                <div className="-mx-4 sm:-mx-6 md:mx-0">
                  <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto px-4 sm:px-6 md:px-0 pb-4 pt-2 hide-scrollbar snap-x">
                    {STORIES.map(story => (
                      <div key={story.id} className="w-[280px] md:w-auto flex-shrink-0 snap-start bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-3xl p-4 shadow-sm flex items-center gap-4 cursor-pointer hover:bg-white/50 transition-colors">
                        <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0", story.bg, story.color)}>
                          <story.icon className="w-6 h-6" />
                        </div>
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">{story.type}</p>
                          <p className="text-sm font-medium leading-snug">{story.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Health Advice */}
              {insights && (
                <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-8 shadow-sm mt-6">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "p-3 rounded-2xl flex-shrink-0",
                        insights.color + "/20",
                        insights.textColor
                      )}
                    >
                      <HeartPulse className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Health Advice
                      </h3>
                      <p className="text-lg font-medium leading-snug">
                        {insights.healthImpact}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* SECTION 2: SYSTEMS MAP */}
            <section className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">2</div>
                  <h2 className="text-3xl font-bold tracking-tight">The Underlying System</h2>
                </div>
                <p className="text-muted-foreground font-medium max-w-2xl text-lg">
                  Why is this happening? Explore how urbanization, climate, and human activity interact to amplify heat stress and worsen air quality.
                </p>
              </div>
              <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-8 shadow-sm">
                <SystemsMap />
              </div>
            </section>

            {/* SECTION 3: POLICY SIMULATOR */}
            <section className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">3</div>
                  <h2 className="text-3xl font-bold tracking-tight">Policy Intervention Simulator</h2>
                </div>
                <p className="text-muted-foreground font-medium max-w-2xl text-lg">
                  What can we do about it? Adjust the levers below to simulate how different urban policies impact the heat index and air quality.
                </p>
              </div>
              <PolicySimulator baseTemp={liveTemp} baseHumidity={liveHumidity} baseAQI={liveAQI} />
            </section>

            {/* SECTION 4: SDG IMPACT TRACKER */}
            <section className="space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">4</div>
                  <h2 className="text-3xl font-bold tracking-tight">City Sustainability Scorecard</h2>
                </div>
                <p className="text-muted-foreground font-medium max-w-2xl text-lg">
                  How well is {selectedCity.name} currently meeting the UN Sustainable Development Goals based on these live environmental signals?
                </p>
              </div>
              <SDGTracker aqi={liveAQI} heatIndex={heatIndex} pm25={data.aqi.current.pm2_5} />
            </section>

          </div>
        )}
      </main>
    </div>
  );
}
