import { YoutubeTranscript } from "youtube-transcript";
import ytdl from "ytdl-core";
import { client } from "./openai.js";
import { toFile } from "openai";

// Extract a YouTube video id from common URL formats
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

// --- Internal: download up to ~24MB of audio (enough for short episodes/tests)
async function downloadAudioAsBuffer(videoId, maxBytes = 24 * 1024 * 1024) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;

    const stream = ytdl(url, {
      filter: "audioonly",
      quality: "highestaudio",
      // higher water mark reduces backpressure stalls on serverless
      highWaterMark: 1 << 20
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

// --- Internal: transcribe audio via OpenAI (gpt-4o-mini-transcribe -> whisper-1)
async function transcribeAudioViaOpenAI(videoId) {
  const buf = await downloadAudioAsBuffer(videoId);
  // ytdl usually gives webm/opus for audio-only; that’s fine for OpenAI
  const file = await toFile(buf, "audio.webm", { contentType: "audio/webm" });

  // Prefer the newer 4o-mini transcribe model; fall back to whisper-1
  try {
    const r1 = await client.audio.transcriptions.create({
      file,
      model: "gpt-4o-mini-transcribe"
    });
    if (r1?.text) return r1.text;
  } catch (e) {
    console.warn("[transcribe] 4o-mini-transcribe failed, falling back to whisper-1", e?.message);
  }

  const r2 = await client.audio.transcriptions.create({
    file,
    model: "whisper-1"
  });
  return r2?.text || "";
}

// Public: try captions first, else full audio transcription
export async function fetchYouTubeTranscript(videoId) {
  // 1) Try official captions
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoId);
    const text = items.map((i) => i.text).join(" ");
    // If captions exist but are trivial/too short, still fall back to audio
    if (text && text.length > 500) {
      const entries = items.map((i) => ({
        text: i.text,
        start: Math.round(i.offset || i.start || 0)
      }));
      return { text, entries };
    }
  } catch (e) {
    console.warn("[captions] fetch failed, will try audio transcription", e?.message);
  }

  // 2) Fallback: download audio + transcribe with OpenAI
  const text = await transcribeAudioViaOpenAI(videoId);
  if (!text) throw new Error("audio_transcription_failed");
  return { text, entries: [] };
}
