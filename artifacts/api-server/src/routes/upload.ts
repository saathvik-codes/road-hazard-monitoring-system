import { Router } from "express";
import { execFileSync } from "node:child_process";
import { existsSync, unlinkSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import multer from "multer";
import { DB_PATH, YOLO_DIR, loadColabSnapshot } from "../lib/colab-store";

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

  if (!existsSync(modelPath)) {
    res.status(500).json({ error: `YOLO model not found at ${modelPath}` });
    return;
  }
  if (!existsSync(scriptPath)) {
    res.status(500).json({ error: `Processing script not found at ${scriptPath}` });
    return;
  }

  try {
    const result = runPython([
      scriptPath,
      file.path,
      location_id,
      latitude,
      longitude,
      DB_PATH,
      modelPath,
    ]);

    // Invalidate the colab-store cache so the next API call sees fresh data
    loadColabSnapshot(); // will re-read since file changed

    res.json(result);
  } catch (err: unknown) {
    res.status(500).json({
      error: "Processing failed",
      detail: err instanceof Error ? err.message : String(err),
    });
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
