import React from 'react';

export function Sk({ w, h, style = {}, round = false }) {
  return (
    <div className="skeleton" style={{
      width: w || '100%', height: h || 16,
      borderRadius: round ? '50%' : 6,
      flexShrink: 0, ...style,
    }} />
  );
}

export function CourseCardSkeleton() {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
      <Sk h={178} style={{ borderRadius: 0 }} />
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 11 }}>
        <div style={{ display: 'flex', gap: 8 }}><Sk w={72} h={20} /><Sk w={90} h={20} /></div>
        <Sk h={18} /><Sk h={18} w="75%" />
        <Sk h={14} /><Sk h={14} w="55%" />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Sk w={26} h={26} round /><Sk w={80} h={12} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}><Sk w={40} h={12} /><Sk w={40} h={12} /></div>
        </div>
      </div>
    </div>
  );
}

export function CourseGridSkeleton({ count = 6 }) {
  return (
    <div className="courses-grid">
      {Array.from({ length: count }).map((_, i) => <CourseCardSkeleton key={i} />)}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Sk w={44} h={44} style={{ borderRadius: 'var(--r-sm)' }} />
      <Sk h={36} w="50%" /><Sk h={14} w="70%" />
    </div>
  );
}

export function LessonItemSkeleton() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
      <Sk w={28} h={28} round />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <Sk h={12} /><Sk h={10} w="40%" />
      </div>
    </div>
  );
}

export function ReviewSkeleton() {
  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 10, borderBottom: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Sk w={40} h={40} round /><div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}><Sk h={14} w="120px" /><Sk h={12} w="80px" /></div>
      </div>
      <Sk h={14} /><Sk h={14} w="80%" />
    </div>
  );
}
