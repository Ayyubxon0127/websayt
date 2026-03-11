import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { progressService } from '../services/api';

export default function CertificatePage() {
  const { slug } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    progressService.getCertificate(slug)
      .then(({ data }) => setCert(data))
      .catch(err => setError(err.response?.data?.error || 'Could not load certificate.'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="loading-center" style={{ minHeight: '80vh' }}><div className="spinner" style={{ width: 36, height: 36 }} /></div>;

  if (error || !cert) return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>📜</div>
        <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>Certificate Not Available</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{error}</p>
        <Link to="/dashboard" className="btn btn-primary">← Dashboard</Link>
      </div>
    </div>
  );

  const issueDate = new Date(cert.issued_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div style={{ minHeight: '100vh', paddingBlock: 60 }}>
      <div className="container-sm">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ fontSize: 26, fontFamily: 'var(--font-display)', fontWeight: 800, marginBottom: 8 }}>Your Certificate</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Congratulations on completing this course!</p>
        </div>

        <div id="certificate" style={{ background: 'linear-gradient(135deg,#0e0e25 0%,#0a0a1a 100%)', border: '1px solid rgba(99,102,241,.3)', borderRadius: 'var(--r-xl)', padding: '56px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden', boxShadow: '0 0 80px rgba(99,102,241,.15),0 24px 80px rgba(0,0,0,.5)' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 20%,rgba(99,102,241,.12) 0%,transparent 50%), radial-gradient(circle at 80% 80%,rgba(139,92,246,.1) 0%,transparent 50%)', pointerEvents: 'none' }} />
          {['top-left','top-right','bottom-left','bottom-right'].map((pos) => (
            <div key={pos} style={{ position: 'absolute', width: 70, height: 70, border: '1px solid rgba(99,102,241,.2)', borderRadius: 8, pointerEvents: 'none', ...(pos.includes('top') ? { top: 20 } : { bottom: 20 }), ...(pos.includes('left') ? { left: 20, transform: 'rotate(-15deg)' } : { right: 20, transform: 'rotate(15deg)' }) }} />
          ))}

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,var(--accent),#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#fff" strokeWidth="2.2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22 }}>LearnHub</span>
            </div>

            <div style={{ fontSize: 52, marginBottom: 14 }}>🏆</div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.15em', color: 'var(--text-secondary)', marginBottom: 12 }}>Certificate of Completion</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10 }}>This is to certify that</div>
            <div style={{ fontSize: 38, fontFamily: 'var(--font-display)', fontWeight: 800, background: 'linear-gradient(135deg,var(--accent-bright),#c4b5fd,var(--sky))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', marginBottom: 10, letterSpacing: '-.02em' }}>
              {cert.student_name}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 12 }}>has successfully completed</div>
            <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: 8, maxWidth: 500, margin: '0 auto 16px', lineHeight: 1.3 }}>
              {cert.course_title}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 32 }}>
              Instructed by <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{cert.instructor_name}</span>
            </div>
            <div style={{ width: 140, height: 1, background: 'linear-gradient(90deg,transparent,rgba(99,102,241,.5),transparent)', margin: '0 auto 24px' }} />
            <div style={{ display: 'flex', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Issued</div>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{issueDate}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4 }}>Certificate ID</div>
                <div style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent-bright)' }}>{cert.certificate_id}</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28, flexWrap: 'wrap' }}>
          <button onClick={() => window.print()} className="btn btn-primary">🖨 Print / Save PDF</button>
          <Link to="/dashboard" className="btn btn-secondary">← Dashboard</Link>
          <Link to={`/courses/${slug}`} className="btn btn-secondary">View Course</Link>
        </div>
        <p style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
          Use your browser's Print function and select "Save as PDF"
        </p>
      </div>
      <style>{`@media print { nav, .btn, footer, p { display: none !important; } body { background: #fff !important; } }`}</style>
    </div>
  );
}
