import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../services/api';

const NOTIF_ICONS = { enrollment:'🎉', completion:'🏆', certificate:'📜', quiz_passed:'✅', streak:'🔥', system:'🔔' };

function timeAgo(d) {
  if (!d) return '';
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function Navbar() {
  const { user, logout, isInstructor, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const userRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 6);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  useEffect(() => {
    const fn = (e) => {
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  useEffect(() => { setUserOpen(false); setNotifOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (!user) return;
    notificationService.list().then(({ data }) => {
      setNotifs(data.notifications || []);
      setUnread(data.unread_count || 0);
    }).catch(() => {});
  }, [user]);

  const handleNotifOpen = () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen && unread > 0) {
      notificationService.markRead().then(() => {
        setUnread(0);
        setNotifs(p => p.map(n => ({ ...n, is_read: true })));
      });
    }
  };

  const handleLogout = () => { logout(); setUserOpen(false); navigate('/'); };

  const initials = (user?.full_name || user?.username || '?')[0].toUpperCase();

  const navLinks = [
    { to: '/courses', label: 'Courses' },
    // Student yoki Admin: "My Learning" → /dashboard
    ...(user && !isInstructor ? [{ to: '/dashboard', label: 'My Learning' }] : []),
    // Instructor: to'g'ridan o'z paneliga
    ...(user && isInstructor ? [{ to: '/instructor', label: 'My Dashboard' }] : []),
    // Admin uchun qo'shimcha Instructor linki
    ...(user && isAdmin    ? [{ to: '/instructor', label: 'Instructor' }] : []),
  ];
  const isActive = (p) => location.pathname === p || location.pathname.startsWith(p + '/');

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: scrolled ? 'rgba(5,5,14,.94)' : 'rgba(5,5,14,.72)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid var(--border)',
      boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,.4)' : 'none',
      transition: 'background .2s, box-shadow .2s',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 60, gap: 8 }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9, textDecoration: 'none', marginRight: 6 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,var(--accent),#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, letterSpacing: '-.02em' }}>
            LearnHub
          </span>
        </Link>

        {/* Nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
          {navLinks.map(({ to, label }) => (
            <Link key={to} to={to} style={{
              padding: '6px 14px', fontSize: 14, fontWeight: isActive(to) ? 600 : 500,
              color: isActive(to) ? 'var(--text-primary)' : 'var(--text-secondary)',
              borderRadius: 'var(--r-sm)', background: isActive(to) ? 'var(--accent-muted)' : 'none',
              transition: 'all .15s',
            }}>{label}</Link>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user ? (
            <>
              {/* Notifications */}
              <div ref={notifRef} style={{ position: 'relative' }}>
                <button onClick={handleNotifOpen} style={s.iconBtn} aria-label="Notifications">
                  <svg width="17" height="17" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
                  </svg>
                  {unread > 0 && (
                    <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 99, background: 'var(--danger)', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg)', padding: '0 3px' }}>
                      {unread > 9 ? '9+' : unread}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div style={{ ...s.dropdown, width: 340 }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700, fontSize: 14 }}>Notifications</span>
                      {unread > 0 && <span style={{ fontSize: 11, color: 'var(--accent-bright)', fontWeight: 600 }}>{unread} new</span>}
                    </div>
                    <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                      {notifs.length === 0 ? (
                        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>All caught up! ✓</div>
                      ) : notifs.map((n) => (
                        <div key={n.id}
                          onClick={() => { if (n.link) { navigate(n.link); setNotifOpen(false); } }}
                          style={{ display: 'flex', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border-sub)', background: n.is_read ? 'none' : 'rgba(99,102,241,.05)', cursor: n.link ? 'pointer' : 'default', transition: 'background .15s' }}
                        >
                          <span style={{ fontSize: 18 }}>{NOTIF_ICONS[n.type] || '🔔'}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: n.is_read ? 500 : 700, marginBottom: 2 }}>{n.title}</div>
                            {n.message && <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.4 }}>{n.message.slice(0, 75)}{n.message.length > 75 ? '…' : ''}</div>}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{timeAgo(n.created_at)}</span>
                            {!n.is_read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)' }} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User menu */}
              <div ref={userRef} style={{ position: 'relative' }}>
                <button onClick={() => setUserOpen(!userOpen)} style={s.avatarBtn}>
                  {user.profile_avatar ? (
                    <img src={user.profile_avatar} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <div style={s.avatarCircle}>{initials}</div>
                  )}
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5">
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>
                {userOpen && (
                  <div className="dropdown-menu">
                    <div style={{ padding: '10px 14px 8px' }}>
                      <div style={{ fontWeight: 700, fontSize: 14 }}>{user.full_name || user.username}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>{user.email}</div>
                    </div>
                    <div className="dropdown-divider" />
                    <Link to="/dashboard" className="dropdown-item" onClick={() => setUserOpen(false)}>📚 My Learning</Link>
                    <Link to="/profile" className="dropdown-item" onClick={() => setUserOpen(false)}>👤 Profile Settings</Link>
                    <Link to="/wishlist" className="dropdown-item" onClick={() => setUserOpen(false)}>❤️ Wishlist</Link>
                    <Link to="/bookmarks" className="dropdown-item" onClick={() => setUserOpen(false)}>🔖 Bookmarks</Link>
                    {(user.is_instructor || user.is_staff) && (
                      <>
                        <div className="dropdown-divider" />
                        <Link to="/instructor" className="dropdown-item" onClick={() => setUserOpen(false)}>🎓 Instructor Dashboard</Link>
                      </>
                    )}
                    {( user.is_staff || user.role === "admin" ) && (
                      <Link to="/admin-panel" className="dropdown-item" onClick={() => setUserOpen(false)}>⚙️ Admin Panel</Link>
                    )}
                    <div className="dropdown-divider" />
                    <button className="dropdown-item danger" onClick={handleLogout}>→ Sign Out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Sign In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Start Free</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const s = {
  iconBtn: { width: 36, height: 36, border: '1px solid var(--border)', background: 'var(--bg-elevated)', borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all .15s', position: 'relative' },
  avatarBtn: { display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 99, padding: '4px 10px 4px 4px', cursor: 'pointer', transition: 'border-color .15s' },
  avatarCircle: { width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),#8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-display)' },
  dropdown: { position: 'absolute', top: 'calc(100% + 10px)', right: 0, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-lg)', zIndex: 200, animation: 'dropIn .18s var(--ease)', overflow: 'hidden' },
};
