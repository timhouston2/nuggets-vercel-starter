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

async function downloadAudioAsBuffer(videoId, maxBytes = 12 * 1024 * 1024) {
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
        stream.destroy(new Error("max_bytes_exceeded"));
      }
    });
    stream.on("end", () => resolve(Buffer.concat(chunks, total)));
    stream.on("error", (err) => reject(err));
  });
}

async function transcribeAudioViaOpenAI(videoId) {
  const buf = await downloadAudioAsBuffer(videoId);
  if (!buf || buf.length === 0) throw new Error("audio_download_empty");
  const file = await toFile(buf, "audio.webm", { contentType: "audio/webm" });

  try {
    const r1 = await client.audio.transcriptions.create({
      file,
      model: "gpt-4o-mini-transcribe"
    });
    if (r1?.text) return r1.text;
  } catch (e) {
    console.warn("[transcribe] 4o-mini-transcribe failed:", e?.message);
  }

  const r2 = await client.audio.transcriptions.create({
    file,
    model: "whisper-1"
  });
  return r2?.text || "";
}

export async function fetchYouTubeTranscript(videoId) {
  // 1) Captions first
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoId);
    const text = items.map((i) => i.text).join(" ");
    if (text && text.length > 500) {
      const entries = items.map((i) => ({
        text: i.text,
        start: Math.round(i.offset || i.start || 0)
      }));
      return { text, entries };
    }
  } catch (e) {
    console.warn("[captions] failed:", e?.message);
  }

  // 2) Fallback: audio + OpenAI transcription
  const text = await transcribeAudioViaOpenAI(videoId);
  if (!text || text.length < 50) throw new Error("audio_transcription_failed");
  return { text, entries: [] };
}
