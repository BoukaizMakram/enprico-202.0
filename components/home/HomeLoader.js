'use client';

import dynamic from 'next/dynamic';

const HomeClient = dynamic(() => import('./HomeClient'), {
  ssr: false,
  loading: () => (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 40, height: 40, border: '3px solid #e5e7eb', borderTopColor: '#0C5FF9',
          borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
        }} />
        <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>Loading...</p>
      </div>
    </div>
  ),
});

export default function HomeLoader() {
  return <HomeClient />;
}
