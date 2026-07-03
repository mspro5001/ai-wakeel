import React, { useState, useEffect } from 'react';

export default function ContentRewards({ api }) {
  const [tab, setTab] = useState('dashboard');
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState(null);
  const [analysisText, setAnalysisText] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [checkResult, setCheckResult] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchStats(); fetchCampaigns(); }, []);

  async function fetchStats() {
    const res = await fetch(`${api}/rewards/stats`);
    const d = await res.json();
    if (d.success) setStats(d.stats);
  }

  async function fetchCampaigns() {
    const res = await fetch(`${api}/rewards/campaigns?filter=${filter}`);
    const d = await res.json();
    if (d.success) setCampaigns(d.campaigns);
  }

  async function checkNow() {
    setCheckResult({ loading: true });
    const res = await fetch(`${api}/rewards/check`, { method: 'POST' });
    const d = await res.json();
    setCheckResult(d);
    fetchStats();
    fetchCampaigns();
  }

  async function analyzeText() {
    const res = await fetch(`${api}/rewards/analyze`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: analysisText }),
    });
    const d = await res.json();
    setAnalysisResult(d);
  }

  useEffect(() => { fetchCampaigns(); }, [filter]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🏆 ContentRewards</h1>

      <div className="flex gap-2 mb-6">
        {['dashboard', 'campaigns', 'analyze', 'haram-rules'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg transition-colors ${tab === t ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {t === 'dashboard' ? 'لوحة التحكم' : t === 'campaigns' ? 'الحملات' : t === 'analyze' ? 'تحليل' : 'المحرمات'}
          </button>
        ))}
      </div>

      {tab === 'dashboard' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card text-center"><div className="stat-value">{stats?.total || 0}</div><div className="stat-label">إجمالي الحملات</div></div>
            <div className="card text-center border-green-200"><div className="stat-value text-green-600">{stats?.halal || 0}</div><div className="stat-label">حلال ✅</div></div>
            <div className="card text-center border-red-200"><div className="stat-value text-red-600">{stats?.haram || 0}</div><div className="stat-label">حرام ⛔</div></div>
            <div className="card text-center"><div className="stat-value">{stats?.halalPercent || 0}%</div><div className="stat-label">نسبة الحلال</div></div>
          </div>
          <div className="card">
            <h2 className="font-bold text-lg mb-4">🔍 فحص الحملات</h2>
            <button onClick={checkNow} className="btn-primary" disabled={checkResult?.loading}>
              {checkResult?.loading ? 'جاري الفحص...' : '🚀 فحص الآن'}
            </button>
            {checkResult && !checkResult.loading && (
              <div className="mt-4 space-y-2">
                <div className="flex gap-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">✅ حلال: {checkResult.halal}</span>
                  <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full">⛔ حرام: {checkResult.haram}</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">📦 المجموع: {checkResult.total}</span>
                </div>
                {checkResult.haramDetails?.length > 0 && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg">
                    <p className="font-bold text-red-700 mb-2">⚠️ حملات مرفوضة:</p>
                    {checkResult.haramDetails.map((h, i) => (
                      <div key={i} className="text-sm text-red-600 mb-1">
                        • {h.title || 'بدون عنوان'}: {h.violations?.join(', ')}
                      </div>
                    ))}
                  </div>
                )}
                {!checkResult.success && checkResult.error && (
                  <p className="text-red-500 text-sm">{checkResult.error}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'campaigns' && (
        <div>
          <div className="flex gap-2 mb-4">
            {['all', 'halal', 'haram'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-sm ${filter === f ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}>
                {f === 'all' ? 'الكل' : f === 'halal' ? 'حلال ✅' : 'حرام ⛔'}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            {campaigns.map(c => {
              const reqs = JSON.parse(c.requirements || '{}');
              const isHaram = c.status === 'haram_rejected';
              return (
                <div key={c.id} className={`card border-r-4 ${isHaram ? 'border-red-400' : 'border-green-400'}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold">{c.campaign_name}</h3>
                      <p className="text-sm text-gray-500">{c.platform}</p>
                      <p className="text-xs text-gray-400 mt-1">{c.created_at}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${isHaram ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {isHaram ? '⛔ حرام' : '✅ حلال'} (نسبة: {c.compliance_score}%)
                    </span>
                  </div>
                  {reqs.haramCheck?.violations?.length > 0 && (
                    <div className="mt-2 p-2 bg-red-50 rounded text-sm text-red-600">
                      {reqs.haramCheck.violations.map((v, i) => <div key={i}>⚠ {v.reason}</div>)}
                    </div>
                  )}
                </div>
              );
            })}
            {!campaigns.length && <p className="text-gray-400 text-center py-8">لا توجد حملات</p>}
          </div>
        </div>
      )}

      {tab === 'analyze' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="font-bold mb-4">تحليل نص حملة</h2>
            <textarea placeholder="أدخل وصف الحملة أو شروطها للتحقق من مطابقتها للضوابط الشرعية..."
              value={analysisText} onChange={e => setAnalysisText(e.target.value)} rows={8} className="mb-3" />
            <button onClick={analyzeText} className="btn-primary">🔍 تحليل</button>
          </div>
          <div className="card">
            <h2 className="font-bold mb-4">النتيجة</h2>
            {analysisResult ? (
              <div>
                <div className={`p-4 rounded-lg mb-4 text-center text-lg font-bold ${analysisResult.isHalal ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {analysisResult.isHalal ? '✅ حلال - الحملة متوافقة' : '⛔ حرام - الحملة مرفوضة'}
                </div>
                {analysisResult.violations?.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-red-600">المخالفات:</h3>
                    {analysisResult.violations.map((v, i) => (
                      <div key={i} className="p-2 bg-red-50 rounded text-sm text-red-700">
                        <strong>{v.category}:</strong> {v.reason}
                        <div className="text-xs text-red-400 mt-1">كلمات: {v.matchedWords?.join(', ')}</div>
                      </div>
                    ))}
                  </div>
                )}
                {analysisResult.isHalal && <p className="text-green-600">✅ لا توجد مخالفات شرعية</p>}
              </div>
            ) : (
              <p className="text-gray-400">أدخل النص واضغط تحليل</p>
            )}
          </div>
        </div>
      )}

      {tab === 'haram-rules' && (
        <div className="card">
          <h2 className="font-bold text-lg mb-4">📋 أنواع المحرمات التي يتم الكشف عنها</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { cat: 'alcohol_drugs', label: 'الخمر والمخدرات', sev: 'خطير', words: 'خمر، كحول، مخدرات، سجائر...' },
              { cat: 'gambling', label: 'القمار والمراهنات', sev: 'خطير', words: 'قمار، كازينو، بوكر، رهان...' },
              { cat: 'adult_content', label: 'محتوى غير لائق', sev: 'خطير جداً', words: 'إباحي، عاري، تعارف...' },
              { cat: 'riba_usury', label: 'الربا', sev: 'خطير', words: 'ربا، فائدة، قرض بفائدة...' },
              { cat: 'haram_food', label: 'طعام غير حلال', sev: 'خطير', words: 'خنزير، غير حلال...' },
              { cat: 'sorcery', label: 'السحر والشعوذة', sev: 'خطير جداً', words: 'سحر، تنجيم، أبراج...' },
              { cat: 'blasphemy', label: 'الكفر والتجديف', sev: 'خطير جداً', words: 'سب، كفر، إلحاد...' },
              { cat: 'fraud_scam', label: 'الاحتيال والنصب', sev: 'خطير', words: 'احتيال، نصب، scam...' },
              { cat: 'music_instruments', label: 'المعازف', sev: 'مختلف فيه', words: 'آلات موسيقية، أغاني...' },
              { cat: 'imitations', label: 'التشبه المحرم', sev: 'متوسط', words: 'وشم، تشبه...' },
            ].map(r => (
              <div key={r.cat} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold">{r.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    r.sev === 'خطير جداً' ? 'bg-red-100 text-red-700' :
                    r.sev === 'خطير' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>{r.sev}</span>
                </div>
                <p className="text-xs text-gray-400">{r.words}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-700 font-medium">💡 آلية العمل:</p>
            <p className="text-sm text-blue-600 mt-1">
              عند فحص الحملات، يتحقق الوكيل تلقائياً من وجود أي كلمات أو عبارات تدل على محتوى محرم شرعاً.
              الحملات المخالفة يتم رفضها تلقائياً ولا تُدرج في قائمة الحملات المقبولة.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
