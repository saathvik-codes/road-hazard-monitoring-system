import { Router } from "express";
import { loadColabSnapshot } from "../lib/colab-store";

const router = Router();

router.get("/", async (req, res) => {
  const limitParam = req.query.limit;
  const limit = limitParam ? Math.min(parseInt(String(limitParam), 10), 50) : 20;

  const snapshot = loadColabSnapshot();
  const locations = new Map(snapshot.locations.map((location) => [location.location_id, location]));

  const feed = [...snapshot.detections]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, isNaN(limit) ? 20 : limit)
    .map((detection) => {
      const location = locations.get(detection.location_id);
      return {
        id: detection.id,
        road_name: detection.location_id,
        pothole_count: detection.pothole_count,
        severity: detection.severity,
        detected_at: detection.timestamp,
        latitude: location?.latitude ?? 0,
        longitude: location?.longitude ?? 0,
      };
    });

  res.json(feed);
});

export default router;
