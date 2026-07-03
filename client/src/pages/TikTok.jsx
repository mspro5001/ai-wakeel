import React, { useState } from 'react';

export default function TikTok({ api }) {
  const [videoPath, setVideoPath] = useState('');
  const [caption, setCaption] = useState('');
  const [uploadResult, setUploadResult] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  async function uploadVideo() {
    const res = await fetch(`${api}/tiktok/upload`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoPath, caption }),
    });
    const d = await res.json();
    setUploadResult(d);
  }

  async function fetchAnalytics() {
    const res = await fetch(`${api}/tiktok/analytics`);
    const d = await res.json();
    setAnalytics(d);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🎵 تيك توك</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-bold mb-4">رفع فيديو</h2>
          <div className="space-y-3">
            <input placeholder="مسار الفيديو" value={videoPath} onChange={e => setVideoPath(e.target.value)} />
            <textarea placeholder="التعليق (caption)" value={caption} onChange={e => setCaption(e.target.value)} rows={3} />
            <button onClick={uploadVideo} className="btn-primary">🚀 رفع</button>
            {uploadResult && (
              <div className={`p-3 rounded-lg ${uploadResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {uploadResult.success ? `✅ تم الرفع!` : uploadResult.setupRequired ? '❌ يرجى إعداد تيك توك في الإعدادات' : `❌ ${uploadResult.error}`}
              </div>
            )}
          </div>
        </div>
        <div className="card">
          <h2 className="font-bold mb-4">التحليلات</h2>
          <button onClick={fetchAnalytics} className="btn-secondary mb-4">📊 جلب التحليلات</button>
          {analytics?.summary && (
            <div className="space-y-2">
              <div className="flex justify-between p-2 bg-gray-50 rounded"><span>إجمالي الفيديوهات</span><span className="font-bold">{analytics.summary.totalVideos}</span></div>
              <div className="flex justify-between p-2 bg-gray-50 rounded"><span>المشاهدات</span><span className="font-bold">{analytics.summary.totalViews}</span></div>
              <div className="flex justify-between p-2 bg-gray-50 rounded"><span>الإعجابات</span><span className="font-bold">{analytics.summary.totalLikes}</span></div>
              <div className="flex justify-between p-2 bg-gray-50 rounded"><span>التعليقات</span><span className="font-bold">{analytics.summary.totalComments}</span></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
