/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import DashboardV1 from "./components/DashboardV1";
import DashboardV2 from "./components/Dashboard";
import DashboardV3 from "./components/DashboardV3";
import { ThemeProvider } from "./components/ThemeProvider";

export default function App() {
  const [version, setVersion] = useState<'v1' | 'v2' | 'v3'>('v3');

  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-background/80 backdrop-blur-xl p-1.5 rounded-full border shadow-lg flex gap-1">
        <button 
          onClick={() => setVersion('v1')} 
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${version === 'v1' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
        >
          V1
        </button>
        <button 
          onClick={() => setVersion('v2')} 
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${version === 'v2' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
        >
          V2 (Apple)
        </button>
        <button 
          onClick={() => setVersion('v3')} 
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${version === 'v3' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
        >
          V3 (Intelligence)
        </button>
      </div>
      {version === 'v1' && <DashboardV1 />}
      {version === 'v2' && <DashboardV2 />}
      {version === 'v3' && <DashboardV3 />}
    </ThemeProvider>
  );
}
