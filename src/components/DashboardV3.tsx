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
  Info,
} from "lucide-react";
import { CITIES, fetchAirQuality, EnvironmentalData, searchCities, reverseGeocode, fetchLocationByIP, City } from "../services/api";
import { generateInsights, generateAIInsights, Insights, AIInsights } from "../lib/insightEngine";
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
import MobileSystemsMap from "./MobileSystemsMap";
import PolicySimulator from "./PolicySimulator";
import PMChart from "./PMChart";
import SDGTracker from "./SDGTracker";

const AQIGauge = ({ aqi, colorClass }: { aqi: number; colorClass: string }) => {
  const percentage = Math.min((aqi / 500) * 100, 100);

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
  if (aqi <= 300) return { text: "Very Unhealthy", color: "text-purple-600", bg: "bg-purple-600/10" };
  return { text: "Hazardous", color: "text-rose-900", bg: "bg-rose-900/10" };
};

const getAQIExplanation = (aqi: number) => {
  if (aqi <= 50) return "Air quality is satisfactory, and air pollution poses little or no risk.";
  if (aqi <= 100) return "Air quality is acceptable. However, search for unusually sensitive people who should consider reducing prolonged outdoor exertion.";
  if (aqi <= 150) return "Members of sensitive groups may experience health effects. The general public is less likely to be affected.";
  if (aqi <= 200) return "Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.";
  if (aqi <= 300) return "Health alert: The risk of health effects is increased for everyone.";
  return "Health warning of emergency conditions: everyone is more likely to be affected.";
};

const getHeatLabel = (temp: number) => {
  if (temp <= 32) return { text: "Safe", color: "text-emerald-500", bg: "bg-emerald-500/10" };
  if (temp <= 39) return { text: "Extreme Caution", color: "text-orange-500", bg: "bg-orange-500/10" };
  if (temp <= 51) return { text: "Danger", color: "text-red-500", bg: "bg-red-500/10" };
  return { text: "Extreme Danger", color: "text-rose-900", bg: "bg-rose-900/10" };
};

const getSystemDrivers = (temp: number, humidity: number, wind: number, pm25: number, pm10: number) => {
  const drivers = [];
  
  if (humidity > 55) {
    drivers.push({
      id: 'humidity',
      label: "High Humidity",
      effect: "Heat Stress",
      whyItMatters: "Heat feels more intense because sweat can't evaporate",
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
      whyItMatters: "Dry air allows more dust and particles to stay airborne",
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
      whyItMatters: "Lack of ventilation keeps pollutants trapped near the ground",
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
      whyItMatters: "Coarse particles from construction or regional dust irritate lungs",
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
      whyItMatters: "Buildings absorb heat all day, preventing nighttime cooling",
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
      whyItMatters: "Exhaust from vehicles directly lowers neighborhood air quality",
      value: `+22%`,
      icon: Activity,
      color: "text-red-500",
      bg: "bg-red-500/10"
    });
  }

  return drivers.slice(0, 4);
};

function getConditionStories(city: City, data: EnvironmentalData, aiEvents?: { title: string; type: string }[]) {
  const { pm10, pm2_5, nitrogen_dioxide: no2 } = data.aqi.current;
  const temp = data.weather.current.temperature_2m;
  const stories: { id: number; title: string; type: string; icon: React.ElementType; color: string; bg: string }[] = [];

  // AI-generated events take priority if available
  if (aiEvents && aiEvents.length > 0) {
    const iconMap: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
      Dust:    { icon: Wind,          color: "text-orange-500", bg: "bg-orange-500/10" },
      Fire:    { icon: Flame,         color: "text-red-500",    bg: "bg-red-500/10" },
      Heat:    { icon: ThermometerSun,color: "text-yellow-500", bg: "bg-yellow-500/10" },
      Traffic: { icon: Activity,      color: "text-purple-500", bg: "bg-purple-500/10" },
      Air:     { icon: Wind,          color: "text-blue-500",   bg: "bg-blue-500/10" },
    };
    return aiEvents.slice(0, 3).map((ev, i) => {
      const meta = iconMap[ev.type] ?? iconMap["Air"];
      return { id: i + 1, title: ev.title, type: ev.type, ...meta };
    });
  }

  // Condition-driven fallback
  if (pm10 > pm2_5 * 1.8 && pm10 > 40) {
    stories.push({ id: 1, title: `Elevated dust transport detected over ${city.name}`, type: "Dust", icon: Wind, color: "text-orange-500", bg: "bg-orange-500/10" });
  }
  if (temp > 34) {
    stories.push({ id: 2, title: `Heat stress conditions developing in ${city.name}`, type: "Heat", icon: ThermometerSun, color: "text-yellow-500", bg: "bg-yellow-500/10" });
  }
  if (pm2_5 > 35 && no2 < 20) {
    stories.push({ id: 3, title: `Biomass or waste burning smoke detected near ${city.name}`, type: "Fire", icon: Flame, color: "text-red-500", bg: "bg-red-500/10" });
  }
  if (no2 > 30) {
    stories.push({ id: stories.length + 1, title: `Elevated traffic emissions recorded in ${city.name}`, type: "Traffic", icon: Activity, color: "text-purple-500", bg: "bg-purple-500/10" });
  }
  if (stories.length === 0) {
    stories.push({ id: 1, title: `Air quality monitoring active in ${city.name}, ${city.country}`, type: "Air", icon: Activity, color: "text-emerald-500", bg: "bg-emerald-500/10" });
  }
  return stories.slice(0, 3);
}

export default function DashboardV3() {
  const [selectedCity, setSelectedCity] = useState<City>(CITIES[0]);
  const [openCitySelector, setOpenCitySelector] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [data, setData] = useState<EnvironmentalData | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [aiInsights, setAIInsights] = useState<AIInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initial location detection
  useEffect(() => {
    async function detectLocation() {
      // 1. Try IP-based geolocation first (No permission required, immediate result)
      try {
        const ipCity = await fetchLocationByIP();
        setSelectedCity(ipCity);
      } catch (err) {
        console.warn("IP Geolocation failed:", err);
      }

      // 2. Try browser geolocation for better accuracy (Optional, triggers popup)
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;
            const localCity = await reverseGeocode(latitude, longitude);
            setSelectedCity(localCity);
          },
          (error) => {
            console.warn("Browser Geolocation denied or failed:", error);
          }
        );
      }
    }

    detectLocation();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        const results = await searchCities(searchQuery);
        setSearchResults(results);
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      setAIInsights(null);
      try {
        const result = await fetchAirQuality(selectedCity);
        if (mounted) {
          setData(result);
          setInsights(generateInsights(result.aqi, selectedCity));
        }
        // Kick off AI insights asynchronously — UI shows rule-based immediately
        generateAIInsights(result, selectedCity).then((ai) => {
          if (mounted && ai) setAIInsights(ai);
        });
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
  const liveAQI = data?.aqi.current.us_aqi || 0;
  
  const heatIndex = calculateHeatIndex(liveTemp, liveHumidity);

  // Format local time
  const localTime = data?.weather.current.time 
    ? format(parseISO(data.weather.current.time), "h:mm a")
    : "";

  const currentDrivers = data ? getSystemDrivers(liveTemp, liveHumidity, liveWind, data.aqi.current.pm2_5, data.aqi.current.pm10) : [];
  const currentStories = data ? getConditionStories(selectedCity, data, aiInsights?.regionalEvents) : [];

  // Merge: AI replaces rule-based text fields when available
  const displayedInsights = insights ? {
    ...insights,
    healthImpact: aiInsights?.healthImpact ?? insights.healthImpact,
    mainDrivers: aiInsights?.mainDrivers ?? insights.mainDrivers,
    policyInsights: aiInsights?.policyInsights ?? insights.policyInsights,
    sdgImpact: aiInsights?.sdgImpact ?? insights.sdgImpact,
  } : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-foreground font-sans pb-16 relative overflow-hidden transition-colors duration-500">
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
            getBlobColor(liveAQI),
          )}
        />
      </div>

      {/* Header */}
      <header className="relative z-40 pt-6 pb-6 px-6 flex justify-between items-start max-w-5xl mx-auto">
        <div className="flex-1 flex items-center gap-2 pt-1">
          <Globe2 className="w-6 h-6 text-primary" />
          <span className="font-bold tracking-tight text-lg hidden sm:inline-block">Urban Climate Signals</span>
        </div>
        
        <div className="flex flex-col items-center gap-2">
          <Popover open={openCitySelector} onOpenChange={setOpenCitySelector}>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-2 text-xl font-semibold tracking-tight hover:opacity-70 transition-opacity">
                {selectedCity.name} <ChevronDown className="w-5 h-5 opacity-50" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0 rounded-2xl shadow-2xl border-white/60 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-3xl overflow-hidden">
              <Command shouldFilter={false}>
                <CommandInput
                  placeholder="Search any city..."
                  className="border-none focus:ring-0"
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  {isSearching && <div className="p-4 text-sm text-center text-muted-foreground">Searching...</div>}
                  {!isSearching && searchResults.length === 0 && searchQuery.length >= 2 && (
                    <CommandEmpty>No city found.</CommandEmpty>
                  )}
                  {!isSearching && (
                    <CommandGroup heading="Major Cities">
                      {CITIES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map((city) => (
                         <CommandItem
                           key={city.id}
                           value={city.id}
                           onSelect={() => {
                             setSelectedCity(city);
                             setOpenCitySelector(false);
                             setSearchQuery("");
                           }}
                           className="rounded-xl my-1 cursor-pointer"
                         >
                           <MapPin className="mr-2 h-4 w-4 opacity-50" />
                           {city.name}, {city.country}
                         </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                  {!isSearching && searchResults.length > 0 && (
                    <CommandGroup heading="Search Results">
                      {searchResults
                        .filter(searchCity => !CITIES.some(c => c.name === searchCity.name && c.country === searchCity.country))
                        .map((city) => (
                          <CommandItem
                            key={city.id}
                            value={city.id}
                            onSelect={() => {
                              setSelectedCity(city);
                              setOpenCitySelector(false);
                              setSearchQuery("");
                            }}
                            className="rounded-xl my-1 cursor-pointer"
                          >
                            <MapPin className="mr-2 h-4 w-4 opacity-50" />
                            <div className="flex flex-col">
                              <span>{city.name}{city.admin1 ? `, ${city.admin1}` : ""}</span>
                              <span className="text-[10px] opacity-50 uppercase tracking-wider">{city.country}</span>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {!loading && localTime && (
            <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full border border-black/5 dark:border-white/5 md:hidden">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mr-1">Live</span>
              <span className="text-[10px] font-medium text-muted-foreground border-l border-black/10 dark:border-white/10 pl-2">
                {localTime}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 flex justify-end items-center gap-4">
          {!loading && localTime && (
            <div className="hidden md:flex items-center gap-2 bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mr-1">Live</span>
              <span className="text-sm font-medium text-muted-foreground border-l border-black/10 dark:border-white/10 pl-2">
                {localTime}
              </span>
            </div>
          )}
          <ModeToggle />
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6">
        <div className="mb-8 sm:mb-12 text-center">
          <p className="text-base sm:text-lg font-medium text-muted-foreground max-w-3xl mx-auto">
            Urban Climate Signals explains why cities feel hotter, how pollution builds up, and what policies can improve urban climate conditions.
          </p>
        </div>

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
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-3xl font-bold tracking-tight">What's Happening Right Now?</h2>
                </div>
                <p className="text-muted-foreground font-medium max-w-2xl text-lg mx-auto">
                  Real-time environmental conditions in {selectedCity.name}.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Heat Index Explanation */}
                <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-6 sm:p-8 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <ThermometerSun className="w-4 h-4 text-orange-500" /> How It Feels Outside
                      </h3>
                      <span className={cn("px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider", getHeatLabel(heatIndex).bg, getHeatLabel(heatIndex).color)}>
                        {getHeatLabel(heatIndex).text}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-center sm:justify-start gap-4 sm:gap-6 mb-8">
                      <div className="text-center">
                        <span className="text-5xl sm:text-6xl font-light tracking-tighter">{liveTemp}°</span>
                        <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground mt-2">Air Temp</p>
                      </div>
                      <span className="text-3xl sm:text-4xl font-light text-muted-foreground/30">→</span>
                      <div className="text-center">
                        <span className={cn("text-5xl sm:text-6xl font-light tracking-tighter", getHeatLabel(heatIndex).color)}>{heatIndex}°</span>
                        <p className={cn("text-[10px] sm:text-xs font-bold uppercase tracking-wider mt-2", getHeatLabel(heatIndex).color)}>Feels Like</p>
                      </div>
                    </div>

                    <p className="text-lg font-medium leading-relaxed mb-6">
                      How is your body experiencing {selectedCity.name} today?
                    </p>

                    <ul className="space-y-4">
                      {liveHumidity > 60 && (
                        <li className="flex gap-3 items-start">
                          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 flex-shrink-0">
                            <Droplets className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">
                              Stifling Moisture ({liveHumidity}%)
                            </p>
                            <p className="text-sm font-medium leading-snug">
                              High humidity is slowing sweat evaporation, making it feel hotter against your skin.
                            </p>
                          </div>
                        </li>
                      )}

                      <li className="flex gap-3 items-start">
                        <div className="p-2 rounded-xl bg-slate-500/10 text-slate-500 flex-shrink-0">
                          <Building className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">
                            Urban Trapped Heat
                          </p>
                          <p className="text-sm font-medium leading-snug">
                            Heat trapped in buildings and roads is raising local temperatures even after the sun goes down.
                          </p>
                        </div>
                      </li>

                      {liveWind < 15 && (
                        <li className="flex gap-3 items-start">
                          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500 flex-shrink-0">
                            <Wind className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1">
                              Heavy, Still Air
                            </p>
                            <p className="text-sm font-medium leading-snug">
                              Stagnant air is preventing cooling and making the heat feel more constant.
                            </p>
                          </div>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* AQI & Health Impact */}
                <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-6 sm:p-8 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <Activity className="w-4 h-4 text-purple-500" /> Air Quality Status
                        <Popover>
                          <PopoverTrigger>
                            <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" />
                          </PopoverTrigger>
                          <PopoverContent className="w-64 text-sm p-4 rounded-xl shadow-xl border-white/60 dark:border-zinc-800/50 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl">
                            <p className="font-bold mb-1">What is AQI (US)?</p>
                            <p className="text-muted-foreground">The US Air Quality Index (EPA standard) measures pollution on a scale of 0-500. Higher values indicate greater health risk.</p>
                          </PopoverContent>
                        </Popover>
                      </h3>
                    </div>
                    
                    <div className="flex flex-col items-center gap-6 mb-8">
                      <div className="relative flex items-center justify-center">
                        <AQIGauge aqi={liveAQI} colorClass={getAQILabel(liveAQI).color} />
                        <div className="absolute flex flex-col items-center">
                          <span className="text-5xl font-light tracking-tighter">{liveAQI}</span>
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AQI</span>
                        </div>
                      </div>
                      <div className="flex-1 w-full text-center">
                        <h4 className={cn("text-2xl font-bold mb-2", getAQILabel(liveAQI).color)}>
                          {getAQILabel(liveAQI).text} Air Quality
                        </h4>
                        <p className="text-base font-medium leading-relaxed mb-6">
                          {getAQIExplanation(liveAQI)}
                        </p>
                        
                        <div className="pt-6 border-t border-black/5 dark:border-white/5 text-center px-4">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground underline decoration-primary/30 underline-offset-4">Health Suggestion</p>
                            {aiInsights && <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">AI</span>}
                          </div>
                          <p className="text-sm font-medium text-foreground/70">
                            {displayedInsights?.healthImpact ?? (liveAQI > 100
                              ? "People with respiratory issues should consider avoiding strenuous outdoor activities today."
                              : "The air is generally safe for physical activity, though sensitive groups might want to stay aware.")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Today's System Drivers */}
              <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-6 sm:p-8 shadow-sm mt-6">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  <h3 className="text-lg sm:text-xl font-bold tracking-tight">What's Making Conditions Worse Today?</h3>
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-6">
                  What's amplifying the environmental stress right now?
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {currentDrivers.map(driver => (
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
              <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-6 sm:p-8 shadow-sm mt-6">
                <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-primary" /> Particulate Matter Concentration (Last 24h)
                </h3>
                <p className="text-sm font-medium text-muted-foreground mb-6">
                  Tracking the levels of fine (PM2.5) and coarse (PM10) particulate matter over the last 24 hours.
                </p>
                <PMChart hourlyData={data.aqi.hourly} />
              </div>

              {/* Regional Events Strip */}
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                    Regional events influencing today’s conditions
                  </h3>
                  {aiInsights && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      AI Enhanced
                    </span>
                  )}
                </div>
                <div className="-mx-4 sm:-mx-6 md:mx-0">
                  <div className="flex flex-col md:grid md:grid-cols-3 gap-4 px-4 sm:px-6 md:px-0">
                    {currentStories.map(story => (
                      <div key={story.id} className="w-full flex-shrink-0 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-3xl p-4 shadow-sm flex items-center gap-4">
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

            </section>

            {/* SECTION 2: SYSTEMS MAP */}
            <section className="space-y-8">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-3xl font-bold tracking-tight">How the City Climate System Works</h2>
                </div>
                <p className="text-muted-foreground font-medium max-w-2xl text-lg mx-auto">
                  These factors interact to shape temperature, air quality, and heat stress. When temperatures rise, pollution can increase. When pollution increases, it can trap more heat.
                </p>
              </div>
              
              {/* Desktop: Interactive Map */}
              <div className="hidden md:block bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-6 sm:p-8 shadow-sm">
                <div className="min-h-[600px]">
                  <SystemsMap />
                </div>
              </div>

              {/* Mobile: Static Cards */}
              <div className="md:hidden">
                <MobileSystemsMap />
              </div>
            </section>

            {/* SECTION 3: POLICY SIMULATOR */}
            <section className="space-y-8">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-3xl font-bold tracking-tight">What Can Cities Do?</h2>
                </div>
                <p className="text-muted-foreground font-medium max-w-2xl text-lg mx-auto">
                  Adjust the levers below to simulate how different urban policies impact the heat index and air quality.
                </p>
              </div>
              <PolicySimulator selectedCity={selectedCity} baseTemp={liveTemp} baseHumidity={liveHumidity} baseAQI={liveAQI} />
            </section>

            {/* SECTION 4: SDG IMPACT TRACKER */}
            <section className="space-y-8">
              <div className="flex flex-col items-center text-center">
                <div className="flex items-center gap-3 mb-3">
                  <h2 className="text-3xl font-bold tracking-tight">City Resilience Outlook</h2>
                </div>
                <p className="text-muted-foreground font-medium max-w-2xl text-lg mx-auto">
                  How well is {selectedCity.name} currently meeting the UN Sustainable Development Goals based on these live environmental signals?
                </p>
              </div>
              <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-6 sm:p-8 shadow-sm">
                <h3 className="text-lg sm:text-xl font-bold tracking-tight mb-6">City Resilience Scorecard</h3>
                <SDGTracker aqi={liveAQI} heatIndex={heatIndex} pm25={data.aqi.current.pm2_5} />
              </div>
            </section>
            
            {/* FOOTER / DATA TRANSPARENCY */}
            <footer className="-mt-8 pt-16 pb-0 border-t border-black/5 dark:border-white/10 text-center">
              <div className="max-w-4xl mx-auto px-6">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40 mb-8">Data Transparency & Standards</p>
                <div className="grid md:grid-cols-2 gap-8 text-left text-sm text-muted-foreground/80 leading-relaxed mb-16">
                  <div className="space-y-4">
                    <p>
                      <strong className="text-foreground/90">Unified Air Quality Standard:</strong> All environmental signals are unified under the <strong>United States EPA AQI Standard</strong> (0-500) to ensure consistent global comparison, powered by <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Open-Meteo</a>'s CAMS modeling.
                    </p>
                    <p>
                      <strong className="text-foreground/90">Representative Geolocation:</strong> We use curated coordinates for major urban centers (e.g., Ikeja for Lagos) to provide the most representative readings for city residents, rather than generic city-center averages.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <p>
                      <strong className="text-foreground/90">Zero-Permission Privacy:</strong> Initial city detection uses <strong>privacy-first IP geolocation</strong>. This allows the app to show relevant local data immediately without requiring explicit browser location permissions.
                    </p>
                    <p>
                      <strong className="text-foreground/90">Model Variability:</strong> Atmospheric models are coordinate-specific. While highly accurate for regional trends, ground-level readings may vary based on hyper-local factors like immediate traffic density or micro-elevations.
                    </p>
                  </div>
                </div>
                
                <div className="pt-16 border-t border-black/5 dark:border-white/5">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/40 mb-3">Credit</p>
                  <p className="text-sm font-medium">
                    A project by <a href="https://susbridge.xyz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold transition-all">Susbridge</a>
                  </p>
                </div>
              </div>
            </footer>

          </div>
        )}
      </main>
    </div>
  );
}
