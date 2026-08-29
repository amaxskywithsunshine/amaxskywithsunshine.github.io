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

const CATALOG_VIDEOS = [
  { id: 'k5uBiraClCY', title: 'ENDER LILIES | EP1 ( NO CUT ) | กำเนิดนักบุญตัวน้อยแห่งดอกไม้ขาว Lilies (Lily)', pubDate: '2026-08-17T06:03:45+00:00' },
  { id: 'AdU297GBNvg', title: 'visuals:AZURE2026', pubDate: '2026-07-07T07:53:15+00:00' },
  { id: 'rpY9ydbisP4', title: 'visuals:AZURE2026 [ Discarded ]', pubDate: '2026-06-11T16:26:26+00:00' },
  { id: 'Rwc5zKMN1xM', title: 'visuals:NO_WORRIES.', pubDate: '2026-05-31T15:03:05+00:00' },
  { id: 'mm-pWXxyT6k', title: 'visuals:Height.', pubDate: '2026-05-31T13:49:22+00:00' },
  { id: 'N0SML3Qotaw', title: 'banner:HIRO.', pubDate: '2026-05-31T13:08:11+00:00' },
  { id: 'zIEbQMFPSMs', title: 'remake:AMOS', pubDate: '2026-03-15T13:54:37+00:00' },
  { id: '0eXpsDlfUII', title: 'reels:2024-2025', pubDate: '2026-03-08T02:10:51+00:00' },
  { id: 'ZVTB6703DnE', title: 'HBD:amax.', pubDate: '2026-02-02T09:11:09+00:00' },
  { id: 'Q-Fg1dh8s_I', title: 'HBD:sxcstyles2025.', pubDate: '2025-08-17T04:02:46+00:00' },
  { id: '4gGzsHAM4mA', title: 'amv:News.', pubDate: '2024-10-21T10:21:34+00:00' },
  { id: 'NiYcw0yX2VY', title: '文字PV:not_enough.', pubDate: '2024-09-12T03:43:59+00:00' },
  { id: 'QpnHcE5G0ks', title: '文字PV:all_alone.', pubDate: '2024-06-10T09:03:54+00:00' },
  { id: 'R3zzz9GDyfs', title: 'amv:Untitled.', pubDate: '2024-05-13T17:43:31+00:00' },
  { id: 'P5uiNuZG46s', title: 'amv:Daisey.', pubDate: '2024-02-29T06:37:30+00:00' },
  { id: 'XgDKkSS0aPw', title: '.', pubDate: '2024-05-01T00:00:00+00:00' },
  { id: 'gNO7aiqYkSQ', title: 'visuals:busy.', pubDate: '2024-02-01T00:00:00+00:00' },
  { id: 'Rc__qEAHGAU', title: 'amv:Story.', pubDate: '2023-11-01T00:00:00+00:00' },
  { id: 'Taiw_SjScNY', title: 'HBD:sxcstyles', pubDate: '2023-08-17T00:00:00+00:00' },
  { id: 'ot68zIJmfyY', title: 'intro:HiroNeyka.', pubDate: '2023-05-01T00:00:00+00:00' },
  { id: 'r5wQP7NbVmQ', title: 'fantro:Nerumi-S', pubDate: '2023-03-01T00:00:00+00:00' },
  { id: 'x8C_vZsPIFc', title: 'amv:amax&witty.', pubDate: '2022-12-01T00:00:00+00:00' },
];

function mergeWithCatalog(liveList) {
  const seen = new Set();
  const result = [];
  (liveList || []).forEach(item => {
    const vid = item.link ? item.link.split('v=').pop() : '';
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

// Fetch user's latest YouTube videos directly from YouTube's official RSS feed
app.get('/api/videos', (req, res) => {
  const now = Date.now();
  // Return cached result if fresh within 10 minutes
  if (videoCache.items && (now - videoCache.timestamp < 10 * 60 * 1000)) {
    return res.json({ status: 'ok', source: 'cache', items: videoCache.items });
  }

  const targetChannelId = process.env.YOUTUBE_CHANNEL_ID || CHANNEL_ID;
  const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${targetChannelId}`;

  const request = https.get(rssUrl, (ytRes) => {
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

        const mergedItems = mergeWithCatalog(liveItems);

        if (mergedItems.length > 0) {
          videoCache.items = mergedItems;
          videoCache.timestamp = now;
        }

        res.json({
          status: 'ok',
          source: 'youtube_rss',
          items: mergedItems,
        });
      } catch (err) {
        res.json({ status: 'ok', source: 'catalog_fallback', items: mergeWithCatalog([]) });
      }
    });
  });

  request.on('error', (err) => {
    if (videoCache.items) {
      return res.json({ status: 'ok', source: 'stale_cache', items: videoCache.items });
    }
    res.json({ status: 'ok', source: 'catalog_fallback', items: mergeWithCatalog([]) });
  });
});

// For any other route, serve the index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
