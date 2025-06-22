const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.post('/api/download', async (req, res) => {
  const { url, platform } = req.body;
  if (!url || !platform) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const downloadsDir = path.resolve('downloads');
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir);
  }

  const outputTemplate = path.join(downloadsDir, '%(title)s.%(ext)s');
  const ytdlp = spawn('yt-dlp', ['-o', outputTemplate, url]);

  console.log(`[yt-dlp] Starting download: ${url}`);

  ytdlp.stdout.on('data', data => {
    console.log('[yt-dlp stdout]', data.toString());
  });

  ytdlp.stderr.on('data', data => {
    console.error('[yt-dlp stderr]', data.toString());
  });

  ytdlp.on('close', async (code) => {
    console.log(`[yt-dlp] exited with code ${code}`);
    if (code !== 0) {
      return res.status(500).json({ error: 'yt-dlp failed to download the video' });
    }

    const files = fs.readdirSync(downloadsDir).filter(file =>
      /\.(mp4|webm|mkv)$/.test(file)
    );

    if (!files.length) {
      return res.status(500).json({ error: 'No file downloaded' });
    }

    const fname = files.pop();
    const filePath = path.join(downloadsDir, fname);

    try {
      await pool.query(
        'INSERT INTO downloads(url, platform, filename) VALUES($1, $2, $3)',
        [url, platform, fname]
      );
    } catch (err) {
      console.error('Database insert failed:', err.message);
    }

    res.download(filePath, fname, (err) => {
      if (err) console.error('Send failed:', err.message);
      fs.unlinkSync(filePath); // delete after sending
    });
  });
});

// ✅ Test route to verify yt-dlp is working
app.get('/test-dlp', (req, res) => {
  const proc = spawn('yt-dlp', ['--version']);
  let output = '';
  proc.stdout.on('data', d => output += d);
  proc.on('close', () => res.send(output || 'No output'));
});

// ✅ Only one listen call
const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`✅ Backend running on http://localhost:${PORT}`)
);
