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
  connectionString: process.env.DATABASE_URL
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

  const ytdlp = spawn('yt-dlp', [
    '-o',
    path.join(downloadsDir, '%(title)s.%(ext)s'),
    url
  ]);

  ytdlp.stderr.on('data', (data) => {
    console.error('yt-dlp:', data.toString());
  });

  ytdlp.on('close', async () => {
    const files = fs.readdirSync(downloadsDir).filter(file =>
      /\.(mp4|webm|mkv)$/.test(file)
    );

    if (!files.length) {
      return res.status(500).json({ error: 'Download failed' });
    }

    const fname = files.pop();
    const filePath = path.join(downloadsDir, fname);

    try {
      await pool.query(
        'INSERT INTO downloads(url, platform, filename) VALUES($1, $2, $3)',
        [url, platform, fname]
      );
    } catch (err) {
      console.error('DB insert failed:', err.message);
    }

    res.download(filePath, fname, (err) => {
      if (err) console.error(err);
      fs.unlinkSync(filePath); // delete after sending
    });
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () =>
  console.log(`✅ Backend running on http://localhost:${PORT}`)
);
