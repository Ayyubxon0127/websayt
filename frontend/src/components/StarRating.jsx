import React, { useState } from 'react';

export function StarDisplay({ rating = 0, size = 14, showNumber = false, reviewCount }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} style={{ fontSize: size, color: s <= Math.round(rating) ? 'var(--gold)' : 'var(--text-muted)', lineHeight: 1 }}>★</span>
      ))}
      {showNumber && (
        <span style={{ marginLeft: 6, fontSize: size, color: 'var(--gold)', fontWeight: 700 }}>
          {Number(rating).toFixed(1)}
        </span>
      )}
      {reviewCount !== undefined && (
        <span style={{ marginLeft: 4, fontSize: size - 1, color: 'var(--text-muted)' }}>({reviewCount})</span>
      )}
    </span>
  );
}

export function StarPicker({ value = 0, onChange, size = 28 }) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;
  return (
    <span style={{ display: 'inline-flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s} type="button"
          onClick={() => onChange?.(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: 'none', border: 'none', padding: 2, cursor: 'pointer',
            fontSize: size, color: s <= display ? 'var(--gold)' : 'var(--text-muted)',
            transition: 'color .15s, transform .1s',
            transform: s <= display ? 'scale(1.15)' : 'scale(1)', lineHeight: 1,
          }}
        >★</button>
      ))}
    </span>
  );
}

export function RatingBreakdown({ breakdown = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {breakdown.map(({ star, count, percentage }) => (
        <div key={star} className="rating-bar-row">
          <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 10, textAlign: 'center' }}>{star}</span>
          <span style={{ fontSize: 12, color: 'var(--gold)' }}>★</span>
          <div className="rating-bar-track">
            <div className="rating-bar-fill" style={{ width: `${percentage}%` }} />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', width: 28, textAlign: 'right' }}>{count}</span>
        </div>
      ))}
    </div>
  );
}
