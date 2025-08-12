import OpenAI from "openai";

const banned = ["delve","tapestry","realm","unpack","myriad","journey"];
const scrub = (s) => banned
  .reduce((t,w)=>t.replace(new RegExp(`\\b${w}\\b`,"gi"),""), s)
  .replace(/\s{2,}/g," ")
  .trim();

export const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateSummary({ transcript, podcastTitle, episodeTitle }) {
  const system = `You are a precise editor creating a clear, modern podcast summary with no flowery clichés.`;
  const user = `Podcast: ${podcastTitle}
Episode: ${episodeTitle}

TASKS:
1) Write a 200-300 word narrative summary (plain paragraphs, no bullets).
2) Executive Summary: 5-8 crisp bullets.
3) Actionable Insights: 5-10 bullets; each bullet starts with a short **bolded** title then a colon and detail (markdown ok).
4) Strategic Takeaways: 5-10 bullets; same style as insights.
5) Important Quotes: 8-15 VERBATIM quotes in JSON with fields: text, speaker, startSec (seconds).

RULES:
- Avoid words like delve, tapestry, realm, unpack, myriad, journey.
- Keep quotes short (< 240 chars).
- If unsure of speaker, use "Host" or "Guest".
- Use only content inferable from the transcript.

TRANSCRIPT:
${transcript.slice(0, 100000)}
`;

  const r = await client.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    max_tokens: 1500,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ]
  });

  const text = r.choices[0]?.message?.content || "";

  let narrative = "";
  let exec = [];
  let insights = [];
  let takeaways = [];
  let quotes = [];

  const parseBullets = (block) => (block.match(/^-\\s+.*$/gmi) || [])
    .map(s => s.replace(/^[\\-•]\\s+/, "").trim());

  narrative = scrub(text.split(/\n\s*\d\)\s*/i)[0] || text);

  const execMatch = text.match(/Executive Summary[\\s\\S]*?(Actionable Insights|Strategic Takeaways|Important Quotes|$)/i);
  if (execMatch) exec = parseBullets(execMatch[0]);

  const insMatch = text.match(/Actionable Insights[\\s\\S]*?(Strategic Takeaways|Important Quotes|$)/i);
  if (insMatch) insights = parseBullets(insMatch[0]);

  const stratMatch = text.match(/Strategic Takeaways[\\s\\S]*?(Important Quotes|$)/i);
  if (stratMatch) takeaways = parseBullets(stratMatch[0]);

  const jsonMatch = text.match(/```json[\\s\\S]*?```/i) || text.match(/\n\s*(\[\s*{[\s\S]*}\s*])\s*/);
  if (jsonMatch) {
    try { quotes = JSON.parse(jsonMatch[0].replace(/```json|```/g, "").trim()); } catch {}
  }

  return { narrative, exec, insights, takeaways, quotes: Array.isArray(quotes) ? quotes : [] };
}
