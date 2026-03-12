import React, { useState } from 'react';
import { Slider } from './ui/slider';
import { cn } from '../lib/utils';
import { Activity, AlertTriangle, Building, Leaf, Zap, Bus } from 'lucide-react';

interface PolicySimulatorProps {
  baseTemp: number;
  baseHumidity: number;
  baseAQI: number;
}

export default function PolicySimulator({ baseTemp, baseHumidity, baseAQI }: PolicySimulatorProps) {
  // Sliders state
  const [treeCover, setTreeCover] = useState([10]); // Percentage
  const [generatorReliance, setGeneratorReliance] = useState([80]); // Percentage
  const [publicTransit, setPublicTransit] = useState([20]); // Percentage
  const [concreteDensity, setConcreteDensity] = useState([75]); // Percentage

  // Simple heuristic math model for simulation
  // Heat Index calculation (simplified for demonstration)
  const calculateHeatIndex = () => {
    // Base feels like calculation (simplified)
    // If temp is low, heat index isn't really a factor, but we'll use a simple offset for the demo
    let feelsLike = baseTemp;
    if (baseTemp >= 27 && baseHumidity >= 40) {
      feelsLike = baseTemp + ((baseHumidity - 40) * 0.1); // Extremely simplified baseline
    }
    
    // Concrete density increases heat island effect
    feelsLike += (concreteDensity[0] - 75) * 0.05;
    
    // Tree cover reduces heat island effect
    feelsLike -= (treeCover[0] - 10) * 0.1;
    
    return Math.max(baseTemp, Math.round(feelsLike * 10) / 10);
  };

  const calculateAQI = () => {
    let aqi = baseAQI;
    
    // Generators increase AQI (worse)
    aqi += (generatorReliance[0] - 80) * 0.8;
    
    // Public transit decreases AQI (better, fewer cars)
    aqi -= (publicTransit[0] - 20) * 0.5;
    
    // Concrete density (urbanization) slightly increases AQI
    aqi += (concreteDensity[0] - 75) * 0.2;
    
    return Math.max(20, Math.round(aqi));
  };

  const simulatedHeatIndex = calculateHeatIndex();
  const simulatedAQI = calculateAQI();

  const getAQIColor = (aqi: number) => {
    if (aqi <= 50) return "text-emerald-500";
    if (aqi <= 100) return "text-yellow-500";
    if (aqi <= 150) return "text-orange-500";
    if (aqi <= 200) return "text-red-500";
    return "text-purple-600";
  };

  const getHeatColor = (temp: number) => {
    if (temp <= 35) return "text-yellow-500";
    if (temp <= 40) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <div className="grid md:grid-cols-12 gap-6">
      {/* Controls Panel */}
      <div className="md:col-span-7 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-8 shadow-sm">
        <h2 className="text-2xl font-bold tracking-tight mb-8">Actions Cities Can Take</h2>
        
        <div className="space-y-8">
          {/* Tree Cover */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                <Leaf className="w-4 h-4 text-emerald-500" /> Green Infrastructure
              </label>
              <span className="font-bold text-lg">{treeCover[0]}%</span>
            </div>
            <Slider 
              value={treeCover} 
              onValueChange={setTreeCover} 
              max={50} 
              step={1}
              className="[&_[role=slider]]:border-emerald-500 [&_.absolute]:bg-emerald-500"
            />
            <p className="text-xs text-muted-foreground font-medium">Increasing tree cover provides shade and evaporative cooling.</p>
          </div>

          {/* Generator Reliance */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" /> Diesel Generator Reliance
              </label>
              <span className="font-bold text-lg">{generatorReliance[0]}%</span>
            </div>
            <Slider 
              value={generatorReliance} 
              onValueChange={setGeneratorReliance} 
              max={100} 
              step={1}
              className="[&_[role=slider]]:border-yellow-500 [&_.absolute]:bg-yellow-500"
            />
            <p className="text-xs text-muted-foreground font-medium">Reducing reliance improves local air quality significantly.</p>
          </div>

          {/* Public Transit */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                <Bus className="w-4 h-4 text-blue-500" /> Public Transit Usage
              </label>
              <span className="font-bold text-lg">{publicTransit[0]}%</span>
            </div>
            <Slider 
              value={publicTransit} 
              onValueChange={setPublicTransit} 
              max={80} 
              step={1}
              className="[&_[role=slider]]:border-blue-500 [&_.absolute]:bg-blue-500"
            />
            <p className="text-xs text-muted-foreground font-medium">Higher transit usage reduces vehicle emissions and traffic congestion.</p>
          </div>

          {/* Concrete Density */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-500" /> Urban Concrete Density
              </label>
              <span className="font-bold text-lg">{concreteDensity[0]}%</span>
            </div>
            <Slider 
              value={concreteDensity} 
              onValueChange={setConcreteDensity} 
              max={100} 
              min={40}
              step={1}
              className="[&_[role=slider]]:border-slate-500 [&_.absolute]:bg-slate-500"
            />
            <p className="text-xs text-muted-foreground font-medium">High concrete density traps heat, worsening the Urban Heat Island effect.</p>
          </div>
        </div>
      </div>

      {/* Output Panel */}
      <div className="md:col-span-5 flex flex-col gap-6">
        {/* Heat Index Output */}
        <div className="flex-1 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-8 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Activity className="w-4 h-4" /> Heat Index
          </div>
          
          <div className="mt-6">
            <span className={cn("text-7xl font-light tracking-tighter transition-colors duration-500", getHeatColor(simulatedHeatIndex))}>
              {simulatedHeatIndex}°
            </span>
          </div>
          
          <div className="mt-4 flex items-center gap-2 text-sm font-medium">
            <span className="text-muted-foreground">Base (Current):</span>
            <span className="font-bold">{baseTemp}°</span>
          </div>
          
          <div className="mt-6 text-sm font-medium leading-relaxed max-w-[250px]">
            {simulatedHeatIndex < 40 
              ? "Significant reduction in heat stress. Safer for outdoor activities." 
              : "Extreme heat stress remains. High risk of heat exhaustion."}
          </div>
        </div>

        {/* AQI Output */}
        <div className="flex-1 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-8 shadow-sm flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute top-4 left-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <AlertTriangle className="w-4 h-4" /> Air Quality (AQI)
          </div>
          
          <div className="mt-6">
            <span className={cn("text-7xl font-light tracking-tighter transition-colors duration-500", getAQIColor(simulatedAQI))}>
              {simulatedAQI}
            </span>
          </div>
          
          <div className="mt-4 flex items-center gap-2 text-sm font-medium">
            <span className="text-muted-foreground">Base (Current):</span>
            <span className="font-bold">{baseAQI}</span>
          </div>
          
          <div className="mt-6 text-sm font-medium leading-relaxed max-w-[250px]">
            {simulatedAQI <= 100 
              ? "Air quality is acceptable. Health risks are minimized." 
              : "Unhealthy for sensitive groups. Pollution levels remain high."}
          </div>
        </div>
      </div>
    </div>
  );
}
