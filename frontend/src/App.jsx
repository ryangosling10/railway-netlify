import React, { useState } from 'react';
import GlassCard from './GlassCard';

export default function App() {
  const [url, setUrl] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [loading, setLoading] = useState(false);

  const download = async () => {
    if (!url) return;
    setLoading(true);
    try {
const res = await fetch('/api/download', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ url, platform })
});

      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const disp = res.headers.get('Content-Disposition');
      const filename = disp?.split('filename=')[1]?.replace(/"/g, '') || 'download';
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard>
      <h1>Downloader</h1>
      <p>by RabbitDev</p>
      <p>This is my first personal project — a simple all-in-one downloader for Instagram, YouTube.<br/>
      Feel free to use it and share feedback. Thanks for visiting!</p>
      <div className="tab-buttons">
        <button onClick={() => setPlatform('instagram')}>Instagram</button>
        <button onClick={() => setPlatform('youtube')}>YouTube</button>
      </div>
      <input
        type="text"
        placeholder={`Paste ${platform} URL here`}
        value={url}
        onChange={e => setUrl(e.target.value)}
      />
      <button className="download" onClick={download} disabled={loading}>
        🚀 {loading ? 'Downloading...' : 'Download'}
      </button>
    </GlassCard>
  );
}