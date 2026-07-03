import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const API = import.meta.env.VITE_API_URL || '/api';

// Pages
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Videos from './pages/Videos';
import Telegram from './pages/Telegram';
import Email from './pages/Email';
import TikTok from './pages/TikTok';
import ContentRewards from './pages/ContentRewards';
import Agents from './pages/Agents';
import Settings from './pages/Settings';

const icons = {
  dashboard: '📊', tasks: '📋', videos: '🎬', telegram: '🤖',
  email: '📧', tiktok: '🎵',   rewards: '🏆', agents: '🤖', settings: '⚙️',
};

const pages = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: icons.dashboard },
  { id: 'tasks', label: 'المهام', icon: icons.tasks },
  { id: 'videos', label: 'الفيديو', icon: icons.videos },
  { id: 'telegram', label: 'تلجرام', icon: icons.telegram },
  { id: 'email', label: 'البريد', icon: icons.email },
  { id: 'tiktok', label: 'تيك توك', icon: icons.tiktok },
  { id: 'rewards', label: 'ContentRewards', icon: icons.rewards },
  { id: 'agents', label: 'الوكلاء', icon: icons.agents },
  { id: 'settings', label: 'الإعدادات', icon: icons.settings },
];

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [socket, setSocket] = useState(null);
  const [notif, setNotif] = useState(null);

  useEffect(() => {
    const s = io(import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : undefined);
    s.on('connect', () => console.log('Socket connected'));
    s.on('report', (msg) => setNotif({ type: 'report', message: msg }));
    setSocket(s);
    checkAuth();
    return () => s.close();
  }, []);

  async function checkAuth() {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await fetch(`${API}/auth/status`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setAuthenticated(data.authenticated);
    } catch {}
  }

  async function handleLogin() {
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem('token', data.token);
      setAuthenticated(true);
    } else {
      alert('كلمة المرور غير صحيحة');
    }
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-500 to-primary-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">🤖</div>
            <h1 className="text-3xl font-bold text-gray-800">AI Wakeel</h1>
            <p className="text-gray-500 mt-2">الوكيل الذكي المتكامل</p>
          </div>
          <input
            type="password" placeholder="كلمة المرور" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="text-center text-lg mb-4"
            autoFocus
          />
          <button onClick={handleLogin} className="btn-primary w-full text-lg py-3">
            دخول
          </button>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard api={API} socket={socket} />;
      case 'tasks': return <Tasks api={API} />;
      case 'videos': return <Videos api={API} />;
      case 'telegram': return <Telegram api={API} />;
      case 'email': return <Email api={API} />;
      case 'tiktok': return <TikTok api={API} />;
      case 'rewards': return <ContentRewards api={API} />;
      case 'agents': return <Agents api={API} socket={socket} />;
      case 'settings': return <Settings api={API} />;
      default: return <Dashboard api={API} socket={socket} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white border-l border-gray-200 p-4 flex flex-col">
        <div className="text-center mb-6 pb-4 border-b border-gray-100">
          <div className="text-3xl mb-1">🤖</div>
          <h2 className="font-bold text-gray-800">AI Wakeel</h2>
          <p className="text-xs text-gray-400">الوكيل الذكي</p>
        </div>
        <nav className="flex-1 space-y-1">
          {pages.map(p => (
            <button key={p.id} onClick={() => setPage(p.id)}
              className={`sidebar-link w-full text-right ${page === p.id ? 'active' : ''}`}>
              <span>{p.icon}</span>
              <span>{p.label}</span>
            </button>
          ))}
        </nav>
        <div className="pt-4 border-t border-gray-100">
          <button onClick={() => { localStorage.removeItem('token'); setAuthenticated(false); }}
            className="sidebar-link w-full text-right text-red-500 hover:bg-red-50">
            <span>🚪</span><span>خروج</span>
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        {notif && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-primary-500 text-white px-6 py-3 rounded-xl shadow-lg z-50 animate-bounce"
            onClick={() => setNotif(null)}>
            {notif.message}
          </div>
        )}
        {renderPage()}
      </main>
    </div>
  );
}
