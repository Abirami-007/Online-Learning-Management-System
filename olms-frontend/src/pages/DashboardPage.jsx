import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCourseProgress } from '../context/CourseProgressContext';
import { getAllCourses } from '../api/courseApi';
import { getMyEnrollments } from '../api/enrollmentApi';
import { getAllNotifications } from '../api/notificationApi';

export default function DashboardPage() {
  const { user, role } = useAuth();
  const { completedCoursesCount, getCourseProgress, loaded: progressLoaded } = useCourseProgress();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getAllCourses().catch(() => ({ data: [] })),
      getMyEnrollments().catch(() => ({ data: [] })),
      getAllNotifications().catch(() => ({ data: [] })),
    ]).then(([c, e, n]) => {
      setCourses(c.data || []);
      setEnrollments(e.data || []);
      setNotifications(n.data || []);
      setLoading(false);
    });
  }, []);

  if (loading || !progressLoaded) return <div className="page-loader"><div className="spinner" /></div>;

  const unreadNotifs = notifications.filter(n => !n.read).length;

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back{user?.fullName ? `, ${user.fullName}` : user?.email ? `, ${user.email.split('@')[0]}` : ''}!</h1>
        <p>Your {role?.toLowerCase()} dashboard — here&apos;s what&apos;s happening</p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: '32px' }}>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(79,70,229,0.15)' }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#818cf8" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
          </div>
          <div className="stat-value">{courses.length}</div>
          <div className="stat-label">Total Courses</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6,182,212,0.15)' }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#22d3ee" strokeWidth="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><path d="M20 8v6M23 11h-6"/></svg>
          </div>
          <div className="stat-value">{enrollments.length}</div>
          <div className="stat-label">Enrollments</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)' }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#34d399" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/></svg>
          </div>
          <div className="stat-value" style={{ color: completedCoursesCount > 0 ? '#10b981' : 'inherit' }}>{completedCoursesCount}</div>
          <div className="stat-label">Completed Courses</div>
        </div>
        <div className="card stat-card">
          <div className="stat-icon" style={{ background: 'rgba(245,158,11,0.15)' }}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#fbbf24" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
          </div>
          <div className="stat-value">{unreadNotifs}</div>
          <div className="stat-label">Unread Alerts</div>
        </div>
      </div>

      {/* Course Progress Overview — only enrolled courses, always show even at 0% */}
      {(() => {
        const enrolledCourseIds = new Set(enrollments.map(e => e.courseId));
        const enrolledCourses = courses.filter(c => enrolledCourseIds.has(c.id));
        if (enrolledCourses.length === 0) return null;
        return (
          <>
            <div className="page-header"><h1 style={{ fontSize: '1.3rem' }}>My Course Progress</h1></div>
            <div className="grid grid-3" style={{ marginBottom: '32px' }}>
              {enrolledCourses.map(course => {
                const progress = getCourseProgress(course.id);
                const notStarted = progress === 0;
                return (
                  <Link to={`/learn/${course.id}`} key={course.id} className="card" style={{ textDecoration: 'none', padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: 0, color: 'var(--text-primary)' }}>{course.title}</h4>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: progress === 100 ? '#10b981' : notStarted ? 'var(--text-muted)' : 'var(--primary)' }}>
                        {progress}%
                      </span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                    </div>
                    <div style={{ marginTop: '8px', fontSize: '0.78rem', fontWeight: 600,
                      color: progress === 100 ? '#10b981' : notStarted ? 'var(--text-muted)' : 'var(--primary)' }}>
                      {progress === 100 ? '✓ Course Completed' : notStarted ? '▷ Not Started — Click to Begin' : `In Progress — ${progress}% done`}
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        );
      })()}

      <div className="page-header"><h1 style={{ fontSize: '1.3rem' }}>Quick Actions</h1></div>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <Link to="/catalog" className="btn btn-primary">Browse Courses</Link>
        <Link to="/notifications" className="btn btn-secondary">Notifications {unreadNotifs > 0 && `(${unreadNotifs})`}</Link>
        <Link to="/certificates" className="btn btn-secondary">My Certificates</Link>
        {(role === 'INSTRUCTOR' || role === 'ADMIN') && <Link to="/admin/courses" className="btn btn-secondary">Manage Courses</Link>}
        {role === 'ADMIN' && <Link to="/admin/users" className="btn btn-secondary">Audit Logs</Link>}
      </div>

      {courses.length > 0 && (
        <>
          <div className="page-header"><h1 style={{ fontSize: '1.3rem' }}>Recent Courses</h1></div>
          <div className="grid grid-3">
            {courses.slice(0, 6).map(course => (
              <Link to={`/courses/${course.id}`} key={course.id} className="card course-card" style={{ textDecoration: 'none' }}>
                <div className="course-card-thumb">📚</div>
                <div className="course-card-body">
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <div className="course-card-meta">
                    {course.category && <span className="badge badge-primary">{course.category}</span>}
                    {course.level && <span className="badge badge-secondary">{course.level}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
