import { generateSummary } from "../../_lib/openai.js";
import { fetchYouTubeTranscript } from "../../_lib/transcript.js";

export default async function handler(req, res) {
  try {
    const { podcastSlug, episodeSlug } = req.query;
    const m = /^yt-(.+)$/.exec(episodeSlug || "");
    if (!m) return res.status(404).json({ error: "not_found" });
    const vid = m[1];

    const { text } = await fetchYouTubeTranscript(vid);
    if (!text) return res.status(422).json({ error: "no_transcript" });

    const meta = { podcastTitle: "YouTube", episodeTitle: `Video ${vid}` };
    const out = await generateSummary({ transcript: text, ...meta });

    const summary = {
      id: `yt-${vid}`,
      slug: `/${podcastSlug}/${episodeSlug}`,
      episodeTitle: meta.episodeTitle,
      podcastTitle: meta.podcastTitle,
      narrative: out.narrative,
      execSummary: (out.exec || []).map(b => `• ${b}`).join("\n"),
      actionableInsights: out.insights || [],
      strategicTakeaways: out.takeaways || [],
      importantQuotes: (out.quotes || []).map(q => ({
        text: q.text,
        speaker: q.speaker || "Speaker",
        tStartSec: q.startSec || q.start || 0,
        deepLinkUrl: `https://www.youtube.com/watch?v=${vid}&t=${Math.max(0, Math.round(q.startSec || q.start || 0))}s`,
        tweetIntentUrl: `https://twitter.com/intent/tweet?` +
          new URLSearchParams({ text: `${q.text} — ${q.speaker || "Speaker"}`, url: `https://www.youtube.com/watch?v=${vid}` })
      })),
      pdfUrl: "",
      audioSummaryUrl: "",
      metaDescription: "2-page summary with quotes, insights, and takeaways."
    };

    res.status(200).json(summary);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "server_error" });
  }
}
