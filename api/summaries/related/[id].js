
export default function handler(req, res){
  const items = [1,2,3].map(n => ({
    id: 'demo-'+n,
    slug: `/a16z/sample-episode-${n}`,
    episodeTitle: `Related Example ${n}`
  }));
  res.status(200).json(items);
}
