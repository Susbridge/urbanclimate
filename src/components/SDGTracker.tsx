import React from 'react';
import { Heart, Home, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface SDGTrackerProps {
  aqi: number;
  heatIndex: number;
  pm25: number;
}

export default function SDGTracker({ aqi, heatIndex, pm25 }: SDGTrackerProps) {
  // --- SDG 3: Good Health and Well-being ---
  // Target 3.9: Substantially reduce the number of deaths and illnesses from hazardous chemicals and air, water and soil pollution.
  // Calculation: Based heavily on PM2.5 (WHO 24h guideline is 15 µg/m³) and Heat Index.
  const calculateSDG3 = () => {
    // PM2.5 Score (0 to 100)
    // 15 µg/m³ or less = 100. 75 µg/m³ or more = 0.
    const pm25Score = Math.max(0, Math.min(100, 100 - ((pm25 - 15) / 60) * 100));
    
    // Heat Score (0 to 100)
    // 27°C or less = 100. 41°C or more = 0.
    const heatScore = Math.max(0, Math.min(100, 100 - ((heatIndex - 27) / 14) * 100));

    // Weight: PM2.5 is a chronic/acute health killer (60%), Heat is acute (40%)
    return Math.round((pm25Score * 0.6) + (heatScore * 0.4));
  };

  // --- SDG 11: Sustainable Cities and Communities ---
  // Target 11.6: Reduce the adverse per capita environmental impact of cities, including by paying special attention to air quality.
  // Calculation: Based on overall AQI (which includes PM10, NO2, O3) and Urban Heat Island effect.
  const calculateSDG11 = () => {
    // AQI Score (0 to 100)
    // AQI 50 or less = 100. AQI 200 or more = 0.
    const aqiScore = Math.max(0, Math.min(100, 100 - ((aqi - 50) / 150) * 100));
    
    // Heat Score (0 to 100)
    // 27°C or less = 100. 41°C or more = 0.
    const heatScore = Math.max(0, Math.min(100, 100 - ((heatIndex - 27) / 14) * 100));

    // Weight: Overall urban air quality (50%), Urban Heat Island (50%)
    return Math.round((aqiScore * 0.5) + (heatScore * 0.5));
  };

  const sdg3Score = calculateSDG3();
  const sdg11Score = calculateSDG11();

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 60) return "bg-yellow-500";
    if (score >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* SDG 3 */}
      <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-6 sm:p-8 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#4C9F38] flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                <Heart className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">SDG 3</h3>
                <p className="text-lg font-bold leading-tight">Good Health & Well-being</p>
              </div>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <Info className="w-5 h-5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 rounded-2xl shadow-xl border-white/60 dark:border-zinc-800/50 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl text-sm">
                <p className="font-bold mb-2">How is this calculated?</p>
                <p className="text-muted-foreground mb-2">
                  This score tracks progress toward <strong>Target 3.9</strong> (reducing illnesses from air pollution).
                </p>
                <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                  <li><strong>60% Weight:</strong> PM2.5 concentration relative to the WHO 24h guideline (15 µg/m³).</li>
                  <li><strong>40% Weight:</strong> Heat Index danger levels (stress on the cardiovascular system).</li>
                </ul>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex items-end gap-3 mb-6">
            <span className={cn("text-6xl font-light tracking-tighter", getScoreColor(sdg3Score))}>
              {sdg3Score}
            </span>
            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">/ 100</span>
          </div>

          <div className="w-full h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden mb-6">
            <div 
              className={cn("h-full rounded-full transition-all duration-1000", getScoreBg(sdg3Score))} 
              style={{ width: `${sdg3Score}%` }}
            />
          </div>

          <p className="text-sm font-medium leading-relaxed text-muted-foreground">
            {sdg3Score >= 80 
              ? "Current environmental conditions support healthy living with minimal respiratory or heat-related stress." 
              : sdg3Score >= 60 
              ? "Moderate environmental stress. Vulnerable populations may experience health impacts."
              : "High risk to public health. Current pollution and heat levels significantly increase respiratory and cardiovascular strain."}
          </p>
        </div>
      </div>

      {/* SDG 11 */}
      <div className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-6 sm:p-8 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FD9D24] flex items-center justify-center text-white flex-shrink-0 shadow-lg">
                <Home className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">SDG 11</h3>
                <p className="text-lg font-bold leading-tight">Sustainable Cities</p>
              </div>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <Info className="w-5 h-5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 rounded-2xl shadow-xl border-white/60 dark:border-zinc-800/50 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl text-sm">
                <p className="font-bold mb-2">How is this calculated?</p>
                <p className="text-muted-foreground mb-2">
                  This score tracks progress toward <strong>Target 11.6</strong> (reducing the adverse environmental impact of cities).
                </p>
                <ul className="list-disc pl-4 text-muted-foreground space-y-1">
                  <li><strong>50% Weight:</strong> Overall Air Quality Index (AQI), which includes PM10, NO₂, and Ozone.</li>
                  <li><strong>50% Weight:</strong> Heat Index, representing the severity of the Urban Heat Island effect.</li>
                </ul>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex items-end gap-3 mb-6">
            <span className={cn("text-6xl font-light tracking-tighter", getScoreColor(sdg11Score))}>
              {sdg11Score}
            </span>
            <span className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">/ 100</span>
          </div>

          <div className="w-full h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden mb-6">
            <div 
              className={cn("h-full rounded-full transition-all duration-1000", getScoreBg(sdg11Score))} 
              style={{ width: `${sdg11Score}%` }}
            />
          </div>

          <p className="text-sm font-medium leading-relaxed text-muted-foreground">
            {sdg11Score >= 80 
              ? "The city demonstrates strong resilience to climate factors, maintaining safe and sustainable urban conditions." 
              : sdg11Score >= 60 
              ? "Urban infrastructure is under moderate stress from current climate and pollution levels."
              : "Severe urban stress. The combination of heat islands and poor air quality indicates a need for urgent sustainable interventions."}
          </p>
        </div>
      </div>
    </div>
  );
}
