import React, { useState, useEffect } from 'react';

export default function Tasks({ api }) {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'custom', priority: 'medium', params: '{}' });

  useEffect(() => { loadTasks(); }, []);

  async function loadTasks() {
    const res = await fetch(`${api}/tasks`);
    const d = await res.json();
    if (d.success) setTasks(d.tasks);
  }

  async function createTask() {
    const res = await fetch(`${api}/tasks`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, params: JSON.parse(form.params || '{}') }),
    });
    const d = await res.json();
    if (d.success) { setShowForm(false); loadTasks(); }
  }

  async function executeTask(id) {
    await fetch(`${api}/tasks/${id}/execute`, { method: 'POST' });
    loadTasks();
  }

  async function deleteTask(id) {
    await fetch(`${api}/tasks/${id}`, { method: 'DELETE' });
    loadTasks();
  }

  const statusColors = { completed: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700', pending: 'bg-yellow-100 text-yellow-700', running: 'bg-blue-100 text-blue-700' };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">المهام</h1>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? 'إلغاء' : '➕ مهمة جديدة'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input placeholder="عنوان المهمة" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              <option value="custom">مخصص</option>
              <option value="video_edit">تعديل فيديو</option>
              <option value="email_send">إرسال بريد</option>
              <option value="email_register">تسجيل في موقع</option>
              <option value="tiktok_upload">رفع تيك توك</option>
              <option value="whatsapp_send">رسالة واتساب</option>
              <option value="campaign_analyze">تحليل حملة</option>
              <option value="contentrewards">ContentRewards</option>
            </select>
            <textarea placeholder="وصف المهمة" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="md:col-span-2" rows={2} />
            <textarea placeholder="المعطيات (JSON)" value={form.params} onChange={e => setForm({ ...form, params: e.target.value })} className="md:col-span-2 font-mono text-sm" rows={2} />
            <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
              <option value="low">منخفضة</option><option value="medium">متوسطة</option><option value="high">عالية</option>
            </select>
          </div>
          <button onClick={createTask} className="btn-primary mt-4">إنشاء المهمة</button>
        </div>
      )}

      <div className="space-y-3">
        {tasks.map(t => (
          <div key={t.id} className="card flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[t.status] || 'bg-gray-100'}`}>{t.status}</span>
                <span className="font-bold">{t.title}</span>
                {t.type && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{t.type}</span>}
              </div>
              <p className="text-sm text-gray-500">{t.description}</p>
            </div>
            <div className="flex gap-2">
              {t.status === 'pending' && <button onClick={() => executeTask(t.id)} className="btn-primary text-sm">تشغيل</button>}
              <button onClick={() => deleteTask(t.id)} className="btn-secondary text-sm">🗑️</button>
            </div>
          </div>
        ))}
        {!tasks.length && <p className="text-center text-gray-400 py-12">لا توجد مهام. أنشئ مهمة جديدة!</p>}
      </div>
    </div>
  );
}
