import React, { useState, useEffect, useRef } from 'react';

const agentMeta = {
  scout:    { label: 'وكيل الاستكشاف',     icon: '🔍', color: 'blue' },
  legal:    { label: 'وكيل الشروط والتعديل', icon: '⚖️', color: 'amber' },
  publisher:{ label: 'وكيل النشر',         icon: '📱', color: 'purple' },
  reporter: { label: 'وكيل التلخيص',       icon: '📊', color: 'green' },
};

export default function Agents({ api, socket }) {
  const [videoPath, setVideoPath] = useState('');
  const [caption, setCaption] = useState('');
  const [campaignLink, setCampaignLink] = useState('');
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [results, setResults] = useState(null);
  const [pipelineStatus, setPipelineStatus] = useState(null);
  const logEnd = useRef(null);

  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), ...data }]);
      if (data.stage === 'scout_done' || data.stage === 'legal_done' || data.stage === 'publisher_done' || data.stage === 'reporter_done') {
        setPipelineStatus(data.stage.replace('_done', ''));
      }
      if (data.stage === 'complete') { setRunning(false); setPipelineStatus('complete'); }
      if (data.stage === 'failed' || data.stage === 'no_campaigns') { setRunning(false); setPipelineStatus(data.stage); }
    };
    socket.on('pipeline_update', handler);
    return () => socket.off('pipeline_update', handler);
  }, [socket]);

  useEffect(() => { logEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  async function runPipeline() {
    setRunning(true);
    setLogs([{ time: new Date().toLocaleTimeString(), stage: 'starting', message: '🚀 بدء تشغيل الوكلاء الأربعة...' }]);
    setResults(null);
    setPipelineStatus('starting');
    try {
      const res = await fetch(`${api}/agents/pipeline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoPath: videoPath || null, caption: caption || null, campaignLink: campaignLink || null }),
      });
      const data = await res.json();
      setResults(data);
      setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), stage: 'complete', message: data.success ? '✅ اكتملت جميع المهام' : '⚠️ بعض المهام لم تكتمل' }]);
      setPipelineStatus(data.success ? 'complete' : 'failed');
    } catch (err) {
      setLogs(prev => [...prev, { time: new Date().toLocaleTimeString(), stage: 'error', message: `❌ خطأ: ${err.message}` }]);
      setPipelineStatus('failed');
    }
    setRunning(false);
  }

  const stageColor = (stage) => {
    const colors = { starting: 'blue', scout: 'blue', legal: 'amber', publisher: 'purple', reporter: 'green', complete: 'green', failed: 'red', error: 'red', no_campaigns: 'yellow' };
    const c = colors[stage] || 'gray';
    return `bg-${c}-100 text-${c}-700 border-${c}-200`;
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🤖 الوكلاء الأربعة</h1>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(agentMeta).map(([key, meta]) => (
          <div key={key} className={`card text-center ${pipelineStatus === key ? 'ring-2 ring-primary-500 shadow-lg' : ''}`}>
            <div className="text-3xl mb-2">{meta.icon}</div>
            <div className="font-bold text-sm">{meta.label}</div>
            <div className={`text-xs mt-1 ${pipelineStatus === key ? 'text-primary-600 font-bold' : 'text-gray-400'}`}>
              {pipelineStatus === key ? '⚡ قيد التشغيل...' : pipelineStatus === 'complete' ? '✅ تم' : '⏳'}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="font-bold mb-4">⚙️ تشغيل pipeline</h2>
          <div className="space-y-3">
            <input placeholder="مسار الفيديو (اختياري)" value={videoPath} onChange={e => setVideoPath(e.target.value)} disabled={running} />
            <textarea placeholder="نص الكابتشن (اختياري)" value={caption} onChange={e => setCaption(e.target.value)} rows={2} disabled={running} />
            <input placeholder="رابط الحملة (اختياري)" value={campaignLink} onChange={e => setCampaignLink(e.target.value)} disabled={running} />
            <button onClick={runPipeline} disabled={running} className={`btn-primary w-full ${running ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {running ? '⏳ جاري التشغيل...' : '🚀 تشغيل الوكلاء الأربعة'}
            </button>
          </div>
        </div>

        <div className="card">
          <h2 className="font-bold mb-4">📋 سير التنفيذ</h2>
          <div className="h-64 overflow-y-auto space-y-2" style={{ direction: 'rtl' }}>
            {logs.map((log, i) => (
              <div key={i} className={`text-sm p-2 rounded-lg border ${stageColor(log.stage)}`}>
                <span className="text-xs opacity-60 ml-2">{log.time}</span>
                {log.message}
              </div>
            ))}
            {!logs.length && <p className="text-gray-400 text-center py-8">اضغط "تشغيل" لبدء pipeline</p>}
            <div ref={logEnd} />
          </div>
        </div>
      </div>

      {results && (
        <div className="card mb-6">
          <h2 className="font-bold text-lg mb-4">📊 التقرير النهائي</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className={`p-4 rounded-lg ${results.results?.scout?.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="text-2xl mb-1">🔍</div>
              <div className="font-bold text-sm mb-1">{results.results?.scout?.summary || 'لم ينفذ'}</div>
              <div className="text-xs text-gray-500">حلال: {results.results?.scout?.halalCount || 0} | حرام: {results.results?.scout?.haramCount || 0}</div>
            </div>
            <div className={`p-4 rounded-lg ${results.results?.legal?.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="text-2xl mb-1">⚖️</div>
              <div className="font-bold text-sm mb-1">{results.results?.legal?.summary || 'لم ينفذ'}</div>
              <div className="text-xs text-gray-500">النقاط: {results.results?.legal?.score ?? '-'}/100</div>
            </div>
            <div className={`p-4 rounded-lg ${results.results?.publisher?.success ? 'bg-green-50 border border-green-200' : (results.results?.publisher?.success === false && !results.results?.publisher?.setupRequired ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200')}`}>
              <div className="text-2xl mb-1">📱</div>
              <div className="font-bold text-sm mb-1">{results.results?.publisher?.summary || 'لم ينفذ'}</div>
              {results.results?.publisher?.tiktok?.postId && <div className="text-xs text-gray-500">Post ID: {results.results.publisher.tiktok.postId}</div>}
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-bold mb-2">📝 التقرير النصي:</h3>
            <div className="bg-gray-50 rounded-lg p-4 whitespace-pre-wrap text-sm leading-relaxed" style={{ direction: 'rtl' }}>
              {results.results?.reporter?.formattedMessage || results.results?.reporter?.aiSummary || 'لا يوجد تقرير'}
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button onClick={() => { setResults(null); setLogs([]); setPipelineStatus(null); }} className="btn-secondary text-sm">🔄 تصفير</button>
            <button onClick={() => { const text = results.results?.reporter?.formattedMessage || JSON.stringify(results, null, 2); navigator.clipboard.writeText(text); }} className="btn-secondary text-sm">📋 نسخ</button>
          </div>
        </div>
      )}
    </div>
  );
}
