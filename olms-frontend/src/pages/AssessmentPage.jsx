import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getAssessmentById } from '../api/assessmentApi';
import { getQuestionsByAssessmentId } from '../api/questionApi';
import { createAttempt } from '../api/attemptApi';
import { useAuth } from '../context/AuthContext';

export default function AssessmentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(1800);

  // Store courseId from state or sessionStorage
  const courseId = location.state?.courseId || sessionStorage.getItem('olms_last_course_id');

  useEffect(() => {
    if (location.state?.courseId) {
      sessionStorage.setItem('olms_last_course_id', location.state.courseId);
    }
  }, [location.state]);

  useEffect(() => {
    Promise.all([
      getAssessmentById(id),
      getQuestionsByAssessmentId(id).catch(() => ({ data: [] })),
    ]).then(([aRes, qRes]) => {
      setAssessment(aRes.data);
      setQuestions(qRes.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const selectAnswer = (qId, option) => setAnswers({ ...answers, [qId]: option });

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    let score = 0;
    questions.forEach(q => { if (answers[q.id] === q.correctAnswer) score += (q.marks || 1); });
    const passed = assessment?.passingMarks ? score >= assessment.passingMarks : true;
    try {
      await createAttempt({ score, passed, assessment: { id: parseInt(id) }, user: { id: user?.id || 1 } });
    } catch {}
    navigate(`/assessments/${id}/results`, { 
      state: { 
        score, 
        passed, 
        total: assessment?.totalMarks || questions.length, 
        answers, 
        questions,
        courseId,
        assessmentTitle: assessment?.title
      } 
    });
  }, [submitting, questions, answers, assessment, id, courseId, navigate]);

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!assessment) return <div className="empty-state"><h3>Assessment not found</h3></div>;

  return (
    <div className="quiz-container">
      <div className="quiz-header">
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{assessment.title}</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>{questions.length} questions · {assessment.totalMarks} marks · Pass: {assessment.passingMarks} marks</p>
        </div>
        <div className="quiz-timer">⏱ {formatTime(timeLeft)}</div>
      </div>

      {questions.length === 0 ? (
        <div className="empty-state"><h3>No questions available</h3></div>
      ) : (
        questions.map((q, i) => (
          <div key={q.id} className="card question-card">
            <h3>Q{i + 1}. {q.questionText} <span style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>({q.marks || 1} marks)</span></h3>
            <div className="option-list">
              {['A', 'B', 'C', 'D'].map(opt => {
                const optionText = q[`option${opt}`];
                if (!optionText) return null;
                return (
                  <div key={opt} className={`option-item ${answers[q.id] === opt ? 'selected' : ''}`} onClick={() => selectAnswer(q.id, opt)}>
                    <div className="option-radio" />
                    <span><strong>{opt}.</strong> {optionText}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{Object.keys(answers).length} / {questions.length} answered</span>
        <button className="btn btn-primary btn-lg" onClick={handleSubmit} disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Assessment'}
        </button>
      </div>
    </div>
  );
}
