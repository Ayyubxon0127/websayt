import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { courseService } from '../services/api';
import CourseCard from '../components/CourseCard';
import { CourseGridSkeleton } from '../components/SkeletonLoader';
import { useAuth } from '../context/AuthContext';

const CATEGORY_ICONS = { '': '🎓' };

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [featured, setFeatured] = useState([]);
  const [trending, setTrending] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    courseService.categories().then(({ data }) => setCategories(data.results || data));
    courseService.featured().then(({ data }) => setFeatured((data.results || data).slice(0, 3))).finally(() => setLoadingFeatured(false));
    courseService.trending().then(({ data }) => setTrending((data.results || data).slice(0, 6))).finally(() => setLoadingTrending(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQ.trim()) navigate(`/courses?search=${encodeURIComponent(searchQ.trim())}`);
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero */}
      <section style={{ position: 'relative', overflow: 'hidden', paddingTop: 80, paddingBottom: 80 }}>
        {/* Background orbs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,.18) 0%,transparent 70%)', top: -200, right: -100 }} />
          <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,.12) 0%,transparent 70%)', bottom: -100, left: -50 }} />
          <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(56,189,248,.08) 0%,transparent 70%)', top: 80, left: '30%' }} />
        </div>

        <div className="container" style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div className="slide-up">
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--accent-muted)', border: '1px solid rgba(99,102,241,.2)', borderRadius: 99, padding: '6px 16px', fontSize: 13, fontWeight: 600, color: 'var(--accent-bright)', marginBottom: 24 }}>
              🚀 The future of learning is here
            </div>
            <h1 style={{ fontSize: 'clamp(36px,7vw,66px)', fontFamily: 'var(--font-display)', fontWeight: 800, lineHeight: 1.1, marginBottom: 20, maxWidth: 820, margin: '0 auto 20px' }}>
              Master any skill with<br />
              <span className="gradient-text">expert-led courses</span>
            </h1>
            <p style={{ fontSize: 18, color: 'var(--text-secondary)', lineHeight: 1.65, maxWidth: 560, margin: '0 auto 40px' }}>
              Join thousands of learners building real-world skills through video lessons, quizzes, and certificates.
            </p>

            {/* Search */}
            <form onSubmit={handleSearch} style={{ maxWidth: 520, margin: '0 auto 40px', display: 'flex', gap: 10 }}>
              <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder="What do you want to learn today?"
                className="form-input" style={{ flex: 1, fontSize: 15, height: 50 }} />
              <button type="submit" className="btn btn-primary" style={{ height: 50, paddingInline: 24 }}>Search →</button>
            </form>

            {/* Stats */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 36, flexWrap: 'wrap' }}>
              {[['50+','Courses'],['500+','Lessons'],['10K+','Learners'],['4.8★','Rating']].map(([val, lbl]) => (
                <div key={lbl} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent-bright)' }}>{val}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section style={{ paddingBlock: 56, borderTop: '1px solid var(--border)' }}>
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Browse by Category</h2>
              <Link to="/courses" className="section-link">View all →</Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 14 }} className="stagger">
              {categories.map(cat => (
                <Link key={cat.id} to={`/courses?category__slug=${cat.slug}`} style={{ textDecoration: 'none' }}>
                  <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '20px 16px', textAlign: 'center', transition: 'all .2s var(--ease)', cursor: 'pointer' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = cat.color || 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${cat.color || 'var(--accent)'}22`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{cat.icon || '📚'}</div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{cat.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{cat.course_count} course{cat.course_count !== 1 ? 's' : ''}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Featured */}
      <section style={{ paddingBlock: 56, borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">⭐ Featured Courses</h2>
            <Link to="/courses?is_featured=true" className="section-link">See all →</Link>
          </div>
          {loadingFeatured ? <CourseGridSkeleton count={3} /> : (
            featured.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No featured courses yet.</div>
            ) : (
              <div className="courses-grid stagger">
                {featured.map(c => <CourseCard key={c.id} course={c} />)}
              </div>
            )
          )}
        </div>
      </section>

      {/* Trending */}
      <section style={{ paddingBlock: 56, borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">🔥 Trending Now</h2>
            <Link to="/courses" className="section-link">View all →</Link>
          </div>
          {loadingTrending ? <CourseGridSkeleton count={6} /> : (
            trending.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No courses yet.</div>
            ) : (
              <div className="courses-grid stagger">
                {trending.map((c, i) => (
                  <div key={c.id} style={{ position: 'relative' }}>
                    {i < 3 && (
                      <div style={{ position: 'absolute', top: -8, left: -8, zIndex: 10, width: 28, height: 28, borderRadius: '50%', background: ['#f59e0b','#6b7280','#b45309'][i], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,.4)', border: '2px solid var(--bg-card)' }}>
                        #{i + 1}
                      </div>
                    )}
                    <CourseCard course={c} />
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </section>

      {/* Platform Features */}
      <section style={{ paddingBlock: 72, borderTop: '1px solid var(--border)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <h2 style={{ fontSize: 'clamp(24px,4vw,36px)', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: 12 }}>
              Everything you need to <span className="gradient-text">level up</span>
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 500, margin: '0 auto' }}>A complete learning platform built for serious learners.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 20 }} className="stagger">
            {[
              { icon: '📹', title: 'HD Video Lessons', desc: 'Crystal clear video content with resume support so you never lose your spot.' },
              { icon: '📝', title: 'Interactive Quizzes', desc: 'Test your knowledge with auto-graded quizzes after every lesson.' },
              { icon: '🏆', title: 'Completion Certificates', desc: 'Earn verifiable certificates to showcase your new skills.' },
              { icon: '🔥', title: 'Learning Streaks', desc: 'Build daily habits and track your progress with streak tracking.' },
              { icon: '🔖', title: 'Bookmark & Notes', desc: 'Save important lessons and add notes for future reference.' },
              { icon: '📊', title: 'Progress Tracking', desc: 'Detailed analytics on your learning journey and completion rates.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '24px', transition: 'border-color .2s,transform .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,.35)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{icon}</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 7, fontFamily: 'var(--font-display)' }}>{title}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!user && (
        <section style={{ paddingBlock: 72, borderTop: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          <div className="container" style={{ textAlign: 'center' }}>
            <div style={{ maxWidth: 560, margin: '0 auto' }}>
              <h2 style={{ fontSize: 'clamp(24px,4vw,38px)', fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: 14 }}>
                Ready to start learning?
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15, marginBottom: 32, lineHeight: 1.65 }}>
                Create a free account and get access to all courses, certificates, and learning tools.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/register" className="btn btn-primary btn-lg">Start Learning Free →</Link>
                <Link to="/courses" className="btn btn-secondary btn-lg">Browse Courses</Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
