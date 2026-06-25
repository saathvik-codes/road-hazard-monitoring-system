import { createRoot } from "react-dom/client";
import { setBaseUrl } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Generated client paths already include /api/ prefix (e.g. /api/detections)
// so the base URL must be just the origin — no trailing /api
const explicitApiBase = import.meta.env.VITE_API_BASE;
const localApiBase =
  typeof window !== "undefined" &&
  ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? "http://localhost:3001"
    : null;

setBaseUrl(explicitApiBase ?? localApiBase);

createRoot(document.getElementById("root")!).render(<App />);
