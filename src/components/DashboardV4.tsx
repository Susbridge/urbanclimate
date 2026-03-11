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
} from "lucide-react";
import { CITIES, fetchAirQuality, EnvironmentalData } from "../services/api";
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

export default function DashboardV4() {
  const [selectedCityId, setSelectedCityId] = useState<string>(CITIES[0].id);
  const selectedCity = CITIES.find((c) => c.id === selectedCityId) || CITIES[0];
  const [openCitySelector, setOpenCitySelector] = useState(false);

  const [data, setData] = useState<EnvironmentalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'map' | 'simulator' | 'live'>('map');

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchAirQuality(selectedCity);
        if (mounted) {
          setData(result);
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
      <header className="relative z-40 pt-6 pb-4 px-6 flex justify-between items-center max-w-5xl mx-auto">
        <div className="flex-1 flex items-center gap-2">
          <Globe2 className="w-6 h-6 text-primary" />
          <span className="font-bold tracking-tight text-lg hidden sm:inline-block">V4: Systems Intelligence</span>
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

      {/* Segmented Control */}
      <div className="relative z-40 max-w-5xl mx-auto px-4 sm:px-6 mb-8">
        <div className="flex p-1 bg-black/5 dark:bg-white/10 backdrop-blur-xl rounded-2xl overflow-x-auto hide-scrollbar">
          {[
            { id: 'map', label: 'Systems Map' },
            { id: 'simulator', label: 'Policy Simulator' },
            { id: 'live', label: 'Live Data' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 px-4 py-3 text-sm font-bold uppercase tracking-wider rounded-xl transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-white dark:bg-zinc-800 shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

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
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {/* SYSTEMS MAP TAB */}
            {activeTab === 'map' && (
              <div className="space-y-6">
                <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-8 shadow-sm">
                  <h2 className="text-2xl font-bold tracking-tight mb-2">Urban Climate Systems Map</h2>
                  <p className="text-muted-foreground font-medium mb-8 max-w-2xl">
                    Explore how urbanization, climate, and human activity interact to amplify heat stress and worsen air quality in African megacities.
                  </p>
                  <SystemsMap />
                </div>
              </div>
            )}

            {/* SIMULATOR TAB */}
            {activeTab === 'simulator' && (
              <PolicySimulator baseTemp={liveTemp} baseHumidity={liveHumidity} baseAQI={liveAQI} />
            )}

            {/* LIVE DATA TAB */}
            {activeTab === 'live' && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Heat Index Explanation */}
                <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-8 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
                      <ThermometerSun className="w-4 h-4 text-orange-500" /> The "Feels-Like" Reality
                    </h3>
                    
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
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-purple-500" /> The Pollution Feedback Loop
                    </h3>
                    
                    <div className="flex items-baseline gap-2 mb-8">
                      <span className="text-6xl font-light tracking-tighter">{liveAQI}</span>
                      <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground">AQI</span>
                    </div>

                    <p className="text-lg font-medium leading-relaxed mb-6">
                      Heat doesn't just feel bad—it actively worsens air quality.
                    </p>

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
            )}

          </div>
        )}
      </main>
    </div>
  );
}
