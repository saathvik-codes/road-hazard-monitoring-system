import { execFileSync } from "node:child_process";
import { existsSync, statSync, unlinkSync, renameSync } from "node:fs";

// Requires the Python package `imageio_ffmpeg` (pip install imageio_ffmpeg) to resolve a
// bundled ffmpeg binary. Optional: if it's missing, compression is skipped and videos are
// stored uncompressed rather than failing the upload — see resolveFfmpegPath() below.
const VIDEO_EXT = /\.(mp4|avi|mov|mkv|webm)$/i;
const COMPRESS_THRESHOLD_BYTES = Number(process.env["VIDEO_COMPRESS_THRESHOLD_MB"] ?? 10) * 1024 * 1024;

let ffmpegPath: string | null | undefined;

function resolveFfmpegPath(): string | null {
  if (ffmpegPath !== undefined) return ffmpegPath;

  const commands = ["python", "python3", "py"];
  const script = "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())";
  for (const cmd of commands) {
    try {
      const args = cmd === "py" ? ["-3", "-c", script] : ["-c", script];
      const out = execFileSync(cmd, args, { encoding: "utf8" }).trim();
      if (out && existsSync(out)) {
        ffmpegPath = out;
        return ffmpegPath;
      }
    } catch {
      // try next interpreter
    }
  }
  ffmpegPath = null;
  return null;
}

/**
 * Re-encodes a video to H.264/CRF28 (capped at 1280px wide) when it's above
 * VIDEO_COMPRESS_THRESHOLD_MB. No-op for images, small files, or if ffmpeg
 * isn't resolvable. Returns the path to the file that should actually be
 * served — compression always normalizes the container to .mp4, so the
 * returned path can differ from the input when the source wasn't already mp4.
 */
export function compressVideoIfNeeded(filePath: string): string {
  if (!VIDEO_EXT.test(filePath) || !existsSync(filePath)) return filePath;
  if (statSync(filePath).size <= COMPRESS_THRESHOLD_BYTES) return filePath;

  const ffmpeg = resolveFfmpegPath();
  if (!ffmpeg) return filePath;

  const finalPath = filePath.replace(VIDEO_EXT, ".mp4");
  const tempOut = `${finalPath}.tmp.mp4`;

  try {
    execFileSync(
      ffmpeg,
      [
        "-y",
        "-i", filePath,
        "-vf", "scale='min(1280,iw)':-2",
        "-c:v", "libx264",
        "-crf", "28",
        "-preset", "veryfast",
        "-c:a", "aac",
        "-b:a", "96k",
        tempOut,
      ],
      { timeout: 300_000, stdio: "ignore" },
    );

    if (!existsSync(tempOut) || statSync(tempOut).size >= statSync(filePath).size) {
      if (existsSync(tempOut)) unlinkSync(tempOut);
      return filePath;
    }

    unlinkSync(filePath);
    renameSync(tempOut, finalPath);
    return finalPath;
  } catch {
    if (existsSync(tempOut)) {
      try { unlinkSync(tempOut); } catch { /* ignore */ }
    }
    return filePath;
  }
}
