import { useState, useEffect } from 'react';
import { getAllNotifications, updateNotification, deleteNotification } from '../api/notificationApi';

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllNotifications().then(res => { setNotifs(res.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const markRead = async (n) => {
    try {
      await updateNotification(n.id, { ...n, read: true });
      setNotifs(notifs.map(x => x.id === n.id ? { ...x, read: true } : x));
    } catch {}
  };

  const handleDelete = async (id) => {
    try { await deleteNotification(id); setNotifs(notifs.filter(n => n.id !== id)); } catch {}
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1>Notifications</h1><p>Stay updated with your learning activities</p></div>
      {notifs.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          <h3>No notifications</h3><p>You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {notifs.map(n => (
            <div key={n.id} className={`notification-item ${!n.read ? 'unread' : ''}`} onClick={() => markRead(n)}>
              {!n.read && <div className="notification-dot" />}
              <div className="notification-body" style={{ flex: 1 }}>
                <h4>{n.title}</h4>
                <p>{n.message}</p>
              </div>
              <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }} style={{ flexShrink: 0 }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
