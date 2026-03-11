import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { courseService } from '../services/api';
import CourseCard from '../components/CourseCard';
import { CourseGridSkeleton } from '../components/SkeletonLoader';

const LEVELS = [
  { value: '', label: 'All Levels' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
];
const SORT_OPTIONS = [
  { value: '', label: 'Latest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'top_rated', label: 'Top Rated' },
  { value: 'trending', label: 'Trending' },
];

export default function CoursesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debounceTimer, setDebounceTimer] = useState(null);

  const level = searchParams.get('level') || '';
  const category = searchParams.get('category__slug') || '';
  const sort = searchParams.get('sort') || '';

  useEffect(() => {
    courseService.categories().then(({ data }) => setCategories(data.results || data));
  }, []);

  const fetchCourses = useCallback(() => {
    setLoading(true);
    const params = {};
    if (level) params.level = level;
    if (category) params['category__slug'] = category;
    if (searchParams.get('search')) params.search = searchParams.get('search');
    if (searchParams.get('is_featured')) params.is_featured = true;
    if (sort === 'popular') params.popular = true;
    else if (sort === 'top_rated') params.top_rated = true;
    else if (sort === 'trending') params.trending = true;

    courseService.list(params)
      .then(({ data }) => { setCourses(data.results || data); setTotalCount(data.count || (data.results || data).length); })
      .finally(() => setLoading(false));
  }, [level, category, sort, searchParams]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'search') next.delete('search');
    setSearchParams(next);
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    if (debounceTimer) clearTimeout(debounceTimer);
    const t = setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (val.trim()) next.set('search', val.trim()); else next.delete('search');
      setSearchParams(next);
    }, 400);
    setDebounceTimer(t);
  };

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', paddingBlock: 36 }}>
        <div className="container">
          <h1 style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: 6 }}>All Courses</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20 }}>
            {loading ? 'Loading…' : `${totalCount} course${totalCount !== 1 ? 's' : ''} available`}
          </p>
          {/* Search */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', maxWidth: 640 }}>
            <input value={search} onChange={e => handleSearchChange(e.target.value)}
              placeholder="Search courses, topics, instructors…"
              className="form-input" style={{ flex: 1, fontSize: 14 }} />
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28, display: 'flex', gap: 32, alignItems: 'flex-start' }}>
        {/* Sidebar filters */}
        <div style={{ width: 220, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Level */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Level</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {LEVELS.map(l => (
                <button key={l.value} onClick={() => setParam('level', l.value)}
                  style={{ padding: '8px 12px', fontSize: 13, fontWeight: level === l.value ? 600 : 400, borderRadius: 'var(--r-sm)', border: '1px solid', cursor: 'pointer', textAlign: 'left', transition: 'all .15s', background: level === l.value ? 'var(--accent-dim)' : 'var(--bg-elevated)', borderColor: level === l.value ? 'var(--accent)' : 'var(--border)', color: level === l.value ? 'var(--accent-bright)' : 'var(--text-secondary)' }}>
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 10 }}>Category</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <button onClick={() => setParam('category__slug', '')}
                  style={{ padding: '8px 12px', fontSize: 13, fontWeight: !category ? 600 : 400, borderRadius: 'var(--r-sm)', border: '1px solid', cursor: 'pointer', textAlign: 'left', transition: 'all .15s', background: !category ? 'var(--accent-dim)' : 'var(--bg-elevated)', borderColor: !category ? 'var(--accent)' : 'var(--border)', color: !category ? 'var(--accent-bright)' : 'var(--text-secondary)' }}>
                  All Categories
                </button>
                {categories.map(cat => (
                  <button key={cat.id} onClick={() => setParam('category__slug', cat.slug)}
                    style={{ padding: '8px 12px', fontSize: 13, fontWeight: category === cat.slug ? 600 : 400, borderRadius: 'var(--r-sm)', border: '1px solid', cursor: 'pointer', textAlign: 'left', transition: 'all .15s', background: category === cat.slug ? 'var(--accent-dim)' : 'var(--bg-elevated)', borderColor: category === cat.slug ? 'var(--accent)' : 'var(--border)', color: category === cat.slug ? 'var(--accent-bright)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{cat.icon}</span> {cat.name}
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--text-muted)' }}>{cat.course_count}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Course grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Sort bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', marginRight: 4 }}>Sort:</span>
            {SORT_OPTIONS.map(o => (
              <button key={o.value} onClick={() => setParam('sort', o.value)}
                style={{ padding: '5px 14px', fontSize: 12, fontWeight: sort === o.value ? 600 : 400, borderRadius: 99, border: '1px solid', cursor: 'pointer', transition: 'all .15s', background: sort === o.value ? 'var(--accent-dim)' : 'var(--bg-elevated)', borderColor: sort === o.value ? 'var(--accent)' : 'var(--border)', color: sort === o.value ? 'var(--accent-bright)' : 'var(--text-secondary)' }}>
                {o.label}
              </button>
            ))}
            {(level || category || searchParams.get('search')) && (
              <button onClick={() => setSearchParams({})} style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--danger)', background: 'var(--danger-dim)', border: '1px solid rgba(244,63,94,.3)', borderRadius: 99, padding: '5px 12px', cursor: 'pointer' }}>
                ✕ Clear filters
              </button>
            )}
          </div>

          {loading ? (
            <CourseGridSkeleton count={6} />
          ) : courses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <h3>No courses found</h3>
              <p>Try adjusting your search or filters</p>
              <button className="btn btn-primary" onClick={() => setSearchParams({})}>Clear all filters</button>
            </div>
          ) : (
            <div className="courses-grid stagger">
              {courses.map(c => <CourseCard key={c.id} course={c} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
