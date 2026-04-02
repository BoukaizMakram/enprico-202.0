'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, getCurrentUser, getUserProfile, resetPassword } from '@/lib/supabase/client';
import './login.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function redirectByRole(userId) {
    const { data: profile } = await getUserProfile(userId);
    if (profile && profile.role === 'admin') {
      router.push('/admin');
    } else if (profile && profile.role === 'tutor') {
      router.push('/tutor');
    } else {
      router.push('/dashboard');
    }
  }

  useEffect(() => {
    async function checkExistingSession() {
      const { user } = await getCurrentUser();
      if (user) {
        await redirectByRole(user.id);
      }
    }
    checkExistingSession();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await signIn(email, password);
      if (signInError) throw new Error(signInError.message);
      if (data.user) {
        await redirectByRole(data.user.id);
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!email) throw new Error('Please enter your email address.');
      const { error: resetError } = await resetPassword(email);
      if (resetError) throw new Error(resetError.message);
      setResetSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-banner">
        <div className="auth-banner-content">
          <h2>Learn French with Enprico</h2>
          <p>Prepare for TEF &amp; TCF exams with personalized 1-on-1 tutoring sessions for Canada and France immigration.</p>
        </div>
      </div>

      <div className="auth-form-section">
        <div className="auth-card">
          <div className="auth-logo">
            <Link href="/">
              <img src="/images/fav icon.png" alt="Enprico Logo" />
            </Link>
          </div>

          <h1 className="auth-title">Welcome Back</h1>
          <p className="auth-subtitle">Sign in to access your dashboard</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                required
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Log In'}
            </button>
          </form>

          <div className="auth-footer">
            Don&apos;t have an account? <Link href="/#pricing">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
