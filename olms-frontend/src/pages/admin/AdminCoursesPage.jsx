import { useState, useEffect } from 'react';
import { getAllCourses, createCourse, updateCourse, deleteCourse } from '../../api/courseApi';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: '', level: 'BEGINNER', instructor: '' });

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = () => {
    getAllCourses().then(res => { setCourses(res.data || []); setLoading(false); }).catch(() => setLoading(false));
  };

  const openCreate = () => { setEditing(null); setForm({ title: '', description: '', category: '', level: 'BEGINNER', instructor: '' }); setShowModal(true); };
  const openEdit = (c) => { setEditing(c); setForm({ title: c.title, description: c.description || '', category: c.category || '', level: c.level || 'BEGINNER', instructor: c.instructor || '' }); setShowModal(true); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await updateCourse(editing.id, form); }
      else { await createCourse(form); }
      setShowModal(false);
      loadCourses();
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this course?')) return;
    try { await deleteCourse(id); setCourses(courses.filter(c => c.id !== id)); } catch {}
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div className="page-header" style={{ marginBottom: 0 }}><h1>Manage Courses</h1><p>Create, edit, and manage all courses</p></div>
        <button className="btn btn-primary" onClick={openCreate}>+ Create Course</button>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state"><h3>No courses yet</h3><p>Create your first course to get started</p></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="data-table">
            <thead><tr><th>Title</th><th>Category</th><th>Level</th><th>Instructor</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {courses.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.title}</td>
                  <td><span className="badge badge-primary">{c.category || '—'}</span></td>
                  <td><span className="badge badge-secondary">{c.level || '—'}</span></td>
                  <td>{c.instructor || '—'}</td>
                  <td><span className={`badge ${c.published ? 'badge-success' : 'badge-warning'}`}>{c.published ? 'Published' : 'Draft'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(c)}>Edit</button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Course' : 'Create Course'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Course Title</label>
                <input type="text" className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Introduction to Programming" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Course description..." />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input type="text" className="form-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="e.g., Programming, Design, Business" />
              </div>
              <div className="form-group">
                <label className="form-label">Level</label>
                <select className="form-input" value={form.level} onChange={e => setForm({ ...form, level: e.target.value })}>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                  <option value="ALL_LEVELS">All Levels</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Instructor Name</label>
                <input type="text" className="form-input" value={form.instructor} onChange={e => setForm({ ...form, instructor: e.target.value })} placeholder="Instructor name" />
              </div>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
