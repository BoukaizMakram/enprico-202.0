'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getCurrentUser,
  getUserProfile,
  getDashboardData,
  signOut,
  updatePassword,
} from '@/lib/supabase/client';
import './dashboard.css';

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getPlanBadgeClass(planType) {
  const classes = { starter: 'plan-starter', professional: 'plan-professional', enterprise: 'plan-enterprise' };
  return classes[planType] || 'plan-starter';
}

function formatPlanName(planType) {
  return planType ? planType.charAt(0).toUpperCase() + planType.slice(1) : '-';
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [examsData, setExamsData] = useState([]);
  const [exercisesData, setExercisesData] = useState([]);

  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const { user: currentUser, error: authError } = await getCurrentUser();
      if (authError || !currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      // Role guard
      const { data: profile } = await getUserProfile(currentUser.id);
      if (profile && profile.role === 'tutor') {
        router.push('/tutor');
        return;
      }

      const data = await getDashboardData(currentUser.id);
      if (!data) throw new Error('Failed to load dashboard data');
      setDashboardData(data);

      // Load exams and exercises
      loadExams(currentUser.id);
      loadExercises(currentUser.id);

      // Check for password change prompt
      if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('needsPasswordChange') === 'true') {
        setShowPasswordModal(true);
      }

      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard');
      setLoading(false);
    }
  }

  async function loadExams(userId) {
    try {
      const res = await fetch(`/api/student/exams?user_id=${userId}`);
      const result = await res.json();
      if (result.success) {
        setExamsData(result.data || []);
      }
    } catch (e) {
      console.error('Failed to load exams:', e);
    }
  }

  async function loadExercises(userId) {
    try {
      const res = await fetch(`/api/student/exercises?user_id=${userId}`);
      const result = await res.json();
      if (result.success) {
        setExercisesData(result.data || []);
      }
    } catch (e) {
      console.error('Failed to load exercises:', e);
    }
  }

  async function handleLogout() {
    await signOut();
    router.push('/login');
  }

  async function handlePasswordChange(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      const { error: updateError } = await updatePassword(newPassword);
      if (updateError) throw updateError;
      setPasswordSuccess('Password updated successfully!');
      sessionStorage.removeItem('needsPasswordChange');
      setTimeout(() => setShowPasswordModal(false), 1500);
    } catch (err) {
      setPasswordError(err.message || 'Failed to update password');
    }
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div style={{ padding: '2rem' }}>
          <div className="error-message">{error}</div>
        </div>
      </div>
    );
  }

  const profile = dashboardData?.profile;
  const subscription = dashboardData?.subscription;
  const hours = dashboardData?.hours;
  const upcomingSessions = dashboardData?.upcomingSessions || [];
  const name = profile?.full_name || 'Student';
  const firstName = name.split(' ')[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const remainingHours = hours ? parseFloat(hours.remaining_hours) : 0;
  const totalHours = hours ? parseFloat(hours.total_hours) : 0;
  const usedHours = hours ? parseFloat(hours.used_hours) : 0;
  const hoursPercent = totalHours > 0 ? ((usedHours / totalHours) * 100) : 0;

  const examCount = examsData.length;
  const examGraded = examsData.filter(e => e.status === 'graded').length;

  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      <aside className="sidebar">
        <Link href="/" className="sidebar-logo">
          <img src="/images/fav icon.png" alt="Enprico" onError={(e) => { e.target.style.display = 'none'; }} />
          <span>Enprico</span>
        </Link>

        <nav>
          <div className="nav-section">
            <div className="nav-section-title">Menu</div>
            <div
              className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
              <span>Overview</span>
            </div>
            <div
              className={`nav-item ${activeTab === 'exams' ? 'active' : ''}`}
              onClick={() => setActiveTab('exams')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
              <span>Exams</span>
            </div>
            <div
              className={`nav-item ${activeTab === 'exercises' ? 'active' : ''}`}
              onClick={() => setActiveTab('exercises')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
              <span>Exercises</span>
            </div>
            <a href="/#contact" className="nav-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span>Support</span>
            </a>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{name.charAt(0).toUpperCase()}</div>
            <div className="user-meta">
              <div className="name">{name}</div>
              <div className="email">{user?.email}</div>
            </div>
          </div>
          <div className="nav-item" onClick={handleLogout} style={{ color: 'var(--gray-500)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Log out</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Overview Tab */}
        <div className={`tab-content ${activeTab === 'overview' ? 'active' : ''}`}>
          <div className="page-header">
            <h1 className="page-title">{greeting}, {firstName}</h1>
            <p className="page-subtitle">Here&apos;s your learning overview</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-label">Hours Remaining</div>
              <div className="stat-card-value">{remainingHours}</div>
              <div className="stat-card-sub">{usedHours} of {totalHours} used</div>
              <div className="hours-bar">
                <div className="hours-bar-fill" style={{ width: `${hoursPercent}%` }}></div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Current Plan</div>
              <div className="stat-card-value" style={{ fontSize: '1.25rem' }}>
                {formatPlanName(subscription?.plan_type)}
              </div>
              <div className="stat-card-sub">
                {subscription ? `$${subscription.price_usd}/month` : '-'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Status</div>
              <div className="stat-card-value" style={{ fontSize: '1.25rem' }}>
                {subscription?.status ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1) : '-'}
              </div>
              <div className="stat-card-sub">
                Renewal: {subscription?.end_date ? formatDate(subscription.end_date) : '-'}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-card-label">Exams Received</div>
              <div className="stat-card-value">{examCount}</div>
              <div className="stat-card-sub">{examGraded} graded</div>
            </div>
          </div>

          <div className="content-grid">
            <div>
              {/* Recent Exams */}
              <div className="card" style={{ marginBottom: '1.5rem' }}>
                <div className="card-header">
                  <h2 className="card-title">Recent Exams</h2>
                </div>
                {examsData.length === 0 ? (
                  <div className="empty-state">No exams received yet</div>
                ) : (
                  examsData.slice(0, 3).map((exam, i) => (
                    <div key={i} className="exam-item">
                      <div className="exam-info">
                        <div className="exam-title">{exam.title}</div>
                        {exam.notes && <div className="exam-notes">{exam.notes}</div>}
                        <div className="exam-meta">
                          <span className={`status-badge status-${exam.status}`}>{exam.status}</span>
                          <span>{formatDate(exam.created_at)}</span>
                          {exam.file_url && <a href={exam.file_url} target="_blank" rel="noopener noreferrer">Download file</a>}
                        </div>
                      </div>
                      {exam.status === 'graded' && exam.score !== null && (
                        <div className="score-display">
                          <div className="score-value">{exam.score}</div>
                          <div className="score-label">/ 100</div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Upcoming Sessions */}
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Upcoming Sessions</h2>
                </div>
                {upcomingSessions.length === 0 ? (
                  <div className="empty-state">No upcoming sessions scheduled</div>
                ) : (
                  upcomingSessions.map((session, i) => (
                    <div key={i} className="session-item">
                      <div className="session-date">
                        {new Date(session.scheduled_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="session-details">
                        {new Date(session.scheduled_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - {session.duration_hours}h
                        {session.tutor_name && ` with ${session.tutor_name}`}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Subscription Card */}
            <div className="card" style={{ alignSelf: 'start' }}>
              <div className="card-header">
                <h2 className="card-title">Subscription</h2>
              </div>
              <div className="card-body">
                <div className="info-row">
                  <span className="info-label">Plan</span>
                  <span className="info-value">
                    <span className={`plan-badge ${getPlanBadgeClass(subscription?.plan_type)}`}>
                      {formatPlanName(subscription?.plan_type)}
                    </span>
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Status</span>
                  <span className="info-value">
                    {subscription?.status ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1) : '-'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Renewal</span>
                  <span className="info-value">{subscription?.end_date ? formatDate(subscription.end_date) : '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Price</span>
                  <span className="info-value">{subscription ? `$${subscription.price_usd}/month` : '-'}</span>
                </div>
              </div>
              <a href="mailto:learn@enprico.ca" className="contact-link">Need help? Contact support</a>
            </div>
          </div>
        </div>

        {/* Exams Tab */}
        <div className={`tab-content ${activeTab === 'exams' ? 'active' : ''}`}>
          <div className="page-header">
            <h1 className="page-title">Mock Exams &amp; Exercises</h1>
            <p className="page-subtitle">Assignments from your tutor</p>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">All Exams</h2>
            </div>
            {examsData.length === 0 ? (
              <div className="empty-state">No exams received yet</div>
            ) : (
              examsData.map((exam, i) => (
                <div key={i} className="exam-item">
                  <div className="exam-info">
                    <div className="exam-title">{exam.title}</div>
                    {exam.notes && <div className="exam-notes">{exam.notes}</div>}
                    <div className="exam-meta">
                      <span className={`status-badge status-${exam.status}`}>{exam.status}</span>
                      <span>{formatDate(exam.created_at)}</span>
                      {exam.file_url && <a href={exam.file_url} target="_blank" rel="noopener noreferrer">Download file</a>}
                    </div>
                  </div>
                  {exam.status === 'graded' && exam.score !== null && (
                    <div className="score-display">
                      <div className="score-value">{exam.score}</div>
                      <div className="score-label">/ 100</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Exercises Tab */}
        <div className={`tab-content ${activeTab === 'exercises' ? 'active' : ''}`}>
          <div className="page-header">
            <h1 className="page-title">Exercises</h1>
            <p className="page-subtitle">Exercises and quizzes from your tutor</p>
          </div>

          <div className="card">
            <div className="card-header">
              <h2 className="card-title">All Exercises</h2>
            </div>
            {exercisesData.length === 0 ? (
              <div className="empty-state">No exercises received yet</div>
            ) : (
              exercisesData.map((ex, i) => (
                <div key={i} className="exercise-item">
                  <div className="exercise-header">
                    <div>
                      <div className="exercise-title">{ex.title}</div>
                      <div className="exam-meta" style={{ marginTop: '0.25rem' }}>
                        <span className="exercise-type-badge">{ex.type}</span>
                        <span className={`status-badge status-${ex.status}`}>{ex.status}</span>
                        <span>{formatDate(ex.created_at)}</span>
                      </div>
                    </div>
                    {ex.status === 'graded' && ex.score !== null && (
                      <div className="score-display">
                        <div className="score-value">{ex.score}</div>
                        <div className="score-label">/ 100</div>
                      </div>
                    )}
                  </div>
                  {ex.instructions && <div className="exercise-instructions">{ex.instructions}</div>}
                  {ex.type === 'video' && ex.video_url && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <a href={ex.video_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-blue)', fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none' }}>Watch Video</a>
                    </div>
                  )}
                  {ex.type === 'pdf' && ex.file_url && (
                    <div style={{ marginBottom: '0.5rem' }}>
                      <a href={ex.file_url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-blue)', fontSize: '0.85rem', fontWeight: 500, textDecoration: 'none' }}>Download PDF</a>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Change Your Password</h2>
            <p>For your security, please set a new password for your account.</p>

            <div className="password-warning">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <p>You&apos;re currently using a temporary password. Please update it to keep your account secure.</p>
            </div>

            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  placeholder="Enter new password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  placeholder="Confirm new password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {passwordError && <p className="error-text">{passwordError}</p>}
                {passwordSuccess && <p className="success-text">{passwordSuccess}</p>}
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary-modal"
                  onClick={() => {
                    sessionStorage.removeItem('needsPasswordChange');
                    setShowPasswordModal(false);
                  }}
                >
                  Skip for now
                </button>
                <button type="submit" className="btn-primary-modal">Update Password</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
