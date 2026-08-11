'use client';

import Link from 'next/link';
import './register.css';

export default function RegisterPage() {
  return (
    <div className="register-container">
      <div className="register-banner">
        <div className="register-banner-content">
          <h2>Site Under Maintenance</h2>
          <p>We are currently improving our platform to serve you better.</p>
        </div>
      </div>

      <div className="register-form-section">
        <div className="register-card" style={{ textAlign: 'center' }}>
          <div className="register-logo">
            <Link href="/">
              <img src="/images/fav icon.png" alt="Enprico Logo" />
            </Link>
          </div>

          <div style={{ padding: '2rem 1rem' }}>
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#0D66CF" strokeWidth="1.5" style={{ marginBottom: '1.5rem' }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>

            <h1 className="register-title" style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
              Registration Temporarily Unavailable
            </h1>
            <p style={{ color: '#666', fontSize: '1.05rem', lineHeight: 1.6, maxWidth: '420px', margin: '0 auto 1.5rem' }}>
              Our site is currently under maintenance. Registration and enrollment are temporarily closed while we make improvements.
            </p>
            <p style={{ color: '#888', fontSize: '0.95rem', marginBottom: '2rem' }}>
              Please check back soon. We apologize for the inconvenience.
            </p>

            <Link
              href="/"
              style={{
                display: 'inline-block',
                padding: '0.75rem 2rem',
                background: 'linear-gradient(135deg, #0D66CF, #0a4fa3)',
                color: '#fff',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '1rem',
              }}
            >
              Back to Home
            </Link>
          </div>

          <div className="register-footer">
            Already have an account? <Link href="/login">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
