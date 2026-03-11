import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { instructorService, courseService, quizService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { StarDisplay } from '../components/StarRating';

const S = {
  layout: { display: 'flex', minHeight: '100vh' },
  sidebar: {
    width: 220, background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0,
    position: 'sticky', top: 0, height: '100vh',
  },
  sidebarLogo: { padding: '0 20px 24px', borderBottom: '1px solid var(--border)', marginBottom: 12 },
  navItem: (active) => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px',
    cursor: 'pointer', fontSize: 14, fontWeight: active ? 700 : 500,
    color: active ? 'var(--accent-bright)' : 'var(--text-secondary)',
    background: active ? 'rgba(99,102,241,.1)' : 'transparent',
    borderRight: active ? '3px solid var(--accent-bright)' : '3px solid transparent',
  }),
  main: { flex: 1, padding: '32px 36px', overflowY: 'auto' },
  card: { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 20 },
  input: { padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 14, width: '100%', boxSizing: 'border-box' },
  label: { fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6, display: 'block' },
  btn: (c = 'var(--accent-bright)') => ({ padding: '9px 20px', borderRadius: 8, background: c, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700 }),
};

const autoSlug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const STATUS_COLORS = { draft: '#6b7280', pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' };

export default function InstructorDashboard() {
  const { user, isInstructor } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [studentsData, setStudentsData] = useState(null);

  // Course form
  const [courseForm, setCourseForm] = useState({
    title: '', slug: '', short_description: '', description: '',
    image_url: '', level: 'beginner', language: 'English', category: '',
    is_published: false,
  });

  // Module form
  const [moduleForm, setModuleForm] = useState({ course: '', title: '', description: '', order: 0 });

  // Lesson form
  const [lessonForm, setLessonForm] = useState({
    course: '', module: '', title: '', description: '',
    lesson_type: 'video', youtube_url: '', text_content: '',
    order: 1, duration_minutes: 10,
  });

  // Quiz form
  const [quizForm, setQuizForm] = useState({ lesson: '', title: '', pass_score: 70, time_limit_minutes: 0, max_attempts: 3 });
  const [questionForm, setQuestionForm] = useState({ text: '', question_type: 'multiple', options: ['', '', '', ''], correct_index: 0, explanation: '' });
  const [selectedQuizId, setSelectedQuizId] = useState(null);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    if (!isInstructor) { navigate('/'); return; }
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    try {
      const { data: d } = await instructorService.dashboard();
      setData(d);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCourseCreate = async (e) => {
    e.preventDefault();
    setSaving(true); setSaveMsg('');
    try {
      await courseService.create(courseForm);
      setSaveMsg('✅ Course created!');
      await loadDashboard();
      setCourseForm({ title: '', slug: '', short_description: '', description: '', image_url: '', level: 'beginner', language: 'English', category: '', is_published: false });
      setTimeout(() => setTab('courses'), 800);
    } catch (e) {
      setSaveMsg('❌ ' + JSON.stringify(e.response?.data || 'Error'));
    } finally { setSaving(false); }
  };

  const handleModuleCreate = async (e) => {
    e.preventDefault();
    setSaving(true); setSaveMsg('');
    try {
      await courseService.createModule(moduleForm);
      setSaveMsg('✅ Module created!');
      setModuleForm({ course: '', title: '', description: '', order: 0 });
    } catch (e) {
      setSaveMsg('❌ ' + JSON.stringify(e.response?.data || 'Error'));
    } finally { setSaving(false); }
  };

  const handleLessonCreate = async (e) => {
    e.preventDefault();
    setSaving(true); setSaveMsg('');
    try {
      await courseService.createLesson(lessonForm);
      setSaveMsg('✅ Lesson added!');
      setLessonForm({ course: '', module: '', title: '', description: '', lesson_type: 'video', youtube_url: '', text_content: '', order: 1, duration_minutes: 10 });
    } catch (e) {
      setSaveMsg('❌ ' + JSON.stringify(e.response?.data || 'Error'));
    } finally { setSaving(false); }
  };

  const handleQuizCreate = async (e) => {
    e.preventDefault();
    setSaving(true); setSaveMsg('');
    try {
      const { data: q } = await quizService.create(quizForm);
      setSelectedQuizId(q.id);
      setSaveMsg('✅ Quiz created! Now add questions.');
      setQuizForm({ lesson: '', title: '', pass_score: 70, time_limit_minutes: 0, max_attempts: 3 });
    } catch (e) {
      setSaveMsg('❌ ' + JSON.stringify(e.response?.data || 'Error'));
    } finally { setSaving(false); }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!selectedQuizId) { setSaveMsg('❌ Create a quiz first'); return; }
    setSaving(true); setSaveMsg('');
    try {
      const opts = questionForm.options.filter(o => o.trim());
      await quizService.addQuestion(selectedQuizId, { ...questionForm, options: opts });
      setSaveMsg('✅ Question added!');
      setQuestionForm({ text: '', question_type: 'multiple', options: ['', '', '', ''], correct_index: 0, explanation: '' });
    } catch (e) {
      setSaveMsg('❌ ' + JSON.stringify(e.response?.data || 'Error'));
    } finally { setSaving(false); }
  };

  const handleSubmitForApproval = async (slug) => {
    await courseService.submitForApproval(slug);
    await loadDashboard();
  };

  const viewStudents = async (course) => {
    setSelectedCourse(course);
    setStudentsData(null);
    setTab('students');
    const { data: d } = await instructorService.students(course.slug);
    setStudentsData(d);
  };

  const navItems = [
    { id: 'overview', icon: '📊', label: 'Overview' },
    { id: 'courses', icon: '📚', label: 'My Courses' },
    { id: 'create-course', icon: '➕', label: 'New Course' },
    { id: 'add-module', icon: '📂', label: 'Add Module' },
    { id: 'add-lesson', icon: '🎬', label: 'Add Lesson' },
    { id: 'add-quiz', icon: '✏️', label: 'Add Quiz' },
  ];

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  return (
    <div style={S.layout}>
      {/* Sidebar */}
      <aside style={S.sidebar}>
        <div style={S.sidebarLogo}>
          <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent-bright)' }}>🎓 Instructor</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{user?.full_name}</div>
        </div>
        {navItems.map(n => (
          <div key={n.id} style={S.navItem(tab === n.id)} onClick={() => setTab(n.id)}>
            <span>{n.icon}</span><span>{n.label}</span>
          </div>
        ))}
        {tab === 'students' && (
          <div style={S.navItem(true)}><span>👥</span><span>Students</span></div>
        )}
        <div style={{ flex: 1 }} />
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
          <Link to="/" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>← Back to Site</Link>
        </div>
      </aside>

      <main style={S.main}>
        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="fade-up">
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 4 }}>Your Dashboard</h1>
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Welcome back, {user?.first_name}!</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
              {[
                { icon: '📚', label: 'Total Courses', val: data?.total_courses ?? 0, color: '#6366f1' },
                { icon: '✅', label: 'Published', val: data?.published_courses ?? 0, color: '#10b981' },
                { icon: '⏳', label: 'Pending', val: data?.pending_courses ?? 0, color: '#f59e0b' },
                { icon: '👥', label: 'Students', val: data?.total_students ?? 0, color: '#38bdf8' },
              ].map(s => (
                <div key={s.label} style={{ ...S.card, borderTop: `3px solid ${s.color}`, marginBottom: 0 }}>
                  <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
              <button style={S.btn()} onClick={() => setTab('create-course')}>+ New Course</button>
              <button style={S.btn('#f59e0b')} onClick={() => setTab('add-lesson')}>+ Add Lesson</button>
              <button style={S.btn('#10b981')} onClick={() => setTab('add-quiz')}>+ Create Quiz</button>
            </div>
            {data?.avg_rating && (
              <div style={{ ...S.card, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>⭐</span>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 20 }}>{data.avg_rating}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Average Rating</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MY COURSES */}
        {tab === 'courses' && (
          <div className="fade-up">
            <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 20 }}>My Courses</h1>
            {(!data?.courses || data.courses.length === 0) ? (
              <div style={{ ...S.card, textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                <p style={{ color: 'var(--text-muted)' }}>No courses yet. <button onClick={() => setTab('create-course')} style={{ background: 'none', border: 'none', color: 'var(--accent-bright)', cursor: 'pointer', fontWeight: 700 }}>Create your first course →</button></p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {data.courses.map(c => (
                  <div key={c.id} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 16, marginBottom: 0 }}>
                    {c.cover_image && <img src={c.cover_image} alt="" style={{ width: 80, height: 52, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <strong style={{ fontSize: 14 }}>{c.title}</strong>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: (STATUS_COLORS[c.approval_status] || '#6b7280') + '22', color: STATUS_COLORS[c.approval_status] || '#6b7280' }}>
                          {c.approval_status}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {c.lesson_count} lessons · {c.enrollment_count} students · {c.avg_rating ? `${c.avg_rating}★` : 'No ratings'}
                      </div>
                      {c.approval_status === 'rejected' && (
                        <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>Rejected by admin. Edit and resubmit.</div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {c.approval_status === 'draft' && (
                        <button style={{ ...S.btn('#f59e0b'), padding: '6px 12px', fontSize: 12 }}
                          onClick={() => handleSubmitForApproval(c.slug)}>
                          Submit for Review
                        </button>
                      )}
                      <button style={{ ...S.btn('#6366f1'), padding: '6px 12px', fontSize: 12 }}
                        onClick={() => viewStudents(c)}>
                        Students
                      </button>
                      <Link to={`/courses/${c.slug}`} style={{ ...S.btn(), padding: '6px 12px', fontSize: 12, textDecoration: 'none', display: 'inline-block' }}>
                        View
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CREATE COURSE */}
        {tab === 'create-course' && (
          <div className="fade-up" style={{ maxWidth: 640 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 20 }}>Create New Course</h1>
            <div style={S.card}>
              <form onSubmit={handleCourseCreate}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={S.label}>Course Title *</label>
                    <input style={S.input} required value={courseForm.title} onChange={e => setCourseForm(p => ({ ...p, title: e.target.value, slug: autoSlug(e.target.value) }))} placeholder="e.g. React Fundamentals" />
                  </div>
                  <div>
                    <label style={S.label}>Slug</label>
                    <input style={S.input} value={courseForm.slug} onChange={e => setCourseForm(p => ({ ...p, slug: e.target.value }))} placeholder="auto-generated" />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={S.label}>Short Description</label>
                  <input style={S.input} value={courseForm.short_description} onChange={e => setCourseForm(p => ({ ...p, short_description: e.target.value }))} placeholder="One-line summary" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={S.label}>Full Description *</label>
                  <textarea required style={{ ...S.input, height: 100, resize: 'vertical' }} value={courseForm.description} onChange={e => setCourseForm(p => ({ ...p, description: e.target.value }))} placeholder="Detailed course description..." />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={S.label}>Level</label>
                    <select style={S.input} value={courseForm.level} onChange={e => setCourseForm(p => ({ ...p, level: e.target.value }))}>
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Language</label>
                    <input style={S.input} value={courseForm.language} onChange={e => setCourseForm(p => ({ ...p, language: e.target.value }))} />
                  </div>
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={S.label}>Thumbnail Image URL</label>
                  <input style={S.input} value={courseForm.image_url} onChange={e => setCourseForm(p => ({ ...p, image_url: e.target.value }))} placeholder="https://images.unsplash.com/..." />
                  {courseForm.image_url && (
                    <div style={{ marginTop: 8, position: 'relative' }}>
                      <img
                        src={courseForm.image_url}
                        alt="Thumbnail preview"
                        style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }}
                        onError={e => { e.target.style.display = 'none'; }}
                        onLoad={e => { e.target.style.display = 'block'; }}
                      />
                      <div style={{ position: 'absolute', top: 6, right: 6, background: '#10b98199', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700 }}>
                        Preview ✓
                      </div>
                    </div>
                  )}
                </div>
                {saveMsg && <div style={{ padding: '8px 12px', borderRadius: 6, background: saveMsg.includes('✅') ? '#10b98122' : '#ef444422', color: saveMsg.includes('✅') ? '#10b981' : '#ef4444', marginBottom: 16, fontSize: 13 }}>{saveMsg}</div>}
                <button type="submit" style={S.btn()} disabled={saving}>{saving ? 'Creating...' : 'Create Course'}</button>
              </form>
            </div>
          </div>
        )}

        {/* ADD MODULE */}
        {tab === 'add-module' && (
          <div className="fade-up" style={{ maxWidth: 560 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 20 }}>Add Module</h1>
            <div style={S.card}>
              <form onSubmit={handleModuleCreate}>
                <div style={{ marginBottom: 14 }}>
                  <label style={S.label}>Course *</label>
                  <select required style={S.input} value={moduleForm.course} onChange={e => setModuleForm(p => ({ ...p, course: e.target.value }))}>
                    <option value="">Select course</option>
                    {data?.courses?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={S.label}>Module Title *</label>
                  <input required style={S.input} value={moduleForm.title} onChange={e => setModuleForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Getting Started" />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={S.label}>Description</label>
                  <input style={S.input} value={moduleForm.description} onChange={e => setModuleForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div style={{ marginBottom: 20 }}>
                  <label style={S.label}>Order</label>
                  <input type="number" style={S.input} value={moduleForm.order} onChange={e => setModuleForm(p => ({ ...p, order: +e.target.value }))} />
                </div>
                {saveMsg && <div style={{ padding: '8px 12px', borderRadius: 6, background: saveMsg.includes('✅') ? '#10b98122' : '#ef444422', color: saveMsg.includes('✅') ? '#10b981' : '#ef4444', marginBottom: 16, fontSize: 13 }}>{saveMsg}</div>}
                <button type="submit" style={S.btn('#f59e0b')} disabled={saving}>{saving ? 'Adding...' : 'Add Module'}</button>
              </form>
            </div>
          </div>
        )}

        {/* ADD LESSON */}
        {tab === 'add-lesson' && (
          <div className="fade-up" style={{ maxWidth: 640 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 20 }}>Add Lesson</h1>
            <div style={S.card}>
              <form onSubmit={handleLessonCreate}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <div>
                    <label style={S.label}>Course *</label>
                    <select required style={S.input} value={lessonForm.course} onChange={e => setLessonForm(p => ({ ...p, course: e.target.value }))}>
                      <option value="">Select course</option>
                      {data?.courses?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>Module (optional)</label>
                    <input style={S.input} value={lessonForm.module} onChange={e => setLessonForm(p => ({ ...p, module: e.target.value }))} placeholder="Module ID" />
                  </div>
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={S.label}>Lesson Title *</label>
                  <input required style={S.input} value={lessonForm.title} onChange={e => setLessonForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Introduction to React" />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={S.label}>Lesson Type</label>
                  <select style={S.input} value={lessonForm.lesson_type} onChange={e => setLessonForm(p => ({ ...p, lesson_type: e.target.value }))}>
                    <option value="video">📹 Video (YouTube)</option>
                    <option value="text">📄 Text / Article</option>
                  </select>
                </div>
                {lessonForm.lesson_type === 'video' && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={S.label}>YouTube URL</label>
                    <input style={S.input} value={lessonForm.youtube_url} onChange={e => setLessonForm(p => ({ ...p, youtube_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." />
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>Paste any YouTube URL — we'll extract the video ID automatically.</div>
                  </div>
                )}
                {lessonForm.lesson_type === 'text' && (
                  <div style={{ marginBottom: 14 }}>
                    <label style={S.label}>Content (Markdown)</label>
                    <textarea style={{ ...S.input, height: 120, resize: 'vertical', fontFamily: 'monospace' }} value={lessonForm.text_content} onChange={e => setLessonForm(p => ({ ...p, text_content: e.target.value }))} placeholder="# Lesson Title&#10;&#10;Write your content here..." />
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
                  <div>
                    <label style={S.label}>Order</label>
                    <input type="number" style={S.input} value={lessonForm.order} onChange={e => setLessonForm(p => ({ ...p, order: +e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.label}>Duration (min)</label>
                    <input type="number" style={S.input} value={lessonForm.duration_minutes} onChange={e => setLessonForm(p => ({ ...p, duration_minutes: +e.target.value }))} />
                  </div>
                </div>
                {saveMsg && <div style={{ padding: '8px 12px', borderRadius: 6, background: saveMsg.includes('✅') ? '#10b98122' : '#ef444422', color: saveMsg.includes('✅') ? '#10b981' : '#ef4444', marginBottom: 16, fontSize: 13 }}>{saveMsg}</div>}
                <button type="submit" style={S.btn('#10b981')} disabled={saving}>{saving ? 'Adding...' : 'Add Lesson'}</button>
              </form>
            </div>
          </div>
        )}

        {/* ADD QUIZ */}
        {tab === 'add-quiz' && (
          <div className="fade-up" style={{ maxWidth: 640 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 20 }}>Create Quiz</h1>

            {/* Quiz Settings */}
            <div style={S.card}>
              <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Quiz Settings</h3>
              <form onSubmit={handleQuizCreate}>
                <div style={{ marginBottom: 14 }}>
                  <label style={S.label}>Lesson (attach quiz to)</label>
                  <input type="number" style={S.input} value={quizForm.lesson} onChange={e => setQuizForm(p => ({ ...p, lesson: e.target.value }))} placeholder="Lesson ID" required />
                </div>
                <div style={{ marginBottom: 14 }}>
                  <label style={S.label}>Quiz Title *</label>
                  <input required style={S.input} value={quizForm.title} onChange={e => setQuizForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Module 1 Quiz" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 20 }}>
                  <div>
                    <label style={S.label}>Pass % (default 70)</label>
                    <input type="number" min="1" max="100" style={S.input} value={quizForm.pass_score} onChange={e => setQuizForm(p => ({ ...p, pass_score: +e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.label}>Time Limit (min, 0=none)</label>
                    <input type="number" min="0" style={S.input} value={quizForm.time_limit_minutes} onChange={e => setQuizForm(p => ({ ...p, time_limit_minutes: +e.target.value }))} />
                  </div>
                  <div>
                    <label style={S.label}>Max Attempts (0=∞)</label>
                    <input type="number" min="0" style={S.input} value={quizForm.max_attempts} onChange={e => setQuizForm(p => ({ ...p, max_attempts: +e.target.value }))} />
                  </div>
                </div>
                <button type="submit" style={S.btn()} disabled={saving}>{saving ? 'Creating...' : 'Create Quiz'}</button>
              </form>
            </div>

            {/* Add Questions */}
            {selectedQuizId && (
              <div style={S.card}>
                <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Add Question to Quiz #{selectedQuizId}</h3>
                <form onSubmit={handleAddQuestion}>
                  <div style={{ marginBottom: 14 }}>
                    <label style={S.label}>Question Type</label>
                    <select style={S.input} value={questionForm.question_type} onChange={e => setQuestionForm(p => ({
                      ...p, question_type: e.target.value,
                      options: e.target.value === 'truefalse' ? ['True', 'False'] : ['', '', '', ''],
                    }))}>
                      <option value="multiple">Multiple Choice</option>
                      <option value="truefalse">True / False</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={S.label}>Question Text *</label>
                    <textarea required style={{ ...S.input, height: 60, resize: 'vertical' }} value={questionForm.text} onChange={e => setQuestionForm(p => ({ ...p, text: e.target.value }))} placeholder="What is..." />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={S.label}>Answer Options</label>
                    {questionForm.options.map((opt, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                        <input
                          type="radio" name="correct" checked={questionForm.correct_index === i}
                          onChange={() => setQuestionForm(p => ({ ...p, correct_index: i }))}
                          title="Mark as correct"
                        />
                        <input
                          style={{ ...S.input, flex: 1 }}
                          value={opt}
                          onChange={e => setQuestionForm(p => ({ ...p, options: p.options.map((o, j) => j === i ? e.target.value : o) }))}
                          placeholder={`Option ${i + 1}${i === questionForm.correct_index ? ' ← correct' : ''}`}
                          readOnly={questionForm.question_type === 'truefalse'}
                        />
                      </div>
                    ))}
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Select the radio button next to the correct answer</div>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={S.label}>Explanation (shown after answering)</label>
                    <input style={S.input} value={questionForm.explanation} onChange={e => setQuestionForm(p => ({ ...p, explanation: e.target.value }))} placeholder="Optional explanation..." />
                  </div>
                  <button type="submit" style={S.btn('#f59e0b')} disabled={saving}>{saving ? 'Adding...' : 'Add Question'}</button>
                </form>
              </div>
            )}

            {saveMsg && <div style={{ padding: '10px 14px', borderRadius: 8, background: saveMsg.includes('✅') ? '#10b98122' : '#ef444422', color: saveMsg.includes('✅') ? '#10b981' : '#ef4444', fontSize: 13 }}>{saveMsg}</div>}
          </div>
        )}

        {/* STUDENTS */}
        {tab === 'students' && (
          <div className="fade-up">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <button onClick={() => setTab('courses')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-bright)', fontSize: 13, fontWeight: 700 }}>← Back</button>
              <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                {selectedCourse?.title} — Students
              </h1>
            </div>
            {!studentsData ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" style={{ width: 30, height: 30 }} /></div>
            ) : (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Student</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Progress</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Enrolled</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Status</th>
                  </tr></thead>
                  <tbody>
                    {(studentsData.students || []).map(s => (
                      <tr key={s.user_id}>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>{s.full_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.email}</div>
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden', maxWidth: 120 }}>
                              <div style={{ height: '100%', width: `${s.progress}%`, background: s.progress >= 100 ? '#10b981' : '#6366f1', borderRadius: 3 }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 700 }}>{s.progress}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
                          {new Date(s.enrolled_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                          {s.completed
                            ? <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#10b98122', color: '#10b981' }}>Completed</span>
                            : <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: '#6366f122', color: '#6366f1' }}>In Progress</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
