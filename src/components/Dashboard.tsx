import React, { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import {
  Wind,
  MapPin,
  Activity,
  AlertTriangle,
  Info,
  TrendingUp,
  Leaf,
  Building,
  Droplets,
  Globe2,
  ChevronDown,
  HeartPulse,
  Clock,
  Lightbulb,
} from "lucide-react";
import { CITIES, City, fetchAirQuality, EnvironmentalData } from "../services/api";
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

const AQIGauge = ({ aqi, colorClass }: { aqi: number; colorClass: string }) => {
  const percentage = Math.min((aqi / 300) * 100, 100);

  return (
    <svg viewBox="0 0 36 36" className="w-64 h-64 -rotate-90 drop-shadow-2xl">
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

const PollutantCard = ({
  name,
  value,
  max,
  unit,
}: {
  name: string;
  value: number;
  max: number;
  unit: string;
}) => {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          {name}
        </span>
        <Info className="w-4 h-4 text-muted-foreground/50" />
      </div>
      <div>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-3xl font-medium tracking-tight">{value}</span>
          <span className="text-xs text-muted-foreground font-medium">
            {unit}
          </span>
        </div>
        <div className="h-1.5 w-full bg-black/5 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-1000"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const getBlobColor = (aqi: number) => {
  if (aqi <= 50) return "bg-emerald-400";
  if (aqi <= 100) return "bg-yellow-400";
  if (aqi <= 150) return "bg-orange-500";
  if (aqi <= 200) return "bg-red-500";
  return "bg-purple-600";
};

export default function Dashboard() {
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

  // Hourly Data
  const now = new Date();
  const currentIndex =
    data?.aqi.hourly.time.findIndex((t) => new Date(t) >= now) || 0;
  const next24Hours =
    data?.aqi.hourly.time
      .slice(currentIndex, currentIndex + 24)
      .map((timeStr, idx) => ({
        time: timeStr,
        aqi: data.aqi.hourly.european_aqi?.[currentIndex + idx] || 0,
      })) || [];

  const localTime = data?.weather.current.time 
    ? format(parseISO(data.weather.current.time), "h:mm a")
    : "";

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-foreground font-sans pb-24 relative overflow-hidden transition-colors duration-500">
      {/* Dynamic Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className={cn(
            "absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-30 dark:opacity-20 transition-colors duration-1000",
            getBlobColor(data?.aqi.current.european_aqi || 0),
          )}
        />
        <div
          className={cn(
            "absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-20 dark:opacity-10 transition-colors duration-1000",
            getBlobColor((data?.aqi.current.european_aqi || 0) + 20),
          )}
        />
      </div>

      {/* Header */}
      <header className="relative z-40 pt-6 pb-4 px-6 flex justify-between items-center max-w-4xl mx-auto">
        <div className="flex-1 flex justify-start">
          {!loading && localTime && (
            <span className="text-sm font-medium text-muted-foreground bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full">
              {localTime}
            </span>
          )}
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
        <div className="flex-1 flex justify-end">
          <ModeToggle />
        </div>
      </header>

      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6">
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

        {!loading && !error && data && insights && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Hero AQI */}
            <div className="flex flex-col items-center justify-center py-8 mb-4">
              <div className="relative flex items-center justify-center">
                <AQIGauge
                  aqi={data.aqi.current.european_aqi}
                  colorClass={insights.textColor}
                />
                <div className="absolute flex flex-col items-center">
                  <span className="text-7xl font-light tracking-tighter">
                    {data.aqi.current.european_aqi}
                  </span>
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mt-1">
                    AQI
                  </span>
                </div>
              </div>
              <div className="mt-6 text-center">
                <h2 className="text-2xl font-semibold tracking-tight">
                  {insights.status}
                </h2>
              </div>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Health Summary */}
              <div className="col-span-2 md:col-span-4 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-6 shadow-sm">
                <div className="flex gap-4 items-start">
                  <div
                    className={cn(
                      "p-3 rounded-2xl",
                      insights.color + "/20",
                      insights.textColor
                    )}
                  >
                    <HeartPulse className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                      Health Advice
                    </h3>
                    <p className="text-lg font-medium leading-snug">
                      {insights.healthImpact}
                    </p>
                  </div>
                </div>
              </div>

              {/* Hourly Forecast */}
              <div className="col-span-2 md:col-span-4 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-6 shadow-sm overflow-hidden">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> 24-Hour Forecast
                </h3>
                <div className="flex gap-6 overflow-x-auto pb-2 hide-scrollbar snap-x">
                  {next24Hours.map((hour, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-3 min-w-[60px] snap-start"
                    >
                      <span className="text-sm font-medium text-muted-foreground">
                        {i === 0 ? "Now" : format(parseISO(hour.time), "ha")}
                      </span>
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full shadow-sm",
                          getBlobColor(hour.aqi).replace("bg-", "bg-"),
                        )}
                      />
                      <span className="text-lg font-semibold">{hour.aqi}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pollutants */}
              <PollutantCard
                name="PM2.5"
                value={data.aqi.current.pm2_5}
                max={50}
                unit="µg/m³"
              />
              <PollutantCard
                name="PM10"
                value={data.aqi.current.pm10}
                max={100}
                unit="µg/m³"
              />
              <PollutantCard
                name="NO₂"
                value={data.aqi.current.nitrogen_dioxide}
                max={100}
                unit="µg/m³"
              />
              <PollutantCard
                name="Ozone"
                value={data.aqi.current.ozone}
                max={150}
                unit="µg/m³"
              />

              {/* Drivers & Policy */}
              <div className="col-span-2 md:col-span-4 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-6 shadow-sm mt-2">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> Insights & Drivers
                </h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="font-medium mb-3 text-foreground/80">
                      Primary Sources
                    </h4>
                    <ul className="space-y-3">
                      {insights.mainDrivers.map((d, i) => (
                        <li
                          key={i}
                          className="flex gap-3 items-center text-sm font-medium"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3 text-foreground/80">
                      Policy Action
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                      {insights.policyInsights}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
