import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { getAllCourses } from '../api/courseApi';
import { getMyCertificates } from '../api/certificateApi';
import { getCourseProgressApi, completeLessonApi } from '../api/progressApi';
import { getMyEnrollments, createEnrollment } from '../api/enrollmentApi';

const CourseProgressContext = createContext(null);

export function CourseProgressProvider({ children }) {
  const { user } = useAuth();

  // Maps: courseId -> CourseProgressDto (from backend, contains modules+lessons+locks)
  const [progressMap, setProgressMap] = useState({});
  // Set of course IDs that have certificates
  const [certifiedCourseIds, setCertifiedCourseIds] = useState(new Set());
  // Enrollments array and set of enrolled course IDs
  const [enrollments, setEnrollments] = useState([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState(new Set());
  const [loaded, setLoaded] = useState(false);

  // ─── Load initial data ─────────────────────────────────────────────────────

  useEffect(() => {
    setProgressMap({});
    setCertifiedCourseIds(new Set());
    setEnrollments([]);
    setEnrolledCourseIds(new Set());
    setLoaded(false);

    if (!user?.id) {
      setLoaded(true);
      return;
    }

    (async () => {
      try {
        const [coursesRes, certsRes, enrollRes] = await Promise.all([
          getAllCourses().catch(() => ({ data: [] })),
          getMyCertificates().catch(() => ({ data: [] })),
          getMyEnrollments().catch(() => ({ data: [] })),
        ]);

        const courses = coursesRes.data || [];
        const certs = certsRes.data || [];
        const enrollList = enrollRes.data || [];

        // Certified course IDs
        const certIds = new Set(certs.map(c => c.course?.id).filter(Boolean));
        setCertifiedCourseIds(certIds);

        // Enrolled course IDs
        const enrolledIds = new Set(enrollList.map(e => Number(e.courseId)).filter(Boolean));
        setEnrollments(enrollList);
        setEnrolledCourseIds(enrolledIds);

        // Fetch progress trees for all courses in parallel
        const entries = await Promise.all(
          courses.map(async (course) => {
            try {
              const res = await getCourseProgressApi(user.id, course.id);
              return [course.id, res.data];
            } catch {
              return [course.id, null];
            }
          })
        );

        const map = {};
        for (const [cid, dto] of entries) {
          if (dto) map[cid] = dto;
        }
        setProgressMap(map);
      } catch {
        // Fail silently
      } finally {
        setLoaded(true);
      }
    })();
  }, [user?.id]);

  // ─── Refresh a single course progress tree ─────────────────────────────────

  const refreshCourseProgress = useCallback(async (courseId) => {
    if (!user?.id) return null;
    try {
      const res = await getCourseProgressApi(user.id, courseId);
      setProgressMap(prev => ({ ...prev, [courseId]: res.data }));
      return res.data;
    } catch {
      return null;
    }
  }, [user?.id]);

  // ─── Mark lesson complete (calls backend, then refreshes the tree) ─────────

  const completeLesson = useCallback(async (courseId, lessonId) => {
    if (!user?.id) return null;
    try {
      await completeLessonApi(user.id, lessonId);
      return await refreshCourseProgress(courseId);
    } catch (err) {
      // Re-throw so the UI can show the right message (403 = locked)
      throw err;
    }
  }, [user?.id, refreshCourseProgress]);

  // ─── Derived helpers (read from the cached progress tree) ─────────────────

  /** Returns all completed lesson IDs for a course. */
  const getCompletedLessons = useCallback((courseId) => {
    const dto = progressMap[courseId];
    if (!dto) return [];
    const ids = [];
    for (const mod of dto.modules || []) {
      for (const lesson of mod.lessons || []) {
        if (lesson.completed) ids.push(lesson.lessonId);
      }
    }
    return ids;
  }, [progressMap]);

  /** Returns true if a specific lesson is completed. */
  const isLessonCompleted = useCallback((courseId, lessonId) => {
    return getCompletedLessons(courseId).includes(lessonId);
  }, [getCompletedLessons]);

  /** Returns true if a specific lesson is locked. */
  const isLessonLocked = useCallback((courseId, lessonId) => {
    const dto = progressMap[courseId];
    if (!dto) return false;
    for (const mod of dto.modules || []) {
      const lesson = (mod.lessons || []).find(l => l.lessonId === lessonId);
      if (lesson) return lesson.locked;
    }
    return false;
  }, [progressMap]);

  /** Returns unlock requirement text for a locked lesson, or null. */
  const getLessonUnlockRequirement = useCallback((courseId, lessonId) => {
    const dto = progressMap[courseId];
    if (!dto) return null;
    for (const mod of dto.modules || []) {
      const lesson = (mod.lessons || []).find(l => l.lessonId === lessonId);
      if (lesson) return lesson.unlockRequirement || null;
    }
    return null;
  }, [progressMap]);

  /** Returns true if an assessment is locked. */
  const isAssessmentLocked = useCallback((courseId, assessmentId) => {
    const dto = progressMap[courseId];
    if (!dto) return true;
    for (const mod of dto.modules || []) {
      const a = (mod.assessments || []).find(a => a.assessmentId === assessmentId);
      if (a) return a.locked;
    }
    return true;
  }, [progressMap]);

  /** Returns true if an assessment is passed. */
  const isAssessmentPassed = useCallback((courseId, assessmentId) => {
    const dto = progressMap[courseId];
    if (!dto) return false;
    for (const mod of dto.modules || []) {
      const a = (mod.assessments || []).find(a => a.assessmentId === assessmentId);
      if (a) return a.passed;
    }
    return false;
  }, [progressMap]);

  /** Returns true if a module is locked. */
  const isModuleLocked = useCallback((courseId, moduleId) => {
    const dto = progressMap[courseId];
    if (!dto) return false;
    const mod = (dto.modules || []).find(m => m.moduleId === moduleId);
    return mod ? mod.locked : false;
  }, [progressMap]);

  /** Returns true if a module is completed (lessons done AND assessment passed). */
  const isModuleCompleted = useCallback((courseId, moduleId) => {
    const dto = progressMap[courseId];
    if (!dto) return false;
    const mod = (dto.modules || []).find(m => m.moduleId === moduleId);
    return mod ? mod.completed : false;
  }, [progressMap]);

  /** Returns the progress percentage for a course (0-100). */
  const getCourseProgress = useCallback((courseId) => {
    const dto = progressMap[courseId];
    return dto?.progressPercent ?? 0;
  }, [progressMap]);

  /** Returns total lesson count for a course. */
  const getTotalLessons = useCallback((courseId) => {
    return progressMap[courseId]?.totalLessons ?? 0;
  }, [progressMap]);

  /** Returns true if a course is fully completed. */
  const isCourseCompleted = useCallback((courseId) => {
    if (certifiedCourseIds.has(courseId)) return true;
    const dto = progressMap[courseId];
    if (!dto) return false;
    return dto.totalLessons > 0 && dto.completedLessons >= dto.totalLessons;
  }, [progressMap, certifiedCourseIds]);

  /** Count of distinct completed courses (by lessons OR by certificate). */
  const completedCoursesCount = useMemo(() => {
    const ids = new Set(certifiedCourseIds);
    for (const [courseId, dto] of Object.entries(progressMap)) {
      if (dto?.totalLessons > 0 && dto.completedLessons >= dto.totalLessons) {
        ids.add(Number(courseId));
      }
    }
    return ids.size;
  }, [progressMap, certifiedCourseIds]);

  /** Reload certificates after passing a quiz. */
  const refreshCertificates = useCallback(async () => {
    try {
      const certsRes = await getMyCertificates();
      const certs = certsRes.data || [];
      setCertifiedCourseIds(new Set(certs.map(c => c.course?.id).filter(Boolean)));
    } catch {}
  }, []);

  /** Check if the learner is enrolled in a specific course. */
  const isEnrolled = useCallback((courseId) => {
    if (!courseId) return false;
    return enrolledCourseIds.has(Number(courseId));
  }, [enrolledCourseIds]);

  /** Re-fetch enrollments from backend. */
  const refreshEnrollments = useCallback(async () => {
    if (!user?.id) {
      setEnrollments([]);
      setEnrolledCourseIds(new Set());
      return [];
    }
    try {
      const res = await getMyEnrollments();
      const data = res.data || [];
      const set = new Set(data.map(e => Number(e.courseId)).filter(Boolean));
      setEnrollments(data);
      setEnrolledCourseIds(set);
      return data;
    } catch {
      return [];
    }
  }, [user?.id]);

  /** Enroll in a course, update state immediately, and refresh progression tree. */
  const enrollInCourse = useCallback(async (courseId) => {
    if (!user?.id) throw new Error('Authentication required');
    const cid = Number(courseId);
    const res = await createEnrollment({ courseId: cid });
    const newEnrollment = res.data;

    // Immediately update state without waiting for page reload
    setEnrolledCourseIds(prev => new Set([...prev, cid]));
    setEnrollments(prev => {
      const exists = prev.some(e => Number(e.courseId) === cid);
      return exists ? prev : [...prev, newEnrollment];
    });

    // Refresh course progress tree so lessons/modules unlock immediately
    await refreshCourseProgress(cid);
    return newEnrollment;
  }, [user?.id, refreshCourseProgress]);

  // ─── Backward-compat alias (CoursePlayerPage uses toggleLessonComplete) ────

  /**
   * Replaces the old localStorage toggle.
   * Now calls the backend and refreshes the progress tree.
   * Returns the error so callers can handle 403 (lesson locked).
   */
  const toggleLessonComplete = useCallback(async (courseId, lessonId) => {
    return completeLesson(courseId, lessonId);
  }, [completeLesson]);

  const value = useMemo(() => ({
    loaded,
    progressMap,
    certifiedCourseIds,
    // enrollments state & actions
    enrollments,
    enrolledCourseIds,
    isEnrolled,
    enrollInCourse,
    refreshEnrollments,
    // completion helpers
    getCompletedLessons,
    isLessonCompleted,
    getCourseProgress,
    getTotalLessons,
    isCourseCompleted,
    completedCoursesCount,
    // lock & module helpers
    isLessonLocked,
    getLessonUnlockRequirement,
    isAssessmentLocked,
    isAssessmentPassed,
    isModuleLocked,
    isModuleCompleted,
    // actions
    completeLesson,
    toggleLessonComplete,
    refreshCourseProgress,
    refreshCertificates,
  }), [
    loaded, progressMap, certifiedCourseIds,
    enrollments, enrolledCourseIds, isEnrolled, enrollInCourse, refreshEnrollments,
    getCompletedLessons, isLessonCompleted, getCourseProgress,
    getTotalLessons, isCourseCompleted, completedCoursesCount,
    isLessonLocked, getLessonUnlockRequirement, isAssessmentLocked,
    isAssessmentPassed, isModuleLocked, isModuleCompleted,
    completeLesson, toggleLessonComplete, refreshCourseProgress, refreshCertificates,
  ]);

  return (
    <CourseProgressContext.Provider value={value}>
      {children}
    </CourseProgressContext.Provider>
  );
}

export function useCourseProgress() {
  const ctx = useContext(CourseProgressContext);
  if (!ctx) throw new Error('useCourseProgress must be used within CourseProgressProvider');
  return ctx;
}
