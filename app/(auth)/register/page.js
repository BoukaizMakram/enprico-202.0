'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCurrentUser } from '@/lib/supabase/client';
import { createCheckoutSession, PLANS } from '@/lib/stripe/client';
import './register.css';

// Plan configurations
const FRENCH_LEVELS = [
  { id: 'beginner', name: 'Beginner (A1-A2)', description: 'I know very little French' },
  { id: 'intermediate', name: 'Intermediate (B1-B2)', description: 'I can hold basic conversations' },
  { id: 'advanced', name: 'Advanced (C1-C2)', description: 'I am comfortable in most situations' },
  { id: 'native', name: 'Native/Fluent', description: 'I want to refine my skills' },
];

const LEARNING_GOALS = [
  { id: 'canada', name: 'Immigration to Canada', icon: '\u{1F1E8}\u{1F1E6}' },
  { id: 'france', name: 'Immigration to France', icon: '\u{1F1EB}\u{1F1F7}' },
  { id: 'tef', name: 'TEF Exam Preparation', icon: '\u{1F4DD}' },
  { id: 'tcf', name: 'TCF Exam Preparation', icon: '\u{1F4CB}' },
  { id: 'conversation', name: 'Everyday Conversation', icon: '\u{1F4AC}' },
  { id: 'business', name: 'Business French', icon: '\u{1F4BC}' },
];

const DAYS = [
  { id: 'monday', name: 'Mon' },
  { id: 'tuesday', name: 'Tue' },
  { id: 'wednesday', name: 'Wed' },
  { id: 'thursday', name: 'Thu' },
  { id: 'friday', name: 'Fri' },
  { id: 'saturday', name: 'Sat' },
  { id: 'sunday', name: 'Sun' },
];

function generateTimeSlots() {
  const slots = [];
  for (let hour = 6; hour <= 22; hour++) {
    const ampm = hour < 12 ? 'AM' : 'PM';
    const displayHour = hour <= 12 ? hour : hour - 12;
    slots.push({
      id: `hour_${hour}`,
      hour,
      name: `${displayHour}:00 ${ampm}`,
    });
  }
  return slots;
}

const TIME_SLOTS = generateTimeSlots();

const TIMEZONES = [
  { id: 'America/New_York', name: 'Eastern Time (ET)', offset: 'UTC-5/UTC-4' },
  { id: 'America/Chicago', name: 'Central Time (CT)', offset: 'UTC-6/UTC-5' },
  { id: 'America/Denver', name: 'Mountain Time (MT)', offset: 'UTC-7/UTC-6' },
  { id: 'America/Los_Angeles', name: 'Pacific Time (PT)', offset: 'UTC-8/UTC-7' },
  { id: 'America/Toronto', name: 'Toronto (ET)', offset: 'UTC-5/UTC-4' },
  { id: 'America/Vancouver', name: 'Vancouver (PT)', offset: 'UTC-8/UTC-7' },
  { id: 'America/Montreal', name: 'Montreal (ET)', offset: 'UTC-5/UTC-4' },
  { id: 'Europe/London', name: 'London (GMT/BST)', offset: 'UTC+0/UTC+1' },
  { id: 'Europe/Paris', name: 'Paris (CET)', offset: 'UTC+1/UTC+2' },
  { id: 'Europe/Berlin', name: 'Berlin (CET)', offset: 'UTC+1/UTC+2' },
  { id: 'Asia/Dubai', name: 'Dubai (GST)', offset: 'UTC+4' },
  { id: 'Asia/Kolkata', name: 'India (IST)', offset: 'UTC+5:30' },
  { id: 'Asia/Shanghai', name: 'China (CST)', offset: 'UTC+8' },
  { id: 'Asia/Tokyo', name: 'Tokyo (JST)', offset: 'UTC+9' },
  { id: 'Australia/Sydney', name: 'Sydney (AEST)', offset: 'UTC+10/UTC+11' },
  { id: 'Pacific/Auckland', name: 'Auckland (NZST)', offset: 'UTC+12/UTC+13' },
  { id: 'Africa/Cairo', name: 'Cairo (EET)', offset: 'UTC+2' },
  { id: 'Africa/Casablanca', name: 'Casablanca (WET)', offset: 'UTC+0/UTC+1' },
  { id: 'America/Sao_Paulo', name: 'Sao Paulo (BRT)', offset: 'UTC-3' },
  { id: 'America/Mexico_City', name: 'Mexico City (CST)', offset: 'UTC-6/UTC-5' },
];

const STORAGE_KEY = 'enprico_registration';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [cancelled, setCancelled] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    englishLevel: '',
    learningGoals: [],
    goalsDescription: '',
    preferredDays: [],
    preferredTimes: [],
    timezone: '',
    planType: 'starter',
  });

  // Load from localStorage on mount
  useEffect(() => {
    if (searchParams.get('cancelled') === 'true') {
      setCancelled(true);
    }

    const planFromUrl = searchParams.get('plan');
    const detectedTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData(prev => ({
          ...prev,
          ...parsed,
          planType: planFromUrl || parsed.planType || localStorage.getItem('selectedPlan') || 'starter',
          timezone: parsed.timezone || detectedTimezone,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          planType: planFromUrl || localStorage.getItem('selectedPlan') || 'starter',
          timezone: detectedTimezone,
        }));
      }
    } catch {
      setFormData(prev => ({
        ...prev,
        planType: planFromUrl || 'starter',
        timezone: detectedTimezone,
      }));
    }
  }, [searchParams]);

  // Save to localStorage on formData change
  useEffect(() => {
    if (formData.fullName || formData.email) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    }
  }, [formData]);

  // Check if already authenticated
  useEffect(() => {
    async function checkAuth() {
      const { user } = await getCurrentUser();
      if (user) {
        router.push('/dashboard');
      }
    }
    checkAuth();
  }, [router]);

  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  const toggleArrayItem = useCallback((field, item) => {
    setFormData(prev => {
      const arr = prev[field] || [];
      const index = arr.indexOf(item);
      const newArr = index > -1
        ? arr.filter((_, i) => i !== index)
        : [...arr, item];
      return { ...prev, [field]: newArr };
    });
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  function validateStep(step) {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.fullName || formData.fullName.trim().length < 2) {
          newErrors.fullName = 'Please enter your full name';
        }
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email address';
        }
        break;
      case 2:
        if (!formData.englishLevel) {
          newErrors.englishLevel = 'Please select your French level';
        }
        break;
      case 3:
        if (!formData.learningGoals || formData.learningGoals.length === 0) {
          newErrors.learningGoals = 'Please select at least one learning goal';
        }
        break;
      case 4:
        if (!formData.preferredDays || formData.preferredDays.length === 0) {
          newErrors.preferredDays = 'Please select at least one day';
        }
        if (!formData.preferredTimes || formData.preferredTimes.length === 0) {
          newErrors.preferredTimes = 'Please select at least one time preference';
        }
        break;
      case 5:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleNext() {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(prev => prev + 1);
      }
    }
  }

  function handleBack() {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }

  async function handleSubmit() {
    // Validate all steps
    for (let step = 1; step <= 4; step++) {
      if (!validateStep(step)) {
        setCurrentStep(step);
        return;
      }
    }

    setSubmitting(true);
    setGlobalError('');

    try {
      const registrationData = {
        email: formData.email.toLowerCase().trim(),
        fullName: formData.fullName.trim(),
        phone: formData.phone?.trim() || null,
        englishLevel: formData.englishLevel,
        learningGoals: formData.learningGoals,
        goalsDescription: formData.goalsDescription?.trim() || null,
        preferredDays: formData.preferredDays,
        preferredTimes: formData.preferredTimes,
        timezone: formData.timezone,
        planType: formData.planType,
      };

      // Submit registration
      const response = await fetch('/api/registration/create-pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create registration');
      }

      // If user already exists with active subscription
      if (data.existingUser && data.hasActiveSubscription) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem('selectedPlan');
        router.push('/dashboard');
        return;
      }

      // Create checkout session
      let checkoutData;
      if (data.existingUser && data.userId) {
        checkoutData = await createCheckoutSession({
          userId: data.userId,
          userEmail: formData.email,
          planType: formData.planType,
          isNewUser: false,
          successUrl: window.location.origin + '/success?session_id={CHECKOUT_SESSION_ID}',
          cancelUrl: window.location.origin + '/register?cancelled=true',
        });
      } else {
        checkoutData = await createCheckoutSession({
          registrationId: data.registrationId,
          userEmail: formData.email,
          planType: formData.planType,
          isNewUser: true,
          successUrl: window.location.origin + '/success?session_id={CHECKOUT_SESSION_ID}',
          cancelUrl: window.location.origin + '/register?cancelled=true',
        });
      }

      // Redirect to Stripe Checkout
      if (checkoutData.url) {
        window.location.href = checkoutData.url;
      }
    } catch (err) {
      setGlobalError(err.message || 'An error occurred. Please try again.');
      setSubmitting(false);
    }
  }

  // Helpers for review
  function getLevelName() {
    const level = FRENCH_LEVELS.find(l => l.id === formData.englishLevel);
    return level ? level.name : '';
  }

  function getGoalNames() {
    return formData.learningGoals.map(gId => {
      const goal = LEARNING_GOALS.find(g => g.id === gId);
      return goal ? goal.name : gId;
    });
  }

  function getDayNames() {
    return formData.preferredDays.map(dId => {
      const day = DAYS.find(d => d.id === dId);
      return day ? day.name : dId;
    });
  }

  function getTimeNames() {
    return formData.preferredTimes.map(tId => {
      const time = TIME_SLOTS.find(t => t.id === tId);
      return time ? time.name : tId;
    });
  }

  function getTimezoneDisplay() {
    const tz = TIMEZONES.find(t => t.id === formData.timezone);
    return tz ? `${tz.name} (${tz.offset})` : formData.timezone;
  }

  const plan = PLANS[formData.planType] || PLANS.starter;

  return (
    <div className="register-container">
      <div className="register-banner">
        <div className="register-banner-content">
          <h2>Start Your French Journey</h2>
          <p>Personalized 1-on-1 tutoring for TEF &amp; TCF exam preparation, immigration, and conversation.</p>
        </div>
      </div>

      <div className="register-form-section">
        <div className="register-card">
          <div className="register-logo">
            <Link href="/">
              <img src="/images/fav icon.png" alt="Enprico Logo" />
            </Link>
          </div>

          <h1 className="register-title">Create Your Account</h1>
          <p className="register-subtitle">Step {currentStep} of {totalSteps}</p>

          {cancelled && (
            <div className="cancelled-banner">
              Your payment was cancelled. You can update your details and try again.
            </div>
          )}

          {/* Progress Bar */}
          <div className="progress-bar">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div key={i} className="progress-step">
                <div
                  className={`progress-dot ${i + 1 === currentStep ? 'active' : ''} ${i + 1 < currentStep ? 'completed' : ''}`}
                  onClick={() => { if (i + 1 < currentStep) setCurrentStep(i + 1); }}
                  style={{ cursor: i + 1 < currentStep ? 'pointer' : 'default' }}
                >
                  {i + 1 < currentStep ? '\u2713' : i + 1}
                </div>
                {i < totalSteps - 1 && (
                  <div className={`progress-line ${i + 1 < currentStep ? 'active' : ''}`} />
                )}
              </div>
            ))}
          </div>

          {globalError && <div className="global-error">{globalError}</div>}

          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div>
              <div className="plan-selector">
                {Object.entries(PLANS).filter(([key]) => key !== 'enterprise').map(([key, p]) => (
                  <div
                    key={key}
                    className={`plan-option ${formData.planType === key ? 'selected' : ''}`}
                    onClick={() => updateField('planType', key)}
                  >
                    <div className="plan-name">{p.name}</div>
                    <div className="plan-price">${p.price} CAD</div>
                    <div className="plan-desc">{p.hours}h/month</div>
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  type="text"
                  id="fullName"
                  placeholder="Your full name"
                  value={formData.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                />
                {errors.fullName && <div className="form-error">{errors.fullName}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
                {errors.email && <div className="form-error">{errors.email}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number (optional)</label>
                <input
                  type="tel"
                  id="phone"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                />
              </div>

              <div className="btn-row">
                <button className="btn-next" onClick={handleNext} style={{ flex: 1 }}>
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: French Level */}
          {currentStep === 2 && (
            <div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--gray-900)' }}>What is your French level?</h3>

              <div className="level-grid">
                {FRENCH_LEVELS.map(level => (
                  <div
                    key={level.id}
                    className={`level-card ${formData.englishLevel === level.id ? 'selected' : ''}`}
                    onClick={() => updateField('englishLevel', level.id)}
                  >
                    <div className="level-name">{level.name}</div>
                    <div className="level-desc">{level.description}</div>
                  </div>
                ))}
              </div>
              {errors.englishLevel && <div className="form-error">{errors.englishLevel}</div>}

              <div className="btn-row">
                <button className="btn-back" onClick={handleBack}>Back</button>
                <button className="btn-next" onClick={handleNext}>Continue</button>
              </div>
            </div>
          )}

          {/* Step 3: Learning Goals */}
          {currentStep === 3 && (
            <div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--gray-900)' }}>What are your learning goals?</h3>

              <div className="goals-grid">
                {LEARNING_GOALS.map(goal => (
                  <div
                    key={goal.id}
                    className={`goal-card ${formData.learningGoals.includes(goal.id) ? 'selected' : ''}`}
                    onClick={() => toggleArrayItem('learningGoals', goal.id)}
                  >
                    <span className="goal-icon">{goal.icon}</span>
                    <span className="goal-name">{goal.name}</span>
                  </div>
                ))}
              </div>
              {errors.learningGoals && <div className="form-error">{errors.learningGoals}</div>}

              <div className="form-group">
                <label htmlFor="goalsDesc">Additional details (optional)</label>
                <textarea
                  id="goalsDesc"
                  rows="3"
                  placeholder="Tell us more about your learning goals..."
                  value={formData.goalsDescription}
                  onChange={(e) => updateField('goalsDescription', e.target.value)}
                />
              </div>

              <div className="btn-row">
                <button className="btn-back" onClick={handleBack}>Back</button>
                <button className="btn-next" onClick={handleNext}>Continue</button>
              </div>
            </div>
          )}

          {/* Step 4: Availability */}
          {currentStep === 4 && (
            <div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--gray-900)' }}>When are you available?</h3>

              <label style={{ display: 'block', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Preferred Days
              </label>
              <div className="days-grid">
                {DAYS.map(day => (
                  <div
                    key={day.id}
                    className={`day-chip ${formData.preferredDays.includes(day.id) ? 'selected' : ''}`}
                    onClick={() => toggleArrayItem('preferredDays', day.id)}
                  >
                    {day.name}
                  </div>
                ))}
              </div>
              {errors.preferredDays && <div className="form-error" style={{ marginTop: '-0.75rem', marginBottom: '1rem' }}>{errors.preferredDays}</div>}

              <label style={{ display: 'block', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Preferred Times
              </label>
              <div className="times-grid">
                {TIME_SLOTS.map(slot => (
                  <div
                    key={slot.id}
                    className={`time-chip ${formData.preferredTimes.includes(slot.id) ? 'selected' : ''}`}
                    onClick={() => toggleArrayItem('preferredTimes', slot.id)}
                  >
                    {slot.name}
                  </div>
                ))}
              </div>
              {errors.preferredTimes && <div className="form-error" style={{ marginTop: '-0.75rem', marginBottom: '1rem' }}>{errors.preferredTimes}</div>}

              <div className="form-group">
                <label htmlFor="timezone">Timezone</label>
                <select
                  id="timezone"
                  value={formData.timezone}
                  onChange={(e) => updateField('timezone', e.target.value)}
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz.id} value={tz.id}>
                      {tz.name} ({tz.offset})
                    </option>
                  ))}
                </select>
              </div>

              <div className="btn-row">
                <button className="btn-back" onClick={handleBack}>Back</button>
                <button className="btn-next" onClick={handleNext}>Review</button>
              </div>
            </div>
          )}

          {/* Step 5: Review & Submit */}
          {currentStep === 5 && (
            <div>
              <h3 style={{ marginBottom: '1rem', color: 'var(--gray-900)' }}>Review Your Information</h3>

              <div className="review-section">
                <h3>Plan</h3>
                <div className="review-row">
                  <span className="review-label">Selected Plan</span>
                  <span className="review-value">{plan.name}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Price</span>
                  <span className="review-value">${plan.price} CAD/month</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Hours</span>
                  <span className="review-value">{plan.hours} hours/month</span>
                </div>
              </div>

              <div className="review-section">
                <h3>Personal Info</h3>
                <div className="review-row">
                  <span className="review-label">Name</span>
                  <span className="review-value">{formData.fullName}</span>
                </div>
                <div className="review-row">
                  <span className="review-label">Email</span>
                  <span className="review-value">{formData.email}</span>
                </div>
                {formData.phone && (
                  <div className="review-row">
                    <span className="review-label">Phone</span>
                    <span className="review-value">{formData.phone}</span>
                  </div>
                )}
              </div>

              <div className="review-section">
                <h3>French Level</h3>
                <div className="review-row">
                  <span className="review-label">Level</span>
                  <span className="review-value">{getLevelName()}</span>
                </div>
              </div>

              <div className="review-section">
                <h3>Learning Goals</h3>
                <div className="review-row">
                  <span className="review-label">Goals</span>
                  <div className="review-tags">
                    {getGoalNames().map((name, i) => (
                      <span key={i} className="review-tag">{name}</span>
                    ))}
                  </div>
                </div>
                {formData.goalsDescription && (
                  <div className="review-row">
                    <span className="review-label">Details</span>
                    <span className="review-value" style={{ fontSize: '0.85rem' }}>{formData.goalsDescription}</span>
                  </div>
                )}
              </div>

              <div className="review-section">
                <h3>Availability</h3>
                <div className="review-row">
                  <span className="review-label">Days</span>
                  <div className="review-tags">
                    {getDayNames().map((name, i) => (
                      <span key={i} className="review-tag">{name}</span>
                    ))}
                  </div>
                </div>
                <div className="review-row">
                  <span className="review-label">Times</span>
                  <div className="review-tags">
                    {getTimeNames().map((name, i) => (
                      <span key={i} className="review-tag">{name}</span>
                    ))}
                  </div>
                </div>
                <div className="review-row">
                  <span className="review-label">Timezone</span>
                  <span className="review-value" style={{ fontSize: '0.85rem' }}>{getTimezoneDisplay()}</span>
                </div>
              </div>

              <div className="btn-row">
                <button className="btn-back" onClick={handleBack}>Back</button>
                <button
                  className="btn-next"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? 'Processing...' : `Proceed to Payment - $${plan.price} CAD`}
                </button>
              </div>
            </div>
          )}

          <div className="register-footer">
            Already have an account? <Link href="/login">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
