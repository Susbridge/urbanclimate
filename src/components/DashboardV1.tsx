import React, { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart 
} from "recharts";
import { 
  Wind, MapPin, Activity, AlertTriangle, Info, 
  TrendingUp, Leaf, Building, Droplets, Globe2
} from "lucide-react";
import { CITIES, City, fetchAirQuality, AirQualityData } from "../services/api";
import { generateInsights, Insights } from "../lib/insightEngine";
import { cn } from "../lib/utils";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Combobox } from "./ui/combobox";
import { ModeToggle } from "./ModeToggle";

export default function Dashboard() {
  const [selectedCityId, setSelectedCityId] = useState<string>(CITIES[0].id);
  const selectedCity = CITIES.find(c => c.id === selectedCityId) || CITIES[0];
  
  const [data, setData] = useState<AirQualityData | null>(null);
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
          setInsights(generateInsights(result));
        }
      } catch (err) {
        if (mounted) setError("Failed to load environmental data.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => { mounted = false; };
  }, [selectedCity]);

  // Format chart data
  const chartData = data?.hourly.time.map((timeStr, index) => ({
    time: format(parseISO(timeStr), "MMM d, HH:mm"),
    pm25: data.hourly.pm2_5[index],
    pm10: data.hourly.pm10[index],
  })).slice(-48); // Last 48 hours for better visibility

  const cityOptions = CITIES.map(city => ({
    value: city.id,
    label: `${city.name}, ${city.country}`
  }));

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-20 transition-colors duration-300">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe2 className="w-6 h-6 text-primary" />
            <span className="font-bold tracking-tight text-lg hidden sm:inline-block">Africa Environmental Signals</span>
            <span className="font-bold tracking-tight text-lg sm:hidden">AES</span>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="hidden md:inline-flex">Source Data Hub</Badge>
            <ModeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* City Selector & Hero */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
              Environmental Intelligence
            </h1>
            <p className="text-muted-foreground text-lg">
              Real-time air quality and SDG impact tracking across Africa.
            </p>
          </div>
          <div className="w-full md:w-auto">
            <Combobox 
              options={cityOptions} 
              value={selectedCityId} 
              onChange={(val) => { if(val) setSelectedCityId(val) }} 
              placeholder="Search city or country..."
            />
          </div>
        </div>

        {/* Loading / Error States */}
        {loading && (
          <div className="h-96 flex flex-col items-center justify-center space-y-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground font-medium">Analyzing signals for {selectedCity.name}...</p>
          </div>
        )}

        {error && !loading && (
          <Card className="border-destructive bg-destructive/10">
            <CardContent className="flex items-start space-x-3 pt-6">
              <AlertTriangle className="w-6 h-6 text-destructive flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-destructive">Connection Error</h3>
                <p className="text-sm text-destructive/80 mt-1">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Dashboard Grid */}
        {!loading && !error && data && insights && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: The Signal (AQI) */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              
              {/* AQI Card */}
              <Card className="relative overflow-hidden border-border shadow-sm">
                <div className={cn("absolute top-0 left-0 w-full h-1.5", insights.color)} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardDescription className="font-bold uppercase tracking-widest">Current Signal</CardDescription>
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-2 flex items-baseline">
                    <span className="text-7xl font-bold tracking-tighter">{data.current.european_aqi}</span>
                    <span className="text-xl text-muted-foreground ml-2 font-medium">AQI</span>
                  </div>
                  
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-secondary mb-6">
                    <div className={cn("w-2.5 h-2.5 rounded-full", insights.color)} />
                    <span className="text-sm font-semibold">{insights.status}</span>
                  </div>

                  <div className="space-y-4 border-t border-border pt-6">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">What this means for you</h3>
                      <p className="text-sm leading-relaxed text-foreground font-medium">{insights.healthImpact}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Raw Data Mini Grid */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">PM2.5</div>
                    <div className="text-2xl font-semibold">{data.current.pm2_5} <span className="text-xs text-muted-foreground font-normal">µg/m³</span></div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">PM10</div>
                    <div className="text-2xl font-semibold">{data.current.pm10} <span className="text-xs text-muted-foreground font-normal">µg/m³</span></div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">NO₂</div>
                    <div className="text-2xl font-semibold">{data.current.nitrogen_dioxide} <span className="text-xs text-muted-foreground font-normal">µg/m³</span></div>
                  </CardContent>
                </Card>
                <Card className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Ozone</div>
                    <div className="text-2xl font-semibold">{data.current.ozone} <span className="text-xs text-muted-foreground font-normal">µg/m³</span></div>
                  </CardContent>
                </Card>
              </div>

            </div>

            {/* Right Column: Insights & Trends */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              
              {/* The Drivers */}
              <Card className="bg-primary text-primary-foreground shadow-md border-none">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Activity className="w-6 h-6 text-emerald-400" />
                    <CardTitle className="text-2xl">Why is this happening?</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-primary-foreground/60 mb-4">Likely Main Drivers</h3>
                      <ul className="space-y-3">
                        {insights.mainDrivers.map((driver, idx) => (
                          <li key={idx} className="flex items-start space-x-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                            <span className="text-primary-foreground/90 font-medium">{driver}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-background/10 rounded-xl p-5 backdrop-blur-sm border border-background/10">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 flex items-center">
                        <Building className="w-3 h-3 mr-1.5" /> Policy Insight
                      </h3>
                      <p className="text-sm leading-relaxed text-primary-foreground/80">
                        {insights.policyInsights}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trend Chart */}
              <Card className="shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">48-Hour Trend</CardTitle>
                    <CardDescription>Particulate matter concentration over time</CardDescription>
                  </div>
                  <TrendingUp className="w-5 h-5 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorPm25" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorPm10" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="time" 
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
                          tickLine={false}
                          axisLine={false}
                          minTickGap={30}
                        />
                        <YAxis 
                          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} 
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '8px', 
                            border: '1px solid hsl(var(--border))', 
                            backgroundColor: 'hsl(var(--background))',
                            color: 'hsl(var(--foreground))',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                          }}
                          labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                        />
                        <Area type="monotone" dataKey="pm25" name="PM2.5" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorPm25)" />
                        <Area type="monotone" dataKey="pm10" name="PM10" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorPm10)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* SDG Impact */}
              <Card className="bg-blue-500/10 border-blue-500/20 shadow-sm">
                <CardContent className="p-6 flex items-start space-x-4">
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Droplets className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-blue-500 mb-2">SDG Impact Tracker</h3>
                    <p className="text-foreground/80 leading-relaxed font-medium">
                      {insights.sdgImpact}
                    </p>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
