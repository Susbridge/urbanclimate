/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import DashboardV5 from "./components/DashboardV5";
import { ThemeProvider } from "./components/ThemeProvider";

export default function App() {
  return (
    <ThemeProvider defaultTheme="auto" storageKey="vite-ui-theme">
      <DashboardV5 />
    </ThemeProvider>
  );
}
