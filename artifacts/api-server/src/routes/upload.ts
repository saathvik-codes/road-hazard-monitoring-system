import { Router } from "express";
import { execFileSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import multer from "multer";
import { DB_PATH, YOLO_DIR, saveDetectionToColab } from "../lib/colab-store";

const router = Router();

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (_req, file, cb) => {
    const ok = /\.(jpg|jpeg|png|mp4|avi|mov|mkv|webm)$/i.test(file.originalname);
    cb(null, ok);
  },
});

function runPython(args: string[]): unknown {
  const cmds = ["python", "python3", "py"];
  let last: unknown;
  for (const cmd of cmds) {
    try {
      const extraArgs = cmd === "py" ? ["-3", ...args] : args;
      const out = execFileSync(cmd, extraArgs, { encoding: "utf8", timeout: 300_000 });
      return JSON.parse(out.trim());
    } catch (e) {
      last = e;
    }
  }
  throw last;
}

function getSeverity(avgDiameter: number, potholeCount: number): string {
  const score = avgDiameter + 10 * potholeCount;
  if (score >= 500) return "Critical";
  if (score >= 250) return "High";
  if (score >= 100) return "Medium";
  return "Low";
}

function simulateDetection(location_id: string, latitude: string, longitude: string) {
  const potholeCount = Math.floor(Math.random() * 5);
  const avgDiameter = potholeCount > 0 ? Math.round((15 + Math.random() * 35) * 100) / 100 : 0;
  const severity = getSeverity(avgDiameter, potholeCount);
  const timestamp = new Date().toISOString();
  const detection = saveDetectionToColab({
    location_id,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    pothole_count: potholeCount,
    avg_diameter: avgDiameter,
    severity,
    timestamp,
  });
  return { detection_id: detection.id, location_id, latitude: parseFloat(latitude), longitude: parseFloat(longitude), pothole_count: potholeCount, avg_diameter: avgDiameter, severity, timestamp, simulated: true };
}

/** POST /api/upload
 * multipart fields:
 *   file       — image or video
 *   location_id — string  (e.g. "LOC006")
 *   latitude   — number
 *   longitude  — number
 */
router.post("/", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const { location_id, latitude, longitude } = req.body as Record<string, string>;
  if (!location_id || !latitude || !longitude) {
    if (file) unlinkSync(file.path);
    res.status(400).json({ error: "location_id, latitude and longitude are required" });
    return;
  }

  const modelPath = path.join(YOLO_DIR, "best.pt");
  const scriptPath = path.join(YOLO_DIR, "process_upload.py");

  try {
    if (existsSync(modelPath) && existsSync(scriptPath)) {
      const result = runPython([scriptPath, file.path, location_id, latitude, longitude, DB_PATH, modelPath]) as Record<string, unknown>;
      if (result && "error" in result) throw new Error(String(result.error));
      res.json(result);
    } else {
      res.json(simulateDetection(location_id, latitude, longitude));
    }
  } catch {
    res.json(simulateDetection(location_id, latitude, longitude));
  } finally {
    try { unlinkSync(file.path); } catch {}
  }
});

/** GET /api/upload/status — quick health check: model + script present? */
router.get("/status", (_req, res) => {
  const modelPath = path.join(YOLO_DIR, "best.pt");
  const scriptPath = path.join(YOLO_DIR, "process_upload.py");
  res.json({
    model_ready: existsSync(modelPath),
    script_ready: existsSync(scriptPath),
    db_path: DB_PATH,
    yolo_dir: YOLO_DIR,
  });
});

export default router;
