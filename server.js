require('dotenv').config();
const express = require('express');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || 'UCuDkWnsBiTKlsecae0D11Ag';
const HANDLE = process.env.YOUTUBE_HANDLE || 'iaexamax';
const UPLOADS_PLAYLIST_ID = process.env.YOUTUBE_UPLOADS_PLAYLIST_ID || 'UUuDkWnsBiTKlsecae0D11Ag';
const API_KEY = process.env.YOUTUBE_API_KEY || '';

// Serve static files from the current directory
app.use(express.static(__dirname));

// Expose config to the frontend
app.get('/config', (req, res) => {
  res.json({
    YOUTUBE_HANDLE: process.env.YOUTUBE_HANDLE || HANDLE,
    YOUTUBE_CHANNEL_ID: process.env.YOUTUBE_CHANNEL_ID || CHANNEL_ID,
    YOUTUBE_UPLOADS_PLAYLIST_ID: process.env.YOUTUBE_UPLOADS_PLAYLIST_ID || UPLOADS_PLAYLIST_ID,
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || API_KEY,
  });
});

// In-memory cache for fetched YouTube videos
let videoCache = {
  items: null,
  timestamp: 0,
};

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

// Fetch user's videos dynamically from YouTube (API or RSS feed)
app.get('/api/videos', (req, res) => {
  const now = Date.now();
  if (videoCache.items && (now - videoCache.timestamp < 10 * 60 * 1000)) {
    return res.json({ status: 'ok', source: 'cache', items: videoCache.items });
  }

  const apiKey = process.env.YOUTUBE_API_KEY || API_KEY || '';
  const playlistId = process.env.YOUTUBE_UPLOADS_PLAYLIST_ID || UPLOADS_PLAYLIST_ID;

  // If API key is available, use YouTube Data API v3; otherwise use RSS feed directly
  if (apiKey) {
    const apiUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${apiKey}`;

    const apiReq = https.get(apiUrl, {
      headers: { 'Referer': 'https://amaxskywithsunshine.github.io/' }
    }, (apiRes) => {
      if (apiRes.statusCode === 200) {
        let data = '';
        apiRes.on('data', chunk => data += chunk);
        apiRes.on('end', () => {
          try {
            const json = JSON.parse(data);
            const items = (json.items || []).map(v => ({
              title: decodeHtmlEntities(v.snippet.title),
              pubDate: v.snippet.publishedAt,
              link: `https://www.youtube.com/watch?v=${v.snippet.resourceId.videoId}`,
              thumbnail: { url: v.snippet.thumbnails?.maxres?.url || v.snippet.thumbnails?.high?.url || v.snippet.thumbnails?.default?.url }
            }));
            if (items.length > 0) {
              videoCache.items = items;
              videoCache.timestamp = now;
              return res.json({ status: 'ok', source: 'youtube_api', items });
            }
          } catch (e) {}
          fetchFromRSS();
        });
      } else {
        fetchFromRSS();
      }
    });

    apiReq.on('error', () => fetchFromRSS());
  } else {
    fetchFromRSS();
  }

  function fetchFromRSS() {
    const targetChannelId = process.env.YOUTUBE_CHANNEL_ID || CHANNEL_ID;
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${targetChannelId}`;

    https.get(rssUrl, (ytRes) => {
      if (ytRes.statusCode !== 200) {
        if (videoCache.items) {
          return res.json({ status: 'ok', source: 'stale_cache', items: videoCache.items });
        }
        return res.status(ytRes.statusCode).json({ error: `YouTube responded with status ${ytRes.statusCode}` });
      }

      let xml = '';
      ytRes.on('data', chunk => xml += chunk);
      ytRes.on('end', () => {
        try {
          const entries = xml.split('<entry>').slice(1);
          const liveItems = entries.map(entry => {
            const idMatch = entry.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
            const titleMatch = entry.match(/<title>([^<]+)<\/title>/);
            const pubMatch = entry.match(/<published>([^<]+)<\/published>/);
            const vid = idMatch ? idMatch[1] : '';
            const rawTitle = titleMatch ? titleMatch[1] : '';

            return {
              title: decodeHtmlEntities(rawTitle),
              pubDate: pubMatch ? pubMatch[1] : '',
              link: `https://www.youtube.com/watch?v=${vid}`,
              thumbnail: { url: `https://img.youtube.com/vi/${vid}/hqdefault.jpg` },
            };
          }).filter(item => item.link.length > 28);

          if (liveItems.length > 0) {
            videoCache.items = liveItems;
            videoCache.timestamp = now;
          }

          res.json({
            status: 'ok',
            source: 'youtube_rss',
            items: liveItems.length > 0 ? liveItems : (videoCache.items || []),
          });
        } catch (err) {
          if (videoCache.items) return res.json({ status: 'ok', source: 'stale_cache', items: videoCache.items });
          res.status(500).json({ error: err.message });
        }
      });
    }).on('error', (err) => {
      if (videoCache.items) return res.json({ status: 'ok', source: 'stale_cache', items: videoCache.items });
      res.status(500).json({ error: err.message });
    });
  }
});

// For any other route, serve the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
