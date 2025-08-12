
const API = '/api';
export async function ingest(url){
  const r = await fetch(`${API}/ingest`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ url }) });
  return r.json();
}
export async function getSummary(podcastSlug, episodeSlug){
  const r = await fetch(`${API}/summaries/${podcastSlug}/${episodeSlug}`);
  return r.json();
}
export async function getPodcast(podcastSlug){
  const r = await fetch(`${API}/podcasts/${podcastSlug}`);
  return r.json();
}
export async function getRelated(id){
  const r = await fetch(`${API}/summaries/related/${id}`);
  return r.json();
}
