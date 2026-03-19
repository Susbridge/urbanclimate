import React from 'react';
import { cn } from '../lib/utils';
import { 
  Building, Leaf, Wind
} from 'lucide-react';

const CATEGORIES = [
  { 
    name: "Drivers", 
    icon: Building, 
    color: "text-slate-500",
    items: [
      { name: "Urbanization", tags: ["Increases Heat", "Traps Pollution"], desc: "More buildings and roads absorb heat and slow down air movement, keeping pollution near the ground." },
      { name: "Diesel Generators", tags: ["Worsens Air"], desc: "Local emissions from backup power increase PM2.5 levels regardless of regional weather." }
    ]
  },
  { 
    name: "Mitigators", 
    icon: Leaf, 
    color: "text-emerald-500",
    items: [
      { name: "Tree Cover", tags: ["Cools Air", "Improves Air"], desc: "Trees provide shade and evaporative cooling while filtering particulate matter from the air." }
    ]
  },
  { 
    name: "Climate Factors", 
    icon: Wind, 
    color: "text-cyan-500",
    items: [
      { name: "Wind Speed", tags: ["Disperses Heat", "Clears Air"], desc: "Stronger winds help move hot air out of city canyons and disperse accumulated pollutants." }
    ]
  }
];

export default function MobileSystemsMap() {
  return (
    <div className="space-y-8">
      {CATEGORIES.map((cat, i) => (
        <div key={i} className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <cat.icon className={cn("w-4 h-4", cat.color)} />
            <h4 className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">{cat.name}</h4>
          </div>
          <div className="space-y-3">
            {cat.items.map((item, j) => (
              <div key={j} className="bg-white/40 dark:bg-zinc-900/40 backdrop-blur-xl border border-white/60 dark:border-zinc-800/50 rounded-2xl p-5 shadow-sm">
                <h5 className="text-[14px] font-bold mb-3">{item.name}</h5>
                <div className="flex flex-wrap gap-2 mb-4">
                  {item.tags.map((tag, k) => (
                    <span key={k} className={cn(
                      "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-normal whitespace-nowrap",
                      tag.includes("Increases") || tag.includes("Worsens") || tag.includes("Traps") ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"
                    )}>
                      {tag}
                    </span>
                  ))}
                </div>
                <p className="text-[14px] text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
