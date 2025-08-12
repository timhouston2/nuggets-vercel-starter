import { YoutubeTranscript } from "youtube-transcript";
import ytdl from "ytdl-core";
import { client } from "./openai.js";
import { toFile } from "openai";

export function parseYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    if (u.hostname.includes("youtube.com")) return u.searchParams.get("v");
  } catch {}
  return null;
}

export function ytDeepLink(videoId, startSec) {
  const s = Math.max(0, Math.round(startSec || 0));
  return `https://www.youtube.com/watch?v=${videoId}&t=${s}s`;
}

// Download up to ~10MB of audio to stay within serverless limits
async function downloadAudioAsBuffer(videoId, maxBytes = 10 * 1024 * 1024) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;

    const stream = ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
      highWaterMark: 1 << 20,
      requestOptions: {
        headers: {
          "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
          "accept-language": "en-US,en;q=0.9"
        }
      }
    });

    stream.on("data", (chunk) => {
      total += chunk.length;
      chunks.push(chunk);
      if (total > maxBytes) {
        stream.destroy(new Error("audio_max_bytes_exceeded"));
      }
    });
    stream.on("end", () => resolve(Buffer.concat(chunks, total)));
    stream.on("error", (err) => reject(err));
  });
}

// Stable transcription with whisper-1
async function transcribeAudio(videoId) {
  let buf;
  try {
    buf = await downloadAudioAsBuffer(videoId);
  } catch (e) {
    throw new Error(`audio_download_failed:${e?.message || e}`);
  }
  if (!buf || buf.length === 0) {
    throw new Error("audio_download_empty");
  }

  let text = "";
  try {
    const file = await to
