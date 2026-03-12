/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import DashboardV1 from "./components/DashboardV1";
import DashboardV2 from "./components/DashboardV2";
import DashboardV3 from "./components/DashboardV3";
import { ThemeProvider } from "./components/ThemeProvider";

export default function App() {
  const [version, setVersion] = useState<"v1" | "v2" | "v3">("v3");

  return (
    <ThemeProvider defaultTheme="auto" storageKey="vite-ui-theme">
      {/* Version Toggle */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-white/60 dark:border-zinc-800/50 p-1 rounded-full shadow-lg flex items-center gap-1">
        <button
          onClick={() => setVersion("v1")}
          className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
            version === "v1"
              ? "bg-primary text-primary-foreground shadow-md"
              : "hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground"
          }`}
        >
          V1 <span className="hidden sm:inline">(Original)</span>
        </button>
        <button
          onClick={() => setVersion("v2")}
          className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
            version === "v2"
              ? "bg-primary text-primary-foreground shadow-md"
              : "hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground"
          }`}
        >
          V2 <span className="hidden sm:inline">(Narrative)</span>
        </button>
        <button
          onClick={() => setVersion("v3")}
          className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
            version === "v3"
              ? "bg-primary text-primary-foreground shadow-md"
              : "hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground"
          }`}
        >
          V3 <span className="hidden sm:inline">(AQI)</span>
        </button>
      </div>

      {version === "v1" && <DashboardV1 />}
      {version === "v2" && <DashboardV2 />}
      {version === "v3" && <DashboardV3 />}
    </ThemeProvider>
  );
}
