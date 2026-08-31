import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getAllCourses } from '../api/courseApi';

export default function HomePage() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    getAllCourses().then(res => setCourses(res.data || [])).catch(() => {});
  }, []);

  return (
    <div>
      <section className="hero">
        <h1>Learn Anything, <span>Anywhere</span>, at Your Own Pace</h1>
        <p>Welcome to the Online Learning Management System — your gateway to structured, engaging online education with assessments, certifications, and collaborative learning.</p>
        <div className="hero-actions">
          <Link to="/catalog" className="btn btn-primary btn-lg">Explore Courses</Link>
          <Link to="/login" className="btn btn-secondary btn-lg">Start Teaching</Link>
          <Link to="/login" className="btn btn-secondary btn-lg">Sign In</Link>
        </div>
        <div className="hero-stats">
          <div className="hero-stat-item">
            <div className="hero-stat-value">{courses.length || '0'}</div>
            <div className="hero-stat-label">Courses Available</div>
          </div>
          <div className="hero-stat-item">
            <div className="hero-stat-value">100%</div>
            <div className="hero-stat-label">Free Access</div>
          </div>
          <div className="hero-stat-item">
            <div className="hero-stat-value">24/7</div>
            <div className="hero-stat-label">Learn Anytime</div>
          </div>
        </div>
      </section>

      {courses.length > 0 && (
        <section style={{ marginTop: '48px' }}>
          <div className="page-header">
            <h1>Featured Courses</h1>
            <p>Start your learning journey today</p>
          </div>
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
        </section>
      )}
    </div>
  );
}
