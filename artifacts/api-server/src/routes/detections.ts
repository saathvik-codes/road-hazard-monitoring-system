import { Router } from "express";
import { CreateDetectionBody } from "@workspace/api-zod";
import { getLatestMediaByLocation, loadColabSnapshot, saveDetectionToColab } from "../lib/colab-store";

const router = Router();

router.get("/", async (req, res) => {
  const snapshot = loadColabSnapshot();
  const locations = new Map(snapshot.locations.map((location) => [location.location_id, location]));

  const detections = [...snapshot.detections]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map((detection) => {
      const location = locations.get(detection.location_id);
      const media = getLatestMediaByLocation(snapshot, detection.location_id);
      const severityScore = detection.avg_diameter + 10 * detection.pothole_count;

      return {
        id: detection.id,
        road_name: detection.location_id,
        latitude: location?.latitude ?? 0,
        longitude: location?.longitude ?? 0,
        pothole_count: detection.pothole_count,
        avg_diameter_cm: detection.avg_diameter,
        severity: detection.severity,
        severity_score: severityScore,
        detected_at: detection.timestamp,
        original_image_url: media?.original_file && /^https?:\/\//i.test(media.original_file) ? media.original_file : null,
        detected_image_url: media?.detected_file && /^https?:\/\//i.test(media.detected_file) ? media.detected_file : null,
        mask_image_url: null,
      };
    });

  res.json(detections);
});

router.post("/", async (req, res) => {
  const parsed = CreateDetectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body", details: parsed.error.issues });
    return;
  }

  const { road_name, latitude, longitude, pothole_count, avg_diameter_cm, severity } = parsed.data;
  const timestamp = new Date().toISOString();
  const created = saveDetectionToColab({
    location_id: road_name,
    latitude,
    longitude,
    pothole_count,
    avg_diameter: avg_diameter_cm,
    severity,
    timestamp,
    original_file: parsed.data.original_image_url ?? null,
    detected_file: parsed.data.detected_image_url ?? null,
    pothole_csv: null,
  });

  res.status(201).json({
    id: created.id,
    road_name,
    latitude,
    longitude,
    pothole_count,
    avg_diameter_cm,
    severity,
    severity_score: parsed.data.severity_score ?? avg_diameter_cm + 10 * pothole_count,
    detected_at: timestamp,
    original_image_url: parsed.data.original_image_url ?? null,
    detected_image_url: parsed.data.detected_image_url ?? null,
    mask_image_url: parsed.data.mask_image_url ?? null,
  });
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  const snapshot = loadColabSnapshot();
  const detection = snapshot.detections.find((item) => item.id === id);
  if (!detection) {
    res.status(404).json({ error: "Detection not found" });
    return;
  }

  const location = snapshot.locations.find((item) => item.location_id === detection.location_id);
  const media = getLatestMediaByLocation(snapshot, detection.location_id);

  res.json({
    id: detection.id,
    road_name: detection.location_id,
    latitude: location?.latitude ?? 0,
    longitude: location?.longitude ?? 0,
    pothole_count: detection.pothole_count,
    avg_diameter_cm: detection.avg_diameter,
    severity: detection.severity,
    severity_score: detection.avg_diameter + 10 * detection.pothole_count,
    detected_at: detection.timestamp,
    original_image_url: media?.original_file && /^https?:\/\//i.test(media.original_file) ? media.original_file : null,
    detected_image_url: media?.detected_file && /^https?:\/\//i.test(media.detected_file) ? media.detected_file : null,
    mask_image_url: null,
  });
});

export default router;
