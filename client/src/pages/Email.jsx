import React, { useState } from 'react';

export default function Email({ api }) {
  const [tab, setTab] = useState('send');
  const [sendForm, setSendForm] = useState({ to: '', subject: '', text: '' });
  const [regForm, setRegForm] = useState({ url: '', email: '', password: '', name: '' });
  const [inbox, setInbox] = useState([]);
  const [result, setResult] = useState(null);

  async function sendEmail() {
    const res = await fetch(`${api}/email/send`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sendForm),
    });
    setResult(await res.json());
  }

  async function fetchInbox() {
    const res = await fetch(`${api}/email/inbox`);
    const d = await res.json();
    if (d.success) setInbox(d.emails);
  }

  async function registerSite() {
    const res = await fetch(`${api}/email/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(regForm),
    });
    setResult(await res.json());
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">📧 البريد الإلكتروني</h1>
      <div className="flex gap-2 mb-6">
        {['send', 'inbox', 'register'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg transition-colors ${tab === t ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {t === 'send' ? 'إرسال' : t === 'inbox' ? 'الوارد' : 'تسجيل في موقع'}
          </button>
        ))}
      </div>

      {tab === 'send' && (
        <div className="card max-w-xl">
          <input placeholder="إلى (البريد الإلكتروني)" value={sendForm.to} onChange={e => setSendForm({ ...sendForm, to: e.target.value })} className="mb-3" />
          <input placeholder="الموضوع" value={sendForm.subject} onChange={e => setSendForm({ ...sendForm, subject: e.target.value })} className="mb-3" />
          <textarea placeholder="نص الرسالة" value={sendForm.text} onChange={e => setSendForm({ ...sendForm, text: e.target.value })} rows={6} className="mb-3" />
          <button onClick={sendEmail} className="btn-primary">إرسال</button>
          {result && <p className={`mt-3 ${result.success ? 'text-green-600' : 'text-red-600'}`}>{result.success ? `✅ أرسلت إلى ${result.to}` : `❌ ${result.error}`}</p>}
        </div>
      )}

      {tab === 'inbox' && (
        <div>
          <button onClick={fetchInbox} className="btn-primary mb-4">📩 جلب البريد الوارد</button>
          <div className="space-y-2">
            {inbox.map((m, i) => (
              <div key={i} className="card">
                <p className="font-bold">{m.subject || 'بدون موضوع'}</p>
                <p className="text-sm text-gray-500">من: {m.from}</p>
                <p className="text-sm text-gray-400 mt-1">{m.text?.slice(0, 200)}</p>
              </div>
            ))}
            {!inbox.length && <p className="text-gray-400 text-center py-8">لا توجد رسائل جديدة</p>}
          </div>
        </div>
      )}

      {tab === 'register' && (
        <div className="card max-w-xl">
          <input placeholder="رابط الموقع" value={regForm.url} onChange={e => setRegForm({ ...regForm, url: e.target.value })} className="mb-3" />
          <input placeholder="البريد الإلكتروني للتسجيل" value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} className="mb-3" />
          <input placeholder="كلمة المرور" type="password" value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} className="mb-3" />
          <button onClick={registerSite} className="btn-primary">تسجيل تلقائي</button>
          {result && <p className={`mt-3 ${result.success ? 'text-green-600' : 'text-red-600'}`}>{result.success ? `✅ تم التسجيل في ${result.url}` : `❌ ${result.error}`}</p>}
        </div>
      )}
    </div>
  );
}
