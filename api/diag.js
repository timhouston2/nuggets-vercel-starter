export const config = { runtime: "nodejs" };

import { parseYouTubeId, fetchYouTubeTranscript } from "./_lib/transcript.js";

export default async function handler(req, res) {
  try {
    const url = req.query?.url || req.body?.url || "";
    if (!url) return res.status(400).json({ ok: false, step: "input", error: "missing_url" });

    const vid = parseYouTubeId(url);
    if (!vid) return res.status(400).json({ ok: false, step: "parse", error: "invalid_youtube_url" });

    const hasKey = !!process.env.OPENAI_API_KEY;
    if (!hasKey) return res.status(500).json({ ok: false, step: "key", error: "missing_openai_key" });

    const t0 = Date.now();
    const { text } = await fetchYouTubeTranscript(vid);
    const ms = Date.now() - t0;

    return res.status(200).json({
      ok: true,
      step: "done",
      videoId: vid,
      durationMs: ms,
      transcriptChars: text?.length ?? 0,
      preview: text?.slice(0, 200) || ""
    });
  } catch (e) {
    return res.status(500).json({
      ok: false,
      step: "exception",
      error: e?.message || String(e)
    });
  }
}
