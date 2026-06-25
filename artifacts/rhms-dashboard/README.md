# Road Hazard Monitoring Dashboard

A React + Vite dashboard for monitoring YOLOv8 pothole detections on Google Maps with severity heatmaps.

## Local Development

1. Copy the environment example:
   ```
   cp .env.example .env
   ```
   Then edit `.env` and add your Google Maps API key.

2. Install dependencies:
   ```
   pnpm install
   ```

3. Run the dev server:
   ```
   pnpm --filter @workspace/rhms-dashboard run dev
   ```
   The app will be available at `http://localhost:3000`.

## Tech Stack

- React 19 + Vite + TypeScript
- Tailwind CSS v4
- Framer Motion
- Recharts
- Wouter (routing)
- Google Maps JavaScript API

## Notes

- The backend API server must be running for data to load (`pnpm --filter @workspace/api-server run dev`).
- Without a Google Maps API key, the map will fail gracefully with a loading indicator.
- This dashboard is part of a pnpm workspace; run commands from the repo root with `--filter @workspace/rhms-dashboard`.
