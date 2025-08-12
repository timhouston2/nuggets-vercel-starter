import { useEffect, useState } from "react";
import { getSummary, getRelated } from "../lib/api";

export default function SummaryPage({ params }){
  const { podcastSlug, episodeSlug } = params;
  const [s, setS] = useState(null);
  const [rel, setRel] = useState([]);

  useEffect(()=>{
    (async()=>{
      const data = await getSummary(podcastSlug, episodeSlug);
      if(!data?.id){
        try {
          const cached = JSON.parse(localStorage.getItem("nugget:" + `/${podcastSlug}/${episodeSlug}`));
          if(cached) setS(cached);
        } catch {}
      } else {
        setS(data);
      }
      const id = (data && data.id) || (s && s.id);
      if(id){
        const r = await getRelated(id);
        setRel(r || []);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [podcastSlug, episodeSlug]);

  if(!s) return <div style={{maxWidth: 800, margin: "40px auto", padding: 16}}>Loading...</div>;
  const url = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div style={{maxWidth: 800, margin: "40px auto", padding: 16}}>
      <h1>{s.episodeTitle}</h1>
      <p style={{color:"#888"}}>{s.podcastTitle}</p>

      <div style={{margin:"16px 0"}}>
        <a target="_blank" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(s.episodeTitle)}`}>Share on X</a>
        {" "}|{" "}
        <a target="_blank" href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(s.episodeTitle)}`}>LinkedIn</a>
        {" "}|{" "}
        <a target="_blank" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}>Facebook</a>
      </div>

      {/* Narrative 200–300 words */}
      {s.narrative && (
        <div style={{background:"#111", color:"#eee", padding:12, borderRadius:8, marginBottom:16, lineHeight:1.6}}>
          {s.narrative}
        </div>
      )}

      {/* Executive Summary bullets */}
      {s.execSummary && (
        <pre style={{whiteSpace:"pre-wrap", background:"#0d0d0d", color:"#ddd", padding:12, borderRadius:8}}>{s.execSummary}</pre>
      )}

      {/* Actionable Insights */}
      {Array.isArray(s.actionableInsights) && s.actionableInsights.length > 0 && (
        <div style={{marginTop:16}}>
          <h3>Actionable Insights</h3>
          <ul>
            {s.actionableInsights.map((it,i)=> <li key={i}>{it}</li>)}
          </ul>
        </div>
      )}

      {/* Strategic Takeaways */}
      {Array.isArray(s.strategicTakeaways) && s.strategicTakeaways.length > 0 && (
        <div style={{marginTop:16}}>
          <h3>Strategic Takeaways</h3>
          <ul>
            {s.strategicTakeaways.map((it,i)=> <li key={i}>{it}</li>)}
          </ul>
        </div>
      )}

      {/* Quotes */}
      {s.importantQuotes?.length ? (
        <div style={{marginTop:16}}>
          <h3>Important Quotes</h3>
          <ul>
            {s.importantQuotes.map((q,i)=>(
              <li key={i}>
                “{q.text}” — <b>{q.speaker}</b> [{Math.floor(q.tStartSec/60)}:{String(q.tStartSec%60).padStart(2,"0")}]
                {" "}<a target="_blank" href={q.deepLinkUrl}>Play</a>
                {" "}<a target="_blank" href={q.tweetIntentUrl}>Click to Tweet</a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Related */}
      {rel?.length ? (
        <div style={{marginTop:16}}>
          <h3>Related Summaries</h3>
          <ul>{rel.map(r => <li key={r.id}><a href={r.slug}>{r.episodeTitle}</a></li>)}</ul>
        </div>
      ) : null}
    </div>
  );
}
