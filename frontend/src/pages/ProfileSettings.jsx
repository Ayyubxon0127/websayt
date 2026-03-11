import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

export default function ProfileSettings() {
  const { user, login } = useAuth();
  const avatarRef = useRef(null);
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    bio: user?.bio || '',
    avatar_url: user?.avatar_url || '',
    website: user?.website || '',
    twitter: user?.twitter || '',
    linkedin: user?.linkedin || '',
    location: user?.location || '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState('');
  const [tab, setTab] = useState('profile');

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true); setSuccess(''); setError('');
    try {
      await authService.updateProfile(form);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(JSON.stringify(err.response?.data || 'Failed to update.'));
    } finally { setSaving(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('avatar', file);
    setSaving(true);
    try {
      await authService.uploadAvatar(fd);
      setSuccess('Avatar updated!');
    } catch { setError('Avatar upload failed.'); }
    finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) { setPwMsg('Passwords do not match.'); return; }
    setPwSaving(true); setPwMsg('');
    try {
      await authService.updateProfile({ old_password: pwForm.old_password, new_password: pwForm.new_password });
      setPwMsg('Password changed successfully!');
      setPwForm({ old_password: '', new_password: '', confirm: '' });
    } catch (err) {
      setPwMsg(err.response?.data?.detail || 'Failed to change password.');
    } finally { setPwSaving(false); }
  };

  const initials = (user?.full_name || user?.username || '?')[0].toUpperCase();

  return (
    <div style={{ minHeight: '100vh', padding: '52px 0' }}>
      <div className="container-sm">
        <div style={{ marginBottom: 36 }} className="slide-up">
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-bright)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 8 }}>Account</div>
          <h1 style={{ fontSize: 30, fontWeight: 800, fontFamily: 'var(--font-display)' }}>Profile Settings</h1>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 32 }}>
          {[['profile','👤 Profile'],['password','🔐 Password'],['account','⚙️ Account']].map(([v,l]) => (
            <button key={v} className={`tab ${tab===v?'active':''}`} onClick={() => setTab(v)}>{l}</button>
          ))}
        </div>

        {tab === 'profile' && (
          <form onSubmit={handleSave} className="fade-in">
            {/* Avatar section */}
            <div style={{ display: 'flex', gap: 24, alignItems: 'flex-end', marginBottom: 36, padding: '28px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
              <div style={{ position: 'relative' }}>
                <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 34, fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', border: '3px solid var(--border)', overflow: 'hidden' }}>
                  {user?.profile_avatar ? (
                    <img src={user.profile_avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : initials}
                </div>
                <button type="button" onClick={() => avatarRef.current?.click()}
                  style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: 'var(--accent)', border: '2px solid var(--bg-card)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>
                  📷
                </button>
                <input type="file" ref={avatarRef} accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{user?.full_name || user?.username}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>{user?.email}</div>
                <button type="button" onClick={() => avatarRef.current?.click()} className="btn btn-secondary btn-sm">Upload Photo</button>
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '28px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: 24, fontSize: 16 }}>Personal Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input className="form-input" value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} placeholder="First name" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input className="form-input" value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} placeholder="Last name" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Bio</label>
                  <textarea className="form-textarea" value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Tell learners about yourself…" rows={4} />
                </div>

                <div className="form-group">
                  <label className="form-label">Avatar URL</label>
                  <input className="form-input" value={form.avatar_url} onChange={e => setForm(p => ({ ...p, avatar_url: e.target.value }))} placeholder="https://…" />
                </div>

                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="form-input" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="City, Country" />
                </div>

                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 20 }}>
                  <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 15 }}>Social Links</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {[['website','🌐','Website URL','https://yoursite.com'],['twitter','🐦','Twitter Username','@yourhandle'],['linkedin','💼','LinkedIn Username','your-linkedin']].map(([f,i,l,ph]) => (
                      <div className="form-group" key={f}>
                        <label className="form-label">{i} {l}</label>
                        <input className="form-input" value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} placeholder={ph} />
                      </div>
                    ))}
                  </div>
                </div>

                {success && <div className="alert alert-success">✓ {success}</div>}
                {error && <div className="alert alert-error">⚠ {error}</div>}

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <button type="submit" disabled={saving} className="btn btn-primary btn-lg">
                    {saving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}

        {tab === 'password' && (
          <form onSubmit={handlePasswordChange} className="fade-in">
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '28px', maxWidth: 460 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 24, fontSize: 16 }}>Change Password</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input type="password" className="form-input" value={pwForm.old_password} onChange={e => setPwForm(p => ({ ...p, old_password: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-input" value={pwForm.new_password} onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" className="form-input" value={pwForm.confirm} onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))} />
                </div>
                {pwMsg && <div className={`alert ${pwMsg.includes('success') ? 'alert-success' : 'alert-error'}`}>{pwMsg}</div>}
                <button type="submit" disabled={pwSaving} className="btn btn-primary">
                  {pwSaving ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            </div>
          </form>
        )}

        {tab === 'account' && (
          <div className="fade-in">
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '28px', marginBottom: 20 }}>
              <h3 style={{ fontWeight: 700, marginBottom: 16, fontSize: 16 }}>Account Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[['Email',user?.email],['Username',user?.username],['Account Type',user?.is_staff ? 'Admin' : user?.is_instructor ? 'Instructor' : 'Student'],['Member Since',new Date(user?.date_joined || Date.now()).toLocaleDateString()]].map(([l,v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-sub)', fontSize: 14 }}>
                    <span style={{ color: 'var(--text-muted)' }}>{l}</span>
                    <span style={{ fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ background: 'var(--danger-dim)', border: '1px solid rgba(244,63,94,.25)', borderRadius: 'var(--r-md)', padding: '24px' }}>
              <h3 style={{ fontWeight: 700, fontSize: 15, color: 'var(--danger)', marginBottom: 8 }}>⚠ Danger Zone</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>Permanently delete your account and all data.</p>
              <button className="btn btn-danger" disabled>Delete Account (Contact Support)</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
