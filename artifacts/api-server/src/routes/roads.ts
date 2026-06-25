import { Router } from "express";
import { loadColabSnapshot } from "../lib/colab-store";

const router = Router();

router.get("/ranking", async (req, res) => {
  const snapshot = loadColabSnapshot();
  const grouped = new Map<
    string,
    { road_name: string; total_potholes: number; scores: number[]; severities: string[] }
  >();

  for (const detection of snapshot.detections) {
    const severityScore = detection.avg_diameter + 10 * detection.pothole_count;
    const current = grouped.get(detection.location_id) ?? {
      road_name: detection.location_id,
      total_potholes: 0,
      scores: [],
      severities: [],
    };

    current.total_potholes += detection.pothole_count;
    current.scores.push(severityScore);
    current.severities.push(detection.severity);
    grouped.set(detection.location_id, current);
  }

  const rows = [...grouped.values()]
    .map((row) => {
      const counts = row.severities.reduce<Record<string, number>>((acc, severity) => {
        acc[severity] = (acc[severity] ?? 0) + 1;
        return acc;
      }, {});

      const dominantSeverity = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Low";
      const avgScore = row.scores.length > 0
        ? row.scores.reduce((sum, value) => sum + value, 0) / row.scores.length
        : 0;

      return {
        road_name: row.road_name,
        total_potholes: row.total_potholes,
        avg_score: avgScore,
        dominant_severity: dominantSeverity,
      };
    })
    .sort((a, b) => b.avg_score - a.avg_score);

  const worst = rows.slice(0, 5).map((r, i) => ({
    rank: i + 1,
    road_name: r.road_name,
    severity_score: Math.round(r.avg_score),
    pothole_count: r.total_potholes,
    dominant_severity: r.dominant_severity,
  }));

  const best = [...rows].reverse().slice(0, 5).map((r, i) => ({
    rank: i + 1,
    road_name: r.road_name,
    severity_score: Math.round(r.avg_score),
    pothole_count: r.total_potholes,
    dominant_severity: r.dominant_severity,
  }));

  res.json({ worst, best });
});

export default router;
