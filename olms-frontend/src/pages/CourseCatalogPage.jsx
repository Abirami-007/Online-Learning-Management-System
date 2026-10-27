import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllCourses } from '../api/courseApi';
import { useCourseProgress } from '../context/CourseProgressContext';

export default function CourseCatalogPage() {
  const { isEnrolled } = useCourseProgress();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLevel, setFilterLevel] = useState('');

  useEffect(() => {
    getAllCourses().then(res => { setCourses(res.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const categories = [...new Set(courses.map(c => c.category).filter(Boolean))];
  const levels = [...new Set(courses.map(c => c.level).filter(Boolean))];

  const filtered = courses.filter(c => {
    const matchSearch = !search || c.title?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase());
    const matchCat = !filterCategory || c.category === filterCategory;
    const matchLevel = !filterLevel || c.level === filterLevel;
    return matchSearch && matchCat && matchLevel;
  });

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Course Catalog</h1>
        <p>Browse and discover courses to start your learning journey</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <input type="text" className="form-input" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: '320px' }} />
        <select className="form-input" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} style={{ maxWidth: '200px' }}>
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select className="form-input" value={filterLevel} onChange={e => setFilterLevel(e.target.value)} style={{ maxWidth: '200px' }}>
          <option value="">All Levels</option>
          {levels.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h3>No courses found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {filtered.map(course => (
            <Link to={`/courses/${course.id}`} key={course.id} className="card course-card" style={{ textDecoration: 'none' }}>
              <div className="course-card-thumb">📚</div>
              <div className="course-card-body">
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <div className="course-card-meta">
                  {isEnrolled(course.id) && <span className="badge badge-success">✓ Enrolled</span>}
                  {course.category && <span className="badge badge-primary">{course.category}</span>}
                  {course.level && <span className="badge badge-secondary">{course.level}</span>}
                  {course.instructor && <span className="badge badge-warning">{course.instructor}</span>}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
