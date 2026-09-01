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

const CATALOG_VIDEOS = [
  { id: 'AdU297GBNvg', title: 'visuals:AZURE2026', pubDate: '2026-07-07T07:53:15Z' },
  { id: 'rpY9ydbisP4', title: 'visuals:AZURE2026 [ Discarded ]', pubDate: '2026-06-11T16:26:26Z' },
  { id: 'Rwc5zKMN1xM', title: 'visuals:NO_WORRIES.', pubDate: '2026-05-31T15:03:05Z' },
  { id: 'mm-pWXxyT6k', title: 'visuals:Height.', pubDate: '2026-05-31T13:49:22Z' },
  { id: 'N0SML3Qotaw', title: 'banner:HIRO.', pubDate: '2026-05-31T13:08:11Z' },
  { id: 'zIEbQMFPSMs', title: 'remake:AMOS', pubDate: '2026-03-15T13:54:37Z' },
  { id: '0eXpsDlfUII', title: 'reels:2024-2025', pubDate: '2026-03-08T02:10:51Z' },
  { id: 'ZVTB6703DnE', title: 'HBD:amax.', pubDate: '2026-02-02T09:11:09Z' },
  { id: 'Q-Fg1dh8s_I', title: 'HBD:sxcstyles2025.', pubDate: '2025-08-17T04:02:46Z' },
  { id: '4gGzsHAM4mA', title: 'amv:News.', pubDate: '2024-10-21T10:21:34Z' },
  { id: 'NiYcw0yX2VY', title: '文字PV:not_enough.', pubDate: '2024-09-12T03:43:59Z' },
  { id: 'QpnHcE5G0ks', title: '文字PV:all_alone.', pubDate: '2024-06-10T09:03:54Z' },
  { id: 'R3zzz9GDyfs', title: 'amv:Untitled.', pubDate: '2024-05-13T17:43:31Z' },
  { id: 'P5uiNuZG46s', title: 'amv:Daisey.', pubDate: '2024-02-29T06:37:30Z' },
  { id: 'XgDKkSS0aPw', title: 'amv:dot.', pubDate: '2024-02-05T00:59:57Z' },
  { id: 'gNO7aiqYkSQ', title: 'visuals:busy.', pubDate: '2024-01-07T11:14:44Z' },
  { id: 'zVkIiLFjrWU', title: 'miley', pubDate: '2023-12-09T15:07:36Z' },
  { id: 'Rc__qEAHGAU', title: 'amv:Story.', pubDate: '2023-10-27T14:12:59Z' },
  { id: 'Taiw_SjScNY', title: 'HBD:sxcstyles', pubDate: '2023-07-22T06:01:41Z' },
  { id: 'ot68zIJmfyY', title: 'intro:HiroNeyka.', pubDate: '2023-06-10T09:08:34Z' },
  { id: 'r5wQP7NbVmQ', title: 'fantro:Nerumi-S', pubDate: '2023-05-29T10:29:48Z' },
  { id: 'x8C_vZsPIFc', title: 'amv:amax&witty.', pubDate: '2023-05-20T12:13:08Z' },
];

function mergeWithCatalog(liveList) {
  const seen = new Set();
  const result = [];
  (liveList || []).forEach(item => {
    const vid = item.link ? item.link.split('v=').pop() : (item.id || '');
    if (vid && !seen.has(vid)) {
      seen.add(vid);
      result.push(item);
    }
  });
  CATALOG_VIDEOS.forEach(item => {
    if (!seen.has(item.id)) {
      seen.add(item.id);
      result.push({
        title: item.title,
        pubDate: item.pubDate,
        link: `https://www.youtube.com/watch?v=${item.id}`,
        thumbnail: { url: `https://img.youtube.com/vi/${item.id}/hqdefault.jpg` }
      });
    }
  });
  return result;
}

  function fetchFromRSS() {
    const targetChannelId = process.env.YOUTUBE_CHANNEL_ID || CHANNEL_ID;
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${targetChannelId}`;

    https.get(rssUrl, (ytRes) => {
      if (ytRes.statusCode !== 200) {
        if (videoCache.items) {
          return res.json({ status: 'ok', source: 'stale_cache', items: videoCache.items });
        }
        return res.json({ status: 'ok', source: 'catalog_fallback', items: mergeWithCatalog([]) });
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

          const merged = mergeWithCatalog(liveItems);

          if (merged.length > 0) {
            videoCache.items = merged;
            videoCache.timestamp = now;
          }

          res.json({
            status: 'ok',
            source: 'youtube_rss_merged',
            items: merged,
          });
        } catch (err) {
          if (videoCache.items) return res.json({ status: 'ok', source: 'stale_cache', items: videoCache.items });
          res.json({ status: 'ok', source: 'catalog_fallback', items: mergeWithCatalog([]) });
        }
      });
    }).on('error', (err) => {
      if (videoCache.items) return res.json({ status: 'ok', source: 'stale_cache', items: videoCache.items });
      res.json({ status: 'ok', source: 'catalog_fallback', items: mergeWithCatalog([]) });
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
