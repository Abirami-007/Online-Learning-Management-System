import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCourseById } from '../api/courseApi';
import { getModulesByCourseId } from '../api/moduleApi';
import { getLessonsByModuleId } from '../api/lessonApi';
import { getAssessmentsByModuleId } from '../api/assessmentApi';
import { useAuth } from '../context/AuthContext';
import { useCourseProgress } from '../context/CourseProgressContext';
import { createEnrollment, getMyEnrollments } from '../api/enrollmentApi';
import { createCertificate } from '../api/certificateApi';

export default function CourseDetailPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { 
    getCompletedLessons, 
    getCourseProgress, 
    certifiedCourseIds, 
    refreshCertificates 
  } = useCourseProgress();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [moduleLessons, setModuleLessons] = useState({});
  const [moduleAssessments, setModuleAssessments] = useState({});
  const [openModule, setOpenModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrollMsg, setEnrollMsg] = useState('');
  const [isAlreadyEnrolled, setIsAlreadyEnrolled] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');

  const completedLessons = getCompletedLessons(Number(id));
  const courseProgress = getCourseProgress(Number(id));

  useEffect(() => {
    Promise.all([
      getCourseById(id),
      getModulesByCourseId(id).catch(() => ({ data: [] })),
      getMyEnrollments().catch(() => ({ data: [] })),
    ]).then(async ([courseRes, modulesRes, enrollRes]) => {
      setCourse(courseRes.data);

      // Check if already enrolled in this course
      const enrollments = enrollRes.data || [];
      const alreadyEnrolled = enrollments.some(e => String(e.courseId) === String(id));
      setIsAlreadyEnrolled(alreadyEnrolled);

      const mods = (modulesRes.data || []).sort((a, b) => (a.moduleOrder || 0) - (b.moduleOrder || 0));
      setModules(mods);
      
      const lessonsMap = {};
      const assessmentsMap = {};
      await Promise.all(mods.map(async (m) => {
        try { 
          const lr = await getLessonsByModuleId(m.id); 
          lessonsMap[m.id] = (lr.data || []).sort((a, b) => (a.lessonOrder || 0) - (b.lessonOrder || 0)); 
        } catch { 
          lessonsMap[m.id] = []; 
        }
        
        try { 
          const ar = await getAssessmentsByModuleId(m.id); 
          assessmentsMap[m.id] = ar.data || []; 
        } catch { 
          assessmentsMap[m.id] = []; 
        }
      }));

      setModuleLessons(lessonsMap);
      setModuleAssessments(assessmentsMap);
      if (mods.length > 0) setOpenModule(mods[0].id);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const handleEnroll = async () => {
    if (!isAuthenticated) { setEnrollMsg('Please sign in to enroll'); return; }
    if (isAlreadyEnrolled) return;
    try {
      await createEnrollment({ userId: user?.id || 1, courseId: parseInt(id) });
      setIsAlreadyEnrolled(true);
      setEnrollMsg('Enrolled successfully!');
    } catch { setEnrollMsg('Enrollment failed or already enrolled'); }
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

  const totalLessons = Object.values(moduleLessons).reduce((a, b) => a + b.length, 0);
  const totalAssessments = Object.values(moduleAssessments).reduce((a, b) => a + b.length, 0);

  return (
    <div>
      <div className="card-glass" style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ flex: 1, minWidth: '280px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px' }}>{course.title}</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.7 }}>{course.description}</p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '16px' }}>
              {course.category && <span className="badge badge-primary">{course.category}</span>}
              {course.level && <span className="badge badge-secondary">{course.level}</span>}
              {course.instructor && <span className="badge badge-warning">By {course.instructor}</span>}
            </div>
            <div style={{ display: 'flex', gap: '24px', color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '16px' }}>
              <span>📚 {modules.length} Modules</span>
              <span>📖 {totalLessons} Lessons</span>
              <span>📝 {totalAssessments} Assessments</span>
            </div>

            {/* Course Progress Bar */}
            <div style={{ maxWidth: '360px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                <span>Your Progress</span>
                <span style={{ fontWeight: 700, color: courseProgress === 100 ? '#10b981' : 'var(--primary)' }}>
                  {courseProgress}%
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${courseProgress}%` }} />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '180px' }}>
            {isAlreadyEnrolled ? (
              <>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
                  background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)',
                  borderRadius: '8px', color: '#10b981', fontWeight: 700, fontSize: '0.92rem'
                }}>
                  ✓ Already Enrolled
                </div>
                <Link to={`/learn/${id}`} className="btn btn-primary btn-lg">Continue Learning →</Link>

                {/* Certificate Section on Detail Page */}
                {courseProgress === 100 && (
                  <div style={{
                    marginTop: '10px',
                    padding: '12px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '8px',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    {certifiedCourseIds?.has(Number(id)) ? (
                      <>
                        <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>
                          🎉 Certificate Earned!
                        </span>
                        <Link to="/certificates" className="btn btn-sm btn-success btn-block" style={{ textDecoration: 'none', textAlign: 'center', padding: '6px 0' }}>
                          🏆 View Certificate
                        </Link>
                      </>
                    ) : totalAssessments > 0 ? (
                      <span style={{ fontSize: '0.74rem', color: '#fcd34d', fontWeight: 600 }}>
                        🔒 Pass module quizzes below to earn certificate
                      </span>
                    ) : (
                      <>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          Lessons completed!
                        </span>
                        <button 
                          className="btn btn-sm btn-success btn-block"
                          onClick={handleClaimCertificate}
                          disabled={claiming}
                          style={{ padding: '6px 0' }}>
                          {claiming ? 'Claiming...' : '🏆 Claim Certificate'}
                        </button>
                        {claimError && <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>{claimError}</span>}
                      </>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                <button className="btn btn-primary btn-lg" onClick={handleEnroll}>Enroll Now — Free</button>
                <Link to={`/learn/${id}`} className="btn btn-secondary">Preview Course</Link>
              </>
            )}
            {enrollMsg && <div className={`alert ${enrollMsg.includes('success') ? 'alert-success' : 'alert-warning'}`} style={{ marginBottom: 0 }}>{enrollMsg}</div>}
          </div>
        </div>
      </div>

      <div className="page-header"><h1 style={{ fontSize: '1.3rem' }}>Course Curriculum</h1></div>
      {modules.length === 0 ? (
        <div className="empty-state"><h3>No modules yet</h3><p>This course has no content modules.</p></div>
      ) : (
        modules.map((mod, idx) => {
          const modLessons = moduleLessons[mod.id] || [];
          const modAssessments = moduleAssessments[mod.id] || [];
          const completedCount = modLessons.filter(l => completedLessons.includes(l.id)).length;
          const isModDone = modLessons.length > 0 && completedCount === modLessons.length;
          const isOpen = openModule === mod.id;

          return (
            <div key={mod.id} className="accordion-item" style={{ marginBottom: '12px', border: isModDone ? '1px solid rgba(16,185,129,0.4)' : '1px solid var(--border)' }}>
              <div 
                className="accordion-header" 
                onClick={() => setOpenModule(isOpen ? null : mod.id)}
                style={{
                  padding: '14px 18px',
                  background: isModDone ? 'rgba(16,185,129,0.1)' : 'rgba(15,23,42,0.4)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 800, 
                    color: isModDone ? '#10b981' : 'var(--primary)',
                    background: isModDone ? 'rgba(16,185,129,0.2)' : 'rgba(79,70,229,0.15)',
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}>
                    Module {mod.moduleOrder || (idx + 1)}
                  </span>
                  <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{mod.title}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {isModDone ? (
                    <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '3px 8px', fontWeight: 700 }}>
                      ✓ Module Completed
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {completedCount}/{modLessons.length} lessons · {modAssessments.length} assessments
                    </span>
                  )}
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
              </div>

              {isOpen && (
                <div className="accordion-body" style={{ padding: '16px 18px' }}>
                  {mod.description && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '14px', lineHeight: 1.6 }}>
                      {mod.description}
                    </p>
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {modLessons.map((lesson, lIdx) => {
                      const isDone = completedLessons.includes(lesson.id);
                      return (
                        <Link 
                          to={`/learn/${id}`} 
                          key={lesson.id} 
                          className="lesson-item"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: 'rgba(15,23,42,0.3)',
                            border: '1px solid var(--border)',
                            textDecoration: 'none',
                            color: 'var(--text-primary)'
                          }}>
                          <div className={`lesson-check ${isDone ? 'completed' : ''}`} style={{ width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0 }}>
                            {isDone && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>✓</span>}
                          </div>
                          <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 500 }}>
                            {lIdx + 1}. {lesson.title}
                          </span>
                          {lesson.videoUrl && (
                            <span className="badge badge-secondary" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                              Video
                            </span>
                          )}
                        </Link>
                      );
                    })}

                    {modAssessments.map(assessment => (
                      <Link 
                        to={`/assessments/${assessment.id}`} 
                        state={{ courseId: id }} 
                        key={assessment.id} 
                        className="lesson-item" 
                        style={{ 
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: 'rgba(245,158,11,0.08)',
                          border: '1px solid rgba(245,158,11,0.25)',
                          textDecoration: 'none',
                          color: '#fcd34d'
                        }}>
                        <span>📝</span>
                        <span style={{ flex: 1, fontSize: '0.9rem', fontWeight: 600 }}>{assessment.title}</span>
                        <span className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                          {assessment.totalMarks} marks
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
