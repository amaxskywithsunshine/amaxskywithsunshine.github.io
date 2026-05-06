require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Expose env vars to the frontend (never expose secrets you don't want public)
app.get('/config', (req, res) => {
  res.json({
    YOUTUBE_HANDLE:  process.env.YOUTUBE_HANDLE  || '',
    YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || '',
  });
});

// For any route, serve the index.html file (useful if you ever add client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
