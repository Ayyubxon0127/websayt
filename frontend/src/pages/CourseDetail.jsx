import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseService, reviewService, wishlistService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StarDisplay, StarPicker, RatingBreakdown } from '../components/StarRating';

const LEVEL_BADGE = { beginner: 'badge-beginner', intermediate: 'badge-intermediate', advanced: 'badge-advanced' };
const FALLBACKS = [
  'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=900&q=80',
  'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&q=80',
  'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=900&q=80',
];

function timeAgo(d) {
  if (!d) return '';
  const days = Math.floor((Date.now() - new Date(d)) / 86400000);
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return new Date(d).toLocaleDateString();
}

export default function CourseDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [expandCurriculum, setExpandCurriculum] = useState(false);
  const [wishloading, setWishloading] = useState(false);

  useEffect(() => {
    setLoading(true);
    courseService.detail(slug)
      .then(({ data }) => setCourse(data))
      .catch(() => navigate('/courses'))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  const handleEnroll = async () => {
    if (!user) { navigate('/login', { state: { from: `/courses/${slug}` } }); return; }
    setEnrolling(true);
    try {
      await courseService.enroll(slug);
      setCourse(p => ({ ...p, is_enrolled: true, enrollment_count: (p.enrollment_count || 0) + 1 }));
    } finally { setEnrolling(false); }
  };

  const handleWishlist = async () => {
    if (!user) { navigate('/login'); return; }
    setWishloading(true);
    try {
      if (course.is_wishlisted) { await wishlistService.remove(slug); }
      else { await wishlistService.add(slug); }
      setCourse(p => ({ ...p, is_wishlisted: !p.is_wishlisted }));
    } finally { setWishloading(false); }
  };

  const submitReview = async () => {
    setReviewLoading(true);
    try {
      const { data } = await reviewService.create(slug, reviewData);
      setCourse(p => ({ ...p, user_review: data, review_count: (p.review_count || 0) + 1 }));
      setShowReviewForm(false);
    } finally { setReviewLoading(false); }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', paddingTop: 60 }}>
        <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="skeleton" style={{ height: 52 }} />
            <div className="skeleton" style={{ height: 20, width: '70%' }} />
            <div className="skeleton" style={{ height: 440, borderRadius: 16 }} />
          </div>
          <div className="skeleton" style={{ height: 480, borderRadius: 16 }} />
        </div>
      </div>
    );
  }

  if (!course) return null;

  const lessons = course.lessons || [];
  const freeCount = lessons.filter(l => l.is_free_preview).length;
  const visibleLessons = expandCurriculum ? lessons : lessons.slice(0, 6);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 80 }}>
      {/* Hero banner */}
      <div style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', paddingTop: 44, paddingBottom: 48 }}>
        <div className="container">
          <div style={{ maxWidth: 820 }}>
            {course.category && (
              <Link to={`/courses?category__slug=${course.category.slug}`} style={{ textDecoration: 'none', display: 'inline-block', marginBottom: 14 }}>
                <span className="badge badge-accent">{course.category.icon} {course.category.name}</span>
              </Link>
            )}
            <h1 style={{ fontSize: 30, fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1.2, marginBottom: 14 }}>
              {course.title}
            </h1>
            {course.short_description && (
              <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 18 }}>
                {course.short_description}
              </p>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              {course.avg_rating && <StarDisplay rating={course.avg_rating} size={14} showNumber reviewCount={course.review_count} />}
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>👥 {course.enrollment_count?.toLocaleString()} students</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>📹 {course.lesson_count} lessons</span>
              {course.total_duration_display && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>⏱ {course.total_duration_display}</span>}
              {course.language && <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>🌐 {course.language}</span>}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span className={`badge ${LEVEL_BADGE[course.level] || 'badge-accent'}`}>{course.level}</span>
              {course.instructor && (
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  by <span style={{ fontWeight: 600 }}>{course.instructor.full_name}</span>
                </span>
              )}
              {course.is_featured && <span className="badge badge-gold">⭐ Featured</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 40, display: 'grid', gridTemplateColumns: '1fr min(360px,100%)', gap: 48, alignItems: 'start' }}>
        {/* Left col */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40, minWidth: 0 }}>

          {/* What you'll learn */}
          {course.what_you_learn?.length > 0 && (
            <section>
              <h2 style={{ fontSize: 19, fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>What you'll learn</h2>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '22px 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 10 }}>
                  {course.what_you_learn.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 14 }}>
                      <span style={{ color: 'var(--success)', flexShrink: 0, marginTop: 2 }}>✓</span>
                      <span style={{ color: 'var(--text-secondary)', lineHeight: 1.45 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Requirements */}
          {course.requirements?.length > 0 && (
            <section>
              <h2 style={{ fontSize: 19, fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 14 }}>Requirements</h2>
              <ul style={{ paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {course.requirements.map((r, i) => (
                  <li key={i} style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{r}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Curriculum */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 19, fontFamily: 'var(--font-display)', fontWeight: 700 }}>Course Curriculum</h2>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {lessons.length} lessons{freeCount > 0 ? ` · ${freeCount} free` : ''}
              </span>
            </div>
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
              {visibleLessons.map((lesson, i) => (
                <div key={lesson.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: i < visibleLessons.length - 1 || lessons.length > 6 ? '1px solid var(--border-sub)' : 'none' }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
                    {lesson.is_locked ? '🔒' : i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{lesson.title}</div>
                    {lesson.description && (
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
                        {lesson.description.slice(0, 75)}{lesson.description.length > 75 ? '…' : ''}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {lesson.is_free_preview && <span className="badge badge-sky" style={{ fontSize: 10 }}>Free</span>}
                    {lesson.duration_minutes > 0 && <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lesson.duration_minutes}m</span>}
                  </div>
                </div>
              ))}
              {lessons.length > 6 && (
                <button onClick={() => setExpandCurriculum(p => !p)}
                  style={{ width: '100%', padding: '12px', fontSize: 13, fontWeight: 600, color: 'var(--accent-bright)', background: 'none', border: 'none', borderTop: '1px solid var(--border)', cursor: 'pointer' }}>
                  {expandCurriculum ? '↑ Show less' : `↓ Show ${lessons.length - 6} more lessons`}
                </button>
              )}
            </div>
          </section>

          {/* Instructor */}
          {course.instructor && (
            <section>
              <h2 style={{ fontSize: 19, fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 16 }}>Your Instructor</h2>
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '24px', display: 'flex', gap: 18 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                  {(course.instructor.full_name || 'I')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 2 }}>{course.instructor.full_name}</div>
                  {course.instructor.course_count > 0 && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>{course.instructor.course_count} courses published</div>
                  )}
                  {course.instructor.bio && <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{course.instructor.bio}</p>}
                  {(course.instructor.website || course.instructor.linkedin) && (
                    <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                      {course.instructor.website && <a href={course.instructor.website} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--accent-bright)' }}>🌐 Website</a>}
                      {course.instructor.linkedin && <a href={`https://linkedin.com/in/${course.instructor.linkedin}`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: 'var(--sky)' }}>💼 LinkedIn</a>}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* Reviews */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <h2 style={{ fontSize: 19, fontFamily: 'var(--font-display)', fontWeight: 700 }}>
                Reviews {course.review_count > 0 && <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--text-muted)' }}>({course.review_count})</span>}
              </h2>
              {course.is_enrolled && !course.user_review && (
                <button onClick={() => setShowReviewForm(p => !p)} className="btn btn-outline btn-sm">
                  {showReviewForm ? 'Cancel' : '+ Write Review'}
                </button>
              )}
            </div>

            {course.avg_rating && course.rating_breakdown?.length > 0 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '24px', marginBottom: 20, display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 52, fontFamily: 'var(--font-display)', fontWeight: 800, color: 'var(--gold)', lineHeight: 1 }}>{Number(course.avg_rating).toFixed(1)}</div>
                  <StarDisplay rating={course.avg_rating} size={16} />
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{course.review_count} reviews</div>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <RatingBreakdown breakdown={course.rating_breakdown} />
                </div>
              </div>
            )}

            {showReviewForm && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(99,102,241,.3)', borderRadius: 'var(--r-md)', padding: '24px', marginBottom: 20 }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16 }}>Write Your Review</h3>
                <div style={{ marginBottom: 16 }}>
                  <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>Your Rating</label>
                  <StarPicker value={reviewData.rating} onChange={r => setReviewData(p => ({ ...p, rating: r }))} size={32} />
                </div>
                <div className="form-group" style={{ marginBottom: 16 }}>
                  <label className="form-label">Comment</label>
                  <textarea className="form-textarea" rows={4} placeholder="Share your experience with this course…"
                    value={reviewData.comment} onChange={e => setReviewData(p => ({ ...p, comment: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-primary" onClick={submitReview} disabled={reviewLoading}>{reviewLoading ? 'Submitting…' : 'Submit Review'}</button>
                  <button className="btn btn-secondary" onClick={() => setShowReviewForm(false)}>Cancel</button>
                </div>
              </div>
            )}

            {course.user_review && (
              <div style={{ background: 'var(--success-dim)', border: '1px solid rgba(16,185,129,.25)', borderRadius: 'var(--r-md)', padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ color: 'var(--success)' }}>✓</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>You reviewed this course: </span>
                <StarDisplay rating={course.user_review.rating} size={13} showNumber />
              </div>
            )}

            {course.reviews?.length > 0 ? (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                {course.reviews.map((r, i) => (
                  <div key={r.id} style={{ padding: '18px 20px', borderBottom: i < course.reviews.length - 1 ? '1px solid var(--border-sub)' : 'none' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'var(--accent-bright)', flexShrink: 0 }}>
                        {(r.user?.full_name || r.user?.username || '?')[0].toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{r.user?.full_name || r.user?.username}</span>
                          <StarDisplay rating={r.rating} size={12} />
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(r.created_at)}</span>
                        </div>
                        {r.comment && <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{r.comment}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '36px', textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text-muted)', fontSize: 14 }}>
                No reviews yet. Be the first!
              </div>
            )}
          </section>
        </div>

        {/* Sticky Sidebar */}
        <div style={{ position: 'sticky', top: 80 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ aspectRatio: '16/9', background: 'var(--bg-elevated)', overflow: 'hidden', position: 'relative' }}>
              <img src={course.cover_image || FALLBACKS[course.id % 3]} alt={course.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={e => e.target.src = FALLBACKS[0]} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,5,14,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(99,102,241,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
              </div>
            </div>

            <div style={{ padding: '24px' }}>
              {course.is_enrolled ? (
                <Link to={`/courses/${slug}/learn/${lessons[0]?.id || ''}`} className="btn btn-success btn-lg"
                  style={{ width: '100%', justifyContent: 'center', display: 'flex', marginBottom: 10, textDecoration: 'none' }}>
                  ▶ Continue Learning
                </Link>
              ) : (
                <button onClick={handleEnroll} className="btn btn-primary btn-lg" disabled={enrolling}
                  style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}>
                  {enrolling ? 'Enrolling…' : 'Enroll for Free →'}
                </button>
              )}

              {user && (
                <button onClick={handleWishlist} disabled={wishloading}
                  className="btn btn-secondary btn-sm" style={{ width: '100%', justifyContent: 'center', marginBottom: 20 }}>
                  {course.is_wishlisted ? '❤️ Wishlisted' : '🤍 Add to Wishlist'}
                </button>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['📹', `${lessons.length} lessons`],
                  ['⏱', course.total_duration_display || '—'],
                  ['📊', course.level],
                  ['🌐', course.language || 'English'],
                  ['👥', `${course.enrollment_count?.toLocaleString()} students`],
                  ['⭐', course.avg_rating ? `${Number(course.avg_rating).toFixed(1)} rating (${course.review_count} reviews)` : 'No ratings yet'],
                ].map(([icon, val]) => (
                  <div key={icon} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
                    <span style={{ width: 20, textAlign: 'center' }}>{icon}</span>
                    <span style={{ textTransform: 'capitalize' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
