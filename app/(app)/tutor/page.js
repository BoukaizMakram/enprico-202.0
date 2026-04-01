'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getCurrentUser,
  getUserProfile,
  signOut,
  supabase,
} from '@/lib/supabase/client';
import './tutor.css';

function formatDate(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function TutorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [students, setStudents] = useState([]);
  const [exams, setExams] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadTutorDashboard();
  }, []);

  async function loadTutorDashboard() {
    try {
      const { user: currentUser, error: authError } = await getCurrentUser();
      if (authError || !currentUser) {
        router.push('/login');
        return;
      }
      setUser(currentUser);

      // Role guard
      const { data: profileData } = await getUserProfile(currentUser.id);
      if (!profileData || profileData.role !== 'tutor') {
        router.push('/dashboard');
        return;
      }
      setProfile(profileData);

      // Load tutor data
      await Promise.all([
        loadStudents(currentUser.id),
        loadExams(currentUser.id),
        loadExercises(currentUser.id),
      ]);

      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to load tutor dashboard');
      setLoading(false);
    }
  }

  async function loadStudents(tutorId) {
    try {
      const { data, error } = await supabase
        .from('tutor_students')
        .select(`
          student_id,
          profiles!tutor_students_student_id_fkey (id, full_name, email),
          subscriptions!inner (plan_type, status)
        `)
        .eq('tutor_id', tutorId);

      if (!error && data) {
        // Also get hours for each student
        const studentsWithHours = await Promise.all(
          data.map(async (ts) => {
            const currentMonth = new Date().toISOString().slice(0, 7);
            const { data: hoursData } = await supabase
              .from('hours_tracking')
              .select('*')
              .eq('user_id', ts.student_id)
              .eq('month_year', currentMonth)
              .single();

            return {
              id: ts.student_id,
              name: ts.profiles?.full_name || 'Unknown',
              email: ts.profiles?.email || '',
              plan: ts.subscriptions?.[0]?.plan_type || '-',
              status: ts.subscriptions?.[0]?.status || 'inactive',
              remainingHours: hoursData ? parseFloat(hoursData.remaining_hours) : 0,
              totalHours: hoursData ? parseFloat(hoursData.total_hours) : 0,
              usedHours: hoursData ? parseFloat(hoursData.used_hours) : 0,
            };
          })
        );
        setStudents(studentsWithHours);
      }
    } catch (e) {
      console.error('Failed to load students:', e);
    }
  }

  async function loadExams(tutorId) {
    try {
      const res = await fetch(`/api/tutor/exams?tutor_id=${tutorId}`);
      const result = await res.json();
      if (result.success) {
        setExams(result.data || []);
      }
    } catch (e) {
      console.error('Failed to load exams:', e);
    }
  }

  async function loadExercises(tutorId) {
    try {
      const res = await fetch(`/api/tutor/exercises?tutor_id=${tutorId}`);
      const result = await res.json();
      if (result.success) {
        setExercises(result.data || []);
      }
    } catch (e) {
      console.error('Failed to load exercises:', e);
    }
  }

  async function handleLogout() {
    await signOut();
    router.push('/login');
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  if (loading) {
    return (
      <div className="tutor-page">
        <div className="loading">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tutor-page">
        <div style={{ padding: '2rem' }}>
          <div className="empty-state">{error}</div>
        </div>
      </div>
    );
  }

  const tutorName = profile?.full_name || 'Tutor';
  const firstName = tutorName.split(' ')[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const totalStudents = students.length;
  const examsToGrade = exams.filter(e => e.status === 'sent').length;

  return (
    <div className="tutor-page">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/images/fav icon.png" alt="Enprico" onError={(e) => { e.target.style.display = 'none'; }} />
          <span>Enprico</span>
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
            <div className="nav-section-title">Manage</div>
            <div
              className={`nav-item ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
              <span>Students</span>
              <span className="badge">{totalStudents}</span>
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
            <div
              className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`}
              onClick={() => setActiveTab('payments')}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              <span>Payments</span>
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="tutor-info">
            <div className="tutor-avatar">{tutorName.charAt(0).toUpperCase()}</div>
            <div className="tutor-meta">
              <div className="name">{tutorName}</div>
              <div className="role">Tutor</div>
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
        {/* Dashboard Tab */}
        <div className={`tab-content ${activeTab === 'dashboard' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">{greeting}, {firstName}</h1>
              <p className="page-subtitle">Here&apos;s your teaching overview</p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-icon blue">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                </div>
              </div>
              <div className="stat-value">{totalStudents}</div>
              <div className="stat-label">Assigned Students</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-icon green">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                </div>
              </div>
              <div className="stat-value">0</div>
              <div className="stat-label">Hours Taught This Month</div>
            </div>
            <div className="stat-card">
              <div className="stat-card-header">
                <div className="stat-icon yellow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
              </div>
              <div className="stat-value">{examsToGrade}</div>
              <div className="stat-label">Exams to Grade</div>
            </div>
          </div>

          {/* Quick Student List */}
          <div className="data-card">
            <div className="data-card-header">
              <h2 className="data-card-title">Your Students</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Plan</th>
                  <th>Hours Left</th>
                  <th>Hours Used</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan="4" className="empty-state">No students assigned yet</td></tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.plan ? student.plan.charAt(0).toUpperCase() + student.plan.slice(1) : '-'}</td>
                      <td>{student.remainingHours}h</td>
                      <td>{student.usedHours}h / {student.totalHours}h</td>
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
              <p className="page-subtitle">Manage your assigned students and their hours</p>
            </div>
          </div>

          <div className="data-card">
            <div className="data-card-header">
              <h2 className="data-card-title">Assigned Students</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Plan</th>
                  <th>Remaining Hours</th>
                  <th>Total Hours</th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 ? (
                  <tr><td colSpan="5" className="empty-state">No students assigned yet</td></tr>
                ) : (
                  students.map((student) => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>{student.email}</td>
                      <td>{student.plan ? student.plan.charAt(0).toUpperCase() + student.plan.slice(1) : '-'}</td>
                      <td>{student.remainingHours}h</td>
                      <td>{student.totalHours}h</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Exams Tab */}
        <div className={`tab-content ${activeTab === 'exams' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Mock Exams &amp; Exercises</h1>
              <p className="page-subtitle">Send and grade student assignments</p>
            </div>
          </div>

          <div className="data-card">
            <div className="data-card-header">
              <h2 className="data-card-title">All Exams</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {exams.length === 0 ? (
                  <tr><td colSpan="5" className="empty-state">No exams yet</td></tr>
                ) : (
                  exams.map((exam, i) => (
                    <tr key={i}>
                      <td>{exam.title}</td>
                      <td>{exam.student_name || exam.student_email || '-'}</td>
                      <td><span className={`status-badge status-${exam.status}`}>{exam.status}</span></td>
                      <td>{exam.score !== null && exam.score !== undefined ? exam.score : '-'}</td>
                      <td>{formatDate(exam.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Exercises Tab */}
        <div className={`tab-content ${activeTab === 'exercises' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Exercises</h1>
              <p className="page-subtitle">Create and manage exercises for your students</p>
            </div>
          </div>

          <div className="data-card">
            <div className="data-card-header">
              <h2 className="data-card-title">All Exercises</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Type</th>
                  <th>Student</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {exercises.length === 0 ? (
                  <tr><td colSpan="6" className="empty-state">No exercises yet</td></tr>
                ) : (
                  exercises.map((ex, i) => (
                    <tr key={i}>
                      <td>{ex.title}</td>
                      <td>{ex.type}</td>
                      <td>{ex.student_name || ex.student_email || '-'}</td>
                      <td><span className={`status-badge status-${ex.status}`}>{ex.status}</span></td>
                      <td>{ex.score !== null && ex.score !== undefined ? ex.score : '-'}</td>
                      <td>{formatDate(ex.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payments Tab */}
        <div className={`tab-content ${activeTab === 'payments' ? 'active' : ''}`}>
          <div className="page-header">
            <div>
              <h1 className="page-title">Payment Requests</h1>
              <p className="page-subtitle">Submit and track your monthly payments</p>
            </div>
          </div>

          <div className="data-card">
            <div className="data-card-header">
              <h2 className="data-card-title">Request History</h2>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Hours</th>
                  <th>Rate</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Submitted</th>
                </tr>
              </thead>
              <tbody>
                <tr><td colSpan="6" className="empty-state">No payment requests yet</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
}
