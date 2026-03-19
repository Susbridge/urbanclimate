import React from 'react';
import { cn } from '../lib/utils';
import { 
  Activity, Wind, ThermometerSun, Building, Leaf, 
  Zap, AlertTriangle
} from 'lucide-react';

const CHAINS = [
  {
    title: "Urban Development Loop",
    steps: [
      { label: "Urbanization", icon: Building, color: "text-slate-500" },
      { label: "Increases", type: "effect" },
      { label: "Heat Island", icon: ThermometerSun, color: "text-orange-500" },
      { label: "Worsens", type: "effect" },
      { label: "Heat Index", icon: Activity, color: "text-red-500" }
    ]
  },
  {
    title: "Energy & Air Quality",
    steps: [
      { label: "Urbanization", icon: Building, color: "text-slate-500" },
      { label: "Drives", type: "effect" },
      { label: "Generator Use", icon: Zap, color: "text-yellow-500" },
      { label: "Pollutes", type: "effect" },
      { label: "Air Quality", icon: AlertTriangle, color: "text-purple-500" }
    ]
  },
  {
    title: "Natural Mitigation",
    steps: [
      { label: "Tree Cover", icon: Leaf, color: "text-emerald-500" },
      { label: "Decreases", type: "positive" },
      { label: "Surface Heat", icon: ThermometerSun, color: "text-orange-500" },
      { label: "Improves", type: "positive" },
      { label: "Heat Index", icon: Activity, color: "text-red-500" }
    ]
  },
  {
    title: "Climate Dynamics",
    steps: [
      { label: "Wind Speed", icon: Wind, color: "text-cyan-500" },
      { label: "Disperses", type: "positive" },
      { label: "Pollutants", icon: AlertTriangle, color: "text-purple-500" },
      { label: "Improves", type: "positive" },
      { label: "Air Quality", icon: Activity, color: "text-emerald-500" }
    ]
  }
];

export default function MobileSystemsMap() {
  return (
    <div className="space-y-6">
      {CHAINS.map((chain, i) => (
        <div key={i} className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/60 dark:border-zinc-800/50 rounded-[32px] p-6 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">{chain.title}</p>
          <div className="flex flex-col gap-3">
            {chain.steps.map((step, j) => (
              <React.Fragment key={j}>
                {step.type ? (
                  <div className="flex justify-center py-1">
                    <div className={cn(
                      "text-[9px] font-black uppercase px-3 py-1 rounded-full border",
                      step.type === "effect" ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                    )}>
                      {step.label}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 bg-white/20 dark:bg-black/20 rounded-2xl p-3 border border-white/40 dark:border-white/5">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-zinc-800 shadow-sm", step.color)}>
                      {step.icon && <step.icon className="w-5 h-5" />}
                    </div>
                    <span className="text-sm font-bold">{step.label}</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
