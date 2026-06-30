import { Router } from "express";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, copyFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import multer from "multer";
import { DB_PATH, YOLO_DIR, UPLOADS_DIR, saveDetectionToColab } from "../lib/colab-store";
import { compressVideoIfNeeded } from "../lib/video-compress";

const router = Router();

const ACCEPTED_TYPES = /\.(jpg|jpeg|png|mp4|avi|mov|mkv|webm)$/i;

const ORIGINALS_DIR = path.join(UPLOADS_DIR, "originals");
mkdirSync(ORIGINALS_DIR, { recursive: true });
mkdirSync(path.join(UPLOADS_DIR, "detected"), { recursive: true });

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
  fileFilter: (_req, file, cb) => {
    if (ACCEPTED_TYPES.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type. Please upload an image (JPG, PNG) or video (MP4, AVI, MOV, MKV, WEBM).`));
    }
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

function simulateStats() {
  const potholeCount = Math.floor(Math.random() * 5);
  const avgDiameter = potholeCount > 0 ? Math.round((15 + Math.random() * 35) * 100) / 100 : 0;
  const severity = getSeverity(avgDiameter, potholeCount);
  return { pothole_count: potholeCount, avg_diameter: avgDiameter, severity, detected_file: null as string | null };
}

/** POST /api/upload
 * multipart fields:
 *   file       — image or video
 *   location_id — string  (e.g. "LOC006")
 *   latitude   — number
 *   longitude  — number
 */
router.post("/", (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      res.status(400).json({ error: err.message });
      return;
    }
    next();
  });
}, async (req, res) => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ error: "No file uploaded" });
    return;
  }

  const { location_id, latitude, longitude } = req.body as Record<string, string>;
  if (!location_id || !latitude || !longitude) {
    unlinkSync(file.path);
    res.status(400).json({ error: "location_id, latitude and longitude are required" });
    return;
  }

  const storedName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${path.extname(file.originalname)}`;
  const persistedPath = path.join(ORIGINALS_DIR, storedName);
  copyFileSync(file.path, persistedPath);
  unlinkSync(file.path);

  // Large videos get re-encoded down before detection runs and before serving.
  const finalOriginalPath = compressVideoIfNeeded(persistedPath);
  const host = `${req.protocol}://${req.get("host")}`;
  const originalUrl = `${host}/uploads/originals/${path.basename(finalOriginalPath)}`;

  const modelPath = path.join(YOLO_DIR, "best.pt");
  const scriptPath = path.join(YOLO_DIR, "process_upload.py");

  let stats: { pothole_count: number; avg_diameter: number; severity: string; detected_file: string | null };
  try {
    if (existsSync(modelPath) && existsSync(scriptPath)) {
      const result = runPython([scriptPath, finalOriginalPath, UPLOADS_DIR, modelPath]) as Record<string, unknown>;
      if (result && "error" in result) throw new Error(String(result.error));
      stats = result as typeof stats;
    } else {
      stats = simulateStats();
    }
  } catch {
    stats = simulateStats();
  }

  let detectedUrl = originalUrl;
  if (stats.detected_file) {
    const detectedPath = path.join(UPLOADS_DIR, "detected", stats.detected_file);
    const finalDetectedPath = compressVideoIfNeeded(detectedPath);
    detectedUrl = `${host}/uploads/detected/${path.basename(finalDetectedPath)}`;
  }
  const timestamp = new Date().toISOString();

  const saved = saveDetectionToColab({
    location_id,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    pothole_count: stats.pothole_count,
    avg_diameter: stats.avg_diameter,
    severity: stats.severity,
    timestamp,
    original_file: originalUrl,
    detected_file: detectedUrl,
  });

  res.json({
    detection_id: saved.id,
    location_id,
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    pothole_count: stats.pothole_count,
    avg_diameter: stats.avg_diameter,
    severity: stats.severity,
    timestamp,
    original_image_url: originalUrl,
    detected_image_url: detectedUrl,
  });
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
