import { Suspense } from 'react';
import SuccessClient from './SuccessClient';
import './success.css';

export const metadata = {
  title: 'Payment Successful',
  description: 'Thank you for your purchase! Your Enprico plan is now active.',
  robots: { index: false, follow: false },
};

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="success-container">
          <div className="success-card">
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Setting up your account...</p>
            </div>
          </div>
        </div>
      }
    >
      <SuccessClient />
    </Suspense>
  );
}
