import { YoutubeTranscript } from "youtube-transcript";

export function parseYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
  } catch {}
  return null;
}

export async function fetchYouTubeTranscript(videoId) {
  const items = await YoutubeTranscript.fetchTranscript(videoId);
  const text = items.map(i => i.text).join(" ");
  const entries = items.map(i => ({ text: i.text, start: Math.round(i.offset || i.start || 0) }));
  return { text, entries };
}

export function ytDeepLink(videoId, startSec) {
  const s = Math.max(0, Math.round(startSec || 0));
  return `https://www.youtube.com/watch?v=${videoId}&t=${s}s`;
}
