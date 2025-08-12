
import { useEffect, useState } from 'react';
import { getPodcast } from '../lib/api';

export default function PodcastDirectoryPage({ params }){
  const { podcastSlug } = params;
  const [items, setItems] = useState([]);
  useEffect(()=>{ (async()=>{ const d = await getPodcast(podcastSlug); setItems(d.items || []); })(); }, [podcastSlug]);
  return (
    <div style={{maxWidth: 800, margin: '40px auto', padding: 16}}>
      <h1>{podcastSlug}</h1>
      <ul>{items.map(i => <li key={i.id}><a href={i.slug}>{i.episodeTitle}</a></li>)}</ul>
    </div>
  );
}
