import React, { useState, useEffect, useRef } from 'react';

const agents = [
  { id: 'scout',     label: 'وكيل الاستكشاف',     icon: '🔍', color: 'blue' },
  { id: 'legal',     label: 'وكيل الشروط',         icon: '⚖️', color: 'amber' },
  { id: 'publisher', label: 'وكيل النشر',          icon: '📱', color: 'purple' },
  { id: 'reporter',  label: 'وكيل التلخيص',        icon: '📊', color: 'green' },
];

const agentPalette = {
  blue:   { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', ring: 'ring-blue-400', btn: 'bg-blue-500 hover:bg-blue-600' },
  amber:  { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', ring: 'ring-amber-400', btn: 'bg-amber-500 hover:bg-amber-600' },
  purple: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', ring: 'ring-purple-400', btn: 'bg-purple-500 hover:bg-purple-600' },
  green:  { bg: 'bg-green-50 border-green-200', text: 'text-green-700', ring: 'ring-green-400', btn: 'bg-green-500 hover:bg-green-600' },
};

const statusIcon = { completed: '✅', failed: '❌', running: '⚡', pending: '⏳', idle: '💤' };

export default function Dashboard({ api, socket }) {
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [campaignFilter, setCampaignFilter] = useState('all');
  const [health, setHealth] = useState(null);
  const [activity, setActivity] = useState([]);
  const [pipelineRunning, setPipelineRunning] = useState(false);
  const [agentStatus, setAgentStatus] = useState({ scout: 'idle', legal: 'idle', publisher: 'idle', reporter: 'idle' });
  const [pipelineResult, setPipelineResult] = useState(null);
  const [pipelineLogs, setPipelineLogs] = useState([]);
  const [tab, setTab] = useState('overview');
  const [videoPath, setVideoPath] = useState('');
  const [caption, setCaption] = useState('');
  const [campaignLink, setCampaignLink] = useState('');
  const logEnd = useRef(null);

  const refresh = () => {
    fetch(`${api}/dashboard/stats`).then(r => r.json()).then(d => d.success && setStats(d.stats));
    fetch(`${api}/dashboard/recent-tasks`).then(r => r.json()).then(d => d.success && setTasks(d.tasks));
    fetch(`${api}/dashboard/activity`).then(r => r.json()).then(d => d.success && setActivity(d.activity));
    fetch(`${api}/dashboard/system-health`).then(r => r.json()).then(d => d.success && setHealth(d));
    fetch(`${api}/dashboard/campaigns?filter=${campaignFilter}`).then(r => r.json()).then(d => d.success && setCampaigns(d.campaigns));
  };

  useEffect(() => { refresh(); const iv = setInterval(refresh, 5000); return () => clearInterval(iv); }, [campaignFilter]);

  useEffect(() => {
    if (!socket) return;
    const handler = (data) => {
      setPipelineLogs(p => [...p, { time: new Date().toLocaleTimeString(), ...data }]);
      if (data.stage === 'starting') setPipelineRunning(true);
      if (data.stage === 'scout' || data.stage === 'scout_done') setAgentStatus(a => ({ ...a, scout: data.stage === 'scout_done' ? 'completed' : 'running' }));
      if (data.stage === 'legal' || data.stage === 'legal_done') setAgentStatus(a => ({ ...a, legal: data.stage === 'legal_done' ? 'completed' : 'running' }));
      if (data.stage === 'publisher' || data.stage === 'publisher_done') setAgentStatus(a => ({ ...a, publisher: data.stage === 'publisher_done' ? 'completed' : 'running' }));
      if (data.stage === 'reporter' || data.stage === 'reporter_done') setAgentStatus(a => ({ ...a, reporter: data.stage === 'reporter_done' ? 'completed' : 'running' }));
      if (data.stage === 'complete' || data.stage === 'failed' || data.stage === 'no_campaigns') {
        setPipelineRunning(false); refresh();
      }
    };
    socket.on('pipeline_update', handler);
    return () => socket.off('pipeline_update', handler);
  }, [socket]);

  useEffect(() => { logEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [pipelineLogs]);

  async function runPipeline() {
    setPipelineRunning(true);
    setAgentStatus({ scout: 'running', legal: 'idle', publisher: 'idle', reporter: 'idle' });
    setPipelineLogs([{ stage: 'starting', message: '🚀 بدء pipeline...' }]);
    setPipelineResult(null);
    try {
      const res = await fetch(`${api}/dashboard/run-pipeline`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoPath: videoPath || null, caption: caption || null, campaignLink: campaignLink || null }),
      });
      const data = await res.json();
      setPipelineResult(data);
      refresh();
    } catch (err) {
      setPipelineLogs(p => [...p, { stage: 'error', message: `❌ ${err.message}` }]);
    }
  }

  async function runSingleAgent(agentId) {
    setAgentStatus(a => ({ ...a, [agentId]: 'running' }));
    try {
      const res = await fetch(`${api}/dashboard/run-agent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentName: agentId, params: {} }),
      });
      const data = await res.json();
      setAgentStatus(a => ({ ...a, [agentId]: data.success ? 'completed' : 'failed' }));
      setPipelineLogs(p => [...p, { stage: agentId, message: `${agents.find(a => a.id === agentId).icon} ${data.summary || (data.success ? 'تم' : 'فشل')}` }]);
      setTimeout(() => refresh(), 500);
    } catch {
      setAgentStatus(a => ({ ...a, [agentId]: 'failed' }));
    }
  }

  const statCards = stats ? [
    { label: 'المهام',     value: stats.totalTasks,   icon: '📋', color: 'blue' },
    { label: 'قيد التشغيل', value: stats.runningTasks,  icon: '⚡', color: 'yellow' },
    { label: 'مكتملة',     value: stats.completedTasks, icon: '✅', color: 'green' },
    { label: 'فاشلة',      value: stats.failedTasks,    icon: '❌', color: 'red' },
    { label: 'فيديوهات',   value: stats.totalVideos,    icon: '🎬', color: 'purple' },
    { label: 'حملات',      value: stats.totalCampaigns, icon: '🏆', color: 'indigo' },
    { label: 'حلال',       value: stats.halal,          icon: '✅', color: 'green' },
    { label: 'حرام',       value: stats.haram,          icon: '⛔', color: 'red' },
    { label: 'تيك توك',    value: stats.tiktokPosts,    icon: '🎵', color: 'pink' },
  ] : [];

  return (
    <div className="space-y-6" style={{ direction: 'rtl' }}>
      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {['overview', 'pipeline', 'campaigns', 'activity', 'settings'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t ? 'bg-primary-500 text-white shadow' : 'text-gray-600 hover:bg-gray-100'}`}>
            {t === 'overview' && '📊'}{t === 'pipeline' && '🤖'}{t === 'campaigns' && '🏆'}{t === 'activity' && '📝'}{t === 'settings' && '⚙️'}
            {' '}{{ overview: 'نظرة عامة', pipeline: 'الوكلاء', campaigns: 'الحملات', activity: 'النشاط', settings: 'الإعدادات' }[t]}
          </button>
        ))}
      </div>

      {/* ===================== OVERVIEW TAB ===================== */}
      {tab === 'overview' && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {statCards.map(s => (
              <div key={s.label} className="card text-center py-4">
                <div className="text-2xl">{s.icon}</div>
                <div className="stat-value text-xl">{s.value}</div>
                <div className="stat-label text-xs">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Agent status cards + run buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {agents.map(a => {
              const p = agentPalette[a.color];
              const status = agentStatus[a.id];
              return (
                <div key={a.id} className={`card border-2 ${status === 'running' ? p.ring + ' ring-2' : ''} ${p.bg}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{a.icon}</span>
                      <span className="font-bold text-sm">{a.label}</span>
                    </div>
                    <span className="text-lg">{statusIcon[status] || '💤'}</span>
                  </div>
                  <div className="text-xs text-gray-500 mb-3">
                    {status === 'completed' ? '✅ آخر تشغيل ناجح' : status === 'failed' ? '❌ فشل آخر تشغيل' : status === 'running' ? '⚡ قيد التشغيل...' : '💤 في الانتظار'}
                  </div>
                  <button onClick={() => runSingleAgent(a.id)} disabled={status === 'running' || pipelineRunning}
                    className={`${p.btn} text-white px-3 py-1.5 rounded-lg text-xs w-full font-medium disabled:opacity-50 transition-all`}>
                    {status === 'running' ? '⏳ جاري...' : `▶ تشغيل ${a.label}`}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Recent tasks */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">📋 آخر المهام</h2>
              <button onClick={refresh} className="btn-secondary text-xs py-1 px-3">🔄 تحديث</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b text-gray-500 text-xs">
                  <th className="py-2 text-right">الحالة</th><th className="py-2 text-right">العنوان</th><th className="py-2 text-right">النوع</th><th className="py-2 text-right">التاريخ</th>
                </tr></thead>
                <tbody>
                  {tasks.map(t => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2">{statusIcon[t.status] || '⚪'}</td>
                      <td className="py-2 font-medium">{t.title}</td>
                      <td className="py-2 text-gray-500 text-xs">{t.type}</td>
                      <td className="py-2 text-gray-400 text-xs">{new Date(t.created_at).toLocaleString('ar-SA')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!tasks.length && <p className="text-gray-400 text-center py-4">لا توجد مهام بعد</p>}
            </div>
          </div>
        </>
      )}

      {/* ===================== PIPELINE TAB ===================== */}
      {tab === 'pipeline' && (
        <>
          {/* All agents row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {agents.map((a, i) => {
              const p = agentPalette[a.color];
              const status = agentStatus[a.id];
              return (
                <div key={a.id} className={`text-center p-4 rounded-xl border-2 transition-all ${status === 'running' ? p.ring + ' ring-2 shadow-lg' : ''} ${p.bg}`}>
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <span className="text-xl">{a.icon}</span>
                    {i < 3 && <span className="text-gray-300 text-lg">←</span>}
                  </div>
                  <div className="font-bold text-xs mb-1">{a.label}</div>
                  <div className="text-lg">{statusIcon[status] || '💤'}</div>
                </div>
              );
            })}
          </div>

          {/* Control panel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="font-bold mb-4">🚀 تشغيل الـ pipeline</h2>
              <div className="space-y-3">
                <input placeholder="مسار الفيديو (اختياري)" value={videoPath} onChange={e => setVideoPath(e.target.value)} disabled={pipelineRunning} />
                <textarea placeholder="نص الكابتشن (اختياري)" value={caption} onChange={e => setCaption(e.target.value)} rows={2} disabled={pipelineRunning} />
                <input placeholder="رابط الحملة (اختياري)" value={campaignLink} onChange={e => setCampaignLink(e.target.value)} disabled={pipelineRunning} />
                <button onClick={runPipeline} disabled={pipelineRunning}
                  className="btn-primary w-full text-lg py-3 disabled:opacity-50">
                  {pipelineRunning ? '⏳ جاري تشغيل الوكلاء الأربعة...' : '🚀 تشغيل pipeline'}
                </button>
              </div>

              {pipelineResult && (
                <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                  <h3 className="font-bold mb-2">📊 نتيجة الـ pipeline</h3>
                  <div className="text-sm whitespace-pre-wrap" style={{ direction: 'rtl' }}>
                    {pipelineResult.summary}
                  </div>
                  {pipelineResult.results?.reporter?.formattedMessage && (
                    <div className="mt-3 p-3 bg-white rounded-lg border text-sm whitespace-pre-wrap leading-relaxed">
                      {pipelineResult.results.reporter.formattedMessage}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="font-bold mb-4">📋 سجل التنفيذ</h2>
              <div className="h-72 overflow-y-auto space-y-1.5" style={{ direction: 'rtl' }}>
                {pipelineLogs.map((log, i) => {
                  const stageColor = { starting: 'blue', scout: 'blue', legal: 'amber', publisher: 'purple', reporter: 'green', complete: 'green', failed: 'red', error: 'red', no_campaigns: 'yellow' };
                  const c = stageColor[log.stage] || 'gray';
                  return (
                    <div key={i} className={`text-xs p-2 rounded-lg bg-${c}-50 border border-${c}-200 text-${c}-700`}>
                      <span className="opacity-60 ml-1">{log.time}</span>
                      {log.message}
                    </div>
                  );
                })}
                <div ref={logEnd} />
              </div>
              <button onClick={() => { setPipelineLogs([]); setPipelineResult(null); setAgentStatus({ scout: 'idle', legal: 'idle', publisher: 'idle', reporter: 'idle' }); }}
                className="btn-secondary text-xs mt-2 w-full">🔄 تصفير السجل</button>
            </div>
          </div>

          {/* Run single agents */}
          <div className="card">
            <h2 className="font-bold mb-4">▶ تشغيل وكيل واحد</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {agents.map(a => {
                const p = agentPalette[a.color];
                return (
                  <button key={a.id} onClick={() => runSingleAgent(a.id)}
                    disabled={agentStatus[a.id] === 'running' || pipelineRunning}
                    className={`${p.btn} text-white px-4 py-3 rounded-xl text-sm font-medium disabled:opacity-50 transition-all`}>
                    {a.icon} {a.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ===================== CAMPAIGNS TAB ===================== */}
      {tab === 'campaigns' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h2 className="font-bold text-lg">🏆 الحملات</h2>
            <div className="flex gap-2">
              {['all', 'halal', 'haram', 'approved'].map(f => (
                <button key={f} onClick={() => setCampaignFilter(f)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${campaignFilter === f ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {{ all: 'الكل', halal: 'حلال ✅', haram: 'حرام ⛔', approved: 'معتمد' }[f]}
                </button>
              ))}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-gray-500 text-xs">
                <th className="py-2 text-right">الاسم</th><th className="py-2 text-right">الحالة</th><th className="py-2 text-right">التقييم</th><th className="py-2 text-right">التاريخ</th>
              </tr></thead>
              <tbody>
                {campaigns.map(c => (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-2 font-medium">{c.campaign_name}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        c.status === 'halal' || c.status === 'halal_approved' ? 'bg-green-100 text-green-700' :
                        c.status === 'linked_to_tiktok' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>{c.status}</span>
                    </td>
                    <td className="py-2">{c.compliance_score > 0 ? `${c.compliance_score}/100` : '-'}</td>
                    <td className="py-2 text-gray-400 text-xs">{new Date(c.created_at).toLocaleString('ar-SA')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!campaigns.length && <p className="text-gray-400 text-center py-4">لا توجد حملات بعد</p>}
          </div>
        </div>
      )}

      {/* ===================== ACTIVITY TAB ===================== */}
      {tab === 'activity' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-bold mb-4">📝 النشاط الأخير</h2>
            <div className="h-80 overflow-y-auto space-y-2">
              {activity.map((a, i) => (
                <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-xs">
                  <span className="text-gray-400">{new Date(a.created_at).toLocaleString('ar-SA')}</span>
                  <span className={`px-2 py-0.5 rounded-full ${a.level === 'error' || a.status === 'failed' ? 'bg-red-100 text-red-600' : a.level === 'warn' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                    {a.level || a.status}
                  </span>
                  <span className="font-medium">{a.message || a.title}</span>
                </div>
              ))}
              {!activity.length && <p className="text-gray-400 text-center py-4">لا نشاط بعد</p>}
            </div>
          </div>
          <div className="card">
            <h2 className="font-bold mb-4">⚙️ حالة النظام</h2>
            <div className="space-y-3">
              {health && Object.entries(health.status || health).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-sm">{key}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${val ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {val ? '✅ مفعل' : '❌ غير مفعل'}
                  </span>
                </div>
              ))}
            </div>
            <button onClick={refresh} className="btn-secondary w-full mt-4 text-sm">🔄 تحديث الحالة</button>
          </div>
        </div>
      )}

      {/* ===================== SETTINGS TAB ===================== */}
      {tab === 'settings' && (
        <div className="card">
          <h2 className="font-bold text-lg mb-4">⚙️ إعدادات سريعة</h2>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <h3 className="font-bold text-sm mb-2">🔔 تنبيهات</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="rounded" /> إرسال تقرير تيليجرام بعد كل pipeline</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" defaultChecked className="rounded" /> تحديث تلقائي كل 5 ثوان</label>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <h3 className="font-bold text-sm mb-2">🔄 إجراءات سريعة</h3>
              <div className="flex flex-wrap gap-2">
                <button onClick={refresh} className="btn-primary text-sm">🔄 تحديث الكل</button>
                <button onClick={() => { setPipelineLogs([]); setPipelineResult(null); }} className="btn-secondary text-sm">🧹 مسح سجل التنفيذ</button>
                <button onClick={() => { fetch(`${api}/tasks`, { method: 'DELETE' }).then(refresh); }} className="btn-secondary text-sm text-red-600">🗑️ حذف جميع المهام</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
