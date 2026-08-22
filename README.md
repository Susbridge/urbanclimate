# Urban Climate Signals

## Live Urban Climate Intelligence for African Cities

**Urban Climate Signals** is a public-facing environmental intelligence dashboard for fast-growing African cities. It translates live weather and air-quality readings into plain-language climate signals, city scorecards, and policy simulations that help residents, researchers, and decision-makers understand what is happening outside and why it matters.

The project is currently deployed at [urbanclimate.susbridge.xyz](https://urbanclimate.susbridge.xyz/).

---

## What the App Does

### Live Signals
Shows current temperature, humidity, wind speed, perceived heat, and US AQI for the selected city.

### City Search and Location
Loads the user's current city through browser geolocation when permission is granted, with IP-based location as a fallback. Users can also manually search and switch between African cities.

### Environmental Interpretation
Turns live readings into practical explanations: how it feels outside, what is driving the condition, and what the health implications may be.

### Systems Map
Visualizes how urban systems such as traffic, generators, tree cover, waste burning, and density can influence heat and pollution.

### Policy Simulator
Lets users explore how changes such as more tree cover, cleaner transport, better waste control, and reduced generator dependence could shift climate stress.

### City Scorecard
Converts live environmental indicators into an easy-to-read resilience outlook aligned with public health and sustainable-city priorities.

### AI Insights
Uses a Cloudflare Worker proxy to generate structured AI summaries from the live environmental data. The browser never receives the Groq API key.

---

## Data Sources

- **Weather and air quality:** [Open-Meteo](https://open-meteo.com/) and Open-Meteo Air Quality API
- **City search:** Open-Meteo Geocoding API
- **Browser location fallback:** BigDataCloud reverse geocoding and IP-based city lookup
- **AQI scale:** US EPA-style AQI values exposed by Open-Meteo
- **AI summaries:** Groq API via Cloudflare Worker, currently using `openai/gpt-oss-20b`

The app uses a short client-side cache for environmental requests so returning to a city within a few minutes shows consistent readings instead of flickering between API refreshes.

---

## Tech Stack

- **Frontend:** React, TypeScript, Vite
- **Styling:** Tailwind CSS, Manrope typography
- **UI and visualization:** Recharts, React Flow, Lucide icons, Motion
- **Hosting:** GitHub Pages with a custom domain
- **AI proxy:** Cloudflare Worker

---

## Local Development

**Prerequisites:** Node.js 18+

```bash
git clone https://github.com/Susbridge/urbanclimate.git
cd urbanclimate
npm install
npm run dev
```

The dev server runs on port `3000`.

```bash
npm run build
npm run lint
```

---

## Environment Variables

For production AI insights, set this GitHub Actions variable:

```bash
VITE_INSIGHTS_WORKER_URL=https://urban-climate.tomi.workers.dev
```

For the Cloudflare Worker, set this secret in Cloudflare:

```bash
GROQ_API_KEY=your_groq_api_key
```

---

## Deployment

The frontend is built by GitHub Actions and published to GitHub Pages. The custom domain points to GitHub Pages via DNS.

The Worker is deployed separately to Cloudflare:

```bash
wrangler deploy worker/index.js --name urban-climate --compatibility-date 2024-01-01
```

---

## Susbridge Knowledge Lab

Urban Climate Signals is part of the **Susbridge Knowledge Lab**, where complex environmental data is translated into practical decision tools for communities, city leaders, and impact-driven teams.

Learn more at [susbridge.xyz](https://susbridge.xyz/).
