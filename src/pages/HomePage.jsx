
import { Link } from 'wouter';
export default function HomePage(){
  return (
    <div style={{maxWidth: 800, margin: '40px auto', padding: 16}}>
      <h1>Nuggets (Vercel Starter)</h1>
      <p>Paste a Spotify or YouTube link to generate a mock 2-page summary with quotes and share links.</p>
      <Link href='/ingest'><a>Create a summary</a></Link>
    </div>
  );
}
