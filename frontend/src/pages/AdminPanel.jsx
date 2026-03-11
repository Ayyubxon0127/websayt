import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const S = {
  layout:     { display: 'flex', minHeight: '100vh' },
  sidebar:    { width: 240, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '24px 0', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' },
  sidebarLogo:{ padding: '0 20px 24px', borderBottom: '1px solid var(--border)', marginBottom: 12 },
  navItem: (a) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', cursor: 'pointer', fontSize: 14, fontWeight: a ? 700 : 500, color: a ? 'var(--accent-bright)' : 'var(--text-secondary)', background: a ? 'rgba(99,102,241,.1)' : 'transparent', borderRight: a ? '3px solid var(--accent-bright)' : '3px solid transparent', transition: 'all .15s' }),
  main:       { flex: 1, padding: '32px 36px', overflowY: 'auto', minHeight: '100vh' },
  title:      { fontSize: 26, fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: 4 },
  sub:        { fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 },
  statsGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(175px,1fr))', gap: 16, marginBottom: 28 },
  statCard: (c) => ({ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, borderTop: `3px solid ${c}` }),
  statNum:  (c) => ({ fontSize: 30, fontWeight: 800, fontFamily: 'var(--font-display)', color: c, marginBottom: 4 }),
  statLabel:  { fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' },
  card:       { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 24 },
  cardHeader: { padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle:  { fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)' },
  table:      { width: '100%', borderCollapse: 'collapse' },
  th:         { padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,.02)' },
  td:         { padding: '11px 16px', fontSize: 13, borderBottom: '1px solid var(--border)', verticalAlign: 'middle' },
  badge: (c)  => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: c + '22', color: c }),
  btn: (c = 'var(--accent-bright)', t = '#fff') => ({ padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: c, color: t }),
  input:      { padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13, width: '100%', boxSizing: 'border-box' },
  select:     { padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)', background: 'var(--bg-input)', color: 'var(--text-primary)', fontSize: 13 },
  label:      { fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 5 },
  formRow:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  modal:      { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 },
  modalBox:   { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: 28, width: 480, maxWidth: '100%', maxHeight: '90vh', overflowY: 'auto' },
};

const STATUS_COLORS = { draft: '#6b7280', pending: '#f59e0b', approved: '#10b981', rejected: '#ef4444' };

export default function AdminPanel() {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');

  // Data
  const [analytics, setAnalytics]             = useState(null);
  const [users, setUsers]                     = useState([]);
  const [courses, setCourses]                 = useState([]);
  const [categories, setCategories]           = useState([]);
  const [reviews, setReviews]                 = useState([]);
  const [pendingInstructors, setPending]      = useState([]);
  const [loading, setLoading]                 = useState(true);

  // Filters
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [flaggedOnly, setFlagged]   = useState(false);

  // Modals
  const [approvalModal, setApprovalModal] = useState(null);   // { course, action }
  const [approvalNotes, setApprovalNotes] = useState('');
  const [editModal, setEditModal]         = useState(null);   // course object
  const [editForm, setEditForm]           = useState({});
  const [catForm, setCatForm]             = useState({ name: '', slug: '', icon: '', color: '#6366f1', description: '' });
  const [catMsg, setCatMsg]               = useState('');

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    loadAll();
  }, [isAdmin]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [aRes, uRes, cRes, catRes, rRes, piRes] = await Promise.all([
        adminService.analytics(),
        adminService.getUsers(),
        adminService.getCourses(),
        adminService.getCategories(),
        adminService.getReviews(),
        adminService.getPendingInstructors(),
      ]);
      setAnalytics(aRes.data);
      setUsers(uRes.data.users || []);
      setCourses(cRes.data.courses || []);
      setCategories(catRes.data || []);
      setReviews(rRes.data || []);
      setPending(piRes.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // ── User actions ──
  const handleUserUpdate = async (userId, updates) => {
    await adminService.updateUser(userId, updates);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
  };

  // ── Instructor approve/reject ──
  const handleApproveInstructor = async (id) => {
    await adminService.approveInstructor(id);
    setPending(prev => prev.filter(u => u.id !== id));
    setUsers(prev => prev.map(u => u.id === id ? { ...u, instructor_approved: true } : u));
  };
  const handleRejectInstructor = async (id) => {
    await adminService.rejectInstructor(id);
    setPending(prev => prev.filter(u => u.id !== id));
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role: 'student', instructor_approved: false } : u));
  };

  // ── Course approve/reject ──
  const handleCourseAction = async (courseId, action) => {
    await adminService.approveCourse(courseId, { action, admin_notes: approvalNotes });
    setCourses(prev => prev.map(c => c.id === courseId
      ? { ...c, approval_status: action === 'approve' ? 'approved' : 'rejected', is_published: action === 'approve' }
      : c));
    setApprovalModal(null); setApprovalNotes('');
  };

  // ── Course edit ──
  const openEdit = (course) => {
    setEditForm({
      title:             course.title || '',
      short_description: course.short_description || '',
      description:       course.description || '',
      level:             course.level || 'beginner',
      language:          course.language || 'English',
      image_url:         course.cover_image || '',
      is_published:      course.is_published || false,
      is_featured:       course.is_featured || false,
      admin_notes:       course.admin_notes || '',
    });
    setEditModal(course);
  };
  const handleEditSave = async () => {
    const { data } = await adminService.editCourse(editModal.id, editForm);
    setCourses(prev => prev.map(c => c.id === editModal.id ? { ...c, ...data } : c));
    setEditModal(null);
  };

  // ── Course delete ──
  const handleDeleteCourse = async (slug) => {
    if (!confirm('Delete this course permanently?')) return;
    await adminService.deleteCourse(slug);
    setCourses(prev => prev.filter(c => c.slug !== slug));
  };

  // ── Categories ──
  const autoSlug = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const handleCatCreate = async (e) => {
    e.preventDefault(); setCatMsg('');
    try {
      const { data } = await adminService.createCategory(catForm);
      setCategories(prev => [...prev, data]);
      setCatMsg('✅ Category created!');
      setCatForm({ name: '', slug: '', icon: '', color: '#6366f1', description: '' });
    } catch (err) { setCatMsg('❌ ' + JSON.stringify(err.response?.data || 'Error')); }
  };
  const handleCatDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    await adminService.deleteCategory(id);
    setCategories(prev => prev.filter(c => c.id !== id));
  };

  // ── Reviews ──
  const handleDeleteReview = async (id) => {
    if (!confirm('Delete this review?')) return;
    await adminService.deleteReview(id);
    setReviews(prev => prev.filter(r => r.id !== id));
  };
  const handleFlagReview = async (id) => {
    const { data } = await adminService.flagReview(id);
    setReviews(prev => prev.map(r => r.id === id ? { ...r, is_flagged: data.is_flagged } : r));
  };

  // ── Filtered ──
  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return (!search || u.email?.toLowerCase().includes(q) || u.full_name?.toLowerCase().includes(q))
      && (!roleFilter || u.role === roleFilter);
  });
  const filteredCourses  = courses.filter(c => !statusFilter || c.approval_status === statusFilter);
  const filteredReviews  = flaggedOnly ? reviews.filter(r => r.is_flagged) : reviews;

  const navItems = [
    { id: 'overview',     icon: '📊', label: 'Overview' },
    { id: 'instructors',  icon: '🎓', label: 'Instructors', badge: pendingInstructors.length },
    { id: 'users',        icon: '👥', label: 'Users' },
    { id: 'courses',      icon: '📚', label: 'Courses' },
    { id: 'categories',   icon: '🏷️',  label: 'Categories' },
    { id: 'moderation',   icon: '🛡️',  label: 'Moderation' },
    { id: 'analytics',    icon: '📈', label: 'Analytics' },
  ];

  if (!isAdmin) return null;

  return (
    <div style={S.layout}>
      {/* ── Sidebar ── */}
      <aside style={S.sidebar}>
        <div style={S.sidebarLogo}>
          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--accent-bright)' }}>⚡ Admin Panel</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>{user?.full_name}</div>
        </div>
        {navItems.map(n => (
          <div key={n.id} style={S.navItem(tab === n.id)} onClick={() => setTab(n.id)}>
            <span>{n.icon}</span>
            <span style={{ flex: 1 }}>{n.label}</span>
            {n.badge > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', borderRadius: 20, fontSize: 10, fontWeight: 800, padding: '1px 6px', minWidth: 18, textAlign: 'center' }}>
                {n.badge}
              </span>
            )}
          </div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)' }}>
          <Link to="/" style={{ fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none' }}>← Back to Site</Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={S.main}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
            <div className="spinner" style={{ width: 36, height: 36 }} />
          </div>
        ) : <>

          {/* ══ OVERVIEW ══ */}
          {tab === 'overview' && analytics && (
            <div className="fade-up">
              <h1 style={S.title}>Platform Overview</h1>
              <p style={S.sub}>Real-time statistics for LearnHub</p>
              <div style={S.statsGrid}>
                {[
                  { label: 'Total Users',       val: analytics.total_users,            color: '#6366f1' },
                  { label: 'Students',           val: analytics.total_students,         color: '#38bdf8' },
                  { label: 'Instructors',        val: analytics.total_instructors,      color: '#f59e0b' },
                  { label: 'Pending Instructors',val: pendingInstructors.length,        color: '#ef4444' },
                  { label: 'Total Courses',      val: analytics.total_courses,          color: '#10b981' },
                  { label: 'Published',          val: analytics.published_courses,      color: '#10b981' },
                  { label: 'Enrollments',        val: analytics.total_enrollments,      color: '#6366f1' },
                  { label: 'Completions',        val: analytics.completed_enrollments,  color: '#10b981' },
                  { label: 'Completion Rate',    val: `${analytics.completion_rate}%`,  color: '#f59e0b' },
                  { label: 'Certificates',       val: analytics.total_certificates,     color: '#a78bfa' },
                ].map(s => (
                  <div key={s.label} style={S.statCard(s.color)}>
                    <div style={S.statNum(s.color)}>{typeof s.val === 'number' ? s.val.toLocaleString() : s.val}</div>
                    <div style={S.statLabel}>{s.label}</div>
                  </div>
                ))}
              </div>

              {pendingInstructors.length > 0 && (
                <div style={{ ...S.card, borderTop: '3px solid #ef4444' }}>
                  <div style={S.cardHeader}>
                    <span style={S.cardTitle}>🔔 Pending Instructor Approvals</span>
                    <button style={S.btn()} onClick={() => setTab('instructors')}>View All</button>
                  </div>
                  <div style={{ padding: '12px 20px', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {pendingInstructors.length} instructor{pendingInstructors.length > 1 ? 's' : ''} waiting for approval
                  </div>
                </div>
              )}

              <div style={S.card}>
                <div style={S.cardHeader}><span style={S.cardTitle}>Recent Activity</span></div>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>User</th><th style={S.th}>Action</th><th style={S.th}>Date</th>
                  </tr></thead>
                  <tbody>
                    {(analytics.recent_activity || []).map((a, i) => (
                      <tr key={i}>
                        <td style={S.td}><strong>{a.user}</strong></td>
                        <td style={S.td}>{a.action}</td>
                        <td style={{ ...S.td, color: 'var(--text-muted)', fontSize: 12 }}>{new Date(a.time).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ INSTRUCTORS ══ */}
          {tab === 'instructors' && (
            <div className="fade-up">
              <h1 style={S.title}>Instructor Management</h1>
              <p style={S.sub}>Review and approve instructor applications</p>

              {pendingInstructors.length === 0 ? (
                <div style={{ ...S.card, padding: 40, textAlign: 'center' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>All caught up!</div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>No pending instructor approvals.</div>
                </div>
              ) : (
                <div style={S.card}>
                  <div style={S.cardHeader}>
                    <span style={S.cardTitle}>⏳ Pending Approvals ({pendingInstructors.length})</span>
                  </div>
                  <table style={S.table}>
                    <thead><tr>
                      <th style={S.th}>Instructor</th>
                      <th style={S.th}>Email</th>
                      <th style={S.th}>Joined</th>
                      <th style={S.th}>Courses</th>
                      <th style={S.th}>Actions</th>
                    </tr></thead>
                    <tbody>
                      {pendingInstructors.map(u => (
                        <tr key={u.id}>
                          <td style={S.td}>
                            <div style={{ fontWeight: 700 }}>{u.full_name || u.username}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>@{u.username}</div>
                          </td>
                          <td style={{ ...S.td, color: 'var(--text-muted)' }}>{u.email}</td>
                          <td style={{ ...S.td, fontSize: 12, color: 'var(--text-muted)' }}>
                            {new Date(u.date_joined).toLocaleDateString()}
                          </td>
                          <td style={{ ...S.td, textAlign: 'center' }}>{u.course_count}</td>
                          <td style={S.td}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <button style={S.btn('#10b981')} onClick={() => handleApproveInstructor(u.id)}>
                                ✓ Approve
                              </button>
                              <button style={S.btn('#ef444422', '#ef4444')} onClick={() => handleRejectInstructor(u.id)}>
                                ✗ Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* All approved instructors */}
              <div style={S.card}>
                <div style={S.cardHeader}><span style={S.cardTitle}>✅ Approved Instructors</span></div>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>Instructor</th>
                    <th style={S.th}>Email</th>
                    <th style={S.th}>Courses</th>
                    <th style={S.th}>Approved</th>
                    <th style={S.th}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {users.filter(u => u.role === 'instructor' && u.instructor_approved).map(u => (
                      <tr key={u.id}>
                        <td style={S.td}>
                          <div style={{ fontWeight: 600 }}>{u.full_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                        </td>
                        <td style={{ ...S.td, color: 'var(--text-muted)', fontSize: 12 }}>{u.email}</td>
                        <td style={{ ...S.td, textAlign: 'center' }}>{u.course_count}</td>
                        <td style={S.td}><span style={S.badge('#10b981')}>Approved</span></td>
                        <td style={S.td}>
                          <button style={S.btn('#ef444422', '#ef4444')}
                            onClick={() => handleUserUpdate(u.id, { instructor_approved: false, role: 'student' })}>
                            Revoke
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ USERS ══ */}
          {tab === 'users' && (
            <div className="fade-up">
              <h1 style={S.title}>User Management</h1>
              <p style={S.sub}>{users.length} total users</p>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
                <input style={{ ...S.input, maxWidth: 260 }} placeholder="Search by name or email…"
                  value={search} onChange={e => setSearch(e.target.value)} />
                <select style={S.select} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                  <option value="">All Roles</option>
                  <option value="student">Student</option>
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', alignSelf: 'center' }}>
                  {filteredUsers.length} results
                </span>
              </div>
              <div style={S.card}>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>User</th>
                    <th style={S.th}>Role</th>
                    <th style={S.th}>Enrolled</th>
                    <th style={S.th}>Courses</th>
                    <th style={S.th}>Joined</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} style={{ opacity: u.is_banned ? .45 : 1 }}>
                        <td style={S.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--accent-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                              {(u.full_name || u.email)?.[0]?.toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{u.full_name}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={S.td}>
                          <select style={{ ...S.select, padding: '4px 8px', fontSize: 12 }}
                            value={u.role || 'student'}
                            onChange={e => handleUserUpdate(u.id, { role: e.target.value })}>
                            <option value="student">Student</option>
                            <option value="instructor">Instructor</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td style={{ ...S.td, textAlign: 'center' }}>{u.enrollment_count}</td>
                        <td style={{ ...S.td, textAlign: 'center' }}>{u.course_count}</td>
                        <td style={{ ...S.td, color: 'var(--text-muted)', fontSize: 12 }}>
                          {new Date(u.date_joined).toLocaleDateString()}
                        </td>
                        <td style={S.td}>
                          <span style={S.badge(u.is_banned ? '#ef4444' : '#10b981')}>
                            {u.is_banned ? 'Banned' : 'Active'}
                          </span>
                        </td>
                        <td style={S.td}>
                          <button style={S.btn(u.is_banned ? '#10b98122' : '#ef444422', u.is_banned ? '#10b981' : '#ef4444')}
                            onClick={() => handleUserUpdate(u.id, { is_banned: !u.is_banned })}>
                            {u.is_banned ? 'Unban' : 'Ban'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ COURSES ══ */}
          {tab === 'courses' && (
            <div className="fade-up">
              <h1 style={S.title}>Course Management</h1>
              <p style={S.sub}>{courses.length} total · {courses.filter(c => c.approval_status === 'pending').length} pending review</p>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <select style={S.select} value={statusFilter} onChange={e => setStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="pending">⏳ Pending Review</option>
                  <option value="approved">✅ Approved</option>
                  <option value="rejected">❌ Rejected</option>
                </select>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', alignSelf: 'center' }}>
                  {filteredCourses.length} results
                </span>
              </div>
              <div style={S.card}>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>Course</th>
                    <th style={S.th}>Instructor</th>
                    <th style={S.th}>Status</th>
                    <th style={S.th}>Students</th>
                    <th style={S.th}>Rating</th>
                    <th style={S.th}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {filteredCourses.map(c => (
                      <tr key={c.id}>
                        <td style={S.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            {c.cover_image && <img src={c.cover_image} alt="" style={{ width: 44, height: 30, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }} />}
                            <div>
                              <div style={{ fontWeight: 600, fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.level}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ ...S.td, fontSize: 13 }}>{c.instructor?.full_name}</td>
                        <td style={S.td}>
                          <span style={S.badge(STATUS_COLORS[c.approval_status] || '#6b7280')}>
                            {c.approval_status}
                          </span>
                        </td>
                        <td style={{ ...S.td, textAlign: 'center' }}>{c.enrollment_count}</td>
                        <td style={{ ...S.td, textAlign: 'center', fontSize: 13 }}>{c.avg_rating ? `${c.avg_rating}★` : '—'}</td>
                        <td style={S.td}>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {c.approval_status === 'pending' && <>
                              <button style={S.btn('#10b98122', '#10b981')}
                                onClick={() => setApprovalModal({ course: c, action: 'approve' })}>✓ Approve</button>
                              <button style={S.btn('#ef444422', '#ef4444')}
                                onClick={() => setApprovalModal({ course: c, action: 'reject' })}>✗ Reject</button>
                            </>}
                            <button style={S.btn('#6366f122', '#6366f1')} onClick={() => openEdit(c)}>✏️ Edit</button>
                            <Link to={`/courses/${c.slug}`}
                              style={{ ...S.btn('var(--bg)', 'var(--text-secondary)'), border: '1px solid var(--border)', textDecoration: 'none', display: 'inline-block' }}>
                              View
                            </Link>
                            <button style={S.btn('#ef444422', '#ef4444')} onClick={() => handleDeleteCourse(c.slug)}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ CATEGORIES ══ */}
          {tab === 'categories' && (
            <div className="fade-up">
              <h1 style={S.title}>Category Management</h1>
              <p style={S.sub}>{categories.length} categories</p>
              <div style={{ ...S.card, padding: 24 }}>
                <h3 style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>Add New Category</h3>
                <form onSubmit={handleCatCreate}>
                  <div style={S.formRow}>
                    <div>
                      <label style={S.label}>Name *</label>
                      <input required style={S.input} value={catForm.name}
                        onChange={e => setCatForm(p => ({ ...p, name: e.target.value, slug: autoSlug(e.target.value) }))}
                        placeholder="e.g. Web Development" />
                    </div>
                    <div>
                      <label style={S.label}>Slug</label>
                      <input style={S.input} value={catForm.slug}
                        onChange={e => setCatForm(p => ({ ...p, slug: e.target.value }))}
                        placeholder="web-development" />
                    </div>
                  </div>
                  <div style={S.formRow}>
                    <div>
                      <label style={S.label}>Icon (emoji)</label>
                      <input style={S.input} value={catForm.icon}
                        onChange={e => setCatForm(p => ({ ...p, icon: e.target.value }))} placeholder="💻" />
                    </div>
                    <div>
                      <label style={S.label}>Color</label>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input type="color" value={catForm.color}
                          onChange={e => setCatForm(p => ({ ...p, color: e.target.value }))}
                          style={{ width: 40, height: 38, border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', padding: 2 }} />
                        <input style={{ ...S.input, flex: 1 }} value={catForm.color}
                          onChange={e => setCatForm(p => ({ ...p, color: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={S.label}>Description</label>
                    <input style={S.input} value={catForm.description}
                      onChange={e => setCatForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Short description…" />
                  </div>
                  {catMsg && (
                    <div style={{ padding: '8px 12px', borderRadius: 6, background: catMsg.includes('✅') ? '#10b98122' : '#ef444422', color: catMsg.includes('✅') ? '#10b981' : '#ef4444', fontSize: 13, marginBottom: 12 }}>
                      {catMsg}
                    </div>
                  )}
                  <button type="submit" style={{ ...S.btn(), padding: '8px 20px' }}>+ Add Category</button>
                </form>
              </div>
              <div style={S.card}>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>Category</th><th style={S.th}>Slug</th><th style={S.th}>Courses</th><th style={S.th}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {categories.map(c => (
                      <tr key={c.id}>
                        <td style={S.td}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: 8, background: c.color + '33', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                              {c.icon || '📂'}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600 }}>{c.name}</div>
                              {c.description && <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{c.description}</div>}
                            </div>
                          </div>
                        </td>
                        <td style={{ ...S.td, fontFamily: 'monospace', fontSize: 12, color: 'var(--text-muted)' }}>{c.slug}</td>
                        <td style={{ ...S.td, textAlign: 'center' }}>{c.course_count}</td>
                        <td style={S.td}>
                          <button style={S.btn('#ef444422', '#ef4444')} onClick={() => handleCatDelete(c.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ MODERATION ══ */}
          {tab === 'moderation' && (
            <div className="fade-up">
              <h1 style={S.title}>Content Moderation</h1>
              <p style={S.sub}>Manage reviews and flagged content</p>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={flaggedOnly} onChange={e => setFlagged(e.target.checked)} style={{ accentColor: 'var(--accent-bright)' }} />
                  Show flagged only
                </label>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  {filteredReviews.length} reviews · {reviews.filter(r => r.is_flagged).length} flagged
                </span>
              </div>
              <div style={S.card}>
                <table style={S.table}>
                  <thead><tr>
                    <th style={S.th}>Reviewer</th>
                    <th style={S.th}>Course</th>
                    <th style={S.th}>Rating</th>
                    <th style={S.th}>Comment</th>
                    <th style={S.th}>Date</th>
                    <th style={S.th}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {filteredReviews.map(r => (
                      <tr key={r.id} style={{ background: r.is_flagged ? 'rgba(239,68,68,.04)' : 'transparent' }}>
                        <td style={S.td}>
                          <div style={{ fontWeight: 600 }}>{r.user}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.user_email}</div>
                        </td>
                        <td style={S.td}>
                          <Link to={`/courses/${r.course_slug}`} style={{ color: 'var(--accent-bright)', textDecoration: 'none', fontSize: 13 }}>
                            {r.course_title}
                          </Link>
                        </td>
                        <td style={S.td}>
                          <span style={{ fontWeight: 800, color: r.rating >= 4 ? '#10b981' : r.rating >= 3 ? '#f59e0b' : '#ef4444' }}>
                            {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                          </span>
                        </td>
                        <td style={{ ...S.td, maxWidth: 240 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}>
                            {r.comment || <em style={{ color: 'var(--text-muted)' }}>No comment</em>}
                          </div>
                        </td>
                        <td style={{ ...S.td, fontSize: 12, color: 'var(--text-muted)' }}>
                          {new Date(r.created_at).toLocaleDateString()}
                        </td>
                        <td style={S.td}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button style={S.btn(r.is_flagged ? '#f59e0b22' : '#6b728022', r.is_flagged ? '#f59e0b' : '#6b7280')}
                              onClick={() => handleFlagReview(r.id)}>
                              {r.is_flagged ? '🚩' : '⚑'}
                            </button>
                            <button style={S.btn('#ef444422', '#ef4444')} onClick={() => handleDeleteReview(r.id)}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ══ ANALYTICS ══ */}
          {tab === 'analytics' && analytics && (
            <div className="fade-up">
              <h1 style={S.title}>Platform Analytics</h1>
              <p style={S.sub}>Growth and engagement metrics</p>

              {analytics.monthly_signups?.length > 0 && (
                <div style={S.card}>
                  <div style={S.cardHeader}><span style={S.cardTitle}>📈 Monthly Signups (Last 6 Months)</span></div>
                  <div style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 160 }}>
                      {analytics.monthly_signups.map((m, i) => {
                        const maxVal = Math.max(...analytics.monthly_signups.map(x => x.count), 1);
                        const h = Math.max((m.count / maxVal) * 140, 4);
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-bright)' }}>{m.count}</div>
                            <div style={{ width: '100%', height: h, background: 'linear-gradient(180deg,var(--accent-bright),#8b5cf6)', borderRadius: '5px 5px 0 0', opacity: .85 }} />
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{m.month}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={S.card}>
                  <div style={S.cardHeader}><span style={S.cardTitle}>👥 User Distribution</span></div>
                  <div style={{ padding: 20 }}>
                    {[
                      { label: 'Students',    val: analytics.total_students,    color: '#6366f1' },
                      { label: 'Instructors', val: analytics.total_instructors, color: '#f59e0b' },
                    ].map(r => (
                      <div key={r.label} style={{ marginBottom: 18 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                          <span>{r.label}</span>
                          <span style={{ fontWeight: 700, color: r.color }}>
                            {r.val} ({analytics.total_users ? Math.round(r.val / analytics.total_users * 100) : 0}%)
                          </span>
                        </div>
                        <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${analytics.total_users ? (r.val / analytics.total_users) * 100 : 0}%`, background: r.color, borderRadius: 4, transition: 'width .5s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={S.card}>
                  <div style={S.cardHeader}><span style={S.cardTitle}>🏆 Completion Funnel</span></div>
                  <div style={{ padding: 20 }}>
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <div style={{ fontSize: 52, fontWeight: 900, fontFamily: 'var(--font-display)', color: '#10b981', lineHeight: 1 }}>
                        {analytics.completion_rate}%
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Overall Completion Rate</div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                      {[
                        { label: 'Enrolled',  val: analytics.total_enrollments,      color: '#6366f1' },
                        { label: 'Completed', val: analytics.completed_enrollments,  color: '#10b981' },
                        { label: 'Certs',     val: analytics.total_certificates,     color: '#a78bfa' },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </>}
      </main>

      {/* ══ APPROVE/REJECT MODAL ══ */}
      {approvalModal && (
        <div style={S.modal}>
          <div style={S.modalBox}>
            <h3 style={{ fontWeight: 800, marginBottom: 6, fontSize: 17 }}>
              {approvalModal.action === 'approve' ? '✅ Approve Course' : '❌ Reject Course'}
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 18 }}>{approvalModal.course.title}</p>
            <label style={S.label}>Notes for instructor (notification)</label>
            <textarea value={approvalNotes} onChange={e => setApprovalNotes(e.target.value)}
              placeholder={approvalModal.action === 'approve' ? 'Great course! Now live.' : 'Please improve video quality…'}
              style={{ ...S.input, height: 90, resize: 'vertical', marginBottom: 20, display: 'block' }} />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={S.btn('var(--bg)', 'var(--text-secondary)')}
                onClick={() => { setApprovalModal(null); setApprovalNotes(''); }}>Cancel</button>
              <button style={S.btn(approvalModal.action === 'approve' ? '#10b981' : '#ef4444')}
                onClick={() => handleCourseAction(approvalModal.course.id, approvalModal.action)}>
                {approvalModal.action === 'approve' ? 'Approve & Publish' : 'Reject Course'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EDIT COURSE MODAL ══ */}
      {editModal && (
        <div style={S.modal}>
          <div style={S.modalBox}>
            <h3 style={{ fontWeight: 800, marginBottom: 4, fontSize: 17 }}>✏️ Edit Course</h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>{editModal.title}</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={S.label}>Title</label>
                <input style={S.input} value={editForm.title}
                  onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>Short Description</label>
                <input style={S.input} value={editForm.short_description}
                  onChange={e => setEditForm(p => ({ ...p, short_description: e.target.value }))} />
              </div>
              <div>
                <label style={S.label}>Description</label>
                <textarea style={{ ...S.input, height: 80, resize: 'vertical' }} value={editForm.description}
                  onChange={e => setEditForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div style={S.formRow}>
                <div>
                  <label style={S.label}>Level</label>
                  <select style={S.select} value={editForm.level}
                    onChange={e => setEditForm(p => ({ ...p, level: e.target.value }))}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label style={S.label}>Language</label>
                  <input style={S.input} value={editForm.language}
                    onChange={e => setEditForm(p => ({ ...p, language: e.target.value }))} />
                </div>
              </div>
              <div>
                <label style={S.label}>Thumbnail URL</label>
                <input style={S.input} value={editForm.image_url} placeholder="https://..."
                  onChange={e => setEditForm(p => ({ ...p, image_url: e.target.value }))} />
                {editForm.image_url && (
                  <img src={editForm.image_url} alt="preview"
                    style={{ marginTop: 8, width: '100%', height: 120, objectFit: 'cover', borderRadius: 8 }}
                    onError={e => e.target.style.display = 'none'} />
                )}
              </div>
              <div>
                <label style={S.label}>Admin Notes (sent to instructor)</label>
                <textarea style={{ ...S.input, height: 60, resize: 'vertical' }} value={editForm.admin_notes}
                  onChange={e => setEditForm(p => ({ ...p, admin_notes: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={editForm.is_published}
                    onChange={e => setEditForm(p => ({ ...p, is_published: e.target.checked }))}
                    style={{ accentColor: 'var(--accent-bright)' }} />
                  Published
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={editForm.is_featured}
                    onChange={e => setEditForm(p => ({ ...p, is_featured: e.target.checked }))}
                    style={{ accentColor: 'var(--accent-bright)' }} />
                  Featured
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button style={S.btn('var(--bg)', 'var(--text-secondary)')} onClick={() => setEditModal(null)}>Cancel</button>
              <button style={S.btn()} onClick={handleEditSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
