/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */


import React, { useState, useEffect } from "react";
import DashboardV3 from "./components/DashboardV3";
import { ThemeProvider } from "./components/ThemeProvider";
import MobileSystemMapOptions from "./components/MobileSystemMapOptions";

export default function App() {
  return (
    <ThemeProvider defaultTheme="auto" storageKey="vite-ui-theme">
      <DashboardV3 />
    </ThemeProvider>
  );
}
