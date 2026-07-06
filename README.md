# 🌍 GeoGuesser

A multiplayer GeoGuessr-style game where players guess real-world locations from street-level imagery — with live scoring, round timers, and a clue system.

## Demo
_(add your live Vercel link here)_

## Features
- 📍 Real street-view exploration powered by Mapillary
- 🗺️ Interactive mini-map for placing guesses
- ⏱️ Round-based timer with auto-submit
- 🏆 Distance & time-based scoring system
- 💡 Location clue system (city/country hints)
- 🔄 Multi-round gameplay with final results screen

## Tech Stack
- **Framework:** Next.js 14 (App Router), TypeScript
- **Styling:** Tailwind CSS
- **Maps:** MapLibre GL, Mapillary JS SDK
- **Backend/Realtime:** Firebase (Firestore)

## Getting Started

```bash
git clone https://github.com/Hawyaa/geoguesser.git
cd geoguesser
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables
Create a `.env.local` file: