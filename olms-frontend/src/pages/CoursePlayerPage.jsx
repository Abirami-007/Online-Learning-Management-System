import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCourseById } from '../api/courseApi';
import { getModulesByCourseId } from '../api/moduleApi';
import { getLessonsByModuleId } from '../api/lessonApi';
import { getAssessmentsByModuleId } from '../api/assessmentApi';
import { useCourseProgress } from '../context/CourseProgressContext';
import { useAuth } from '../context/AuthContext';
import { createCertificate } from '../api/certificateApi';

export default function CoursePlayerPage() {
  const { courseId } = useParams();
  const { 
    getCompletedLessons, 
    toggleLessonComplete, 
    isLessonCompleted, 
    certifiedCourseIds, 
    refreshCertificates 
  } = useCourseProgress();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [moduleLessonsMap, setModuleLessonsMap] = useState({});
  const [moduleAssessmentsMap, setModuleAssessmentsMap] = useState({});
  const [allLessons, setAllLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');

  const completedLessons = getCompletedLessons(Number(courseId));
  const cid = Number(courseId);

  useEffect(() => {
    (async () => {
      try {
        const courseRes = await getCourseById(courseId);
        setCourse(courseRes.data);
        
        const modsRes = await getModulesByCourseId(courseId).catch(() => ({ data: [] }));
        const mods = (modsRes.data || []).sort((a, b) => (a.moduleOrder || 0) - (b.moduleOrder || 0));
        setModules(mods);

        const lMap = {};
        const aMap = {};
        let flatLessons = [];

        for (const m of mods) {
          try { 
            const lr = await getLessonsByModuleId(m.id); 
            const lessons = (lr.data || []).sort((a, b) => (a.lessonOrder || 0) - (b.lessonOrder || 0));
            lMap[m.id] = lessons;
            flatLessons = [...flatLessons, ...lessons];
          } catch {
            lMap[m.id] = [];
          }

          try { 
            const ar = await getAssessmentsByModuleId(m.id); 
            aMap[m.id] = ar.data || []; 
          } catch {
            aMap[m.id] = [];
          }
        }

        setModuleLessonsMap(lMap);
        setModuleAssessmentsMap(aMap);
        setAllLessons(flatLessons);

        if (flatLessons.length > 0) {
          setActiveLesson(flatLessons[0]);
        }
      } catch {} finally { 
        setLoading(false); 
      }
    })();
  }, [courseId]);

  const handleToggle = (lessonId, e) => {
    if (e) e.stopPropagation();
    toggleLessonComplete(cid, lessonId);
  };

  const handleNextLesson = () => {
    if (!activeLesson || allLessons.length === 0) return;
    const currentIndex = allLessons.findIndex(l => l.id === activeLesson.id);
    if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
      setActiveLesson(allLessons[currentIndex + 1]);
    }
  };

  const handleClaimCertificate = async () => {
    setClaiming(true);
    setClaimError('');
    try {
      await createCertificate({
        certificateName: `${course.title} Certificate of Completion`,
        certificateUrl: '/certificates',
        issuedDate: new Date().toISOString().split('T')[0],
        user: { id: user?.id || 1 },
        course: { id: course.id }
      });
      await refreshCertificates();
    } catch (err) {
      setClaimError('Failed to claim certificate. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!course) return <div className="empty-state"><h3>Course not found</h3></div>;

  const progressPercent = allLessons.length > 0 ? Math.round((completedLessons.length / allLessons.length) * 100) : 0;
  const isCurrentCompleted = activeLesson && completedLessons.includes(activeLesson.id);
  const activeIndex = activeLesson ? allLessons.findIndex(l => l.id === activeLesson.id) : -1;

  const hasCertificate = certifiedCourseIds?.has(cid);
  const courseAssessments = Object.values(moduleAssessmentsMap).flat();
  const hasAssessments = courseAssessments.length > 0;

  return (
    <div className="player-layout" style={{ gridTemplateColumns: '320px 1fr', gap: '24px' }}>
      {/* Sidebar */}
      <div className="player-sidebar" style={{ padding: '16px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)' }}>
          {course.title}
        </h3>
        
        {/* Overall Progress */}
        <div style={{ marginBottom: '20px', background: 'rgba(15,23,42,0.4)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
            <span>Overall Progress</span>
            <span style={{ fontWeight: 700, color: progressPercent === 100 ? '#10b981' : 'var(--primary)' }}>{progressPercent}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%`, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            {completedLessons.length} of {allLessons.length} lessons completed
          </div>

          {/* Certificate Claim/View Area */}
          {progressPercent === 100 && (
            <div style={{
              marginTop: '14px',
              padding: '12px 10px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              {hasCertificate ? (
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700, marginBottom: '8px' }}>
                    🎉 Certificate Unlocked!
                  </div>
                  <Link 
                    to="/certificates" 
                    className="btn btn-sm btn-success btn-block"
                    style={{ display: 'block', textDecoration: 'none', textAlign: 'center', padding: '6px 0', fontSize: '0.8rem', fontWeight: 600 }}>
                    🏆 View Certificate
                  </Link>
                </div>
              ) : hasAssessments ? (
                <div>
                  <div style={{ fontSize: '0.74rem', color: '#fcd34d', fontWeight: 600 }}>
                    🔒 Pass module quizzes below to earn your certificate
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    All lessons complete!
                  </div>
                  <button 
                    className="btn btn-sm btn-success btn-block"
                    onClick={handleClaimCertificate}
                    disabled={claiming}
                    style={{ fontSize: '0.8rem', padding: '6px 0', fontWeight: 600 }}>
                    {claiming ? 'Claiming...' : '🏆 Claim Certificate'}
                  </button>
                  {claimError && (
                    <div style={{ fontSize: '0.7rem', color: '#ef4444', marginTop: '6px' }}>
                      {claimError}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modules List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {modules.map((mod, modIdx) => {
            const modLessons = moduleLessonsMap[mod.id] || [];
            const modAssessments = moduleAssessmentsMap[mod.id] || [];
            const completedInMod = modLessons.filter(l => completedLessons.includes(l.id)).length;
            const isModuleDone = modLessons.length > 0 && completedInMod === modLessons.length;

            return (
              <div 
                key={mod.id} 
                style={{ 
                  border: isModuleDone ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--border)', 
                  borderRadius: '10px', 
                  overflow: 'hidden',
                  background: 'var(--bg-card)'
                }}>
                
                {/* Module Header */}
                <div style={{
                  padding: '12px 14px',
                  background: isModuleDone ? 'rgba(16,185,129,0.12)' : 'rgba(15,23,42,0.6)',
                  borderBottom: '1px solid var(--border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    <span style={{ 
                      fontSize: '0.72rem', 
                      fontWeight: 800, 
                      color: isModuleDone ? '#10b981' : 'var(--primary)', 
                      background: isModuleDone ? 'rgba(16,185,129,0.2)' : 'rgba(79,70,229,0.15)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      flexShrink: 0 
                    }}>
                      MOD {mod.moduleOrder || (modIdx + 1)}
                    </span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {mod.title}
                    </span>
                  </div>

                  {isModuleDone ? (
                    <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '3px 8px', flexShrink: 0, fontWeight: 700 }}>
                      ✓ Completed
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {completedInMod}/{modLessons.length}
                    </span>
                  )}
                </div>

                {/* Lessons & Assessments */}
                <div style={{ padding: '6px 8px' }}>
                  {modLessons.map((lesson, lessonIdx) => {
                    const isDone = completedLessons.includes(lesson.id);
                    const isActive = activeLesson?.id === lesson.id;
                    return (
                      <div 
                        key={lesson.id} 
                        onClick={() => setActiveLesson(lesson)}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '10px', 
                          padding: '8px 10px', 
                          margin: '3px 0',
                          borderRadius: '6px', 
                          background: isActive ? 'rgba(79,70,229,0.18)' : 'transparent', 
                          border: isActive ? '1px solid rgba(79,70,229,0.4)' : '1px solid transparent',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}>
                        <div 
                          className={`lesson-check ${isDone ? 'completed' : ''}`}
                          onClick={(e) => handleToggle(lesson.id, e)}
                          title={isDone ? "Mark incomplete" : "Mark completed"}
                          style={{ 
                            width: '18px', 
                            height: '18px', 
                            borderRadius: '50%', 
                            flexShrink: 0, 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                          {isDone && <span style={{ color: '#fff', fontSize: '10px', fontWeight: 'bold' }}>✓</span>}
                        </div>
                        <span style={{ 
                          fontSize: '0.84rem', 
                          flex: 1, 
                          fontWeight: isActive ? 600 : 400, 
                          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap' 
                        }}>
                          {lessonIdx + 1}. {lesson.title}
                        </span>
                      </div>
                    );
                  })}

                  {modAssessments.map(a => (
                    <Link 
                      key={a.id} 
                      to={`/assessments/${a.id}`} 
                      state={{ courseId: course.id }} 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px', 
                        padding: '8px 10px', 
                        margin: '3px 0',
                        borderRadius: '6px', 
                        color: '#fcd34d', 
                        fontSize: '0.82rem',
                        textDecoration: 'none',
                        background: 'rgba(245,158,11,0.08)',
                        border: '1px solid rgba(245,158,11,0.2)'
                      }}>
                      <span>📝</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {a.title}
                      </span>
                      <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>Quiz</span>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="player-content">
        {activeLesson ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>{activeLesson.title}</h2>
              <button 
                className={`btn btn-sm ${isCurrentCompleted ? 'btn-success' : 'btn-primary'}`}
                onClick={() => handleToggle(activeLesson.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '8px' }}>
                {isCurrentCompleted ? '✓ Lesson Completed' : 'Mark as Completed'}
              </button>
            </div>

            {activeLesson.videoUrl ? (
              <div className="video-container">
                <iframe src={activeLesson.videoUrl.replace('watch?v=', 'embed/')} title={activeLesson.title} allowFullScreen />
              </div>
            ) : (
              <div className="video-container">
                <div className="video-placeholder">
                  <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3" /></svg>
                  <p style={{ marginTop: '12px' }}>No video available for this lesson</p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', marginBottom: '24px' }}>
              <button 
                className="btn btn-secondary btn-sm"
                disabled={activeIndex <= 0}
                onClick={() => activeIndex > 0 && setActiveLesson(allLessons[activeIndex - 1])}>
                ← Previous Lesson
              </button>
              <button 
                className="btn btn-secondary btn-sm"
                disabled={activeIndex >= allLessons.length - 1}
                onClick={handleNextLesson}>
                Next Lesson →
              </button>
            </div>

            {activeLesson.description && (
              <div className="card" style={{ marginBottom: '16px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px' }}>Lesson Overview</h4>
                <p style={{ color: 'var(--text-secondary)' }}>{activeLesson.description}</p>
              </div>
            )}
            {activeLesson.content && (
              <div className="card">
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px' }}>Lesson Content</h3>
                <div className="lesson-content-area">{activeLesson.content}</div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state"><h3>Select a lesson to begin</h3></div>
        )}
      </div>
    </div>
  );
}
