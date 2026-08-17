'use client';

import { useState, useEffect, useCallback } from 'react';

function newChallenge() {
  const a = Math.floor(Math.random() * 8) + 1; // 1–8
  const b = Math.floor(Math.random() * 8) + 1; // 1–8
  return { a, b };
}

export default function ContactClient() {
  const [status, setStatus] = useState(null); // null | sending | success | error
  const [errorMsg, setErrorMsg] = useState('');

  // Human-verification (captcha) state
  const [challenge, setChallenge] = useState({ a: 0, b: 0 });
  const [answer, setAnswer] = useState('');
  const [captchaError, setCaptchaError] = useState(false);

  // Generate the challenge after mount to avoid hydration mismatch.
  const refreshChallenge = useCallback(() => {
    setChallenge(newChallenge());
    setAnswer('');
    setCaptchaError(false);
  }, []);

  useEffect(() => {
    refreshChallenge();
  }, [refreshChallenge]);

  const isHuman = Number(answer) === challenge.a + challenge.b;

  async function handleSubmit(e) {
    e.preventDefault();

    // Human check must pass before we do anything.
    if (!isHuman) {
      setCaptchaError(true);
      return;
    }

    const formData = new FormData(e.target);

    // Honeypot: real users never see or fill this. Bots usually do.
    if ((formData.get('company') || '').toString().trim() !== '') {
      // Silently pretend success so bots get no signal.
      setStatus('success');
      e.target.reset();
      refreshChallenge();
      return;
    }

    setStatus('sending');
    setErrorMsg('');

    try {
      const payload = {
        name: formData.get('name'),
        email: formData.get('email'),
        subject: formData.get('subject'),
        message: formData.get('message'),
        company: formData.get('company'), // honeypot, validated server-side too
      };

      const response = await fetch('/api/contact/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setStatus('success');
        e.target.reset();
        refreshChallenge();
      } else {
        const data = await response.json().catch(() => ({}));
        setErrorMsg(data.message || 'Something went wrong. Please try again.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setStatus('error');
    }
  }

  return (
    <main className="contact-page">
      <section className="contact-section">
        <div className="container contact-grid">
          {/* Form */}
          <div className="contact-form-container">
            <h2>Send Us a Message</h2>
            <p className="contact-form-intro">
              Fill in the form below and a member of our team will reply as soon
              as possible.
            </p>

            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input type="text" id="name" name="name" required placeholder="John Doe" />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" name="email" required placeholder="john@example.com" />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <input type="text" id="subject" name="subject" required placeholder="How can we help?" />
              </div>

              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea id="message" name="message" rows="5" required placeholder="Your message here..."></textarea>
              </div>

              {/* Honeypot field — hidden from humans, catches bots */}
              <div className="hp-field" aria-hidden="true">
                <label htmlFor="company">Company (leave this empty)</label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                />
              </div>

              {/* Human verification (captcha) */}
              <div className="form-group captcha-group">
                <label htmlFor="captcha">
                  Verify you&apos;re human — what is{' '}
                  <strong>
                    {challenge.a} + {challenge.b}
                  </strong>
                  ?
                </label>
                <div className="captcha-row">
                  <input
                    type="number"
                    id="captcha"
                    name="captcha"
                    inputMode="numeric"
                    required
                    placeholder="Answer"
                    value={answer}
                    onChange={(e) => {
                      setAnswer(e.target.value);
                      setCaptchaError(false);
                    }}
                    aria-invalid={captchaError}
                  />
                  <button
                    type="button"
                    className="captcha-refresh"
                    onClick={refreshChallenge}
                    aria-label="Get a new question"
                    title="Get a new question"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="23 4 23 10 17 10" />
                      <polyline points="1 20 1 14 7 14" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                  </button>
                </div>
                {captchaError && (
                  <span className="captcha-hint">That answer isn&apos;t right — please try again.</span>
                )}
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={status === 'sending' || !isHuman}
              >
                {status === 'sending' ? 'Sending...' : 'Send Message'}
              </button>

              {status === 'success' && (
                <p className="form-success">
                  Message sent successfully! We&apos;ll get back to you soon.
                </p>
              )}
              {status === 'error' && <p className="form-error">{errorMsg}</p>}
            </form>
          </div>

          {/* Contact info */}
          <div className="contact-info-container">
            <div className="contact-info-card">
              <div className="info-item">
                <svg className="info-icon" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div>
                  <h4>Email</h4>
                  <p>
                    <a href="mailto:learn@enprico.ca">learn@enprico.ca</a>
                  </p>
                </div>
              </div>

              <div className="info-item">
                <svg className="info-icon" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M17.657 16.657L13.414 20.9C13.039 21.2746 12.5306 21.4851 12.0005 21.4851C11.4704 21.4851 10.962 21.2746 10.587 20.9L6.343 16.657C5.22422 15.5381 4.46234 14.1127 4.15369 12.5608C3.84504 11.009 4.00349 9.40047 4.60901 7.93868C5.21452 6.4769 6.2399 5.22749 7.55548 4.34846C8.87107 3.46943 10.4178 3.00024 12 3.00024C13.5822 3.00024 15.1289 3.46943 16.4445 4.34846C17.7601 5.22749 18.7855 6.4769 19.391 7.93868C19.9965 9.40047 20.155 11.009 19.8463 12.5608C19.5377 14.1127 18.7758 15.5381 17.657 16.657Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12 13C13.6569 13 15 11.6569 15 10C15 8.34315 13.6569 7 12 7C10.3431 7 9 8.34315 9 10C9 11.6569 10.3431 13 12 13Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div>
                  <h4>Location</h4>
                  <p>Church Street, Toronto, ON M5B 1G8, Canada</p>
                </div>
              </div>

              <div className="info-item">
                <svg className="info-icon" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <div>
                  <h4>Business Hours</h4>
                  <p>Monday – Saturday, 9:00 AM – 7:00 PM (EST)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
