
export default function handler(req, res){
  const { podcastSlug } = req.query;
  const items = [1,2,3].map(n => ({
    id: 'demo-'+n,
    slug: `/${podcastSlug}/sample-episode-${n}`,
    episodeTitle: `${String(podcastSlug).toUpperCase()} Episode ${n}`,
    metaDescription: 'Mock summary'
  }));
  res.status(200).json({ items });
}
