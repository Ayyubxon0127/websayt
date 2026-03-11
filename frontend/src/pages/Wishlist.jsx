import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { wishlistService } from '../services/api';
import CourseCard from '../components/CourseCard';
import { CourseGridSkeleton } from '../components/SkeletonLoader';

export default function Wishlist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    wishlistService.list().then(({ data }) => setItems(data)).finally(() => setLoading(false));
  }, []);

  const handleRemove = async (slug) => {
    await wishlistService.remove(slug);
    setItems(p => p.filter(i => i.course.slug !== slug));
  };

  return (
    <div style={{ minHeight: '100vh', padding: '52px 0' }}>
      <div className="container">
        <div style={{ marginBottom: 36 }} className="slide-up">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-bright)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>Saved</div>
          <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: 'var(--font-display)' }}>My Wishlist ❤️</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>{items.length} course{items.length !== 1 ? 's' : ''} saved</p>
        </div>

        {loading ? <CourseGridSkeleton count={4} /> : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">❤️</div>
            <h3>Your wishlist is empty</h3>
            <p>Save courses you'd like to take later</p>
            <Link to="/courses" className="btn btn-primary">Browse Courses</Link>
          </div>
        ) : (
          <div className="courses-grid stagger">
            {items.map(({ id, course }) => (
              <div key={id} style={{ position: 'relative' }}>
                <button onClick={() => handleRemove(course.slug)}
                  style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, width: 30, height: 30, borderRadius: '50%', background: 'rgba(244,63,94,.15)', border: '1px solid rgba(244,63,94,.3)', color: 'var(--danger)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transition: 'all .15s' }}>
                  ✕
                </button>
                <CourseCard course={{ ...course, is_wishlisted: true }} onWishlistToggle={() => handleRemove(course.slug)} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
