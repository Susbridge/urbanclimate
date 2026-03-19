# Urban Climate Signals: Case Study
## Turning Urban Heat and Pollution into Decision-Ready Intelligence

Lagos has always been warm. Lately, it has started to feel punishing.

For city leaders in fast-growing African metropolises, climate change isn't a future abstraction; it’s a daily governance challenge. Each dry season brings the same story: hotter days, nights that fail to cool, and air that feels heavy long after sunset. While information is everywhere—scattered across weather feeds, satellite maps, and technical reports—**usable clarity is rare.**

**Urban Climate Signals** is our response to that gap. It is a live, city-level climate intelligence dashboard designed to explain *why* cities feel hotter, *how* pollution builds up, and *which* levers local decision-makers can pull to reduce stress on people and infrastructure. 

---

## Why We Built This
In our work with impact-driven organizations, we see a recurring pattern: information overload leads to decision paralysis. Heat warnings are often generic, air quality reports are technical, and city officials are left with long PDFs and little help turning them into sharp, tactical decisions.

As urbanization across Africa accelerates, the combination of concrete density, traffic emissions, and backup generator reliance is adding "local" heat and pollution on top of global climate trends. We wanted to ask a narrower, more urgent question:

**What exactly is making a city feel this hot today, and what can we do differently tomorrow morning?**

---

## The Framework: From Signals to SDGs
Instead of building another abstract climate model, we focused on three simple, narrative ideas:

*   **Start from how it feels**: We anchor the experience on the *Heat Index*—the "perceived heat" that actual human bodies feel—to show why a 33°C afternoon in Lagos or Accra can feel closer to 40°C.
*   **Connect heat to air quality**: These crises are rarely separate. We model how stagnant air doesn't just feel uncomfortable; it traps particulate matter close to where people breathe.
*   **Link daily signals to long-term resilience**: We translate live environmental data into simple markers for **SDG 3 (Health)** and **SDG 11 (Sustainable Cities)**, showing leaders how today’s conditions align with their global commitments.

---

## How it Works
The experience is structured as a narrative arc, guiding the user from immediate awareness to long-term policy simulation.

### 1. The Live Signal
The first view focuses on the "City-Day." We use real-time data to identify the primary stressors of the moment—whether it’s "Urban Trapped Heat" from concrete density or "Heavy, Still Air" preventing nighttime cooling. 

`[IMAGE SUGGESTION: Dashboard Overview showing the centered "What's Happening Right Now" section]`

### 2. The Systems Map
We map the chain between drivers (urbanization, traffic, generators) and mitigators (tree cover). This interactive cause-and-effect diagram helps non-technical users follow how a change in one part of the system nudges the others.

`[IMAGE SUGGESTION: The interactive Systems Map flow chart showing connections between Drivers and Impacts]`

### 3. The Policy Simulator
This is the heart of the "Decision Studio." Users can adjust four key variables that city leaders actually control: **Green Infrastructure, Diesel Generator Reliance, Public Transit Usage,** and **Urban Concrete Density.** 

As sliders move, the model updates the projected heat index and air quality (AQI) in real-time. It’s an exploratory playground to test interventions before they are written into policy.

`[IMAGE SUGGESTION: The Policy Simulator showing the city-specific conditional lever for diesel generators]`

### 4. The Resilience Outlook
Finally, we convert these readings into a **City Resilience Scorecard**. This section moves the conversation from "weather" to "governance," providing a language for leaders to talk about why heat and air quality are fundamental to a city's growth and health targets.

---

## Data, Methods, and Technology
Urban Climate Signals sits at the information layer, translating raw models into real-world insights.

*   **Standardization**: We use Open-Meteo’s CAMS-based atmospheric models, unified under the **United States EPA AQI standard** to allow for consistent comparison across different geographies.
*   **Precision**: We anchor readings to curated city coordinates (e.g., Ikeja for Lagos) rather than vague centroids, ensuring data reflects where people actually live and work.
*   **Modern Stack**: Built in the **Susbridge Knowledge Lab**, the app is a lightweight, mobile-first experience using React and Vite, designed to load rapidly on mobile networks across the continent.

---

## Who This Serves
*   **City & State Governments**: To inform heat-action plans and stress-test policies.
*   **Urban Planners**: To guide zoning and building codes based on concrete/heat trade-offs.
*   **Residents & NGOs**: To provide a clear language for demanding specific, data-backed improvements to their local environment.

**Urban Climate Signals** is more than a dashboard. It is a live model of urban climate stress, proving that the heat our cities feel today is not inevitable—it is the outcome of choices we can start to change now.
