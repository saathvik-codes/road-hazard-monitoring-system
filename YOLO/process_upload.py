"""
RHMS Automated Pothole Detection
Usage: python process_upload.py <file> <location_id> <lat> <lon> <db_path> <model_path>
Writes detection results to SQLite and prints JSON summary to stdout.
"""
import sys
import json
import os
import sqlite3
from datetime import datetime


def get_severity(avg_diameter: float, pothole_count: int) -> str:
    score = avg_diameter + 10 * pothole_count
    if score < 100:
        return "Low"
    if score < 250:
        return "Medium"
    if score < 500:
        return "High"
    return "Critical"


def run(file_path: str, location_id: str, lat: float, lon: float,
        db_path: str, model_path: str) -> dict:

    try:
        from ultralytics import YOLO
    except ImportError:
        return {"error": "ultralytics not installed — run: pip install ultralytics"}

    if not os.path.exists(model_path):
        return {"error": f"Model not found: {model_path}"}

    if not os.path.exists(file_path):
        return {"error": f"File not found: {file_path}"}

    model = YOLO(model_path)

    results_iter = model.predict(
        source=file_path,
        conf=0.20,
        iou=0.4,
        retina_masks=True,
        stream=True,
        verbose=False,
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
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute(
        "INSERT OR IGNORE INTO locations(location_id, latitude, longitude) VALUES(?,?,?)",
        (location_id, lat, lon),
    )
    cur.execute(
        "INSERT INTO detections(location_id, timestamp, pothole_count, avg_diameter, severity) "
        "VALUES(?,?,?,?,?)",
        (location_id, timestamp, pothole_count, round(avg_diameter, 2), severity),
    )
    detection_id = cur.lastrowid
    conn.commit()
    conn.close()

    return {
        "detection_id": detection_id,
        "location_id": location_id,
        "latitude": lat,
        "longitude": lon,
        "pothole_count": pothole_count,
        "avg_diameter": round(avg_diameter, 2),
        "severity": severity,
        "timestamp": timestamp,
    }


if __name__ == "__main__":
    if len(sys.argv) < 7:
        print(json.dumps({"error": "Usage: process_upload.py <file> <loc_id> <lat> <lon> <db> <model>"}))
        sys.exit(1)

    result = run(
        file_path=sys.argv[1],
        location_id=sys.argv[2],
        lat=float(sys.argv[3]),
        lon=float(sys.argv[4]),
        db_path=sys.argv[5],
        model_path=sys.argv[6],
    )
    print(json.dumps(result))
