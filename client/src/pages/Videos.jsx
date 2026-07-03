import React, { useState, useEffect } from 'react';

export default function Videos({ api }) {
  const [videos, setVideos] = useState([]);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchVideos(); }, []);

  async function fetchVideos() {
    const res = await fetch(`${api}/videos`);
    const d = await res.json();
    if (d.success) setVideos(d.videos);
  }

  async function uploadVideo(file) {
    const form = new FormData();
    form.append('video', file);
    const res = await fetch(`${api}/videos/upload`, { method: 'POST', body: form });
    const d = await res.json();
    if (d.success) fetchVideos();
  }

  async function processVideo(videoId) {
    setProcessing(true);
    const res = await fetch(`${api}/videos/process`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, action: 'compress', options: {} }),
    });
    setProcessing(false);
    fetchVideos();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🎬 تعديل الفيديو</h1>
      <div className="card mb-6">
        <h2 className="font-bold mb-3">رفع فيديو جديد</h2>
        <input type="file" accept="video/*" onChange={e => e.target.files[0] && uploadVideo(e.target.files[0])} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {videos.map(v => (
          <div key={v.id} className="card">
            <p className="font-bold truncate">{v.title || 'بدون عنوان'}</p>
            <p className="text-sm text-gray-400 mt-1">الحالة: {v.status}</p>
            {v.status === 'uploaded' && (
              <button onClick={() => processVideo(v.id)} disabled={processing} className="btn-primary mt-3 w-full text-sm">
                {processing ? 'جاري المعالجة...' : 'معالجة (ضغط)'}
              </button>
            )}
          </div>
        ))}
        {!videos.length && <p className="text-gray-400 col-span-3 text-center py-12">لم يتم رفع أي فيديو بعد</p>}
      </div>
    </div>
  );
}
