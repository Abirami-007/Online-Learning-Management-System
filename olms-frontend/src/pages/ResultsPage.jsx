import { useState, useEffect } from 'react';
import { useLocation, Link, useParams } from 'react-router-dom';
import { getModulesByCourseId } from '../api/moduleApi';
import { getAssessmentsByModuleId } from '../api/assessmentApi';
import { useCourseProgress } from '../context/CourseProgressContext';

export default function ResultsPage() {
  const { id } = useParams();
  const { state } = useLocation();
  const [nextAssessment, setNextAssessment] = useState(null);
  const { refreshCertificates, refreshCourseProgress } = useCourseProgress();

  const storedCourseId = sessionStorage.getItem('olms_last_course_id');
  const courseId = state?.courseId || storedCourseId;

  useEffect(() => {
    if (courseId) {
      refreshCourseProgress(courseId);
    }
    if (state?.passed) {
      refreshCertificates();
    }

    if (!courseId) return;
    (async () => {
      try {
        const modsRes = await getModulesByCourseId(courseId);
        const mods = modsRes.data || [];
        mods.sort((a, b) => (a.moduleOrder || 0) - (b.moduleOrder || 0));
        
        let allAssessments = [];
        for (const m of mods) {
          try {
            const ar = await getAssessmentsByModuleId(m.id);
            allAssessments = [...allAssessments, ...(ar.data || [])];
          } catch {}
        }
        
        const currentId = parseInt(id);
        const currentIndex = allAssessments.findIndex(a => a.id === currentId);
        
        if (currentIndex >= 0 && currentIndex < allAssessments.length - 1) {
          setNextAssessment(allAssessments[currentIndex + 1]);
        }
      } catch {}
    })();
  }, [courseId, id, refreshCourseProgress, refreshCertificates]);

  if (!state) return (
    <div className="empty-state">
      <h3>No results available</h3>
      <p>Please take an assessment first</p>
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
        {courseId && (
          <Link to={`/learn/${courseId}`} className="btn btn-primary">
            Back to Course Player →
          </Link>
        )}
        <Link to={`/assessments/${id}`} className="btn btn-secondary">Take Assessment</Link>
      </div>
    </div>
  );

  const { score, passed, total, answers, questions } = state;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;

  return (
    <div className="quiz-container">
      <div className="card-glass" style={{ textAlign: 'center', marginBottom: '32px', padding: '36px 24px' }}>
        <div style={{ width: '100px', height: '100px', borderRadius: '50%', margin: '0 auto 20px',
          background: passed ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem',
          boxShadow: passed ? '0 4px 20px rgba(16,185,129,0.2)' : '0 4px 20px rgba(239,68,68,0.2)' }}>
          {passed ? '🎉' : '😔'}
        </div>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px', color: passed ? '#10b981' : '#ef4444' }}>
          {passed ? 'Congratulations!' : 'Assessment Failed — Keep Trying!'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '1rem', maxWidth: '600px', margin: '0 auto 24px' }}>
          {passed
            ? 'You successfully passed the assessment! The next module is now unlocked.'
            : 'You did not meet the passing score. The next module remains locked until you pass this assessment. Your completed lesson progress is safe and has not been reset. You can retake the quiz below.'}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '40px', marginBottom: '28px' }}>
          <div><div style={{ fontSize: '2rem', fontWeight: 800 }}>{score}</div><div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Score</div></div>
          <div><div style={{ fontSize: '2rem', fontWeight: 800 }}>{total}</div><div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Total</div></div>
          <div><div style={{ fontSize: '2rem', fontWeight: 800, color: passed ? '#10b981' : '#ef4444' }}>{percentage}%</div><div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Percentage</div></div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {passed && courseId && (
            <Link to={`/learn/${courseId}`} className="btn btn-primary btn-lg" style={{ boxShadow: '0 4px 14px rgba(79,70,229,0.3)' }}>
              Continue to Next Module →
            </Link>
          )}

          {!passed && courseId && (
            <Link to={`/learn/${courseId}`} className="btn btn-primary btn-lg">
              Back to Course Player
            </Link>
          )}

          <Link to={`/assessments/${id}`} className="btn btn-secondary btn-lg">
            {passed ? 'Retake Quiz' : 'Retry Quiz Now'}
          </Link>

          {passed && (
            <Link to="/certificates" className="btn btn-success btn-lg">
              🏆 View My Certificate
            </Link>
          )}

          <Link to="/dashboard" className="btn btn-secondary btn-lg">
            Dashboard
          </Link>
        </div>
      </div>

      {questions && questions.length > 0 && (
        <>
          <div className="page-header"><h1 style={{ fontSize: '1.3rem' }}>Answer Review</h1></div>
          {questions.map((q, i) => {
            const userAns = answers?.[q.id];
            const isCorrect = userAns === q.correctAnswer;
            return (
              <div key={q.id} className="card question-card">
                <h3>Q{i + 1}. {q.questionText}</h3>
                <div className="option-list">
                  {['A', 'B', 'C', 'D'].map(opt => {
                    const text = q[`option${opt}`];
                    if (!text) return null;
                    let cls = 'option-item';
                    if (opt === q.correctAnswer) cls += ' correct';
                    else if (opt === userAns && !isCorrect) cls += ' incorrect';
                    return <div key={opt} className={cls}><div className="option-radio" /><span><strong>{opt}.</strong> {text}</span></div>;
                  })}
                </div>
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
