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
  const calculateSDG3 = () => {
    // PM2.5 Score (0 to 100)
    // WHO 24h guideline is 15. We want to penalize starting much earlier.
    // 5 µg/m³ = 100. 15 µg/m³ = 60. 30 µg/m³ (Unhealthy) = 0.
    const pm25Score = Math.max(0, Math.min(100, 100 - ((pm25 - 5) / 25) * 100));
    
    // Heat Score (0 to 100)
    // 27°C = 100. 32°C (Caution) = 70. 39°C (Danger) = 0.
    const heatScore = Math.max(0, Math.min(100, 100 - ((heatIndex - 27) / 12) * 100));

    // Weight: 60% PM2.5, 40% Heat
    const rawScore = (pm25Score * 0.6) + (heatScore * 0.4);
    
    // Final score penalized if either is low (Lowest-factor impact)
    const lowest = Math.min(pm25Score, heatScore);
    return {
      total: Math.round(rawScore * 0.7 + lowest * 0.3),
      pm25Score: Math.round(pm25Score),
      heatScore: Math.round(heatScore)
    };
  };

  const calculateSDG11 = () => {
    // AQI Score (0 to 100)
    // US EPA Scale: 0-50 (Good) = 100-80. 51-100 (Moderate) = 80-60. 101-150 (Sensitive) = 60-30. 150+ = 30-0.
    let aqiScore = 0;
    if (aqi <= 50) aqiScore = 100 - (aqi * 0.4); // 50 -> 80
    else if (aqi <= 100) aqiScore = 80 - ((aqi - 50) * 0.4); // 100 -> 60
    else if (aqi <= 150) aqiScore = 60 - ((aqi - 100) * 0.6); // 150 -> 30
    else aqiScore = Math.max(0, 30 - ((aqi - 150) * 0.2)); // 300 -> 0
    
    // Heat Score (0 to 100)
    const heatScore = Math.max(0, Math.min(100, 100 - ((heatIndex - 27) / 12) * 100));

    // Weight: 50% AQI, 50% Heat
    const rawScore = (aqiScore * 0.5) + (heatScore * 0.5);
    const lowest = Math.min(aqiScore, heatScore);
    
    return {
      total: Math.round(rawScore * 0.7 + lowest * 0.3),
      aqiScore: Math.round(aqiScore),
      heatScore: Math.round(heatScore)
    };
  };

  const sdg3 = calculateSDG3();
  const sdg11 = calculateSDG11();
  const sdg3Score = sdg3.total;
  const sdg11Score = sdg11.total;

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

          <div className="w-full h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden mb-4">
            <div 
              className={cn("h-full rounded-full transition-all duration-1000", getScoreBg(sdg3Score))} 
              style={{ width: `${sdg3Score}%` }}
            />
          </div>

          <div className="flex gap-4 mb-6 pt-2 border-t border-black/5 dark:border-white/5">
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">PM2.5 Score</p>
              <div className="flex items-center gap-2">
                <span className={cn("text-lg font-bold", getScoreColor(sdg3.pm25Score))}>{sdg3.pm25Score}%</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Heat Score</p>
              <div className="flex items-center gap-2">
                <span className={cn("text-lg font-bold", getScoreColor(sdg3.heatScore))}>{sdg3.heatScore}%</span>
              </div>
            </div>
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

          <div className="w-full h-2 bg-black/5 dark:bg-white/10 rounded-full overflow-hidden mb-4">
            <div 
              className={cn("h-full rounded-full transition-all duration-1000", getScoreBg(sdg11Score))} 
              style={{ width: `${sdg11Score}%` }}
            />
          </div>

          <div className="flex gap-4 mb-6 pt-2 border-t border-black/5 dark:border-white/5">
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">AQI Score</p>
              <div className="flex items-center gap-2">
                <span className={cn("text-lg font-bold", getScoreColor(sdg11.aqiScore))}>{sdg11.aqiScore}%</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Heat Score</p>
              <div className="flex items-center gap-2">
                <span className={cn("text-lg font-bold", getScoreColor(sdg11.heatScore))}>{sdg11.heatScore}%</span>
              </div>
            </div>
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
