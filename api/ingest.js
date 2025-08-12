import { parseYouTubeId, fetchYouTubeTranscript, ytDeepLink } from "./_lib/transcript.js";
import { client } from "./_lib/openai.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });

  console.log("DEBUG: Incoming request", req.body);

  // 1. Check API key
  if (!process.env.OPENAI_API_KEY) {
    console.error("DEBUG: Missing OPENAI_API_KEY");
    return res.status(500).json({ error: "missing_openai_key" });
  }

  // 2. Parse YouTube URL
  const url = req.body?.url || "";
  const vid = parseYouTubeId(url);
  if (!vid) {
    console.error("DEBUG: Invalid or missing YouTube URL");
    return res.status(400).json({ error: "invalid_url" });
  }
  console.log("DEBUG: Parsed video ID", vid);

  // 3. Fetch transcript
  let transcriptData;
  try {
    transcriptData = await fetchYouTubeTranscript(vid);
  } catch (err) {
    console.error("DEBUG: Transcript fetch error", err);
    return res.status(500).json({ error: "transcript_fetch_failed", details: err.message });
  }

  if (!transcriptData?.text || transcriptData.text.length < 100) {
    console.error("DEBUG: No transcript found or too short");
    return res.status(422).json({ error: "no_transcript" });
  }
  console.log("DEBUG: Transcript length", transcriptData.text.length);

  // 4. Call OpenAI for short test
  let testSummary;
  try {
    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Summarize this YouTube transcript in 50 words or less." },
        { role: "user", content: transcriptData.text.slice(0, 2000) }
      ],
      max_tokens: 200
    });
    testSummary = r.choices[0]?.message?.content || "";
    console.log("DEBUG: Got OpenAI summary");
  } catch (err) {
    console.error("DEBUG: OpenAI API error", err);
    return res.status(500).json({ error: "openai_error", details: err.message });
  }

  // 5. Return test JSON
  return res.status(200).json({
    status: "success",
    videoId: vid,
    transcriptPreview: transcriptData.text.slice(0, 120) + "...",
    testSummary
  });
}
