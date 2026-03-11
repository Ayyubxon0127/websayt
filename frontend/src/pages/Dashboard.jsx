import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { progressService, courseService, quizService } from '../services/api';
import { useAuth } from '../context/AuthContext';

function timeAgo(d) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function Dashboard() {
  const { user, isAdmin, isInstructor } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [quizHistory, setQuizHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [activeSection, setActiveSection] = useState('courses');

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (isInstructor && !isAdmin) { navigate('/instructor', { replace: true }); return; }
    Promise.all([
      progressService.dashboardStats(),
      courseService.myEnrollments(),
      quizService.myHistory(),
    ])
      .then(([s, e, q]) => {
        setStats(s.data);
        setEnrollments(e.data.results || e.data);
        setQuizHistory(q.data || []);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const filteredEnrollments = enrollments.filter(e =>
    tab === 'all' ? true : tab === 'in_progress' ? !e.completed : e.completed
  );

  const inProgress = enrollments.filter(e => !e.completed && e.progress_percentage > 0);
  const continueLearning = inProgress.sort((a, b) => new Date(b.last_accessed) - new Date(a.last_accessed))[0];

  if (loading) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  const streak = stats?.streak || {};

  return (
    <div style={{ minHeight: '100vh', padding: '40px 0' }}>
      <div className="container">
        {/* Role-based quick links */}
        {(isAdmin || isInstructor) && (
          <div style={{ marginBottom: 24, display: 'flex', gap: 10 }}>
            {isAdmin && (
              <Link to="/admin-panel" style={{ padding: '8px 18px', background: '#ef444422', color: '#ef4444', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700, border: '1px solid #ef444444' }}>
                ⚡ Admin Panel
              </Link>
            )}
            {isInstructor && (
              <Link to="/instructor" style={{ padding: '8px 18px', background: '#f59e0b22', color: '#f59e0b', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700, border: '1px solid #f59e0b44' }}>
                🎓 Instructor Dashboard
              </Link>
            )}
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: 32 }} className="slide-up">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-bright)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>
            {isAdmin ? 'Admin' : isInstructor ? 'Instructor' : 'Student'} Dashboard
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 6 }}>
            Welcome back, {user?.first_name || user?.username}! {streak.current > 0 ? '🔥' : '👋'}
          </h1>
          {streak.current > 0 && (
            <p style={{ color: 'var(--text-secondary)' }}>
              You're on a <strong style={{ color: '#f59e0b' }}>{streak.current}-day streak</strong> — keep it up!
            </p>
          )}
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 14, marginBottom: 32 }} className="stagger">
          {[
            { key: 'total_enrolled', label: 'Enrolled', icon: '📚', color: '#6366f1', bg: 'rgba(99,102,241,.1)', val: stats?.total_enrolled ?? 0 },
            { key: 'in_progress', label: 'In Progress', icon: '▶️', color: '#f59e0b', bg: 'rgba(245,158,11,.1)', val: stats?.in_progress ?? 0 },
            { key: 'completed', label: 'Completed', icon: '🏆', color: '#10b981', bg: 'rgba(16,185,129,.1)', val: stats?.completed ?? 0 },
            { key: 'streak', label: 'Day Streak', icon: '🔥', color: '#f59e0b', bg: 'rgba(245,158,11,.08)', val: streak.current ?? 0, sub: `Best: ${streak.longest ?? 0}` },
            { key: 'watch', label: 'Watch Time', icon: '⏱', color: '#38bdf8', bg: 'rgba(56,189,248,.08)', val: streak.total_watch_minutes >= 60 ? `${Math.round(streak.total_watch_minutes / 60)}h` : `${streak.total_watch_minutes ?? 0}m`, isStr: true },
            { key: 'lessons', label: 'Lessons Done', icon: '✅', color: '#10b981', bg: 'rgba(16,185,129,.08)', val: streak.total_lessons ?? 0 },
          ].map(s => (
            <div key={s.key}
              style={{ padding: '18px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, transition: 'border-color .2s,transform .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = s.color + '55'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = ''; }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, marginBottom: 10 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', color: s.color, marginBottom: 2 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</div>
              {s.sub && <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        {/* Continue Learning Banner */}
        {continueLearning && (
          <Link to={`/learn/${continueLearning.course.slug}`} style={{ textDecoration: 'none' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--accent-dim), rgba(99,102,241,.15))', border: '1px solid var(--accent-bright)', borderRadius: 12, padding: '18px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(99,102,241,.2), rgba(99,102,241,.1))'}
              onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, var(--accent-dim), rgba(99,102,241,.15))'}>
              {continueLearning.course.cover_image && (
                <img src={continueLearning.course.cover_image} alt="" style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-bright)', textTransform: 'uppercase', marginBottom: 3 }}>Continue Learning</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{continueLearning.course.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,.15)', borderRadius: 2, overflow: 'hidden', maxWidth: 200 }}>
                    <div style={{ height: '100%', width: `${continueLearning.progress_percentage}%`, background: 'var(--accent-bright)', borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--accent-bright)', fontWeight: 700 }}>{continueLearning.progress_percentage}%</span>
                </div>
              </div>
              <span style={{ fontSize: 20, color: 'var(--accent-bright)' }}>▶</span>
            </div>
          </Link>
        )}

        {/* Section tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[
            { id: 'courses', label: 'My Courses' },
            { id: 'quizzes', label: 'Quiz History' },
          ].map(t => (
            <button key={t.id} onClick={() => setActiveSection(t.id)}
              style={{ padding: '8px 18px', borderRadius: 8, border: '1px solid var(--border)', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: activeSection === t.id ? 'var(--accent-bright)' : 'var(--bg-card)', color: activeSection === t.id ? '#fff' : 'var(--text-secondary)', transition: 'all .15s' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* COURSES SECTION */}
        {activeSection === 'courses' && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[
                { id: 'all', label: `All (${enrollments.length})` },
                { id: 'in_progress', label: `In Progress (${stats?.in_progress ?? 0})` },
                { id: 'completed', label: `Completed (${stats?.completed ?? 0})` },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: tab === t.id ? 'rgba(99,102,241,.15)' : 'transparent', color: tab === t.id ? 'var(--accent-bright)' : 'var(--text-muted)' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {filteredEnrollments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
                <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>No courses yet.</p>
                <Link to="/courses" className="btn btn-primary">Browse Courses</Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
                {filteredEnrollments.map(e => (
                  <div key={e.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                    {e.course.cover_image && (
                      <div style={{ height: 140, overflow: 'hidden', position: 'relative' }}>
                        <img src={e.course.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        {e.completed && (
                          <div style={{ position: 'absolute', top: 8, right: 8, background: '#10b981', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>✓ Completed</div>
                        )}
                      </div>
                    )}
                    <div style={{ padding: 16 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, lineHeight: 1.4 }}>{e.course.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>
                        {e.course.instructor?.full_name} · {e.course.lesson_count} lessons
                      </div>
                      {/* Progress bar */}
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                          <span style={{ fontWeight: 700, color: e.progress_percentage >= 100 ? '#10b981' : 'var(--accent-bright)' }}>
                            {e.progress_percentage}%
                          </span>
                        </div>
                        <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${e.progress_percentage}%`, background: e.progress_percentage >= 100 ? '#10b981' : 'var(--accent-bright)', borderRadius: 3, transition: 'width .4s' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link to={`/learn/${e.course.slug}`} style={{ flex: 1, textAlign: 'center', padding: '7px', background: e.completed ? '#10b98122' : 'var(--accent-bright)', color: e.completed ? '#10b981' : '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>
                          {e.completed ? '✓ Review' : e.progress_percentage > 0 ? '▶ Continue' : '▶ Start'}
                        </Link>
                        {e.completed && (
                          <Link to={`/certificate/${e.course.slug}`} style={{ padding: '7px 12px', background: '#a78bfa22', color: '#a78bfa', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 700 }}>
                            🏆 Cert
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* QUIZ HISTORY */}
        {activeSection === 'quizzes' && (
          <div>
            {quizHistory.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✏️</div>
                <p style={{ color: 'var(--text-muted)' }}>No quiz attempts yet. Enroll in a course to take quizzes.</p>
              </div>
            ) : (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    {['Quiz', 'Course', 'Score', 'Status', 'Time', 'Date'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid var(--border)' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {quizHistory.map(a => (
                      <tr key={a.id}>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 13 }}>{a.quiz_title}</td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
                          <Link to={`/courses/${a.course_slug}`} style={{ color: 'var(--accent-bright)', textDecoration: 'none' }}>{a.course_title}</Link>
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontWeight: 800, fontSize: 15, color: a.passed ? '#10b981' : '#ef4444' }}>{a.score}%</span>
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: a.passed ? '#10b98122' : '#ef444422', color: a.passed ? '#10b981' : '#ef4444' }}>
                            {a.passed ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
                          {a.time_taken_seconds > 0 ? `${Math.floor(a.time_taken_seconds / 60)}m ${a.time_taken_seconds % 60}s` : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
                          {new Date(a.attempted_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
