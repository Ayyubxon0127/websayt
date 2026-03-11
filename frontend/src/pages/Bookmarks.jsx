import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { bookmarkService } from '../services/api';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bookmarkService.list().then(({ data }) => setBookmarks(data)).finally(() => setLoading(false));
  }, []);

  const handleRemove = async (lessonId) => {
    await bookmarkService.remove(lessonId);
    setBookmarks(p => p.filter(b => b.lesson_id !== lessonId));
  };

  return (
    <div style={{ minHeight: '100vh', padding: '52px 0' }}>
      <div className="container-sm">
        <div style={{ marginBottom: 36 }} className="slide-up">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-bright)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>Saved Lessons</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)' }}>Bookmarks 🔖</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>{bookmarks.length} lesson{bookmarks.length !== 1 ? 's' : ''} bookmarked</p>
        </div>

        {loading ? (
          <div className="loading-center"><div className="spinner" /></div>
        ) : bookmarks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔖</div>
            <h3>No bookmarks yet</h3>
            <p>Bookmark lessons while learning to reference later</p>
            <Link to="/courses" className="btn btn-primary">Browse Courses</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} className="stagger">
            {bookmarks.map(b => (
              <div key={b.id} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '18px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', transition: 'border-color .2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,.35)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{ width: 42, height: 42, borderRadius: 'var(--r-sm)', background: 'var(--accent-dim)', color: 'var(--accent-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🔖</div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <Link to={`/learn/${b.course_slug}?lesson=${b.lesson_id}`}
                    style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', textDecoration: 'none', display: 'block', marginBottom: 4, transition: 'color .15s' }}
                    onMouseEnter={e => e.target.style.color = 'var(--accent-bright)'}
                    onMouseLeave={e => e.target.style.color = 'var(--text-primary)'}>
                    {b.lesson_title}
                  </Link>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    📚 {b.course_title} <span style={{ margin: '0 6px' }}>·</span>
                    <Link to={`/learn/${b.course_slug}?lesson=${b.lesson_id}`} style={{ color: 'var(--accent-bright)', fontWeight: 600 }}>Go to Lesson →</Link>
                  </div>
                  {b.note && <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6, borderLeft: '2px solid var(--accent)', fontStyle: 'italic' }}>{b.note}</div>}
                </div>
                <button onClick={() => handleRemove(b.lesson_id)} className="btn btn-ghost btn-xs" style={{ flexShrink: 0, color: 'var(--danger)' }}>Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
