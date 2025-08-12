export const config = { runtime: "nodejs" };

import { parseYouTubeId, fetchYouTubeTranscript, ytDeepLink } from "./_lib/transcript.js";
import { client, generateSummary } from "./_lib/openai.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "missing_openai_key" });
    }

    const url = req.body?.url || "";
    const vid = parseYouTubeId(url);
    if (!vid) return res.status(400).json({ error: "invalid_youtube_url" });

    // Get transcript (captions or whisper fallback)
    let transcriptText = "";
    try {
      const { text } = await fetchYouTubeTranscript(vid);
      transcriptText = text;
    } catch (e) {
      // Surface the exact reason
      return res.status(500).json({ error: "transcript_error", detail: String(e?.message || e) });
    }

    if (!transcriptText || transcriptText.length < 200) {
      return res.status(422).json({ error: "transcript_too_short" });
    }

    // Build the real summary
    const meta = { podcastTitle: "YouTube", episodeTitle: `Video ${vid}` };
    let out;
    try {
      out = await generateSummary({ transcript: transcriptText, ...meta });
    } catch (e) {
      return res.status(500).json({ error: "openai_summary_failed", detail: String(e?.message || e) });
    }

    const quotes = (out.quotes || []).map(q => ({
      text: q.text,
      speaker: q.speaker || "Speaker",
      tStartSec: q.startSec || q.start || 0,
      deepLinkUrl: ytDeepLink(vid, q.startSec || q.start || 0),
      tweetIntentUrl:
        `https://twitter.com/intent/tweet?` +
        new URLSearchParams({ text: `${q.text} — ${q.speaker || "Speaker"}`, url })
    }));

    const slug = `/youtube/yt-${vid}`;
    const resp = {
      id: `yt-${vid}`,
      slug,
      status: "published",
      episodeTitle: meta.episodeTitle,
      podcastTitle: meta.podcastTitle,
      narrative: out.narrative,
      execSummary: (out.exec || []).map(b => `• ${b}`).join("\n"),
      actionableInsights: out.insights || [],
      strategicTakeaways: out.takeaways || [],
      importantQuotes: quotes,
      pdfUrl: "",
      audioSummaryUrl: "",
      metaDescription: "2-page summary with quotes, insights, and takeaways."
    };

    return res.status(200).json({ id: resp.id, slug, status: "published", summary: resp });
  } catch (e) {
    return res.status(500).json({ error: "server_error", detail: String(e?.message || e) });
  }
}
