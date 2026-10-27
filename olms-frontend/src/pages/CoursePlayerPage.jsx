import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCourseById } from '../api/courseApi';
import { getModulesByCourseId } from '../api/moduleApi';
import { getLessonsByModuleId, getLessonById } from '../api/lessonApi';
import { getAssessmentsByModuleId } from '../api/assessmentApi';
import { useCourseProgress } from '../context/CourseProgressContext';
import { useAuth } from '../context/AuthContext';
import { createCertificate } from '../api/certificateApi';

// ── Video Helpers ────────────────────────────────────────────────────────────

function extractYouTubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function isDirectVideo(url) {
  if (!url) return false;
  return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url) || url.startsWith('blob:') || url.startsWith('data:video');
}

// ── Embedded Video Player Component ──────────────────────────────────────────

function VideoPlayer({ lesson, onEnded }) {
  const videoUrl = lesson?.videoUrl || lesson?.video_url || lesson?.contentUrl || lesson?.url || '';
  const ytId = extractYouTubeId(videoUrl);
  const isDirect = isDirectVideo(videoUrl);
  const playerRef = useRef(null);

  // Initialize YouTube IFrame Player API
  useEffect(() => {
    if (!ytId) return;

    let destroyed = false;
    let ytPlayer = null;

    const setupPlayer = () => {
      if (destroyed || !window.YT || !window.YT.Player) return;
      const targetEl = document.getElementById(`yt-player-${lesson.id}`);
      if (!targetEl) return;

      try {
        ytPlayer = new window.YT.Player(`yt-player-${lesson.id}`, {
          videoId: ytId,
          playerVars: {
            enablejsapi: 1,
            origin: window.location.origin,
            rel: 0,
            modestbranding: 1,
          },
          events: {
            onStateChange: (event) => {
              // 0 is YT.PlayerState.ENDED
              if (event.data === 0) {
                onEnded();
              }
            },
          },
        });
        playerRef.current = ytPlayer;
      } catch (err) {
        console.warn('YT Player init error:', err);
      }
    };

    if (!window.YT) {
      if (!document.getElementById('yt-iframe-api-script')) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prevCallback === 'function') prevCallback();
        setupPlayer();
      };
    } else {
      setupPlayer();
    }

    return () => {
      destroyed = true;
      if (ytPlayer && ytPlayer.destroy) {
        try { ytPlayer.destroy(); } catch {}
      }
    };
  }, [ytId, lesson.id, onEnded]);

  // Window message listener as secondary safeguard for YouTube events
  useEffect(() => {
    const handleMessage = (event) => {
      try {
        let data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data && (data.event === 'onStateChange' || data.info === 0)) {
          if (data.info === 0) {
            onEnded();
          }
        }
      } catch {}
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onEnded]);

  if (!videoUrl) {
    return (
      <div className="video-container">
        <div className="video-placeholder">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <p style={{ marginTop: '12px' }}>No video available for this lesson</p>
        </div>
      </div>
    );
  }

  if (isDirect) {
    return (
      <div className="video-container">
        <video
          key={lesson.id}
          src={videoUrl}
          controls
          autoPlay
          onEnded={onEnded}
          style={{ width: '100%', height: '100%' }}
        />
      </div>
    );
  }

  if (ytId) {
    return (
      <div className="video-container" key={lesson.id}>
        <div id={`yt-player-${lesson.id}`} style={{ width: '100%', height: '100%' }}>
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}`}
            title={lesson.title || 'Lesson Video'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="video-container">
      <iframe
        src={videoUrl}
        title={lesson.title || 'Lesson Video'}
        allowFullScreen
        style={{ width: '100%', height: '100%', border: 'none' }}
      />
    </div>
  );
}

// ── Main Page Component ──────────────────────────────────────────────────────

export default function CoursePlayerPage() {
  const { courseId } = useParams();
  const {
    isEnrolled,
    enrollInCourse,
    getCompletedLessons,
    completeLesson,
    isLessonLocked,
    getLessonUnlockRequirement,
    isAssessmentLocked,
    isAssessmentPassed,
    isModuleLocked,
    isModuleCompleted,
    getCourseProgress,
    certifiedCourseIds,
    refreshCertificates,
    refreshCourseProgress,
  } = useCourseProgress();
  const { user, role } = useAuth();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [moduleLessonsMap, setModuleLessonsMap] = useState({});
  const [moduleAssessmentsMap, setModuleAssessmentsMap] = useState({});
  const [allLessons, setAllLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [lockError, setLockError] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [claimError, setClaimError] = useState('');

  // Auto-advance banner state
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState(null);
  const countdownTimerRef = useRef(null);

  const cid = Number(courseId);
  const completedLessons = getCompletedLessons(cid);
  const progressPercent = getCourseProgress(cid);

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

  // ── Load course structure ──────────────────────────────────────────────────
  const loadCourseStructure = useCallback(async () => {
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

      setActiveLesson(prev => {
        if (!prev && flatLessons.length > 0) return flatLessons[0];
        if (prev) {
          const match = flatLessons.find(l => l.id === prev.id);
          if (match) return { ...prev, ...match };
        }
        return prev;
      });
    } catch {
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourseStructure();
  }, [loadCourseStructure, isEnrolled(cid)]);

  // Whenever activeLesson changes, ensure full unlocked details (including videoUrl) are loaded
  useEffect(() => {
    if (!activeLesson?.id) return;
    const isEnr = isEnrolled(cid) || role === 'INSTRUCTOR' || role === 'ADMIN';
    if (!isEnr) return;

    let cancelled = false;
    getLessonById(activeLesson.id)
      .then(res => {
        if (!cancelled && res.data) {
          const fresh = res.data;
          const freshVideo = fresh.videoUrl || fresh.video_url || '';
          setActiveLesson(prev => {
            if (!prev || prev.id !== fresh.id) return prev;
            return {
              ...prev,
              ...fresh,
              videoUrl: freshVideo || prev.videoUrl || prev.video_url || '',
              video_url: freshVideo || prev.video_url || prev.videoUrl || '',
            };
          });
        }
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [activeLesson?.id, cid, isEnrolled, role]);

  // ── Navigate to Next Lesson ────────────────────────────────────────────────
  const handleNextLesson = useCallback(() => {
    if (!activeLesson || allLessons.length === 0) return;
    const currentIndex = allLessons.findIndex(l => l.id === activeLesson.id);
    if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
      const next = allLessons[currentIndex + 1];
      if (!isLessonLocked(cid, next.id)) {
        setActiveLesson(next);
        setLockError('');
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
        setAutoAdvanceCountdown(null);
      }
    }
  }, [activeLesson, allLessons, cid, isLessonLocked]);

  // ── Mark lesson complete ───────────────────────────────────────────────────
  const handleMarkComplete = useCallback(async (lessonId, e, autoAdvance = false) => {
    if (e) e.stopPropagation();
    if (!user?.id || completing) return;

    if (completedLessons.includes(lessonId)) {
      if (autoAdvance) handleNextLesson();
      return;
    }

    setCompleting(true);
    setLockError('');
    try {
      const updated = await completeLesson(cid, lessonId);

      // Advance to next unlocked lesson if requested
      if (autoAdvance && activeLesson?.id === lessonId && updated) {
        const currentIndex = allLessons.findIndex(l => l.id === lessonId);
        if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
          const nextLesson = allLessons[currentIndex + 1];
          let nextIsLocked = false;
          if (updated?.modules) {
            for (const m of updated.modules) {
              const found = (m.lessons || []).find(x => x.lessonId === nextLesson.id);
              if (found !== undefined) {
                nextIsLocked = found.locked;
                break;
              }
            }
          }
          if (!nextIsLocked) {
            setActiveLesson(nextLesson);
          }
        }
      }
    } catch (err) {
      if (err?.response?.status === 403) {
        setLockError('Complete the previous lessons first to unlock this one.');
      } else {
        setLockError('Failed to mark complete. Please try again.');
      }
      setTimeout(() => setLockError(''), 4000);
    } finally {
      setCompleting(false);
    }
  }, [user?.id, completing, completedLessons, completeLesson, cid, activeLesson, allLessons, handleNextLesson]);

  // ── Auto-Advance Countdown Starter ─────────────────────────────────────────
  const startAutoAdvance = useCallback((nextLesson, completedTitle) => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    let secs = 3;
    setAutoAdvanceCountdown({
      seconds: secs,
      nextLesson,
      message: `🎉 Video completed! "${completedTitle}" marked as complete. Loading next lesson in ${secs}s...`
    });

    countdownTimerRef.current = setInterval(() => {
      secs -= 1;
      if (secs <= 0) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        setAutoAdvanceCountdown(null);
        setActiveLesson(nextLesson);
      } else {
        setAutoAdvanceCountdown(prev => prev ? {
          ...prev,
          seconds: secs,
          message: `🎉 Video completed! "${completedTitle}" marked as complete. Loading next lesson in ${secs}s...`
        } : null);
      }
    }, 1000);
  }, []);

  const cancelAutoAdvance = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setAutoAdvanceCountdown(null);
  }, []);

  // ── Video Finished Callback ────────────────────────────────────────────────
  const handleVideoEnded = useCallback(async () => {
    if (!activeLesson || completing) return;
    const lessonId = activeLesson.id;
    const lessonTitle = activeLesson.title;

    let updatedProgress = null;

    // 1. Mark lesson as complete if not already marked
    if (!completedLessons.includes(lessonId)) {
      setCompleting(true);
      try {
        updatedProgress = await completeLesson(cid, lessonId);
      } catch (err) {
        console.error('Failed to mark complete on video end:', err);
      } finally {
        setCompleting(false);
      }
    }

    // 2. Find next lesson
    const currentIndex = allLessons.findIndex(l => l.id === lessonId);
    if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];

      let nextIsLocked = false;
      if (updatedProgress?.modules) {
        for (const m of updatedProgress.modules) {
          const found = (m.lessons || []).find(l => l.lessonId === nextLesson.id);
          if (found !== undefined) {
            nextIsLocked = found.locked;
            break;
          }
        }
      } else {
        nextIsLocked = isLessonLocked(cid, nextLesson.id);
      }

      if (!nextIsLocked) {
        startAutoAdvance(nextLesson, lessonTitle);
      } else {
        const currentModId = activeLesson?.module?.id;
        const modAssessments = currentModId ? (moduleAssessmentsMap[currentModId] || []) : [];
        const unpassed = modAssessments.find(a => !isAssessmentPassed(cid, a.id));
        if (unpassed) {
          setAutoAdvanceCountdown({
            seconds: 0,
            nextLesson: null,
            assessmentId: unpassed.id,
            message: `🎉 All lessons in this module complete! Assessment "${unpassed.title}" is mandatory to unlock the next module.`
          });
        }
      }
    } else {
      const currentModId = activeLesson?.module?.id;
      const modAssessments = currentModId ? (moduleAssessmentsMap[currentModId] || []) : [];
      const unpassed = modAssessments.find(a => !isAssessmentPassed(cid, a.id));
      if (unpassed) {
        setAutoAdvanceCountdown({
          seconds: 0,
          nextLesson: null,
          assessmentId: unpassed.id,
          message: `🎉 All lessons complete! Assessment "${unpassed.title}" is mandatory to complete this course.`
        });
      } else {
        setAutoAdvanceCountdown({
          seconds: 0,
          nextLesson: null,
          message: '🎉 Congratulations! You have completed all lessons and assessments in this course!'
        });
      }
    }
  }, [activeLesson, completing, completedLessons, completeLesson, cid, allLessons, isLessonLocked, isAssessmentPassed, moduleAssessmentsMap, startAutoAdvance]);

  const handleLessonClick = useCallback(async (lesson) => {
    const locked = isLessonLocked(cid, lesson.id);
    if (locked) return;
    cancelAutoAdvance();
    setActiveLesson(lesson);
    setLockError('');
    try {
      const res = await getLessonById(lesson.id);
      if (res.data) {
        const vUrl = res.data.videoUrl || res.data.video_url || '';
        setActiveLesson(prev => ({
          ...prev,
          ...res.data,
          videoUrl: vUrl,
          video_url: vUrl,
        }));
      }
    } catch {}
  }, [cid, isLessonLocked, cancelAutoAdvance]);

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
    } catch {
      setClaimError('Failed to claim certificate. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;
  if (!course) return <div className="empty-state"><h3>Course not found</h3></div>;

  const isInstructorOrAdmin = role === 'INSTRUCTOR' || role === 'ADMIN';
  const enrolled = isEnrolled(cid) || isInstructorOrAdmin;

  if (!enrolled) {
    return (
      <div className="player-container" style={{ padding: '40px 20px', maxWidth: '720px', margin: '40px auto', textAlign: 'center' }}>
        <div className="card-glass" style={{ padding: '40px' }}>
          <div style={{ fontSize: '3.2rem', marginBottom: '16px' }}>🔒</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px' }}>Enrollment Required</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto 24px auto' }}>
            You must be enrolled in <strong>{course.title}</strong> before accessing its video lessons, learning materials, and quizzes.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-primary btn-lg" 
              onClick={async () => {
                try {
                  await enrollInCourse(cid);
                  await loadCourseStructure();
                } catch (err) {
                  console.error(err);
                }
              }}>
              Enroll Now — Free
            </button>
            <Link to={`/courses/${cid}`} className="btn btn-secondary btn-lg">
              View Course Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isCurrentCompleted = activeLesson && completedLessons.includes(activeLesson.id);
  const isCurrentLocked = activeLesson && isLessonLocked(cid, activeLesson.id);
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
            const isModuleDone = isModuleCompleted(cid, mod.id);
            const isModLocked = isModuleLocked(cid, mod.id);

            return (
              <div
                key={mod.id}
                style={{
                  border: isModuleDone
                    ? '1px solid rgba(16,185,129,0.4)'
                    : isModLocked
                    ? '1px solid rgba(99,102,241,0.2)'
                    : '1px solid var(--border)',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  background: isModLocked ? 'rgba(15,23,42,0.3)' : 'var(--bg-card)',
                  opacity: isModLocked ? 0.75 : 1,
                }}>

                {/* Module Header */}
                <div style={{
                  padding: '12px 14px',
                  background: isModuleDone ? 'rgba(16,185,129,0.12)' : isModLocked ? 'rgba(15,23,42,0.5)' : 'rgba(15,23,42,0.6)',
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
                      color: isModuleDone ? '#10b981' : isModLocked ? 'var(--text-muted)' : 'var(--primary)',
                      background: isModuleDone ? 'rgba(16,185,129,0.2)' : 'rgba(79,70,229,0.15)',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      flexShrink: 0
                    }}>
                      {isModLocked ? '🔒' : `MOD ${mod.moduleOrder || (modIdx + 1)}`}
                    </span>
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {mod.title}
                    </span>
                  </div>

                  {isModuleDone ? (
                    <span className="badge badge-success" style={{ fontSize: '0.68rem', padding: '3px 8px', flexShrink: 0, fontWeight: 700 }}>
                      ✓ Completed
                    </span>
                  ) : isModLocked ? (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>Locked</span>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {completedInMod}/{modLessons.length}
                    </span>
                  )}
                </div>

                {/* Lessons */}
                <div style={{ padding: '6px 8px' }}>
                  {modLessons.map((lesson, lessonIdx) => {
                    const isDone = completedLessons.includes(lesson.id);
                    const isActive = activeLesson?.id === lesson.id;
                    const locked = isLessonLocked(cid, lesson.id);
                    const unlockHint = getLessonUnlockRequirement(cid, lesson.id);

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => handleLessonClick(lesson)}
                        title={locked ? (unlockHint || 'Complete previous lesson to unlock') : ''}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '8px 10px',
                          margin: '3px 0',
                          borderRadius: '6px',
                          background: isActive ? 'rgba(79,70,229,0.18)' : 'transparent',
                          border: isActive ? '1px solid rgba(79,70,229,0.4)' : '1px solid transparent',
                          cursor: locked ? 'not-allowed' : 'pointer',
                          opacity: locked ? 0.55 : 1,
                          transition: 'all 0.15s ease',
                        }}>

                        {/* Lock icon OR completion circle */}
                        {locked ? (
                          <span style={{ fontSize: '13px', flexShrink: 0, color: 'var(--text-muted)' }}>🔒</span>
                        ) : (
                          <div
                            className={`lesson-check ${isDone ? 'completed' : ''}`}
                            onClick={(e) => { e.stopPropagation(); if (!locked && !isDone) handleMarkComplete(lesson.id, e, false); }}
                            title={isDone ? 'Completed' : 'Click to mark complete'}>
                            {isDone && <span style={{ color: '#fff', fontSize: '11px', fontWeight: 'bold' }}>✓</span>}
                          </div>
                        )}

                        <span style={{
                          fontSize: '0.84rem',
                          flex: 1,
                          fontWeight: isActive ? 600 : 400,
                          color: locked ? 'var(--text-muted)' : isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {lessonIdx + 1}. {lesson.title}
                        </span>

                        {isDone && (
                          <span style={{
                            fontSize: '0.68rem',
                            color: '#10b981',
                            fontWeight: 700,
                            background: 'rgba(16,185,129,0.12)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            flexShrink: 0
                          }}>
                            ✓ Done
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Assessments */}
                  {modAssessments.map(a => {
                    const assessLocked = isAssessmentLocked(cid, a.id) || isModLocked;
                    const assessPassed = isAssessmentPassed(cid, a.id);

                    if (assessLocked) {
                      return (
                        <div
                          key={a.id}
                          title="Complete all required lessons in this module first"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 10px',
                            margin: '3px 0',
                            borderRadius: '6px',
                            color: 'var(--text-muted)',
                            fontSize: '0.82rem',
                            background: 'rgba(245,158,11,0.04)',
                            border: '1px solid rgba(245,158,11,0.1)',
                            cursor: 'not-allowed',
                            opacity: 0.5,
                          }}>
                          <span>🔒</span>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {a.title}
                          </span>
                          <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>Quiz</span>
                        </div>
                      );
                    }

                    if (assessPassed) {
                      return (
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
                            color: '#10b981',
                            fontSize: '0.82rem',
                            textDecoration: 'none',
                            background: 'rgba(16,185,129,0.08)',
                            border: '1px solid rgba(16,185,129,0.3)',
                          }}>
                          <span>✓</span>
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                            {a.title}
                          </span>
                          <span className="badge badge-success" style={{ fontSize: '0.65rem', padding: '2px 6px', fontWeight: 700 }}>Passed</span>
                        </Link>
                      );
                    }

                    return (
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
                          color: '#f59e0b',
                          fontSize: '0.82rem',
                          textDecoration: 'none',
                          background: 'rgba(245,158,11,0.14)',
                          border: '1px solid rgba(245,158,11,0.35)',
                        }}>
                        <span>📝</span>
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {a.title}
                        </span>
                        <span className="badge badge-warning" style={{ fontSize: '0.65rem', padding: '2px 6px', fontWeight: 700 }}>Mandatory Quiz</span>
                      </Link>
                    );
                  })}
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>{activeLesson.title}</h2>
                {isCurrentCompleted && (
                  <span className="badge badge-success" style={{ fontSize: '0.75rem', padding: '4px 8px', fontWeight: 700 }}>
                    ✓ Completed
                  </span>
                )}
              </div>

              {isCurrentLocked ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 18px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  🔒 Lesson Locked
                </div>
              ) : (
                <button
                  className={`btn btn-sm ${isCurrentCompleted ? 'btn-success' : 'btn-primary'}`}
                  onClick={() => !isCurrentCompleted && handleMarkComplete(activeLesson.id, null, false)}
                  disabled={isCurrentCompleted || completing}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 18px', borderRadius: '8px' }}>
                  {completing ? '⏳ Saving...' : isCurrentCompleted ? '✓ Lesson Completed' : 'Mark as Completed'}
                </button>
              )}
            </div>

            {/* Lock error toast */}
            {lockError && (
              <div style={{
                marginBottom: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#ef4444',
                fontSize: '0.85rem',
              }}>
                🔒 {lockError}
              </div>
            )}

            {/* Auto-Advance Notification Banner */}
            {autoAdvanceCountdown && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(79, 70, 229, 0.15))',
                border: '1px solid #10b981',
                borderRadius: '10px',
                padding: '12px 18px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.4rem' }}>🎉</span>
                  <div>
                    <div style={{ fontWeight: 600, color: '#10b981', fontSize: '0.9rem' }}>
                      {autoAdvanceCountdown.message}
                    </div>
                  </div>
                </div>
                {autoAdvanceCountdown.nextLesson && (
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <button
                      className="btn btn-sm btn-success"
                      style={{ fontWeight: 600, padding: '6px 14px' }}
                      onClick={() => {
                        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
                        setActiveLesson(autoAdvanceCountdown.nextLesson);
                        setAutoAdvanceCountdown(null);
                      }}>
                      Play Next Now ({autoAdvanceCountdown.seconds}s) →
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      style={{ padding: '6px 12px' }}
                      onClick={cancelAutoAdvance}>
                      Stay on Lesson
                    </button>
                  </div>
                )}
                {autoAdvanceCountdown.assessmentId && (
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <Link
                      to={`/assessments/${autoAdvanceCountdown.assessmentId}`}
                      state={{ courseId: course.id }}
                      className="btn btn-sm btn-primary"
                      style={{ fontWeight: 700, padding: '6px 16px', textDecoration: 'none' }}>
                      Take Assessment Now →
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Video Player Component */}
            <VideoPlayer lesson={activeLesson} onEnded={handleVideoEnded} />

            {/* Navigation & Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <button
                className="btn btn-secondary btn-sm"
                disabled={activeIndex <= 0}
                onClick={() => activeIndex > 0 && setActiveLesson(allLessons[activeIndex - 1])}>
                ← Previous Lesson
              </button>

              <div style={{ display: 'flex', gap: '10px' }}>
                {!isCurrentCompleted && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleMarkComplete(activeLesson.id, null, true)}
                    disabled={completing}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {completing ? '⏳ Saving...' : '✓ Complete & Next Lesson →'}
                  </button>
                )}

                {isCurrentCompleted && (
                  (() => {
                    const nextLesson = activeIndex < allLessons.length - 1 ? allLessons[activeIndex + 1] : null;
                    const nextIsLocked = nextLesson && isLessonLocked(cid, nextLesson.id);
                    const currentModId = activeLesson?.module?.id;
                    const modAssessments = currentModId ? (moduleAssessmentsMap[currentModId] || []) : [];
                    const unpassedAssessment = modAssessments.find(a => !isAssessmentPassed(cid, a.id));

                    if (nextIsLocked && unpassedAssessment) {
                      return (
                        <Link
                          to={`/assessments/${unpassedAssessment.id}`}
                          state={{ courseId: course.id }}
                          className="btn btn-warning btn-sm"
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, textDecoration: 'none' }}>
                          📝 Take Mandatory Quiz to Unlock Next Module →
                        </Link>
                      );
                    }

                    return (
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={activeIndex >= allLessons.length - 1 || nextIsLocked}
                        title={nextIsLocked ? 'Complete current module assessment to unlock next module' : ''}
                        onClick={handleNextLesson}>
                        Next Lesson →
                      </button>
                    );
                  })()
                )}
              </div>
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
