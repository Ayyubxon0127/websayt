import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Field({ name, label, type = 'text', placeholder, value, onChange, error }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input type={type} name={name} className="form-input" placeholder={placeholder}
        value={value} onChange={onChange} required
        autoComplete={type === 'password' ? 'new-password' : 'off'} />
      {error && <span className="form-error">{Array.isArray(error) ? error[0] : error}</span>}
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: '', last_name: '', username: '', email: '',
    password: '', password2: '', role: 'student',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (form.password !== form.password2) { setErrors({ password2: 'Passwords do not match.' }); return; }
    setLoading(true);
    try {
      await register(form);
      navigate('/login', { state: { message: 'Account created! Please sign in.' } });
    } catch (err) {
      const data = err.response?.data || {};
      if (typeof data === 'object') setErrors(data);
      else setErrors({ non_field: 'Registration failed. Please try again.' });
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,.15) 0%,transparent 70%)', top: -150, right: -150 }} />
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,.1) 0%,transparent 70%)', bottom: -100, left: -100 }} />
      </div>

      <div style={{ width: '100%', maxWidth: 520, position: 'relative', zIndex: 1 }} className="slide-up">
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, textDecoration: 'none', marginBottom: 24 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,var(--accent),#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>LearnHub</span>
          </Link>
          <h1 style={{ fontSize: 28, fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: 8 }}>Create your account</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Start learning for free — no credit card required</p>
        </div>

        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', padding: '32px' }}>
          {errors.non_field && <div className="alert alert-error" style={{ marginBottom: 20, fontSize: 13 }}>⚠ {errors.non_field}</div>}

          {/* Role selector */}
          <div style={{ marginBottom: 20 }}>
            <label className="form-label" style={{ marginBottom: 8, display: 'block' }}>I want to join as</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { value: 'student', icon: '🎓', label: 'Student', sub: 'Learn from courses' },
                { value: 'instructor', icon: '📚', label: 'Instructor', sub: 'Teach and earn' },
              ].map(r => (
                <label key={r.value} style={{ cursor: 'pointer' }}>
                  <input type="radio" name="role" value={r.value} checked={form.role === r.value}
                    onChange={handleChange} style={{ display: 'none' }} />
                  <div style={{
                    padding: '12px 14px', borderRadius: 10, border: `2px solid ${form.role === r.value ? 'var(--accent-bright)' : 'var(--border)'}`,
                    background: form.role === r.value ? 'rgba(99,102,241,.08)' : 'transparent',
                    display: 'flex', alignItems: 'center', gap: 10, transition: 'all .15s',
                  }}>
                    <span style={{ fontSize: 22 }}>{r.icon}</span>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{r.label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.sub}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field name="first_name" label="First name" placeholder="Alex" value={form.first_name} onChange={handleChange} error={errors.first_name} />
              <Field name="last_name" label="Last name" placeholder="Chen" value={form.last_name} onChange={handleChange} error={errors.last_name} />
            </div>
            <Field name="username" label="Username" placeholder="alexchen" value={form.username} onChange={handleChange} error={errors.username} />
            <Field name="email" label="Email address" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} error={errors.email} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <Field name="password" label="Password" type="password" placeholder="Min 8 chars" value={form.password} onChange={handleChange} error={errors.password} />
              <Field name="password2" label="Confirm password" type="password" placeholder="Repeat" value={form.password2} onChange={handleChange} error={errors.password2} />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}
              style={{ marginTop: 6, width: '100%', justifyContent: 'center' }}>
              {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Creating account…</> : 'Create Account →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 22, fontSize: 14, color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--accent-bright)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
