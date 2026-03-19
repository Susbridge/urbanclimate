# Urban Climate Signals
## Turning Urban Heat and Pollution into Decision-Ready Intelligence

**Urban Climate Signals** is a live, city-level climate intelligence dashboard designed for fast-growing African cities, starting with Lagos, Nigeria. It provides real-time environmental data, systemic impact modeling, and interactive policy simulation to help residents and city leaders manage extreme heat and air quality risk.

---

## 🚀 Key Features

### 1. What is Happening Right Now (Live Signals)
Real-time monitoring of air temperature, humidity, wind, and AQI. The dashboard focuses on perceived heat (Heat Index) and provides health-focused explanations of current conditions.

### 2. How the City Climate System Works (Systems Map)
An interactive flow chart that maps the causal links between urban drivers (like urbanization and traffic) and their environmental impacts. It helps non-technical users understand how local choices influence their climate.

### 3. What Cities Can Do (Policy Simulator)
A decision-studio tool where users can simulate how changes in urban policies—such as increasing tree cover or reducing generator reliance—impact the city’s heat index and air quality in real-time.

### 4. City Resilience Outlook (SDG Tracker)
A performance scorecard that translates live environmental signals into progress markers for **SDG 3 (Health)** and **SDG 11 (Sustainable Cities)**.

---

## 🛠️ Technology & Data

- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Visualizations**: Framer Motion + Lucide Icons + Custom SVG Gauges
- **Environmental Data**: [Open-Meteo API](https://open-meteo.com/)
- **Atmospheric Models**: Copernicus CAMS-based signals
- **Air Quality Standards**: Unified version of the **United States EPA AQI (0-500)**
- **Geolocation**: Privacy-first IP-based city detection

---

## 💻 Local Development

**Prerequisites:** Node.js (v18+)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/tomiabe/urbanclimate.git
   cd urban-climate-signals
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

---

## 🧪 Knowledge Lab
This project is part of the **Susbridge Knowledge Lab**, where we turn complex environmental data into decision tools for impact-driven teams.

For more information, visit [susbridge.xyz](https://susbridge.xyz).
