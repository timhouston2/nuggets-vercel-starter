
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Route, Switch } from 'wouter';
import HomePage from './pages/HomePage.jsx';
import IngestPage from './pages/IngestPage.jsx';
import SummaryPage from './pages/SummaryPage.jsx';
import PodcastDirectoryPage from './pages/PodcastDirectoryPage.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Switch>
      <Route path='/' component={HomePage} />
      <Route path='/ingest' component={IngestPage} />
      <Route path='/:podcastSlug/:episodeSlug' component={SummaryPage} />
      <Route path='/:podcastSlug' component={PodcastDirectoryPage} />
    </Switch>
  </React.StrictMode>
);
