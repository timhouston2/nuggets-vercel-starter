
import { useEffect, useState } from 'react';
import { getSummary, getRelated } from '../lib/api';

export default function SummaryPage({ params }){
  const { podcastSlug, episodeSlug } = params;
  const [s, setS] = useState(null);
  const [rel, setRel] = useState([]);

  useEffect(()=>{
    (async()=>{
      const data = await getSummary(podcastSlug, episodeSlug);
      setS(data);
      if(data?.id){
        const r = await getRelated(data.id);
        setRel(r);
      }
    })();
  }, [podcastSlug, episodeSlug]);

  if(!s) return <div style={{maxWidth: 800, margin: '40px auto', padding: 16}}>Loading...</div>;
  const url = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div style={{maxWidth: 800, margin: '40px auto', padding: 16}}>
      <h1>{s.episodeTitle}</h1>
      <p style={{color:'#888'}}>{s.podcastTitle}</p>
      <div style={{margin:'16px 0'}}>
        <a target='_blank' href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(s.episodeTitle)}`}>Share on X</a>
        {' '}|{' '}
        <a target='_blank' href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(s.episodeTitle)}`}>LinkedIn</a>
        {' '}|{' '}
        <a target='_blank' href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}>Facebook</a>
      </div>
      <pre style={{whiteSpace:'pre-wrap', background:'#111', color:'#eee', padding:12, borderRadius:8}}>{s.execSummary}</pre>
      {s.importantQuotes?.length ? (
        <div>
          <h3>Important Quotes</h3>
          <ul>
            {s.importantQuotes.map((q,i)=>(
              <li key={i}>
                “{q.text}” — <b>{q.speaker}</b> [{Math.floor(q.tStartSec/60)}:{String(q.tStartSec%60).padStart(2,'0')}]
                {' '}<a target='_blank' href={q.deepLinkUrl}>Play</a>
                {' '}<a target='_blank' href={q.tweetIntentUrl}>Click to Tweet</a>
              </li>
            ))}
          </ul>
        </div>
      ): null}
      {rel?.length ? (
        <div>
          <h3>Related Summaries</h3>
          <ul>{rel.map(r => <li key={r.id}><a href={r.slug}>{r.episodeTitle}</a></li>)}</ul>
        </div>
      ) : null}
    </div>
  );
}
