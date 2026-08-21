'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser, signIn } from '@/lib/supabase/client';
import { PLANS } from '@/lib/stripe/client';
import { trackReddit } from '@/lib/reddit/pixel';

const REDIRECT_SECONDS = 6;

export default function SuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ranRef = useRef(false);

  const [status, setStatus] = useState('loading'); // loading | success | error
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [copied, setCopied] = useState(false);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    // Guard against React 18/19 double-invoke in dev
    if (ranRef.current) return;
    ranRef.current = true;

    async function verifyAndComplete() {
      const sessionId = searchParams.get('session_id');
      if (!sessionId) {
        setErrorMessage('No payment session was found. If you were charged, please contact support.');
        setStatus('error');
        return;
      }

      try {
        const response = await fetch('/api/registration/complete-registration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to complete your registration.');
        }

        // Clear onboarding data
        try {
          localStorage.removeItem('enprico_registration');
          localStorage.removeItem('selectedPlan');
        } catch {}

        setResult(data);

        // Reddit Purchase conversion — Pixel + CAPI, deduped by conversionId.
        // conversionId is keyed to the Stripe session so a page reload (which
        // re-hits complete-registration) can't double-count the purchase.
        try {
          const purchasePlan = PLANS[data.planType] || null;
          trackReddit(
            'Purchase',
            {
              conversionId: `purchase_${sessionId}`,
              value: purchasePlan?.price,
              currency: purchasePlan?.currency || 'CAD',
              itemCount: 1,
              products: purchasePlan
                ? [{ id: data.planType, name: purchasePlan.name, category: 'French Tutoring' }]
                : undefined,
            },
            { email: data.userEmail, externalId: data.userId }
          );
        } catch {}

        // New user: auto sign-in with the temporary password so we can drop
        // them straight into the dashboard to set their own password.
        if ((data.newUser || data.alreadyCompleted) && data.temporaryPassword && data.userEmail) {
          try {
            const { data: signInData, error } = await signIn(data.userEmail, data.temporaryPassword);
            if (signInData?.user && !error) {
              setLoggedIn(true);
              if (typeof sessionStorage !== 'undefined') {
                sessionStorage.setItem('needsPasswordChange', 'true');
              }
            }
          } catch {
            // Auto-login failed — they can still log in with the emailed credentials.
          }
        } else {
          // Existing / returning user: check whether they already have a session.
          const { user } = await getCurrentUser();
          if (user) setLoggedIn(true);
        }

        setStatus('success');

        // Clean the session_id out of the URL.
        try {
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch {}
      } catch (err) {
        setErrorMessage(err.message || 'Something went wrong while setting up your account.');
        setStatus('error');
      }
    }

    verifyAndComplete();
  }, [searchParams]);

  // Redirect countdown once we know the user is logged in.
  useEffect(() => {
    if (status !== 'success' || !loggedIn) return;
    if (countdown <= 0) {
      router.push('/dashboard');
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [status, loggedIn, countdown, router]);

  function copyPassword() {
    if (!result?.temporaryPassword) return;
    navigator.clipboard.writeText(result.temporaryPassword).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (status === 'loading') {
    return (
      <div className="success-container">
        <div className="success-card">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Confirming your payment and setting up your account...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="success-container">
        <div className="success-card">
          <div className="error-state">
            <h2>We hit a snag</h2>
            <p>{errorMessage}</p>
            <a href="mailto:learn@enprico.ca" className="btn-dashboard">Contact Support</a>
          </div>
        </div>
      </div>
    );
  }

  const planType = result?.planType || 'starter';
  const plan = PLANS[planType] || { name: 'Your Plan', hours: 0, price: 0 };
  const fullName = result?.fullName || '';
  const firstName = fullName ? fullName.split(' ')[0] : '';
  const isNewUser = Boolean(result?.newUser || result?.alreadyCompleted);
  const hours = result?.hours ?? plan.hours;

  return (
    <div className="success-container">
      <div className="success-card">
        <div className="success-icon">
          <svg viewBox="0 0 24 24">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <h1>Congratulations{firstName ? `, ${firstName}` : ''}! 🎉</h1>

        <p className="welcome-message">
          Your payment went through and your plan is now active. Welcome to Enprico!
        </p>

        <div className="contact-notice">
          <p>
            <strong>We&apos;ll be in touch on your email very soon</strong> to arrange your first
            lessons. Keep an eye on your inbox <em>and</em> your dashboard — that&apos;s where
            everything happens from here.
          </p>
        </div>

        <div className="order-details">
          <h3>Order Summary</h3>
          <div className="order-row">
            <span className="order-label">Plan</span>
            <span className="order-value">{plan.name || `${planType.charAt(0).toUpperCase() + planType.slice(1)} Plan`}</span>
          </div>
          <div className="order-row">
            <span className="order-label">Amount Paid</span>
            <span className="order-value">${plan.price} {plan.currency || 'CAD'}</span>
          </div>
          <div className="order-row">
            <span className="order-label">Hours Added</span>
            <span className="order-value">{hours} hours</span>
          </div>
        </div>

        {isNewUser && result?.temporaryPassword && (
          <div className="credentials-box">
            <h3>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Your Login Details
            </h3>
            <div className="credential">
              <span className="credential-label">Email</span>
              <span className="credential-value">{result.userEmail}</span>
            </div>
            <div className="credential">
              <span className="credential-label">Temporary Password</span>
              <span className="credential-value">{result.temporaryPassword}</span>
              <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={copyPassword} type="button">
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="credentials-hint">
              You can keep this password, or set your own from your dashboard in a few seconds.
            </p>
          </div>
        )}

        {isNewUser && result?.emailSent && (
          <div className="email-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
              <polyline points="22,6 12,13 2,6"></polyline>
            </svg>
            <p>We&apos;ve emailed your login details too. Please check your inbox (and spam folder).</p>
          </div>
        )}

        <div className="action-buttons">
          {loggedIn ? (
            <Link href="/dashboard" className="btn-dashboard">Go to My Dashboard</Link>
          ) : (
            <Link href="/login" className="btn-dashboard">Log In &amp; Go to Dashboard</Link>
          )}
        </div>

        {loggedIn && (
          <p className="redirect-notice">
            Taking you to your dashboard in {countdown}s...
          </p>
        )}
      </div>
    </div>
  );
}
