
export default function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const url = req.body?.url || '';
  const podcastSlug = url.includes('a16z') ? 'a16z' : 'podcast';
  const episodeSlug = 'sample-episode';
  const slug = `/${podcastSlug}/${episodeSlug}`;
  res.status(200).json({ id: 'demo', slug, status: 'published' });
}
