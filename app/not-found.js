import Link from 'next/link';
import './not-found.css';

export default function NotFound() {
  return (
    <div className="error-container">
      <div className="error-content">
        <div className="error-illustration">
          <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="100" cy="100" r="80" fill="#e0efff" />
            <path d="M60 80C60 74.4772 64.4772 70 70 70H130C135.523 70 140 74.4772 140 80V140C140 145.523 135.523 150 130 150H70C64.4772 150 60 145.523 60 140V80Z" fill="#0076c7" />
            <circle cx="85" cy="105" r="8" fill="white" />
            <circle cx="115" cy="105" r="8" fill="white" />
            <path d="M80 130C80 130 90 120 100 120C110 120 120 130 120 130" stroke="white" strokeWidth="4" strokeLinecap="round" />
            <path d="M50 60L55 55M150 60L145 55M100 45V50" stroke="#0076c7" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </div>
        <div className="error-code">404</div>
        <h1 className="error-title">Page Not Found</h1>
        <p className="error-message">
          Oops! The page you&apos;re looking for seems to have wandered off.
          Don&apos;t worry, let&apos;s get you back on track to learning French!
        </p>
        <div className="error-actions">
          <Link href="/" className="btn-primary">Go to Homepage</Link>
          <Link href="/#contact" className="btn-secondary">Contact Support</Link>
        </div>
      </div>
    </div>
  );
}
