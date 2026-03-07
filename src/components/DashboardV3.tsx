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
  User,
  Baby,
  HardHat,
  Stethoscope,
  ChevronRight,
  Flame,
  ThermometerSun,
  BookOpen,
  Scale
} from "lucide-react";
import { CITIES, City, fetchAirQuality, AirQualityData } from "../services/api";
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

// --- Mock Data for New Features ---

const STORIES = [
  { id: 1, title: "Saharan dust plume moving toward West Africa", type: "Dust", icon: Wind, color: "text-orange-500", bg: "bg-orange-500/10" },
  { id: 2, title: "Major fire cluster detected in DR Congo", type: "Fire", icon: Flame, color: "text-red-500", bg: "bg-red-500/10" },
  { id: 3, title: "Heatwave intensifying in the Sahel", type: "Heat", icon: ThermometerSun, color: "text-yellow-500", bg: "bg-yellow-500/10" },
];

const PROFILES = [
  { id: 'general', label: 'General', icon: User },
  { id: 'child', label: 'Child', icon: Baby },
  { id: 'pregnant', label: 'Pregnant', icon: HeartPulse },
  { id: 'elderly', label: 'Elderly', icon: User },
  { id: 'worker', label: 'Outdoor Worker', icon: HardHat },
  { id: 'runner', label: 'Runner', icon: Activity },
  { id: 'asthma', label: 'Asthma', icon: Stethoscope },
];

const POLICIES = [
  { title: "Clean Cooking Initiatives", status: "in progress", color: "text-blue-500", bg: "bg-blue-500/20" },
  { title: "Low-Sulfur Fuel Standards", status: "implemented", color: "text-emerald-500", bg: "bg-emerald-500/20" },
  { title: "Generator Emission Rules", status: "on paper", color: "text-orange-500", bg: "bg-orange-500/20" },
  { title: "Open Waste Burning Ban", status: "on paper", color: "text-orange-500", bg: "bg-orange-500/20" },
];

const ACTIONS = [
  "Report open waste burning in your neighborhood",
  "Support local low-cost sensor deployments",
];

// --- Components ---

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

// Helper for dynamic health text based on profile
const getProfileHealthAdvice = (profileId: string, aqi: number) => {
  if (aqi <= 50) {
    return { score: "Safe", text: "Air quality is great. Perfect time for outdoor activities." };
  }
  if (aqi <= 100) {
    if (['asthma', 'elderly', 'child'].includes(profileId)) return { score: "Not Ideal", text: "Air quality is acceptable, but consider reducing prolonged exertion if you are sensitive." };
    return { score: "Safe", text: "Air quality is acceptable. Enjoy your day outside." };
  }
  if (aqi <= 150) {
    if (['asthma', 'elderly', 'child', 'pregnant'].includes(profileId)) return { score: "Avoid", text: "Unhealthy for you. Please stay indoors and keep windows closed." };
    if (['runner', 'worker'].includes(profileId)) return { score: "Not Ideal", text: "Consider reducing intensity or duration of outdoor activities." };
    return { score: "Not Ideal", text: "Sensitive groups may experience health effects. General public is less likely to be affected." };
  }
  return { score: "Avoid", text: "Unhealthy for everyone. Avoid outdoor exertion." };
};

export default function DashboardV3() {
  const [selectedCityId, setSelectedCityId] = useState<string>(CITIES[0].id);
  const selectedCity = CITIES.find((c) => c.id === selectedCityId) || CITIES[0];
  const [openCitySelector, setOpenCitySelector] = useState(false);

  const [compareCityId, setCompareCityId] = useState<string>(CITIES[1].id);
  const compareCity = CITIES.find((c) => c.id === compareCityId) || CITIES[1];
  const [openCompareSelector, setOpenCompareSelector] = useState(false);

  const [data, setData] = useState<AirQualityData | null>(null);
  const [compareData, setCompareData] = useState<AirQualityData | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'compare' | 'narrative' | 'action'>('overview');
  const [activeProfile, setActiveProfile] = useState<string>('general');

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const result = await fetchAirQuality(selectedCity);
        const compResult = await fetchAirQuality(compareCity);
        if (mounted) {
          setData(result);
          setCompareData(compResult);
          setInsights(generateInsights(result));
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
  }, [selectedCity, compareCity]);

  // Hourly Data
  const now = new Date();
  const currentIndex = data?.hourly.time.findIndex((t) => new Date(t) >= now) || 0;
  const next24Hours = data?.hourly.time.slice(currentIndex, currentIndex + 24).map((timeStr, idx) => ({
    time: timeStr,
    aqi: data.hourly.european_aqi?.[currentIndex + idx] || 0,
  })) || [];

  const profileAdvice = data ? getProfileHealthAdvice(activeProfile, data.current.european_aqi) : { score: "Safe", text: "" };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-foreground font-sans pb-32 relative overflow-hidden transition-colors duration-500">
      {/* Dynamic Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div
          className={cn(
            "absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-30 dark:opacity-20 transition-colors duration-1000",
            getBlobColor(data?.current.european_aqi || 0),
          )}
        />
        <div
          className={cn(
            "absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[120px] opacity-20 dark:opacity-10 transition-colors duration-1000",
            getBlobColor((data?.current.european_aqi || 0) + 20),
          )}
        />
      </div>

      {/* Header */}
      <header className="relative z-40 pt-6 pb-4 px-6 flex justify-between items-center max-w-4xl mx-auto">
        <div className="w-10" /> {/* Spacer */}
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
        <ModeToggle />
      </header>

      {/* Segmented Control */}
      <div className="relative z-40 max-w-4xl mx-auto px-4 sm:px-6 mb-6">
        <div className="flex p-1 bg-black/5 dark:bg-white/10 backdrop-blur-xl rounded-2xl overflow-x-auto hide-scrollbar">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'compare', label: 'Compare' },
            { id: 'narrative', label: 'Narrative' },
            { id: 'action', label: 'Action' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-semibold rounded-xl transition-all whitespace-nowrap",
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
            
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <>
                {/* Hero AQI */}
                <div className="flex flex-col items-center justify-center py-4 mb-4">
                  <div className="relative flex items-center justify-center">
                    <AQIGauge
                      aqi={data.current.european_aqi}
                      colorClass={insights.textColor}
                    />
                    <div className="absolute flex flex-col items-center">
                      <span className="text-7xl font-light tracking-tighter">
                        {data.current.european_aqi}
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

                {/* Stories & Events Strip */}
                <div className="mb-8 -mx-4 sm:-mx-6 md:mx-0">
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

                {/* Bento Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  
                  {/* People & Health Layer */}
                  <div className="col-span-2 md:col-span-4 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-6 shadow-sm overflow-hidden">
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <HeartPulse className="w-4 h-4" /> People & Health
                        </h3>
                        <div className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                          profileAdvice.score === "Safe" ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
                          profileAdvice.score === "Not Ideal" ? "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" :
                          "bg-red-500/20 text-red-600 dark:text-red-400"
                        )}>
                          {profileAdvice.score}
                        </div>
                      </div>
                      
                      <div className="flex gap-2 overflow-x-auto pb-4 -mx-6 px-6 hide-scrollbar">
                        {PROFILES.map(p => (
                          <button 
                            key={p.id}
                            onClick={() => setActiveProfile(p.id)}
                            className={cn(
                              "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-colors whitespace-nowrap border",
                              activeProfile === p.id 
                                ? "bg-primary text-primary-foreground border-primary" 
                                : "bg-white/50 dark:bg-zinc-800/50 border-white/40 dark:border-zinc-700 hover:bg-white/80 dark:hover:bg-zinc-800"
                            )}
                          >
                            <p.icon className="w-4 h-4" /> {p.label}
                          </button>
                        ))}
                      </div>

                      <p className="text-lg font-medium leading-snug">
                        {profileAdvice.text}
                      </p>
                    </div>
                  </div>

                  {/* Hourly Forecast */}
                  <div className="col-span-2 md:col-span-4 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-6 shadow-sm overflow-hidden">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> 24-Hour Forecast
                    </h3>
                    <div className="flex gap-6 overflow-x-auto pb-2 pt-2 -mx-6 px-6 hide-scrollbar snap-x">
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
                  <PollutantCard name="PM2.5" value={data.current.pm2_5} max={50} unit="µg/m³" />
                  <PollutantCard name="PM10" value={data.current.pm10} max={100} unit="µg/m³" />
                  <PollutantCard name="NO₂" value={data.current.nitrogen_dioxide} max={100} unit="µg/m³" />
                  <PollutantCard name="Ozone" value={data.current.ozone} max={150} unit="µg/m³" />
                </div>
              </>
            )}

            {/* COMPARE TAB */}
            {activeTab === 'compare' && compareData && (
              <div className="space-y-6">
                <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-6 shadow-sm text-center">
                  <h3 className="text-lg font-medium">
                    <span className="font-bold">{selectedCity.name}</span> has a current AQI of {data.current.european_aqi}, while <span className="font-bold">{compareCity.name}</span> is at {compareData.current.european_aqi}.
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* City 1 */}
                  <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-6 shadow-sm flex flex-col items-center text-center">
                    <h2 className="text-xl font-bold mb-6">{selectedCity.name}</h2>
                    <AQIGauge aqi={data.current.european_aqi} colorClass={insights.textColor} />
                    <span className="text-5xl font-light tracking-tighter mt-[-100px] mb-8">{data.current.european_aqi}</span>
                    <div className="w-full text-left space-y-4 mt-4 border-t border-black/5 dark:border-white/5 pt-4">
                      <div>
                        <span className="text-xs font-bold uppercase text-muted-foreground">PM2.5</span>
                        <p className="text-xl font-semibold">{data.current.pm2_5} <span className="text-sm font-normal text-muted-foreground">µg/m³</span></p>
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase text-muted-foreground">Primary Driver</span>
                        <p className="text-sm font-medium">{insights.mainDrivers[0] || "Mixed Emissions"}</p>
                      </div>
                    </div>
                  </div>

                  {/* City 2 */}
                  <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-6 shadow-sm flex flex-col items-center text-center relative">
                    <div className="absolute top-4 right-4">
                      <Popover open={openCompareSelector} onOpenChange={setOpenCompareSelector}>
                        <PopoverTrigger asChild>
                          <button className="p-2 bg-black/5 dark:bg-white/10 rounded-full hover:bg-black/10 transition-colors">
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0 rounded-2xl shadow-2xl">
                          <Command>
                            <CommandInput placeholder="Change city..." className="border-none focus:ring-0" />
                            <CommandList>
                              <CommandEmpty>No city found.</CommandEmpty>
                              <CommandGroup>
                                {CITIES.map((city) => (
                                  <CommandItem
                                    key={city.id}
                                    value={city.name}
                                    onSelect={() => {
                                      setCompareCityId(city.id);
                                      setOpenCompareSelector(false);
                                    }}
                                  >
                                    {city.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <h2 className="text-xl font-bold mb-6">{compareCity.name}</h2>
                    <AQIGauge aqi={compareData.current.european_aqi} colorClass={getBlobColor(compareData.current.european_aqi).replace('bg-', 'text-')} />
                    <span className="text-5xl font-light tracking-tighter mt-[-100px] mb-8">{compareData.current.european_aqi}</span>
                    <div className="w-full text-left space-y-4 mt-4 border-t border-black/5 dark:border-white/5 pt-4">
                      <div>
                        <span className="text-xs font-bold uppercase text-muted-foreground">PM2.5</span>
                        <p className="text-xl font-semibold">{compareData.current.pm2_5} <span className="text-sm font-normal text-muted-foreground">µg/m³</span></p>
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase text-muted-foreground">Primary Driver</span>
                        <p className="text-sm font-medium">{generateInsights(compareData).mainDrivers[0] || "Mixed Emissions"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* NARRATIVE TAB */}
            {activeTab === 'narrative' && (
              <div className="space-y-6">
                <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-8 shadow-sm prose dark:prose-invert max-w-none">
                  <h2 className="text-3xl font-bold tracking-tight mb-6">Signals Over Time: {selectedCity.name}</h2>
                  
                  <p className="text-lg leading-relaxed mb-6">
                    Over the past 7 days, {selectedCity.name} has experienced fluctuating air quality, primarily driven by <span className="font-semibold">{insights.mainDrivers.join(" and ").toLowerCase() || "mixed urban emissions"}</span>. 
                    The current AQI of <span className="font-bold">{data.current.european_aqi}</span> marks a notable moment in this week's environmental narrative.
                  </p>

                  <div className="my-8 p-6 bg-black/5 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5">
                    <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Key Episode</h4>
                    <p className="font-medium text-lg">"Worst pollution spike in the last 7 days occurred during evening rush hours, exacerbated by local meteorological stagnation."</p>
                  </div>

                  <p className="text-lg leading-relaxed mb-6">
                    Looking at the micro-trends, PM2.5 levels peaked at <span className="font-semibold">{Math.max(...data.hourly.pm2_5)} µg/m³</span>, 
                    which is significantly above the WHO recommended guidelines. This pattern suggests that daily commuter traffic and localized burning are creating predictable, yet hazardous, daily cycles.
                  </p>

                  <div className="flex items-center gap-4 my-8">
                    <div className="flex-1 h-px bg-border" />
                    <Leaf className="w-5 h-5 text-muted-foreground" />
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <p className="text-lg leading-relaxed">
                    Moving forward, if the current weather patterns hold, we expect {insights.status.toLowerCase()} conditions to persist. 
                    Vulnerable populations should continue to monitor these daily rhythms and plan outdoor activities during the mid-day troughs when dispersion is highest.
                  </p>
                </div>
              </div>
            )}

            {/* ACTION TAB */}
            {activeTab === 'action' && (
              <div className="space-y-6">
                <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-8">
                    <Scale className="w-8 h-8 text-primary" />
                    <h2 className="text-2xl font-bold tracking-tight">Civic Action & Policy Tracker</h2>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Regional Policies</h3>
                      <div className="grid gap-3">
                        {POLICIES.map((policy, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-white/50 dark:bg-zinc-800/50 rounded-2xl border border-white/40 dark:border-zinc-700">
                            <span className="font-medium">{policy.title}</span>
                            <span className={cn("px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider", policy.bg, policy.color)}>
                              {policy.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Take Action Today</h3>
                      <div className="grid sm:grid-cols-2 gap-4">
                        {ACTIONS.map((action, i) => (
                          <div key={i} className="p-5 bg-primary text-primary-foreground rounded-3xl flex flex-col justify-between gap-4">
                            <p className="font-medium leading-snug">{action}</p>
                            <button className="self-start flex items-center gap-1 text-sm font-bold uppercase tracking-wider opacity-80 hover:opacity-100 transition-opacity">
                              Learn More <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* DATA SOURCES FOOTER */}
            <footer className="mt-16 text-center text-xs font-medium text-muted-foreground/50 uppercase tracking-wider">
              <p>Data Sources</p>
              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mt-3">
                <span>Open-Meteo Air Quality API</span>
                <span className="hidden sm:inline">•</span>
                <span>WHO Air Quality Guidelines</span>
                <span className="hidden sm:inline">•</span>
                <span>UNEP Reports</span>
              </div>
            </footer>

          </div>
        )}
      </main>
    </div>
  );
}
