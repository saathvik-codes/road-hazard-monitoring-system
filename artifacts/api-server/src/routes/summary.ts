import { Router } from "express";
import { loadColabSnapshot } from "../lib/colab-store";

const router = Router();

router.get("/", async (req, res) => {
  const snapshot = loadColabSnapshot();
  const severityBreakdown = { Low: 0, Medium: 0, High: 0, Critical: 0 } as Record<string, number>;
  let totalPotholes = 0;
  let totalDiameter = 0;
  let criticalZones = 0;

  for (const detection of snapshot.detections) {
    totalPotholes += detection.pothole_count;
    totalDiameter += detection.avg_diameter;
    if (detection.severity in severityBreakdown) {
      severityBreakdown[detection.severity] += 1;
    }
    if (detection.severity === "Critical") {
      criticalZones += 1;
    }
  }

  const totalRoads = new Set(snapshot.locations.map((location) => location.location_id)).size;
  const avgDiameter = snapshot.detections.length > 0 ? totalDiameter / snapshot.detections.length : 0;
  const lastDetectionAt = [...snapshot.detections]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0]?.timestamp ?? null;

  res.json({
    total_roads: totalRoads,
    total_potholes: totalPotholes,
    critical_zones: criticalZones,
    avg_diameter_cm: Number(avgDiameter.toFixed(1)),
    last_detection_at: lastDetectionAt,
    severity_breakdown: severityBreakdown,
  });
});

export default router;
