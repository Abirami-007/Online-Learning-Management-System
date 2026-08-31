import { useState, useEffect } from 'react';
import { getAllDiscussions, createDiscussion } from '../api/discussionApi';

export default function DiscussionsPage() {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });

  useEffect(() => {
    getAllDiscussions().then(res => { setDiscussions(res.data || []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const res = await createDiscussion({ ...form, user: { id: 1 }, lesson: { id: 1 } });
      setDiscussions([res.data, ...discussions]);
      setForm({ title: '', content: '' });
      setShowForm(false);
    } catch {}
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div className="page-header" style={{ marginBottom: 0 }}><h1>Discussions</h1><p>Collaborate and learn with your peers</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>+ New Discussion</button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card" style={{ marginBottom: '24px' }}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input type="text" className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Discussion title" />
          </div>
          <div className="form-group">
            <label className="form-label">Content</label>
            <textarea className="form-textarea" required value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="What would you like to discuss?" />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" className="btn btn-primary btn-sm">Post Discussion</button>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {discussions.length === 0 ? (
        <div className="empty-state"><h3>No discussions yet</h3><p>Start a conversation!</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {discussions.map(d => (
            <div key={d.id} className="card">
              <h3 style={{ fontWeight: 600, marginBottom: '8px' }}>{d.title}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '12px' }}>{d.content}</p>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {d.user && <span>By {d.user.fullName || d.user.email}</span>}
                {d.lesson && <span>Lesson: {d.lesson.title}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
