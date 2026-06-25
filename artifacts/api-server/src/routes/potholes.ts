import { Router } from "express";
import { loadColabSnapshot } from "../lib/colab-store";

const router = Router();

function severityFromDiameter(diameterCm: number): string {
  if (diameterCm >= 90) {
    return "Critical";
  }
  if (diameterCm >= 60) {
    return "High";
  }
  if (diameterCm >= 30) {
    return "Medium";
  }
  return "Low";
}

function toPothole(row: ReturnType<typeof loadColabSnapshot>["potholes"][number]) {
  const diameterCm = Number((row.approx_diameter_pixels / 10).toFixed(1));
  const areaM2 = Number((Math.PI * Math.pow(diameterCm / 200, 2)).toFixed(3));
  const perimeterM = Number((Math.PI * (diameterCm / 100)).toFixed(3));
  const maskCoverage = Number(Math.min(1, Math.max(0.05, row.confidence)).toFixed(3));

  return {
    id: row.id,
    detection_id: row.detection_id ?? 0,
    pothole_code: row.pothole_code,
    diameter_cm: diameterCm,
    area_m2: areaM2,
    perimeter_m: perimeterM,
    mask_coverage: maskCoverage,
    confidence: row.confidence,
    severity: severityFromDiameter(diameterCm),
  };
}

router.get("/", async (req, res) => {
  const snapshot = loadColabSnapshot();
  const potholes = snapshot.potholes.map(toPothole);
  const detectionIdParam = req.query.detection_id;
  if (detectionIdParam !== undefined) {
    const detectionId = parseInt(String(detectionIdParam), 10);
    if (isNaN(detectionId)) {
      res.status(400).json({ error: "Invalid detection_id" });
      return;
    }
    res.json(potholes.filter((item) => item.detection_id === detectionId));
    return;
  }
  res.json(potholes);
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const snapshot = loadColabSnapshot();
  const pothole = snapshot.potholes.map(toPothole).find((item) => item.id === id);
  if (!pothole) {
    res.status(404).json({ error: "Pothole not found" });
    return;
  }
  res.json(pothole);
});

export default router;
