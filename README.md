# 🎣 Angler's Daily Dashboard (Fishtrap Lake Edition)

A high-precision, tactical fishing forecast dashboard and digital logbook built specifically for **Fishtrap Lake (Pikeville, KY)**. Angler's Daily combines real-time hydrology data, meteorological analysis, solunar feeding peak calculations, and Google Gemini AI insights to deliver actionable angling intelligence.

---

## ✨ Features

### 🌊 Fishtrap Lake Hydrology & Water Levels
- **USACE Pool Elevation Monitoring**: Track current pool elevation relative to summer pool (757.0 ft) and winter pool (730.0 ft).
- **Flow & Capacity Analytics**: Monitor inflow (cfs), outflow/discharge rates, percent storage capacity, and water surface temperature.
- **Water Clarity & Structure Guide**: Real-time clarity evaluations and seasonal structure targets (submerged points, rock walls, brush piles, Levisa Fork channel).

### ☀️ Solunar & Feeding Window Predictions
- **Major & Minor Feeding Periods**: Calculated daily solunar feeding windows based on celestial alignment and moon overhead/underfoot transit.
- **Moon Phase & Illumination**: Accurate lunar cycle data, moonrise, moonset, sunrise, and sunset times.
- **Dynamic Bite Score (0–100)**: Multi-variable tactical score calculated from barometric pressure movement, solunar windows, wind direction, cloud cover, and seasonal patterns.

### 🌡️ Tactical Barometer & Meteorology
- **Barometric Pressure Trend Curve**: Live inHg pressure tracking with trend alerts (Rapid Rise, Slow Fall, Steady, Storm Front).
- **Hourly Forecast Grid**: Temperature, feels-like temperature, precipitation probability, wind speed/direction, and UV index.
- **Doppler Radar**: Interactive live weather radar overlay powered by RainViewer for monitoring approaching storm fronts and cloud cover.

### 🧠 Gemini AI Angler Guide
- **Tactical Overview Briefing**: Instant natural-language fishing conditions summary generated from live lake and weather telemetry.
- **Interactive AI Angler Assistant**: Ask questions about specific lures, depths, structures, weather transitions, and techniques tailored directly to current Fishtrap Lake conditions.

### 🐟 Species Bite Radar
- Target-specific bite scores, optimum lure choices, and recommended depth zones for key Fishtrap Lake gamefish:
  - Largemouth Bass
  - Smallmouth Bass
  - Hybrid Striped Bass (Wiper)
  - Black & White Crappie
  - Walleye
  - Channel & Flathead Catfish
  - Bluegill & Sunfish

### 📖 Digital Catch Logbook
- **Catch Recording**: Log species, length, weight, depth, lure, water conditions, and photos.
- **Persistent Storage**: Saves catches locally with quick export and viewing capabilities.
- **Quick Logging**: Global keyboard shortcuts (`L` to log, `U` to toggle units).

### 📱 PWA & Mobile QR Hub
- **Progressive Web App (PWA)**: Installable directly on Chrome for Desktop, Android, and iOS home screens.
- **Mobile QR Connect**: Instant QR code generator to transfer the session directly to your smartphone on the water.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons & Animation**: [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/), [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
- **AI / LLM Integration**: [@google/genai](https://www.npmjs.com/package/@google/genai) (Google Gemini API)
- **Backend / Dev Server**: [Express](https://expressjs.com/), [tsx](https://github.com/privatenumber/tsx), [esbuild](https://esbuild.github.io/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ or 20+
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/anglers-daily-dashboard.git
   cd anglers-daily-dashboard
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env` and provide your Gemini API key:
   ```bash
   cp .env.example .env
   ```
   Edit `.env`:
   ```env
   GEMINI_API_KEY="your_gemini_api_key_here"
   APP_URL="http://localhost:3000"
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `L` / `+` | Open Quick Catch Log Modal |
| `U` | Toggle Imperial (°F, mph) / Metric (°C, km/h) |
| `Esc` | Close active modals / menus |

---

## 🗺️ Hardcoded Target Location

- **Water Body**: Fishtrap Lake / Levisa Fork
- **Region**: Pikeville, Pike County, Kentucky, USA
- **Coordinates**: `37.4253° N, -82.4182° W`
- **Management**: US Army Corps of Engineers (Huntington District)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
