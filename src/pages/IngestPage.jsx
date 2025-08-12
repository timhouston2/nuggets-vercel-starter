import { useState } from "react";
import { useLocation } from "wouter";
import { ingest } from "../lib/api";

export default function IngestPage(){
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLoc] = useLocation();

  async function go(){
    setLoading(true);
    const r = await ingest(url);
    setLoading(false);
    if(r.slug){
      if(r.summary){
        try { localStorage.setItem("nugget:"+r.slug, JSON.stringify(r.summary)); } catch {}
      }
      setLoc(r.slug);
    } else {
      alert(r.message || r.error || "Failed");
    }
  }

  return (
    <div style={{maxWidth: 800, margin: "40px auto", padding: 16}}>
      <h2>Paste a YouTube link</h2>
      <input style={{width:"100%", padding:8}} placeholder="https://www.youtube.com/watch?v=..." value={url} onChange={e=>setUrl(e.target.value)} />
      <div style={{marginTop:12}}>
        <button disabled={loading} onClick={go}>{loading?"Working...":"Summarize"}</button>
      </div>
      <p style={{color:"#888", marginTop:8}}>Spotify fallback coming next (when we add a database).</p>
    </div>
  );
}
