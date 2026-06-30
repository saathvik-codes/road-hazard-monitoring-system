const VIDEO_EXT_RE = /\.(mp4|mov|avi|mkv|webm)(\?.*)?$/i;

export function isVideoUrl(url: string | null | undefined): boolean {
  return !!url && VIDEO_EXT_RE.test(url);
}
