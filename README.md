# Road Hazard Monitoring System (RHMS)

A real-time pothole detection dashboard powered by **YOLOv8 instance segmentation** and **Google Colab**. When road images or videos are processed—either in the Colab notebook or through the built-in Upload page—the dashboard updates automatically.

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                        DATA PATHS                           │
│                                                             │
│  PATH 1 — Google Colab (research / batch processing)       │
│                                                             │
│  Colab Notebook                                             │
│  (upload image/video)                                       │
│       │                                                     │
│       ▼  YOLOv8 detects potholes                           │
│  Google Drive                                               │
│  RHMS/database.db  ──── download & replace ────►           │
│                         YOLO/database.db (local)           │
│                              │                              │
│                              ▼  API reads file (30 s poll) │
│                         Dashboard auto-refreshes            │
│                                                             │
│  PATH 2 — Direct Upload (client uploads via dashboard)     │
│                                                             │
│  Browser Upload Page                                        │
│  (image / video + location)                                 │
│       │                                                     │
│       ▼  API server calls YOLO/process_upload.py           │
│  YOLO/best.pt runs inference                               │
│       │                                                     │
│       ▼  results saved                                      │
│  YOLO/database.db (local)                                  │
│       │                                                     │
│       ▼  Dashboard auto-refreshes (≤ 30 s)                │
└─────────────────────────────────────────────────────────────┘
```

---

## Prerequisites

| Requirement | Version |
|---|---|
| Node.js | 20 or later |
| pnpm | 10 or later (`npm i -g pnpm`) |
| Python | 3.9 or later |
| ultralytics | `pip install ultralytics` (needed for Upload page) |

---

## Local Setup

### 1. Clone / Extract

If you downloaded the zip, extract it. The working directory is the folder that contains `package.json` and `artifacts/`.

### 2. Install dependencies

```powershell
# Windows (PowerShell)
cd "C:\path\to\Road-Hazard-Dashboard"
pnpm install
```

```bash
# macOS / Linux
cd /path/to/Road-Hazard-Dashboard
pnpm install
```

### 3. Environment variables (`.env` files)

#### `artifacts/api-server/.env`

```env
# Port the Express API listens on (default: 3001)
PORT=3001

# Optional — only needed if your database.db is not at YOLO/database.db
# COLAB_DATABASE_PATH=C:\absolute\path\to\database.db

# Optional — only needed if your YOLO folder is in a non-standard location
# COLAB_YOLO_DIR=C:\absolute\path\to\YOLO
```

#### `artifacts/rhms-dashboard/.env`

```env
# Port the Vite dev server listens on (default: 3000)
PORT=3000

# API base URL used in the browser during development
# Must match the PORT set in api-server/.env
VITE_API_BASE=http://localhost:3001/api
```

> **Google Maps API key** — the key is already embedded in the source code.
> If you need to replace it, open `artifacts/rhms-dashboard/src/components/AnimatedMap.tsx`
> and change the value of `script.src` (search for `maps.googleapis.com/maps/api/js?key=`).

---

### 4. Run the servers

Open **two separate terminals** from the project root.

**Terminal 1 — API server (port 3001)**

```powershell
# Windows
$env:PORT="3001"
pnpm --filter @workspace/api-server run dev
```

```bash
# macOS / Linux
PORT=3001 pnpm --filter @workspace/api-server run dev
```

Expected output:
```
INFO: Server listening  port: 3001
```

**Terminal 2 — Dashboard (port 3000)**

```powershell
# Windows
$env:PORT="3000"
pnpm --filter @workspace/rhms-dashboard run dev
```

```bash
# macOS / Linux
PORT=3000 pnpm --filter @workspace/rhms-dashboard run dev
```

Expected output:
```
VITE ready in 600ms  ➜  Local: http://localhost:3000/
```

Open **http://localhost:3000** in your browser.

---

## Data Path 1 — Google Colab Integration

### Colab notebook
Open the notebook: https://colab.research.google.com/drive/1mYWIhl9mWJKQ21wR-ukc9p152oOho4OZ

The notebook:
1. Downloads the Roboflow pothole dataset
2. Trains YOLOv8 on it
3. Runs inference on uploaded images / videos
4. Saves detection results to **Google Drive → `MyDrive/RHMS/database.db`**

### How to push Colab results to the dashboard

After running the Colab notebook:

1. Open **Google Drive** → `MyDrive/RHMS/`
2. Download `database.db`
3. Replace the local file:
   ```
   YOLO/database.db   ← paste/overwrite this file
   ```
4. The API server detects the file change within **30 seconds** (it checks the file's modification timestamp on every request)
5. The dashboard auto-refreshes — no restart needed

> **Tip:** If you use the **Google Drive desktop app** (Google Drive for Desktop), mount your Drive and point `COLAB_DATABASE_PATH` directly at the Drive file so it syncs automatically without any manual download step:
> ```env
> COLAB_DATABASE_PATH=G:\My Drive\RHMS\database.db
> ```

---

## Data Path 2 — Direct Upload (Automated Local Pipeline)

Navigate to the **Upload** tab in the dashboard.

1. **Drop or select** an image (`.jpg`, `.png`) or video (`.mp4`, `.mov`, `.avi`)
2. Fill in **Location ID** (e.g. `LOC-MG-Road`), **Latitude**, and **Longitude**
3. Click **Upload & Run Detection**

What happens automatically:
- The file is sent to the API server
- The server calls `YOLO/process_upload.py` with the trained `YOLO/best.pt` model
- YOLOv8 detects potholes and estimates diameters
- Severity is calculated (`Low / Medium / High / Critical`) based on pothole count and size
- Results are written directly to `YOLO/database.db`
- The dashboard refreshes within 30 seconds showing the new detection on the map and in all tables/charts

### Requirements for the Upload pipeline

```bash
pip install ultralytics opencv-python
```

The API server auto-tries `python`, `python3`, and `py` — whichever is available on your system.

---

## Dashboard Pages

| Page | URL | Description |
|---|---|---|
| Overview | `/` | Live hazard map, summary stats, severity chart, worst roads |
| Detections | `/detections` | Full table of all detection events, sortable |
| Roads | `/roads` | Road ranking — most critical to safest |
| Analytics | `/analytics` | Severity distribution charts and statistics |
| Upload | `/upload` | Upload image/video → automatic YOLO detection → live update |

---

## Database Schema (`YOLO/database.db`)

The SQLite database has three tables:

```sql
-- One row per physical location
locations (location_id TEXT PK, latitude REAL, longitude REAL)

-- One row per detection event
detections (
  id INTEGER PK AUTOINCREMENT,
  location_id TEXT,        -- FK → locations
  timestamp TEXT,          -- ISO 8601
  pothole_count INTEGER,
  avg_diameter REAL,       -- pixels
  severity TEXT            -- Low | Medium | High | Critical
)

-- One row per uploaded file (optional, populated by Colab)
media (
  id INTEGER PK AUTOINCREMENT,
  location_id TEXT,
  original_file TEXT,
  detected_file TEXT,
  pothole_csv TEXT,
  upload_time TEXT
)
```

---

## Severity Formula

```
score = avg_diameter_pixels + (10 × pothole_count)

score < 100  →  Low
score < 250  →  Medium
score < 500  →  High
score ≥ 500  →  Critical
```

---

## Project Structure

```
artifacts/
  api-server/          Express API — reads database.db via Python
    src/
      lib/colab-store.ts   SQLite reader + cache
      routes/upload.ts     Upload + YOLO processing endpoint
  rhms-dashboard/      React + Vite + Tailwind frontend
    src/
      pages/UploadPage.tsx    Upload UI
      components/AnimatedMap.tsx  Google Maps integration

YOLO/
  database.db          SQLite database (shared by Colab + local)
  best.pt              Trained YOLOv8 segmentation model
  process_upload.py    Python script called by the upload endpoint
  YOLOv8_Pothole_Segmentation_Colab.ipynb   Colab notebook
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Can't resolve '@tailwindcss/typography'` | `pnpm --filter @workspace/rhms-dashboard add -D @tailwindcss/typography` |
| Dashboard shows 0 roads after Colab run | Replace `YOLO/database.db` with the one from Google Drive, wait 30 s |
| Upload fails with `ultralytics not installed` | `pip install ultralytics` in the terminal where the API server runs |
| Port already in use | Change `PORT` in the `.env` file and restart that server |
| Google Maps not loading | The API key may be domain-restricted. Replace it in `AnimatedMap.tsx` with your own key from [Google Cloud Console](https://console.cloud.google.com) |
| `COLAB_DATABASE_PATH` needed | Set this env var to the absolute path of your `database.db` if it is not at `YOLO/database.db` |
