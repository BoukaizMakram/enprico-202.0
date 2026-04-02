'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getCurrentUser,
  getUserProfile,
  signOut,
  supabase,
} from '@/lib/supabase/client';
import './admin.css';

function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);

  // Data
  const [subscribers, setSubscribers] = useState([]);
  const [students, setStudents] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);

  useEffect(() => {
    loadAdmin();
  }, []);

  async function loadAdmin() {
    try {
      const { user: currentUser, error: authError } = await getCurrentUser();
      if (authError || !currentUser) {
        router.push('/login');
        return;
      }

      const { data: profile } = await getUserProfile(currentUser.id);
      if (!profile || profile.role !== 'admin') {
        router.push('/dashboard');
        return;
      }

      setUser(currentUser);
      await loadAllData();
    } catch (err) {
      console.error('Admin load error:', err);
      router.push('/login');
    }
  }

  async function loadAllData() {
    setLoading(true);
    await Promise.all([
      loadSubscribers(),
      loadStudents(),
      loadRegistrations(),
      loadTutors(),
      loadSubscriptions(),
    ]);
    setLoading(false);
  }

  async function loadSubscribers() {
    try {
      const { data } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false });
      setSubscribers(data || []);
    } catch (e) {
      console.error('Failed to load subscribers:', e);
    }
  }

  async function loadStudents() {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'student')
        .order('created_at', { ascending: false });
      setStudents(data || []);
    } catch (e) {
      console.error('Failed to load students:', e);
    }
  }

  async function loadRegistrations() {
    try {
      const { data } = await supabase
        .from('pending_registrations')
        .select('*')
        .order('created_at', { ascending: false });
      setRegistrations(data || []);
    } catch (e) {
      console.error('Failed to load registrations:', e);
    }
  }

  async function loadTutors() {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'tutor')
        .order('created_at', { ascending: false });
      setTutors(data || []);
    } catch (e) {
      console.error('Failed to load tutors:', e);
    }
  }

  async function loadSubscriptions() {
    try {
      const { data } = await supabase
        .from('subscriptions')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false });
      setSubscriptions(data || []);
    } catch (e) {
      console.error('Failed to load subscriptions:', e);
    }
  }

  async function handleLogout() {
    await signOut();
    router.push('/login');
  }

  async function refreshData() {
    await loadAllData();
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const activeStudents = students.filter(s => s.status === 'active').length;
  const pendingRegistrations = registrations.filter(r => r.status === 'pending').length;
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;

  return (
    <div className="admin-page">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/images/fav icon.png" alt="Enprico" onError={(e) => { e.target.style.display = 'none'; }} />
          <span>Enprico Admin</span>
        </div>

        <nav>
          <div className="nav-section">
            <div className="nav-section-title">Overview</div>
            <div
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>
              <span>Dashboard</span>
            </div>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">French Tutoring</div>
            <div
              className={`nav-item ${activeTab === 'subscribers' ? 'active' : ''}`}
              onClick={() => setActiveTab('subscribers')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <span>Subscribers</span>
              <span className="badge">{subscribers.length}</span>
            </div>
            <div
              className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span>Students</span>
              <span className="badge">{students.length}</span>
            </div>
            <div
              className={`nav-item ${activeTab === 'registrations' ? 'active' : ''}`}
              onClick={() => setActiveTab('registrations')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
              <span>Registrations</span>
              <span className="badge">{registrations.length}</span>
            </div>
            <div
              className={`nav-item ${activeTab === 'subscriptions' ? 'active' : ''}`}
              onClick={() => setActiveTab('subscriptions')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
              <span>Subscriptions</span>
            </div>
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Management</div>
            <div
              className={`nav-item ${activeTab === 'tutors' ? 'active' : ''}`}
              onClick={() => setActiveTab('tutors')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <span>Tutors</span>
              <span className="badge">{tutors.length}</span>
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item logout-btn" onClick={handleLogout}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Dashboard Tab */}
        <div className={`tab-content ${activeTab === 'dashboard' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Dashboard</h1>
              <p className="page-subtitle">Welcome back! Here&apos;s an overview of your platform.</p>
            </div>
            <div className="header-actions">
              <button className="btn btn-secondary" onClick={refreshData}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                Refresh
              </button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-icon blue">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                </div>
              </div>
              <div className="stat-value">{subscribers.length}</div>
              <div className="stat-label">Newsletter Subscribers</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-icon green">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
              </div>
              <div className="stat-value">{activeStudents}</div>
              <div className="stat-label">Active Students</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-icon yellow">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                </div>
              </div>
              <div className="stat-value">{pendingRegistrations}</div>
              <div className="stat-label">Pending Registrations</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-icon red">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                </div>
              </div>
              <div className="stat-value">{activeSubscriptions}</div>
              <div className="stat-label">Active Subscriptions</div>
            </div>
          </div>

          {/* Recent Subscribers */}
          <div className="data-card">
            <div className="data-card-header">
              <h2 className="data-card-title">Recent Subscribers</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.length === 0 ? (
                  <tr><td colSpan="2" className="empty-state">No subscribers yet</td></tr>
                ) : (
                  subscribers.slice(0, 10).map((sub, i) => (
                    <tr key={i}>
                      <td>{sub.email}</td>
                      <td>{formatDate(sub.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subscribers Tab */}
        <div className={`tab-content ${activeTab === 'subscribers' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Newsletter Subscribers</h1>
              <p className="page-subtitle">All newsletter subscribers</p>
            </div>
          </div>
          <div className="data-card">
            <div className="data-card-header">
              <h2 className="data-card-title">All Subscribers ({subscribers.length})</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Subscribed Date</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.length === 0 ? (
                  <tr><td colSpan="2" className="empty-state">No subscribers yet</td></tr>
                ) : (
                  subscribers.map((sub, i) => (
                    <tr key={i}>
                      <td>{sub.email}</td>
                      <td>{formatDate(sub.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Students Tab */}
        <div className={`tab-content ${activeTab === 'students' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Students</h1>
              <p className="page-subtitle">Manage all students</p>
            </div>
          </div>
          <div className="data-card">
            <div className="data-card-header">
              <h2 className="data-card-title">All Students ({students.length})</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan="4" className="empty-state">No students yet</td></tr>
                ) : (
                  students.map((student, i) => (
                    <tr key={i}>
                      <td>{student.full_name || '-'}</td>
                      <td>{student.email || '-'}</td>
                      <td><span className={`status-badge status-${student.status || 'active'}`}>{student.status || 'active'}</span></td>
                      <td>{formatDate(student.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Registrations Tab */}
        <div className={`tab-content ${activeTab === 'registrations' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Pending Registrations</h1>
              <p className="page-subtitle">Users who started but have not completed registration</p>
            </div>
          </div>
          <div className="data-card">
            <div className="data-card-header">
              <h2 className="data-card-title">All Registrations ({registrations.length})</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {registrations.length === 0 ? (
                  <tr><td colSpan="5" className="empty-state">No registrations yet</td></tr>
                ) : (
                  registrations.map((reg, i) => (
                    <tr key={i}>
                      <td>{reg.full_name || '-'}</td>
                      <td>{reg.email || '-'}</td>
                      <td>{reg.plan_type ? reg.plan_type.charAt(0).toUpperCase() + reg.plan_type.slice(1) : '-'}</td>
                      <td><span className={`status-badge status-${reg.status || 'pending'}`}>{reg.status || 'pending'}</span></td>
                      <td>{formatDate(reg.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Subscriptions Tab */}
        <div className={`tab-content ${activeTab === 'subscriptions' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Subscriptions</h1>
              <p className="page-subtitle">All active and past subscriptions</p>
            </div>
          </div>
          <div className="data-card">
            <div className="data-card-header">
              <h2 className="data-card-title">All Subscriptions ({subscriptions.length})</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Plan</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>End Date</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.length === 0 ? (
                  <tr><td colSpan="5" className="empty-state">No subscriptions yet</td></tr>
                ) : (
                  subscriptions.map((sub, i) => (
                    <tr key={i}>
                      <td>{sub.profiles?.full_name || sub.profiles?.email || '-'}</td>
                      <td>{sub.plan_type ? sub.plan_type.charAt(0).toUpperCase() + sub.plan_type.slice(1) : '-'}</td>
                      <td>${sub.price_usd || 0}</td>
                      <td><span className={`status-badge status-${sub.status}`}>{sub.status}</span></td>
                      <td>{formatDate(sub.end_date)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tutors Tab */}
        <div className={`tab-content ${activeTab === 'tutors' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Tutors</h1>
              <p className="page-subtitle">Manage your tutors</p>
            </div>
          </div>
          <div className="data-card">
            <div className="data-card-header">
              <h2 className="data-card-title">All Tutors ({tutors.length})</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {tutors.length === 0 ? (
                  <tr><td colSpan="4" className="empty-state">No tutors yet</td></tr>
                ) : (
                  tutors.map((tutor, i) => (
                    <tr key={i}>
                      <td>{tutor.full_name || '-'}</td>
                      <td>{tutor.email || '-'}</td>
                      <td><span className={`status-badge status-${tutor.status || 'active'}`}>{tutor.status || 'active'}</span></td>
                      <td>{formatDate(tutor.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
