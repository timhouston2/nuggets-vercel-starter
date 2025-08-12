import { parseYouTubeId, fetchYouTubeTranscript, ytDeepLink } from "./_lib/transcript.js";
import { generateSummary } from "./_lib/openai.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  try {
    const url = req.body?.url || "";
    const vid = parseYouTubeId(url);
    if (!vid) return res.status(400).json({ error: "youtube_only_v1", message: "Please provide a YouTube link for now." });

    const { text } = await fetchYouTubeTranscript(vid);
    if (!text || text.length < 1000) return res.status(422).json({ error: "no_transcript" });

    const meta = { podcastTitle: "YouTube", episodeTitle: `Video ${vid}` };
    const out = await generateSummary({ transcript: text, ...meta });

    const quotes = (out.quotes || []).map(q => ({
      text: q.text,
      speaker: q.speaker || "Speaker",
      tStartSec: q.startSec || q.start || 0,
      deepLinkUrl: ytDeepLink(vid, q.startSec || q.start || 0),
      tweetIntentUrl: `https://twitter.com/intent/tweet?` +
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
    console.error(e);
    return res.status(500).json({ error: "server_error" });
  }
}
