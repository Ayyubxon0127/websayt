import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { StarDisplay } from './StarRating';
import { wishlistService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LEVEL_BADGE = { beginner:'badge-beginner', intermediate:'badge-intermediate', advanced:'badge-advanced' };
const FALLBACKS = [
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&q=80',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=600&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=600&q=80',
  'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&q=80',
];
const getFallback = (id) => FALLBACKS[(id || 0) % FALLBACKS.length];

export default function CourseCard({ course, onWishlistToggle }) {
  const { user } = useAuth();
  const [wishlisted, setWishlisted] = useState(course.is_wishlisted || false);
  const [wishLoading, setWishLoading] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleWishlist = async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!user || wishLoading) return;
    setWishLoading(true);
    try {
      if (wishlisted) { await wishlistService.remove(course.slug); setWishlisted(false); }
      else { await wishlistService.add(course.slug); setWishlisted(true); }
      onWishlistToggle?.(course.slug, !wishlisted);
    } finally { setWishLoading(false); }
  };

  return (
    <Link to={`/courses/${course.slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div className="card" style={{ cursor: 'pointer', height: '100%', display: 'flex', flexDirection: 'column' }}
        onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>

        {/* Thumbnail */}
        <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: 'var(--bg-elevated)', flexShrink: 0 }}>
          <img
            src={course.cover_image || getFallback(course.id)} alt={course.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .45s var(--ease)', transform: hovered ? 'scale(1.06)' : 'scale(1)' }}
            onError={(e) => { e.target.src = getFallback(course.id); }} loading="lazy"
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,transparent 40%,rgba(5,5,14,.65) 100%)', pointerEvents: 'none' }} />

          {course.is_featured && (
            <div style={{ position: 'absolute', top: 10, left: 10 }}>
              <span className="badge badge-gold" style={{ fontSize: 10 }}>⭐ Featured</span>
            </div>
          )}
          {course.total_duration_display && (
            <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(5,5,14,.78)', backdropFilter: 'blur(8px)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              ⏱ {course.total_duration_display}
            </div>
          )}
          {user && (
            <button onClick={handleWishlist} disabled={wishLoading}
              style={{ position: 'absolute', top: 8, right: 8, width: 32, height: 32, borderRadius: '50%', border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, cursor: 'pointer', transition: 'all .2s', backdropFilter: 'blur(8px)', opacity: hovered ? 1 : 0, color: wishlisted ? 'var(--danger)' : '#fff', background: wishlisted ? 'rgba(244,63,94,.15)' : 'rgba(0,0,0,.5)', borderColor: wishlisted ? 'rgba(244,63,94,.4)' : 'rgba(255,255,255,.15)' }}>
              {wishlisted ? '❤️' : '🤍'}
            </button>
          )}
          {course.is_enrolled && (
            <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(16,185,129,.15)', color: 'var(--success)', border: '1px solid rgba(16,185,129,.3)', borderRadius: 99, fontSize: 10, fontWeight: 700, padding: '3px 8px', backdropFilter: 'blur(8px)' }}>
              ✓ Enrolled
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '15px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className={`badge ${LEVEL_BADGE[course.level] || 'badge-accent'}`}>{course.level}</span>
            {course.category && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{course.category.icon} {course.category.name}</span>}
          </div>
          <h3 className="line-clamp-2" style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.35, fontFamily: 'var(--font-display)' }}>{course.title}</h3>
          <p className="line-clamp-2" style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, flex: 1 }}>{course.short_description}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
            <StarDisplay rating={course.avg_rating || 0} size={12} showNumber={!!course.avg_rating} reviewCount={course.review_count} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>📹 {course.lesson_count}</span>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>👥 {course.enrollment_count}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border-sub)' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--accent-dim)', color: 'var(--accent-bright)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>
              {(course.instructor?.full_name || 'I')[0].toUpperCase()}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{course.instructor?.full_name || 'Instructor'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
