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
  const [leads, setLeads] = useState([]);

  // Currency display (base data is in CAD). fxRate = CAD -> USD.
  const [currency, setCurrency] = useState('CAD');
  const [fxRate, setFxRate] = useState(0.73);

  // Dashboard date range
  const [rangePreset, setRangePreset] = useState('month');
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo, setRangeTo] = useState('');

  // Traffic filters + sorting
  const [trafSearch, setTrafSearch] = useState('');
  const [trafSource, setTrafSource] = useState('all');
  const [trafDevice, setTrafDevice] = useState('all');
  const [trafFrom, setTrafFrom] = useState('');
  const [trafTo, setTrafTo] = useState('');
  const [trafSort, setTrafSort] = useState({ key: 'visited_at', dir: 'desc' });

  useEffect(() => {
    // Live CAD -> USD rate (free, no key, CORS-enabled).
    fetch('https://api.frankfurter.app/latest?from=CAD&to=USD')
      .then((r) => r.json())
      .then((d) => { if (d?.rates?.USD) setFxRate(d.rates.USD); })
      .catch(() => {});
  }, []);

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
      loadLeads(),
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

  async function loadLeads() {
    try {
      const res = await fetch('/api/admin/leads');
      const json = await res.json();
      setLeads(json.data || []);
    } catch (e) {
      console.error('Failed to load leads:', e);
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

  // ── Revenue / business metrics ──
  const PLAN_PRICE = { starter: 250, professional: 400 };
  const planPrice = (t) => PLAN_PRICE[t] || 0;

  const now = new Date();
  const isThisMonth = (d) => {
    if (!d) return false;
    const dt = new Date(d);
    return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
  };

  const activeSubs = subscriptions.filter(s => s.status === 'active');
  // Monthly recurring revenue from all active subscriptions.
  const mrr = activeSubs.reduce((sum, s) => sum + planPrice(s.plan_type), 0);
  // New revenue booked this month (subscriptions that started this month).
  const revenueThisMonth = subscriptions
    .filter(s => isThisMonth(s.created_at) && s.status !== 'cancelled')
    .reduce((sum, s) => sum + planPrice(s.plan_type), 0);
  const newSubsThisMonth = subscriptions.filter(s => isThisMonth(s.created_at)).length;

  // Leads: did they pay? A lead counts as paid if flagged, or their email now
  // belongs to a student / active subscription.
  const payingEmails = new Set([
    ...students.filter(s => s.status === 'active').map(s => (s.email || '').toLowerCase()),
    ...subscriptions.map(s => (s.user_email || '').toLowerCase()),
  ].filter(Boolean));
  const leadIsPaid = (l) => l.paid || payingEmails.has((l.email || '').toLowerCase());
  const paidLeads = leads.filter(leadIsPaid).length;
  const leadsThisMonth = leads.filter(l => isThisMonth(l.created_at)).length;
  const conversionRate = leads.length ? Math.round((paidLeads / leads.length) * 100) : 0;

  // Traffic engagement.
  const durations = traffic.map(t => Number(t.duration_seconds) || 0).filter(n => n > 0);
  const avgDuration = durations.length
    ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
    : 0;
  const totalClicks = traffic.reduce((sum, t) => sum + (Number(t.click_count) || 0), 0);
  const fmtDuration = (s) => {
    if (!s) return '0s';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m ? `${m}m ${sec}s` : `${sec}s`;
  };
  // Base amounts are in CAD; convert to USD on demand using the live FX rate.
  const fmtMoney = (cad) => {
    const val = currency === 'USD' ? (cad || 0) * fxRate : (cad || 0);
    return '$' + Math.round(val).toLocaleString('en-US') + ' ' + currency;
  };

  // ── Dashboard date range (filters the overview metrics) ──
  const rangeEnd = rangeTo ? new Date(rangeTo + 'T23:59:59') : new Date();
  let rangeStart;
  if (rangePreset === 'all') rangeStart = new Date(0);
  else if (rangePreset === '7') { rangeStart = new Date(); rangeStart.setDate(rangeStart.getDate() - 7); }
  else if (rangePreset === '30') { rangeStart = new Date(); rangeStart.setDate(rangeStart.getDate() - 30); }
  else if (rangePreset === 'custom') rangeStart = rangeFrom ? new Date(rangeFrom) : new Date(0);
  else rangeStart = new Date(now.getFullYear(), now.getMonth(), 1); // 'month'
  const inRange = (d) => { if (!d) return false; const dt = new Date(d); return dt >= rangeStart && dt <= rangeEnd; };
  const rangeLabel = rangePreset === 'all' ? 'All time'
    : rangePreset === '7' ? 'Last 7 days'
    : rangePreset === '30' ? 'Last 30 days'
    : rangePreset === 'custom' ? 'Custom range'
    : 'This month';

  const revenueInRange = subscriptions.filter(s => inRange(s.created_at) && s.status !== 'cancelled').reduce((sum, s) => sum + planPrice(s.plan_type), 0);
  const newSubsInRange = subscriptions.filter(s => inRange(s.created_at)).length;
  const leadsInRange = leads.filter(l => inRange(l.created_at));
  const paidLeadsInRange = leadsInRange.filter(leadIsPaid).length;
  const convInRange = leadsInRange.length ? Math.round((paidLeadsInRange / leadsInRange.length) * 100) : 0;
  const trafficInRange = traffic.filter(t => inRange(t.visited_at || t.created_at));
  const visitorsInRange = new Set(trafficInRange.map(t => t.session_id).filter(Boolean)).size;
  const clicksInRange = trafficInRange.reduce((s, t) => s + (Number(t.click_count) || 0), 0);
  const durInRange = trafficInRange.map(t => Number(t.duration_seconds) || 0).filter(n => n > 0);
  const avgDurInRange = durInRange.length ? Math.round(durInRange.reduce((a, b) => a + b, 0) / durInRange.length) : 0;

  // ── Traffic: filter + sort ──
  const sourceOf = (t) => t.utm_source || t.referrer || 'Direct';
  const trafficSourceOptions = Array.from(new Set(traffic.map(sourceOf))).sort();
  const trafficDeviceOptions = Array.from(new Set(traffic.map(t => t.device_type).filter(Boolean))).sort();

  let displayedTraffic = traffic.filter(t => {
    if (trafSource !== 'all' && sourceOf(t) !== trafSource) return false;
    if (trafDevice !== 'all' && (t.device_type || '') !== trafDevice) return false;
    const when = new Date(t.visited_at || t.created_at);
    if (trafFrom && when < new Date(trafFrom)) return false;
    if (trafTo && when > new Date(trafTo + 'T23:59:59')) return false;
    if (trafSearch) {
      const q = trafSearch.toLowerCase();
      const hay = `${t.landing_page || ''} ${sourceOf(t)} ${t.browser || ''} ${t.os || ''} ${t.country || t.timezone || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  displayedTraffic = [...displayedTraffic].sort((a, b) => {
    const { key, dir } = trafSort;
    const mul = dir === 'asc' ? 1 : -1;
    let av, bv;
    if (key === 'visited_at') {
      av = new Date(a.visited_at || a.created_at).getTime();
      bv = new Date(b.visited_at || b.created_at).getTime();
    } else if (key === 'duration_seconds' || key === 'click_count') {
      av = Number(a[key]) || 0; bv = Number(b[key]) || 0;
    } else if (key === 'source') {
      av = sourceOf(a).toLowerCase(); bv = sourceOf(b).toLowerCase();
    } else {
      av = (a[key] || '').toString().toLowerCase(); bv = (b[key] || '').toString().toLowerCase();
    }
    if (av < bv) return -1 * mul;
    if (av > bv) return 1 * mul;
    return 0;
  });
  const toggleSort = (key) =>
    setTrafSort(s => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'desc' }));
  const sortCaret = (key) => trafSort.key === key ? (trafSort.dir === 'asc' ? '▲' : '▼') : '↕';

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
              className={`nav-item ${activeTab === 'leads' ? 'active' : ''}`}
              onClick={() => setActiveTab('leads')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              <span>Leads</span>
              <span className="badge">{leads.length}</span>
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
              <select className="range-select" value={rangePreset} onChange={e => setRangePreset(e.target.value)}>
                <option value="month">This month</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="all">All time</option>
                <option value="custom">Custom…</option>
              </select>
              {rangePreset === 'custom' && (
                <>
                  <input type="date" className="range-date" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)} />
                  <span style={{ color: 'var(--gray-400)' }}>–</span>
                  <input type="date" className="range-date" value={rangeTo} onChange={e => setRangeTo(e.target.value)} />
                </>
              )}
              <div className="currency-toggle" title={`Live rate: 1 CAD = ${fxRate.toFixed(4)} USD`}>
                <button
                  className={`currency-opt ${currency === 'CAD' ? 'active' : ''}`}
                  onClick={() => setCurrency('CAD')}
                >CAD</button>
                <button
                  className={`currency-opt ${currency === 'USD' ? 'active' : ''}`}
                  onClick={() => setCurrency('USD')}
                >USD</button>
              </div>
              <button className="btn btn-secondary" onClick={refreshData}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                Refresh
              </button>
            </div>
          </div>

          {/* Money KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card kpi-accent">
              <div className="kpi-top">
                <span className="kpi-label">Revenue · {rangeLabel}</span>
                <span className="kpi-badge">{newSubsInRange} new</span>
              </div>
              <div className="kpi-value">{fmtMoney(revenueInRange)}</div>
              <div className="kpi-sub">from subscriptions started in this period</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">Monthly Recurring (MRR)</span>
              </div>
              <div className="kpi-value">{fmtMoney(mrr)}</div>
              <div className="kpi-sub">{activeSubs.length} active subscriptions</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">Active Students</span>
              </div>
              <div className="kpi-value">{activeStudents}</div>
              <div className="kpi-sub">paying learners right now</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-top">
                <span className="kpi-label">Paid Conversions</span>
                <span className="kpi-badge">{convInRange}%</span>
              </div>
              <div className="kpi-value">{paidLeadsInRange}<span className="kpi-of"> / {leadsInRange.length}</span></div>
              <div className="kpi-sub">leads who paid · {rangeLabel.toLowerCase()}</div>
            </div>
          </div>

          {/* Funnel + traffic KPIs */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-header"><div className="stat-icon yellow">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div></div>
              <div className="stat-value">{leadsInRange.length}</div>
              <div className="stat-label">Inquiries / Leads<span className="stat-hint"> · {rangeLabel.toLowerCase()}</span></div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header"><div className="stat-icon blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </div></div>
              <div className="stat-value">{visitorsInRange}</div>
              <div className="stat-label">Visitors<span className="stat-hint"> · {trafficInRange.length} pageviews</span></div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header"><div className="stat-icon green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div></div>
              <div className="stat-value">{fmtDuration(avgDurInRange)}</div>
              <div className="stat-label">Avg. Visit Duration</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header"><div className="stat-icon red">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11.24V7.5a2.5 2.5 0 0 1 5 0v3.74"/><path d="M14 11l4 4-1.5 4h-9L6 15l4-4"/></svg>
              </div></div>
              <div className="stat-value">{clicksInRange.toLocaleString('en-US')}</div>
              <div className="stat-label">Clicks<span className="stat-hint"> · {rangeLabel.toLowerCase()}</span></div>
            </div>
          </div>

          <div className="dash-split">
            {/* Onboarding leads */}
            <div className="data-card">
              <div className="data-card-header">
                <h2 className="data-card-title">Onboarding Leads</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('leads')}>View all</button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Plan</th>
                    <th>Step</th>
                    <th>Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.length === 0 ? (
                    <tr><td colSpan="4" className="empty-state">No leads captured yet</td></tr>
                  ) : (
                    leads.slice(0, 8).map((l, i) => (
                      <tr key={l.id || i}>
                        <td>{l.email || <span className="muted">— no email yet</span>}</td>
                        <td>{l.plan_type ? (l.plan_type === 'professional' ? 'Standard' : 'Flexible') : '-'}</td>
                        <td>{l.current_step || 1}/5</td>
                        <td>
                          {leadIsPaid(l)
                            ? <span className="pill pill-green">Paid</span>
                            : <span className="pill pill-gray">Not yet</span>}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Traffic sources */}
            <div className="data-card">
              <div className="data-card-header">
                <h2 className="data-card-title">Top Traffic Sources</h2>
                <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('traffic')}>Details</button>
              </div>
              <div className="source-list">
                {topSources.length === 0 ? (
                  <div className="empty-state" style={{ padding: '1.5rem' }}>No traffic data yet</div>
                ) : (
                  topSources.map(([src, count]) => {
                    const pct = traffic.length ? Math.round((count / traffic.length) * 100) : 0;
                    return (
                      <div className="source-row" key={src}>
                        <div className="source-head">
                          <span className="source-name">{src}</span>
                          <span className="source-count">{count} · {pct}%</span>
                        </div>
                        <div className="source-bar"><span style={{ width: `${pct}%` }} /></div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
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

        {/* Leads Tab */}
        <div className={`tab-content ${activeTab === 'leads' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Onboarding Leads</h1>
              <p className="page-subtitle">Everyone who started onboarding — captured on the spot, whether or not they paid.</p>
            </div>
            <div className="header-actions">
              <button className="btn btn-secondary" onClick={refreshData}>Refresh</button>
            </div>
          </div>

          <div className="data-card">
            <div className="data-card-header">
              <h2 className="data-card-title">All Leads ({leads.length})</h2>
              <span className="muted">{paidLeads} paid · {conversionRate}% conversion</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Name</th>
                  <th>Plan</th>
                  <th>Level</th>
                  <th>Step</th>
                  <th>Last field</th>
                  <th>Paid</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr><td colSpan="8" className="empty-state">No leads captured yet. They&apos;ll appear here the moment a visitor fills a field in onboarding.</td></tr>
                ) : (
                  leads.map((l, i) => (
                    <tr key={l.id || i}>
                      <td>{l.email || <span className="muted">—</span>}</td>
                      <td>{l.full_name || <span className="muted">—</span>}</td>
                      <td>{l.plan_type ? (l.plan_type === 'professional' ? 'Standard' : 'Flexible') : '-'}</td>
                      <td>{l.french_level || '-'}</td>
                      <td>{l.current_step || 1}/5</td>
                      <td><span className="muted">{l.last_field || '-'}</span></td>
                      <td>{leadIsPaid(l) ? <span className="pill pill-green">Paid</span> : <span className="pill pill-gray">Not yet</span>}</td>
                      <td>{formatDateTime(l.updated_at || l.created_at)}</td>
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
              <h2 className="data-card-title">Visits ({displayedTraffic.length})</h2>
            </div>

            <div className="filter-bar" style={{ padding: '1rem 1.25rem 0' }}>
              <input
                type="text"
                placeholder="Search page, source, browser…"
                value={trafSearch}
                onChange={e => setTrafSearch(e.target.value)}
              />
              <select value={trafSource} onChange={e => setTrafSource(e.target.value)}>
                <option value="all">All sources</option>
                {trafficSourceOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={trafDevice} onChange={e => setTrafDevice(e.target.value)}>
                <option value="all">All devices</option>
                {trafficDeviceOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <label style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>From
                <input type="date" value={trafFrom} onChange={e => setTrafFrom(e.target.value)} style={{ marginLeft: '0.4rem' }} />
              </label>
              <label style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>To
                <input type="date" value={trafTo} onChange={e => setTrafTo(e.target.value)} style={{ marginLeft: '0.4rem' }} />
              </label>
              {(trafSearch || trafSource !== 'all' || trafDevice !== 'all' || trafFrom || trafTo) && (
                <button className="btn btn-secondary btn-sm" onClick={() => { setTrafSearch(''); setTrafSource('all'); setTrafDevice('all'); setTrafFrom(''); setTrafTo(''); }}>Clear</button>
              )}
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th className="sortable" onClick={() => toggleSort('visited_at')}>Date <span className="sort-caret">{sortCaret('visited_at')}</span></th>
                  <th className="sortable" onClick={() => toggleSort('landing_page')}>Landing Page <span className="sort-caret">{sortCaret('landing_page')}</span></th>
                  <th className="sortable" onClick={() => toggleSort('source')}>Source <span className="sort-caret">{sortCaret('source')}</span></th>
                  <th className="sortable" onClick={() => toggleSort('duration_seconds')}>Duration <span className="sort-caret">{sortCaret('duration_seconds')}</span></th>
                  <th className="sortable" onClick={() => toggleSort('click_count')}>Clicks <span className="sort-caret">{sortCaret('click_count')}</span></th>
                  <th className="sortable" onClick={() => toggleSort('device_type')}>Device <span className="sort-caret">{sortCaret('device_type')}</span></th>
                  <th className="sortable" onClick={() => toggleSort('browser')}>Browser <span className="sort-caret">{sortCaret('browser')}</span></th>
                  <th className="sortable" onClick={() => toggleSort('os')}>OS <span className="sort-caret">{sortCaret('os')}</span></th>
                  <th>Country</th>
                </tr>
              </thead>
              <tbody>
                {displayedTraffic.length === 0 ? (
                  <tr><td colSpan="9" className="empty-state">No traffic matches these filters</td></tr>
                ) : (
                  displayedTraffic.slice(0, 200).map((t, i) => (
                    <tr key={t.id || i}>
                      <td>{formatDateTime(t.visited_at || t.created_at)}</td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.landing_page || '-'}</td>
                      <td>{sourceOf(t)}</td>
                      <td>{fmtDuration(Number(t.duration_seconds) || 0)}</td>
                      <td>{Number(t.click_count) || 0}</td>
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
