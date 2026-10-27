import { useState, useEffect } from 'react';
import { getAllCourses, createCourse, updateCourse, deleteCourse } from '../../api/courseApi';
import { getModulesByCourseId } from '../../api/moduleApi';
import { getLessonsByModuleId, createLesson, updateLesson, deleteLesson } from '../../api/lessonApi';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', category: '', level: 'BEGINNER', instructor: '' });

  // Lesson Management Modal state
  const [lessonModalCourse, setLessonModalCourse] = useState(null);
  const [courseModules, setCourseModules] = useState([]);
  const [selectedModuleId, setSelectedModuleId] = useState(null);
  const [moduleLessons, setModuleLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [lessonForm, setLessonForm] = useState({ title: '', videoUrl: '', lessonOrder: 1, description: '', content: '' });
  const [lessonMessage, setLessonMessage] = useState('');


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

  // ── Lesson Management Methods ──────────────────────────────────────────────
  const openManageLessons = async (course) => {
    setLessonModalCourse(course);
    setLessonMessage('');
    setShowLessonForm(false);
    setEditingLesson(null);
    try {
      const res = await getModulesByCourseId(course.id);
      const mods = (res.data || []).sort((a, b) => (a.moduleOrder || 0) - (b.moduleOrder || 0));
      setCourseModules(mods);
      if (mods.length > 0) {
        setSelectedModuleId(mods[0].id);
        loadModuleLessons(mods[0].id);
      } else {
        setSelectedModuleId(null);
        setModuleLessons([]);
      }
    } catch {
      setCourseModules([]);
      setModuleLessons([]);
    }
  };

  const loadModuleLessons = async (mid) => {
    if (!mid) return;
    setLoadingLessons(true);
    try {
      const res = await getLessonsByModuleId(mid);
      const sorted = (res.data || []).sort((a, b) => (a.lessonOrder || 0) - (b.lessonOrder || 0));
      setModuleLessons(sorted);
    } catch {
      setModuleLessons([]);
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleSelectModule = (mid) => {
    setSelectedModuleId(mid);
    setShowLessonForm(false);
    setEditingLesson(null);
    loadModuleLessons(mid);
  };

  const openAddLesson = () => {
    setEditingLesson(null);
    setLessonForm({
      title: '',
      videoUrl: '',
      lessonOrder: moduleLessons.length + 1,
      description: '',
      content: ''
    });
    setLessonMessage('');
    setShowLessonForm(true);
  };

  const openEditLesson = (lesson) => {
    setEditingLesson(lesson);
    setLessonForm({
      title: lesson.title || '',
      videoUrl: lesson.videoUrl || lesson.video_url || '',
      lessonOrder: lesson.lessonOrder || 1,
      description: lesson.description || '',
      content: lesson.content || ''
    });
    setLessonMessage('');
    setShowLessonForm(true);
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (!selectedModuleId) return;
    try {
      const payload = {
        ...lessonForm,
        videoUrl: lessonForm.videoUrl ? lessonForm.videoUrl.trim() : '',
        video_url: lessonForm.videoUrl ? lessonForm.videoUrl.trim() : '',
        lessonOrder: Number(lessonForm.lessonOrder) || 1,
        module: { id: selectedModuleId }
      };

      if (editingLesson) {
        await updateLesson(editingLesson.id, payload);
        setLessonMessage(`✓ Lesson "${payload.title}" updated successfully! Video URL saved.`);
      } else {
        await createLesson(payload);
        setLessonMessage(`✓ Lesson "${payload.title}" created successfully with video!`);
      }
      setShowLessonForm(false);
      loadModuleLessons(selectedModuleId);
    } catch (err) {
      setLessonMessage('Failed to save lesson. Please verify your inputs.');
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;
    try {
      await deleteLesson(lessonId);
      loadModuleLessons(selectedModuleId);
    } catch {}
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
                      <button className="btn btn-sm btn-info" onClick={() => openManageLessons(c)}>Lessons</button>
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

      {/* Lesson Management Modal */}
      {lessonModalCourse && (
        <div className="modal-overlay" onClick={() => setLessonModalCourse(null)}>
          <div className="modal-content" style={{ maxWidth: '820px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Manage Lessons — {lessonModalCourse.title}</h2>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Add, edit, or configure lesson videos and content</p>
              </div>
              <button className="modal-close" onClick={() => setLessonModalCourse(null)}>✕</button>
            </div>

            {/* Select module */}
            <div style={{ marginBottom: '18px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontWeight: 600, fontSize: '0.9rem' }}>Select Module:</label>
              {courseModules.length === 0 ? (
                <span style={{ color: 'var(--text-muted)' }}>No modules found for this course.</span>
              ) : (
                <select
                  className="form-input"
                  style={{ maxWidth: '340px' }}
                  value={selectedModuleId || ''}
                  onChange={e => handleSelectModule(Number(e.target.value))}>
                  {courseModules.map((m, idx) => (
                    <option key={m.id} value={m.id}>
                      Module {idx + 1}: {m.title}
                    </option>
                  ))}
                </select>
              )}
              {selectedModuleId && !showLessonForm && (
                <button className="btn btn-sm btn-primary" onClick={openAddLesson} style={{ marginLeft: 'auto' }}>
                  + Add Lesson
                </button>
              )}
            </div>

            {lessonMessage && (
              <div style={{
                marginBottom: '16px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: lessonMessage.startsWith('✓') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: lessonMessage.startsWith('✓') ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(239,68,68,0.3)',
                color: lessonMessage.startsWith('✓') ? '#10b981' : '#ef4444',
                fontSize: '0.85rem',
              }}>
                {lessonMessage}
              </div>
            )}

            {/* Lesson Form (Create/Edit) */}
            {showLessonForm && (
              <div style={{
                background: 'rgba(15,23,42,0.4)',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '1rem' }}>
                  {editingLesson ? `Edit Lesson: ${editingLesson.title}` : 'Add New Lesson'}
                </h4>
                <form onSubmit={handleSaveLesson}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">Lesson Title *</label>
                      <input
                        type="text"
                        className="form-input"
                        required
                        value={lessonForm.title}
                        onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })}
                        placeholder="e.g. Introduction to Streams"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Order</label>
                      <input
                        type="number"
                        className="form-input"
                        min="1"
                        value={lessonForm.lessonOrder}
                        onChange={e => setLessonForm({ ...lessonForm, lessonOrder: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Lesson Video URL (YouTube embed/watch or direct MP4 URL)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={lessonForm.videoUrl}
                      onChange={e => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                      placeholder="https://www.youtube.com/embed/eIrMbAQSU34 or https://commondatastorage.googleapis.com/.../video.mp4"
                    />
                    <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      Leave blank if this lesson does not have a video (will display "No video available for this lesson").
                    </small>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-textarea"
                      rows="2"
                      value={lessonForm.description}
                      onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })}
                      placeholder="Short lesson summary..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Lesson Content / Notes</label>
                    <textarea
                      className="form-textarea"
                      rows="3"
                      value={lessonForm.content}
                      onChange={e => setLessonForm({ ...lessonForm, content: e.target.value })}
                      placeholder="Reading materials, instructions, or links..."
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowLessonForm(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary btn-sm">
                      {editingLesson ? 'Save Changes' : 'Create Lesson'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Lessons table for selected module */}
            {loadingLessons ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading lessons...</div>
            ) : moduleLessons.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}>
                No lessons found in this module. Click "+ Add Lesson" to create one.
              </div>
            ) : (
              <div style={{ maxHeight: '340px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Order</th>
                      <th>Title</th>
                      <th>Video URL</th>
                      <th style={{ width: '130px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {moduleLessons.map(l => {
                      const vUrl = l.videoUrl || l.video_url;
                      return (
                        <tr key={l.id}>
                          <td style={{ fontWeight: 600 }}>{l.lessonOrder}</td>
                          <td>
                            <div style={{ fontWeight: 500 }}>{l.title}</div>
                            {l.description && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{l.description}</div>}
                          </td>
                          <td>
                            {vUrl ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>Has Video</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={vUrl}>
                                  {vUrl}
                                </span>
                              </div>
                            ) : (
                              <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>No Video</span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button className="btn btn-sm btn-secondary" onClick={() => openEditLesson(l)}>Edit</button>
                              <button className="btn btn-sm btn-danger" onClick={() => handleDeleteLesson(l.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
