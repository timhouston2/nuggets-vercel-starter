
export default function handler(req, res){
  const { podcastSlug, episodeSlug } = req.query;
  const summary = {
    id: 'demo',
    slug: `/${podcastSlug}/${episodeSlug}`,
    episodeTitle: 'Sample Episode (Mock Summary)',
    podcastTitle: String(podcastSlug).toUpperCase(),
    execSummary: [
      '• Executive bullet 1',
      '• Executive bullet 2',
      '• Executive bullet 3'
    ].join('\n'),
    importantQuotes: [
      { text: 'Great ideas start small.', speaker: 'Guest', tStartSec: 95, deepLinkUrl: 'https://example.com', tweetIntentUrl: 'https://twitter.com/intent/tweet' },
      { text: 'Execution beats inspiration.', speaker: 'Host', tStartSec: 245, deepLinkUrl: 'https://example.com', tweetIntentUrl: 'https://twitter.com/intent/tweet' }
    ],
    pdfUrl: '',
    audioSummaryUrl: '',
    metaDescription: '2-page summary with quotes, insights, and takeaways.'
  };
  res.status(200).json(summary);
}
