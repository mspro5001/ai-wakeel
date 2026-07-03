import React, { useState } from 'react';

export default function Telegram({ api }) {
  const [text, setText] = useState('');
  const [chatId, setChatId] = useState('');
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState(null);

  async function sendMessage() {
    const res = await fetch(`${api}/telegram/send`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, chatId: chatId || undefined }),
    });
    setResult(await res.json());
  }

  async function checkStatus() {
    const res = await fetch(`${api}/telegram/status`);
    setStatus(await res.json());
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">🤖 تلجرام</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-bold mb-4">إرسال رسالة</h2>
          <div className="space-y-4">
            <input placeholder="معرف المحادثة (اختياري - سيستخدم الافتراضي)" value={chatId} onChange={e => setChatId(e.target.value)} />
            <textarea placeholder="نص الرسالة" value={text} onChange={e => setText(e.target.value)} rows={4} />
            <button onClick={sendMessage} className="btn-primary">إرسال إلى تلجرام</button>
            {result && (
              <div className={`p-3 rounded-lg ${result.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {result.success ? '✅ تم الإرسال' : `❌ ${result.error}`}
              </div>
            )}
          </div>
        </div>
        <div className="card">
          <h2 className="font-bold mb-4">حالة البوت</h2>
          <button onClick={checkStatus} className="btn-secondary mb-4">فحص الحالة</button>
          {status && (
            <div className="space-y-2">
              {Object.entries(status).map(([k, v]) => (
                <div key={k} className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>{k}</span><span>{typeof v === 'string' ? v : v ? '✅' : '❌'}</span>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 font-medium">📌 تعليمات ربط البوت:</p>
            <ol className="text-sm text-blue-600 mt-2 space-y-1 list-decimal mr-4">
              <li>افتح تلجرام وابحث عن بوتك</li>
              <li>أرسل /start لبدء المحادثة</li>
              <li>أرسل /id لمعرفة Chat ID</li>
              <li>ضع Chat ID في الإعدادات (.env ← TELEGRAM_CHAT_ID)</li>
              <li>استخدم /help لعرض جميع الأوامر</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
