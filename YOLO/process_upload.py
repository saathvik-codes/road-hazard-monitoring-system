"""
RHMS Automated Pothole Detection
Usage: python process_upload.py <file> <uploads_dir> <model_path>

Runs YOLO inference on the uploaded file, saves an annotated copy under
<uploads_dir>/detected/, and prints a JSON summary to stdout. Does not
touch the database — the caller (api-server) owns persistence so both the
real-model path and the simulated fallback write through the same code.
"""
import sys
import json
import os
import io
import contextlib
import logging


def get_severity(avg_diameter: float, pothole_count: int) -> str:
    score = avg_diameter + 10 * pothole_count
    if score < 100:
        return "Low"
    if score < 250:
        return "Medium"
    if score < 500:
        return "High"
    return "Critical"


def run(file_path: str, uploads_dir: str, model_path: str) -> dict:
    try:
        from ultralytics import YOLO
    except ImportError:
        return {"error": "ultralytics not installed — run: pip install ultralytics"}

    if not os.path.exists(model_path):
        return {"error": f"Model not found: {model_path}"}

    if not os.path.exists(file_path):
        return {"error": f"File not found: {file_path}"}

    logging.getLogger("ultralytics").setLevel(logging.ERROR)
    model = YOLO(model_path)

    # ultralytics writes progress/summary lines straight to stdout regardless of
    # verbose=False, which would corrupt the single JSON line this script must emit.
    # Only the final json.dumps(result) print below is allowed to reach real stdout.
    with contextlib.redirect_stdout(io.StringIO()):
        results_iter = model.predict(
            source=file_path,
            conf=0.20,
            iou=0.4,
            retina_masks=True,
            stream=True,
            verbose=False,
            save=True,
            project=uploads_dir,
            name="detected",
            exist_ok=True,
        )

        rows = []
        for frame_idx, result in enumerate(results_iter):
            n = len(result.boxes) if result.boxes is not None else 0
            for i in range(n):
                conf = float(result.boxes.conf[i].item())
                if result.masks is not None and i < len(result.masks.xy):
                    mask = result.masks.xy[i]
                    xs, ys = mask[:, 0], mask[:, 1]
                    diameter = (float(xs.max() - xs.min()) + float(ys.max() - ys.min())) / 2
                else:
                    x1, y1, x2, y2 = result.boxes.xyxy[i].cpu().numpy()
                    diameter = ((x2 - x1) + (y2 - y1)) / 2
                rows.append({"frame": frame_idx, "confidence": round(conf, 4),
                             "diameter_px": round(float(diameter), 2)})

    pothole_count = len(rows)
    avg_diameter = sum(r["diameter_px"] for r in rows) / pothole_count if pothole_count else 0.0
    severity = get_severity(avg_diameter, pothole_count)

    detected_filename = os.path.basename(file_path)
    detected_full_path = os.path.join(uploads_dir, "detected", detected_filename)
    if not os.path.exists(detected_full_path):
        detected_filename = None

    return {
        "pothole_count": pothole_count,
        "avg_diameter": round(avg_diameter, 2),
        "severity": severity,
        "detected_file": detected_filename,
    }


if __name__ == "__main__":
    if len(sys.argv) < 4:
        print(json.dumps({"error": "Usage: process_upload.py <file> <uploads_dir> <model_path>"}))
        sys.exit(1)

    result = run(
        file_path=sys.argv[1],
        uploads_dir=sys.argv[2],
        model_path=sys.argv[3],
    )
    print(json.dumps(result))
