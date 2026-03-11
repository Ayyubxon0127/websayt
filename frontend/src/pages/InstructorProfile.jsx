import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { instructorService } from '../services/api';
import CourseCard from '../components/CourseCard';

function StarDisplay({ value }) {
  const filled = Math.round(value || 0);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ color: s <= filled ? '#f59e0b' : 'var(--border)', fontSize: 16 }}>★</span>
      ))}
      {value && <span style={{ fontSize: 14, fontWeight: 700, color: '#f59e0b', marginLeft: 4 }}>{value}</span>}
    </span>
  );
}

export default function InstructorProfile() {
  const { username } = useParams();
  const [instructor, setInstructor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    instructorService.profile(username)
      .then(({ data }) => setInstructor(data))
      .catch(() => setError('Instructor not found.'))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (error || !instructor) {
    return (
      <div className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
        <h2>Instructor Not Found</h2>
        <Link to="/courses" className="btn btn-primary" style={{ marginTop: 20 }}>Back to Courses</Link>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Hero */}
      <div style={styles.hero}>
        <div style={styles.heroGlow} />
        <div className="container">
          <div style={styles.heroInner}>
            <div style={styles.avatarWrap}>
              {instructor.avatar ? (
                <img src={instructor.avatar} alt={instructor.full_name} style={styles.avatar} />
              ) : (
                <div style={styles.avatarFallback}>
                  {instructor.full_name?.[0] || instructor.username?.[0] || 'I'}
                </div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 13, color: 'var(--accent-bright)', fontWeight: 600, marginBottom: 6 }}>
                INSTRUCTOR
              </div>
              <h1 style={styles.name}>{instructor.full_name || instructor.username}</h1>
              {instructor.bio && (
                <p style={styles.bio}>{instructor.bio}</p>
              )}
              <div style={styles.statsRow}>
                <div style={styles.stat}>
                  <span style={styles.statValue}>{instructor.total_courses}</span>
                  <span style={styles.statLabel}>Courses</span>
                </div>
                <div style={styles.statDiv} />
                <div style={styles.stat}>
                  <span style={styles.statValue}>{instructor.total_students?.toLocaleString()}</span>
                  <span style={styles.statLabel}>Students</span>
                </div>
                {instructor.avg_rating && (
                  <>
                    <div style={styles.statDiv} />
                    <div style={styles.stat}>
                      <StarDisplay value={instructor.avg_rating} />
                      <span style={styles.statLabel}>Rating</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Courses */}
      <div className="container" style={{ padding: '48px 24px 80px' }}>
        <h2 style={styles.sectionTitle}>Courses by {instructor.full_name || instructor.username}</h2>
        {instructor.courses?.length > 0 ? (
          <div className="courses-grid fade-in">
            {instructor.courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div style={{ fontSize: 48, marginBottom: 12 }}>📚</div>
            <h3>No courses yet</h3>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: { paddingBottom: 0 },
  hero: {
    position: 'relative',
    background: 'var(--bg-card)',
    borderBottom: '1px solid var(--border)',
    padding: '56px 0',
    overflow: 'hidden',
  },
  heroGlow: {
    position: 'absolute',
    inset: 0,
    background: 'radial-gradient(ellipse at 30% 50%, rgba(124,111,205,0.07) 0%, transparent 60%)',
    pointerEvents: 'none',
  },
  heroInner: {
    display: 'flex',
    gap: 32,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  avatarWrap: { flexShrink: 0 },
  avatar: {
    width: 100, height: 100,
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid var(--accent)',
  },
  avatarFallback: {
    width: 100, height: 100,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--accent), var(--accent-bright))',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 40,
    fontWeight: 800,
    textTransform: 'uppercase',
  },
  name: { fontSize: 32, fontWeight: 800, marginBottom: 8 },
  bio: { fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: 600, marginBottom: 20 },
  statsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    flexWrap: 'wrap',
  },
  stat: { display: 'flex', flexDirection: 'column', gap: 2 },
  statDiv: { width: 1, height: 32, background: 'var(--border)' },
  statValue: { fontSize: 22, fontWeight: 800, color: 'var(--accent-bright)' },
  statLabel: { fontSize: 12, color: 'var(--text-muted)' },
  sectionTitle: { fontSize: 24, fontWeight: 700, marginBottom: 24 },
};
