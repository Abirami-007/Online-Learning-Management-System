import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { getAllCourses } from '../api/courseApi';
import { getModulesByCourseId } from '../api/moduleApi';
import { getLessonsByModuleId } from '../api/lessonApi';
import { getMyCertificates } from '../api/certificateApi';

const CourseProgressContext = createContext(null);

export function CourseProgressProvider({ children }) {
  const { user } = useAuth();
  // Unique storage prefix per user — prevents cross-user data leakage in localStorage
  const storagePrefix = user?.id ? `olms_completed_lessons_${user.id}_` : 'olms_completed_lessons_guest_';
  // Maps: courseId -> array of completed lesson IDs
  const [completedMap, setCompletedMap] = useState({});
  // Maps: courseId -> total lesson count
  const [totalLessonsMap, setTotalLessonsMap] = useState({});
  // Set of course IDs that have certificates
  const [certifiedCourseIds, setCertifiedCourseIds] = useState(new Set());
  const [loaded, setLoaded] = useState(false);

  // On mount (or when user changes), load ALL course data and localStorage state
  useEffect(() => {
    // Reset state on user change
    setCompletedMap({});
    setTotalLessonsMap({});
    setCertifiedCourseIds(new Set());
    setLoaded(false);
    (async () => {
      try {
        const [coursesRes, certsRes] = await Promise.all([
          getAllCourses().catch(() => ({ data: [] })),
          getMyCertificates().catch(() => ({ data: [] })),
        ]);

        const courses = coursesRes.data || [];
        const certs = certsRes.data || [];

        // Build certified course IDs
        const certIds = new Set(certs.map(c => c.course?.id).filter(Boolean));
        setCertifiedCourseIds(certIds);

        // Build totalLessons and completedLessons maps per course
        const totals = {};
        const completed = {};

        await Promise.all(courses.map(async (course) => {
          const cid = course.id;

                  // Load saved completed lessons from localStorage (keyed by userId)
          try {
            const saved = localStorage.getItem(`${storagePrefix}${cid}`);
            completed[cid] = saved ? JSON.parse(saved) : [];
          } catch {
            completed[cid] = [];
          }

          // Fetch total lesson count
          try {
            const modsRes = await getModulesByCourseId(cid);
            const mods = modsRes.data || [];
            let count = 0;
            for (const m of mods) {
              try {
                const lr = await getLessonsByModuleId(m.id);
                count += (lr.data || []).length;
              } catch {}
            }
            totals[cid] = count;
          } catch {
            totals[cid] = 0;
          }
        }));

        setTotalLessonsMap(totals);
        setCompletedMap(completed);
      } catch {
        // Fail silently — progress just stays empty
      } finally {
        setLoaded(true);
      }
    })();
  }, [user?.id]);  // Re-run whenever the logged-in user changes

  // Mark a lesson as completed or uncompleted for a given course
  const toggleLessonComplete = useCallback((courseId, lessonId) => {
    setCompletedMap(prev => {
      const current = prev[courseId] || [];
      let updated;
      if (current.includes(lessonId)) {
        updated = current.filter(id => id !== lessonId);
      } else {
        updated = [...current, lessonId];
      }
      const next = { ...prev, [courseId]: updated };

      // Persist to localStorage (scoped by userId)
      try {
        localStorage.setItem(`${storagePrefix}${courseId}`, JSON.stringify(updated));
      } catch {}

      return next;
    });
  }, [storagePrefix]);

  // Get completed lesson IDs for a specific course
  const getCompletedLessons = useCallback((courseId) => {
    return completedMap[courseId] || [];
  }, [completedMap]);

  // Check if a specific lesson is completed
  const isLessonCompleted = useCallback((courseId, lessonId) => {
    return (completedMap[courseId] || []).includes(lessonId);
  }, [completedMap]);

  // Get the total lesson count for a course
  const getTotalLessons = useCallback((courseId) => {
    return totalLessonsMap[courseId] || 0;
  }, [totalLessonsMap]);

  // Check if a course is fully completed (100% lessons done OR has certificate)
  const isCourseCompleted = useCallback((courseId) => {
    if (certifiedCourseIds.has(courseId)) return true;
    const total = totalLessonsMap[courseId] || 0;
    const completed = (completedMap[courseId] || []).length;
    return total > 0 && completed >= total;
  }, [completedMap, totalLessonsMap, certifiedCourseIds]);

  // Count of fully completed courses across entire app
  const completedCoursesCount = useMemo(() => {
    const ids = new Set();
    // Courses with certificates
    certifiedCourseIds.forEach(id => ids.add(id));
    // Courses where all lessons are done
    for (const [courseId, completedArr] of Object.entries(completedMap)) {
      const cid = Number(courseId);
      const total = totalLessonsMap[cid] || 0;
      if (total > 0 && completedArr.length >= total) {
        ids.add(cid);
      }
    }
    return ids.size;
  }, [completedMap, totalLessonsMap, certifiedCourseIds]);

  // Get progress percentage for a specific course
  const getCourseProgress = useCallback((courseId) => {
    const total = totalLessonsMap[courseId] || 0;
    const completed = (completedMap[courseId] || []).length;
    if (total === 0) return 0;
    return Math.round((completed / total) * 100);
  }, [completedMap, totalLessonsMap]);

  // Reload certificates (e.g., after passing a quiz)
  const refreshCertificates = useCallback(async () => {
    try {
      const certsRes = await getMyCertificates();
      const certs = certsRes.data || [];
      setCertifiedCourseIds(new Set(certs.map(c => c.course?.id).filter(Boolean)));
    } catch {}
  }, []);

  const value = useMemo(() => ({
    loaded,
    completedMap,
    totalLessonsMap,
    toggleLessonComplete,
    getCompletedLessons,
    isLessonCompleted,
    getTotalLessons,
    isCourseCompleted,
    completedCoursesCount,
    getCourseProgress,
    refreshCertificates,
    certifiedCourseIds,
  }), [loaded, completedMap, totalLessonsMap, toggleLessonComplete, getCompletedLessons,
       isLessonCompleted, getTotalLessons, isCourseCompleted, completedCoursesCount,
       getCourseProgress, refreshCertificates, certifiedCourseIds]);

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
