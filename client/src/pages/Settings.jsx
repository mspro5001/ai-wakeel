import React, { useState, useEffect } from 'react';

export default function Settings({ api }) {
  const [health, setHealth] = useState(null);
  const [emailPass, setEmailPass] = useState('');
  const [nvidiaKey, setNvidiaKey] = useState('');
  const [crUser, setCrUser] = useState('');
  const [crPass, setCrPass] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    fetch(`${api}/dashboard/system-health`).then(r => r.json()).then(d => d.success && setHealth(d.status));
  }, []);

  function saveSettings() {
    localStorage.setItem('wakeel_settings', JSON.stringify({
      emailPass, nvidiaKey, crUser, crPass, adminPass,
    }));
    setSaved('✅ تم حفظ الإعدادات محلياً. انقلها إلى ملف .env للإنتاج.');
    setTimeout(() => setSaved(''), 3000);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">⚙️ الإعدادات</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-bold mb-4">الإعدادات الأساسية</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gmail App Password</label>
              <input type="password" placeholder="أدخل App Password" value={emailPass} onChange={e => setEmailPass(e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">فعّل من <a className="text-primary-500" href="https://myaccount.google.com/apppasswords" target="_blank">myaccount.google.com/apppasswords</a></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NVIDIA NIM API Key</label>
              <input type="password" placeholder="nvapi-..." value={nvidiaKey} onChange={e => setNvidiaKey(e.target.value)} />
              <p className="text-xs text-gray-400 mt-1">احصل على مفتاح مجاني من <a className="text-primary-500" href="https://build.nvidia.com" target="_blank">build.nvidia.com</a></p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ContentRewards - اسم المستخدم</label>
              <input type="text" value={crUser} onChange={e => setCrUser(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ContentRewards - كلمة المرور</label>
              <input type="password" value={crPass} onChange={e => setCrPass(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">كلمة مرور لوحة التحكم</label>
              <input type="password" value={adminPass} onChange={e => setAdminPass(e.target.value)} />
            </div>
            <button onClick={saveSettings} className="btn-primary w-full">💾 حفظ الإعدادات</button>
            {saved && <p className="text-green-600 text-sm">{saved}</p>}
          </div>
        </div>
        <div className="card">
          <h2 className="font-bold mb-4">حالة النظام</h2>
          {health && Object.entries(health).map(([key, val]) => (
            <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg mb-2">
              <span className="font-medium">{key}</span>
              <span className={`px-3 py-1 rounded-full text-sm ${val ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {val ? '✅ مفعل' : '⏳ غير مفعل'}
              </span>
            </div>
          ))}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-700 mb-2">📋 قائمة تفعيل الحسابات</h3>
            <ol className="text-sm text-blue-600 space-y-2 list-decimal mr-4">
              <li><strong>Gmail App Password</strong> - myaccount.google.com/apppasswords</li>
              <li><strong>NVIDIA NIM</strong> - build.nvidia.com (مجاني)</li>
              <li><strong>WhatsApp Business</strong> - business.whatsapp.com</li>
              <li><strong>TikTok Developer</strong> - developers.tiktok.com</li>
              <li><strong>ContentRewards</strong> - contentrewards.com</li>
              <li><strong>Render</strong> - render.com (استضافة مجانية)</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
