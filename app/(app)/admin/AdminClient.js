'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  getCurrentUser,
  getUserProfile,
  signOut,
} from '@/lib/supabase/client';
import './admin.css';

function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDateTime(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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
  const [traffic, setTraffic] = useState([]);

  // Modals
  const [modal, setModal] = useState(null); // { type, data }
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState({});

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
      loadTraffic(),
    ]);
    setLoading(false);
  }

  async function loadSubscribers() {
    try {
      const res = await fetch('/api/admin/subscribers');
      const json = await res.json();
      setSubscribers(json.data || []);
    } catch (e) {
      console.error('Failed to load subscribers:', e);
    }
  }

  async function loadStudents() {
    try {
      const res = await fetch('/api/admin/students');
      const json = await res.json();
      setStudents(json.data || []);
    } catch (e) {
      console.error('Failed to load students:', e);
    }
  }

  async function loadRegistrations() {
    try {
      const res = await fetch('/api/admin/registrations');
      const json = await res.json();
      setRegistrations(json.data || []);
    } catch (e) {
      console.error('Failed to load registrations:', e);
    }
  }

  async function loadTutors() {
    try {
      const res = await fetch('/api/admin/tutors');
      const json = await res.json();
      setTutors(json.data || []);
    } catch (e) {
      console.error('Failed to load tutors:', e);
    }
  }

  async function loadSubscriptions() {
    try {
      const res = await fetch('/api/admin/subscriptions');
      const json = await res.json();
      setSubscriptions(json.data || []);
    } catch (e) {
      console.error('Failed to load subscriptions:', e);
    }
  }

  async function loadTraffic() {
    try {
      const res = await fetch('/api/admin/traffic');
      const json = await res.json();
      setTraffic(json.data || []);
    } catch (e) {
      console.error('Failed to load traffic:', e);
    }
  }

  async function handleLogout() {
    await signOut();
    router.push('/login');
  }

  async function refreshData() {
    await loadAllData();
  }

  // ---- CRUD Actions ----

  async function handleDeleteStudent(student) {
    setModal({ type: 'confirm-delete', entity: 'student', data: student });
  }

  async function handleDeleteTutor(tutor) {
    setModal({ type: 'confirm-delete', entity: 'tutor', data: tutor });
  }

  async function handleDeleteSubscriber(subscriber) {
    setModal({ type: 'confirm-delete', entity: 'subscriber', data: subscriber });
  }

  async function handleDeleteRegistration(reg) {
    setModal({ type: 'confirm-delete', entity: 'registration', data: reg });
  }

  async function confirmDelete() {
    setModalLoading(true);
    setModalError('');
    const { entity, data } = modal;

    try {
      const endpoints = {
        student: '/api/admin/students',
        tutor: '/api/admin/tutors',
        subscriber: '/api/admin/subscribers',
        registration: '/api/admin/registrations',
      };

      const res = await fetch(endpoints[entity], {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: data.id }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Delete failed');

      setModal(null);
      await loadAllData();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  }

  function openEditStudent(student) {
    setEditForm({
      id: student.id,
      full_name: student.full_name || '',
      email: student.email || '',
      phone: student.phone || '',
      french_level: student.french_level || '',
      timezone: student.timezone || '',
      goals_description: student.goals_description || '',
      assigned_tutor_id: student.assigned_tutor_id || '',
    });
    setModal({ type: 'edit-student' });
    setModalError('');
  }

  async function saveEditStudent() {
    setModalLoading(true);
    setModalError('');
    try {
      const res = await fetch('/api/admin/students', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Update failed');
      setModal(null);
      await loadAllData();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  }

  function openEditTutor(tutor) {
    setEditForm({
      id: tutor.id,
      full_name: tutor.full_name || '',
      email: tutor.email || '',
      phone: tutor.phone || '',
    });
    setModal({ type: 'edit-tutor' });
    setModalError('');
  }

  async function saveEditTutor() {
    setModalLoading(true);
    setModalError('');
    try {
      const res = await fetch('/api/admin/tutors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Update failed');
      setModal(null);
      await loadAllData();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  }

  function openCreateTutor() {
    setEditForm({ full_name: '', email: '', password: '' });
    setModal({ type: 'create-tutor' });
    setModalError('');
  }

  async function saveCreateTutor() {
    setModalLoading(true);
    setModalError('');
    try {
      if (!editForm.full_name || !editForm.email || !editForm.password) {
        throw new Error('All fields are required');
      }
      const res = await fetch('/api/admin/tutors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Create failed');
      setModal(null);
      await loadAllData();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setModalLoading(false);
    }
  }

  function getTutorName(tutorId) {
    if (!tutorId) return '-';
    const tutor = tutors.find(t => t.id === tutorId);
    return tutor ? tutor.full_name : '-';
  }

  // Filter registrations: exclude emails that already exist as students
  const studentEmails = new Set(students.map(s => (s.email || '').toLowerCase()));
  const filteredRegistrations = registrations.filter(r => !studentEmails.has((r.email || '').toLowerCase()));

  // Traffic stats
  const uniqueSessions = new Set(traffic.map(t => t.session_id).filter(Boolean)).size;
  const sourceCounts = {};
  const deviceCounts = {};
  const browserCounts = {};
  traffic.forEach(t => {
    const src = t.utm_source || t.referrer || 'Direct';
    sourceCounts[src] = (sourceCounts[src] || 0) + 1;
    if (t.device_type) deviceCounts[t.device_type] = (deviceCounts[t.device_type] || 0) + 1;
    if (t.browser) browserCounts[t.browser] = (browserCounts[t.browser] || 0) + 1;
  });
  const topSources = Object.entries(sourceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const topDevices = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1]);

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
  const pendingRegistrations = filteredRegistrations.filter(r => r.status === 'pending').length;
  const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length;

  return (
    <div className="admin-page">
      {/* Modal Overlay */}
      {modal && (
        <div className="modal-overlay" onClick={() => !modalLoading && setModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>

            {/* Delete Confirmation */}
            {modal.type === 'confirm-delete' && (
              <>
                <div className="modal-header">
                  <h3>Confirm Delete</h3>
                  <button className="modal-close" onClick={() => setModal(null)}>&times;</button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to delete <strong>{modal.data.full_name || modal.data.email}</strong>?</p>
                  {modal.entity === 'student' && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>This will also cancel their Stripe subscription and remove their account.</p>}
                  {modalError && <div className="form-error" style={{ marginTop: '0.5rem' }}>{modalError}</div>}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setModal(null)} disabled={modalLoading}>Cancel</button>
                  <button className="btn btn-danger" onClick={confirmDelete} disabled={modalLoading}>
                    {modalLoading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </>
            )}

            {/* Edit Student */}
            {modal.type === 'edit-student' && (
              <>
                <div className="modal-header">
                  <h3>Edit Student</h3>
                  <button className="modal-close" onClick={() => setModal(null)}>&times;</button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>French Level</label>
                    <select value={editForm.french_level} onChange={e => setEditForm({ ...editForm, french_level: e.target.value })}>
                      <option value="">Not set</option>
                      <option value="A1">A1 - Beginner</option>
                      <option value="A2">A2 - Elementary</option>
                      <option value="B1">B1 - Intermediate</option>
                      <option value="B2">B2 - Upper Intermediate</option>
                      <option value="C1">C1 - Advanced</option>
                      <option value="C2">C2 - Proficient</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Timezone</label>
                    <input value={editForm.timezone} onChange={e => setEditForm({ ...editForm, timezone: e.target.value })} placeholder="e.g. America/Toronto" />
                  </div>
                  <div className="form-group">
                    <label>Assigned Tutor</label>
                    <select value={editForm.assigned_tutor_id} onChange={e => setEditForm({ ...editForm, assigned_tutor_id: e.target.value || null })}>
                      <option value="">No tutor assigned</option>
                      {tutors.map(t => (
                        <option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Goals</label>
                    <textarea rows={3} value={editForm.goals_description} onChange={e => setEditForm({ ...editForm, goals_description: e.target.value })} />
                  </div>
                  {modalError && <div className="form-error">{modalError}</div>}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setModal(null)} disabled={modalLoading}>Cancel</button>
                  <button className="btn btn-primary" onClick={saveEditStudent} disabled={modalLoading}>
                    {modalLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}

            {/* Edit Tutor */}
            {modal.type === 'edit-tutor' && (
              <>
                <div className="modal-header">
                  <h3>Edit Tutor</h3>
                  <button className="modal-close" onClick={() => setModal(null)}>&times;</button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
                  </div>
                  {modalError && <div className="form-error">{modalError}</div>}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setModal(null)} disabled={modalLoading}>Cancel</button>
                  <button className="btn btn-primary" onClick={saveEditTutor} disabled={modalLoading}>
                    {modalLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}

            {/* Create Tutor */}
            {modal.type === 'create-tutor' && (
              <>
                <div className="modal-header">
                  <h3>Add New Tutor</h3>
                  <button className="modal-close" onClick={() => setModal(null)}>&times;</button>
                </div>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Full Name</label>
                    <input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} placeholder="John Doe" />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} placeholder="tutor@email.com" />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input type="text" value={editForm.password} onChange={e => setEditForm({ ...editForm, password: e.target.value })} placeholder="Initial password" />
                  </div>
                  {modalError && <div className="form-error">{modalError}</div>}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setModal(null)} disabled={modalLoading}>Cancel</button>
                  <button className="btn btn-primary" onClick={saveCreateTutor} disabled={modalLoading}>
                    {modalLoading ? 'Creating...' : 'Create Tutor'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

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
              <span className="badge">{filteredRegistrations.length}</span>
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
            <div
              className={`nav-item ${activeTab === 'traffic' ? 'active' : ''}`}
              onClick={() => setActiveTab('traffic')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              <span>Traffic</span>
              <span className="badge">{traffic.length}</span>
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.length === 0 ? (
                  <tr><td colSpan="3" className="empty-state">No subscribers yet</td></tr>
                ) : (
                  subscribers.map((sub, i) => (
                    <tr key={i}>
                      <td>{sub.email}</td>
                      <td>{formatDate(sub.created_at)}</td>
                      <td>
                        <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => handleDeleteSubscriber(sub)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </td>
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
                  <th>Tutor</th>
                  <th>Level</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan="7" className="empty-state">No students yet</td></tr>
                ) : (
                  students.map((student, i) => (
                    <tr key={i}>
                      <td>{student.full_name || '-'}</td>
                      <td>{student.email || '-'}</td>
                      <td>{getTutorName(student.assigned_tutor_id)}</td>
                      <td>{student.french_level || '-'}</td>
                      <td><span className={`status-badge status-${student.status || 'active'}`}>{student.status || 'active'}</span></td>
                      <td>{formatDate(student.created_at)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button className="btn-icon" title="Edit" onClick={() => openEditStudent(student)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => handleDeleteStudent(student)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        </div>
                      </td>
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
              <p className="page-subtitle">Users who started but have not completed registration (excludes existing students)</p>
            </div>
          </div>
          <div className="data-card">
            <div className="data-card-header">
              <h2 className="data-card-title">Registrations ({filteredRegistrations.length})</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.length === 0 ? (
                  <tr><td colSpan="6" className="empty-state">No pending registrations</td></tr>
                ) : (
                  filteredRegistrations.map((reg, i) => (
                    <tr key={i}>
                      <td>{reg.full_name || '-'}</td>
                      <td>{reg.email || '-'}</td>
                      <td>{reg.plan_type ? reg.plan_type.charAt(0).toUpperCase() + reg.plan_type.slice(1) : '-'}</td>
                      <td><span className={`status-badge status-${reg.status || 'pending'}`}>{reg.status || 'pending'}</span></td>
                      <td>{formatDate(reg.created_at)}</td>
                      <td>
                        <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => handleDeleteRegistration(reg)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </td>
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
                      <td>{sub.user_name || sub.user_email || sub.profiles?.full_name || sub.profiles?.email || '-'}</td>
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
            <div className="header-actions">
              <button className="btn btn-primary" onClick={openCreateTutor}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Add Tutor
              </button>
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
                  <th>Students</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tutors.length === 0 ? (
                  <tr><td colSpan="6" className="empty-state">No tutors yet</td></tr>
                ) : (
                  tutors.map((tutor, i) => (
                    <tr key={i}>
                      <td>{tutor.full_name || '-'}</td>
                      <td>{tutor.email || '-'}</td>
                      <td>{students.filter(s => s.assigned_tutor_id === tutor.id).length}</td>
                      <td><span className={`status-badge status-${tutor.status || 'active'}`}>{tutor.status || 'active'}</span></td>
                      <td>{formatDate(tutor.created_at)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button className="btn-icon" title="Edit" onClick={() => openEditTutor(tutor)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button className="btn-icon btn-icon-danger" title="Delete" onClick={() => handleDeleteTutor(tutor)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Traffic Tab */}
        <div className={`tab-content ${activeTab === 'traffic' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Traffic</h1>
              <p className="page-subtitle">Website visitor analytics</p>
            </div>
            <div className="header-actions">
              <button className="btn btn-secondary" onClick={loadTraffic}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                Refresh
              </button>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-icon blue">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                </div>
              </div>
              <div className="stat-value">{traffic.length}</div>
              <div className="stat-label">Total Page Views</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-icon green">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
              </div>
              <div className="stat-value">{uniqueSessions}</div>
              <div className="stat-label">Unique Sessions</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-icon yellow">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                </div>
              </div>
              <div className="stat-value">{topDevices.length > 0 ? topDevices[0][0] : '-'}</div>
              <div className="stat-label">Top Device</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-icon red">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </div>
              </div>
              <div className="stat-value">{topSources.length > 0 ? topSources[0][0] : '-'}</div>
              <div className="stat-label">Top Source</div>
            </div>
          </div>

          {/* Sources Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="data-card">
              <div className="data-card-header">
                <h2 className="data-card-title">Traffic Sources</h2>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Source</th>
                    <th>Visits</th>
                  </tr>
                </thead>
                <tbody>
                  {topSources.length === 0 ? (
                    <tr><td colSpan="2" className="empty-state">No traffic data</td></tr>
                  ) : (
                    topSources.map(([source, count], i) => (
                      <tr key={i}>
                        <td>{source}</td>
                        <td>{count}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="data-card">
              <div className="data-card-header">
                <h2 className="data-card-title">Devices &amp; Browsers</h2>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Visits</th>
                  </tr>
                </thead>
                <tbody>
                  {topDevices.length === 0 && Object.keys(browserCounts).length === 0 ? (
                    <tr><td colSpan="2" className="empty-state">No traffic data</td></tr>
                  ) : (
                    <>
                      {topDevices.map(([device, count], i) => (
                        <tr key={`d-${i}`}>
                          <td>{device}</td>
                          <td>{count}</td>
                        </tr>
                      ))}
                      {Object.entries(browserCounts).sort((a, b) => b[1] - a[1]).map(([browser, count], i) => (
                        <tr key={`b-${i}`}>
                          <td>{browser}</td>
                          <td>{count}</td>
                        </tr>
                      ))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Traffic Log */}
          <div className="data-card">
            <div className="data-card-header">
              <h2 className="data-card-title">Recent Visits ({traffic.length})</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Landing Page</th>
                  <th>Source</th>
                  <th>Device</th>
                  <th>Browser</th>
                  <th>OS</th>
                  <th>Country</th>
                </tr>
              </thead>
              <tbody>
                {traffic.length === 0 ? (
                  <tr><td colSpan="7" className="empty-state">No traffic data yet</td></tr>
                ) : (
                  traffic.slice(0, 100).map((t, i) => (
                    <tr key={i}>
                      <td>{formatDateTime(t.visited_at || t.created_at)}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.landing_page || '-'}</td>
                      <td>{t.utm_source || t.referrer || 'Direct'}</td>
                      <td>{t.device_type || '-'}</td>
                      <td>{t.browser || '-'}</td>
                      <td>{t.os || '-'}</td>
                      <td>{t.country || t.timezone || '-'}</td>
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
