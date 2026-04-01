'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { createCheckoutSession } from '@/lib/stripe/client';
import { getCurrentUser } from '@/lib/supabase/client';

/* ───────────────────────── Inline SVG helpers ───────────────────────── */

function CheckIcon({ color = 'currentColor' }) {
  return (
    <svg className={`check-icon ${color}`} viewBox="0 0 24 24" fill="none">
      <path
        d="M20 6L9 17L4 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIconSmall() {
  return (
    <svg className="check-icon-small" viewBox="0 0 20 20" fill="none">
      <path
        d="M16 6L8 14L4 10"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GoogleLogoSvg({ size = 28 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

/* ───────────────────────── DATA ───────────────────────── */

const TEACHERS = [
  { flag: '\u{1F1EB}\u{1F1F7}', name: 'France' },
  { flag: '\u{1F1E8}\u{1F1E6}', name: 'Canada (Quebec)' },
  { flag: '\u{1F1E7}\u{1F1EA}', name: 'Belgium' },
  { flag: '\u{1F1E8}\u{1F1ED}', name: 'Switzerland' },
  { flag: '\u{1F1F2}\u{1F1E6}', name: 'Morocco' },
  { flag: '\u{1F1F9}\u{1F1F3}', name: 'Tunisia' },
  { flag: '\u{1F1F8}\u{1F1F3}', name: 'Senegal' },
  { flag: '\u{1F1E8}\u{1F1EE}', name: 'Ivory Coast' },
  { flag: '\u{1F1E8}\u{1F1F2}', name: 'Cameroon' },
  { flag: '\u{1F1E9}\u{1F1FF}', name: 'Algeria' },
  { flag: '\u{1F1ED}\u{1F1F9}', name: 'Haiti' },
  { flag: '\u{1F1F1}\u{1F1FA}', name: 'Luxembourg' },
];

const TESTIMONIALS = [
  {
    name: 'Sarah Mitchell',
    bg: '4285f4',
    fg: 'fff',
    date: '2 weeks ago',
    text: "I achieved C1 on all four TEF sections with NCLC 9-10! My tutor's focused approach on expression orale helped me score 571/699. The personalized strategy made all the difference for my Express Entry application.",
    image: '/images/testimonials/1.webp',
    imageAlt: "Sarah's TEF C1 Results - NCLC 9-10",
    tag: 'Canada Express Entry',
  },
  {
    name: 'James Chen',
    bg: '34a853',
    fg: 'fff',
    date: '1 month ago',
    text: 'Scored B2 across all sections with NCLC 7-8! I went from A1 to B2 faster than I expected. My tutor adapted to my learning style and the structured curriculum focused on exactly what TCF Canada requires.',
    image: '/images/testimonials/2.webp',
    imageAlt: "James's TEF B2 Results - NCLC 7-8",
    tag: 'TCF Canada',
  },
  {
    name: 'Maria Lopez',
    bg: 'ea4335',
    fg: 'fff',
    date: '3 weeks ago',
    text: 'The flexible scheduling was perfect for my busy work life. I could book sessions around my schedule without any hassle. Highly recommend for working professionals who need convenience!',
    image: null,
    tag: 'France Immigration',
  },
  {
    name: 'Ahmed Khan',
    bg: 'fbbc05',
    fg: '333',
    date: '1 month ago',
    text: 'C1 across the board with NCLC 9-10! Scored 571 on expression orale. The exam preparation was thorough and my tutor knew all the strategies specifically for Quebec immigration requirements. Absolutely worth it!',
    image: '/images/testimonials/3.webp',
    imageAlt: "Ahmed's TEF C1 Results - NCLC 9-10",
    tag: 'Quebec Immigration',
  },
  {
    name: 'Elena Petrova',
    bg: '4285f4',
    fg: 'fff',
    date: '2 months ago',
    text: 'From zero French to B2/C1 level! Scored 534 on expression orale reaching C1 NCLC 9. Starting from scratch, my tutor built a personalized curriculum that got me exam-ready. The results speak for themselves!',
    image: '/images/testimonials/4.webp',
    imageAlt: "Elena's TEF B2/C1 Results - NCLC 7-9",
    tag: 'Express Entry',
  },
  {
    name: 'David Wilson',
    bg: '34a853',
    fg: 'fff',
    date: '3 weeks ago',
    text: 'The one-on-one attention really accelerated my learning. Worth every penny! I achieved B2 level much faster than I would have with group classes. Excellent investment in my future.',
    image: null,
    tag: 'TEF Preparation',
  },
  {
    name: 'Lisa Nguyen',
    bg: 'ea4335',
    fg: 'fff',
    date: '1 month ago',
    text: 'My tutor made learning French fun and engaging. I actually look forward to every session now! The conversational practice and real-world scenarios prepared me perfectly for my visa interview.',
    image: null,
    tag: 'France Visa',
  },
  {
    name: 'Robert Brown',
    bg: 'fbbc05',
    fg: '333',
    date: '2 weeks ago',
    text: "B2/C1 results on my first attempt! Expression orale at C1 level with NCLC 9. The curriculum was well-structured and focused on real exam scenarios. My scores were higher than I ever expected!",
    image: '/images/testimonials/5.webp',
    imageAlt: "Robert's TEF B2/C1 Results - NCLC 7-9",
    tag: 'TCF Canada',
  },
  {
    name: 'Nina Kumar',
    bg: '4285f4',
    fg: 'fff',
    date: '1 month ago',
    text: 'Excellent support team and professional tutors. They truly care about your success. The admin team was incredibly helpful with scheduling, and my tutor always came prepared with tailored lessons.',
    image: null,
    tag: 'Express Entry',
  },
  {
    name: 'Thomas Martin',
    bg: '34a853',
    fg: 'fff',
    date: '3 weeks ago',
    text: "I tried other platforms before, but Enprico's personalized approach is unmatched. Finally found a service that truly adapts to my learning pace and goals for Quebec PEQ program.",
    image: null,
    tag: 'Quebec PEQ',
  },
  {
    name: 'Sandra Oliveira',
    bg: 'ea4335',
    fg: 'fff',
    date: '2 months ago',
    text: "From complete beginner to B2 in 6 months. The structured program really works! My tutor kept me motivated throughout the entire journey. Couldn't have done it without Enprico.",
    image: null,
    tag: 'TEF Canada',
  },
  {
    name: 'Paul Henderson',
    bg: 'fbbc05',
    fg: '333',
    date: '1 week ago',
    text: 'The 2-hour flexible program fit perfectly into my schedule. Quality teaching in convenient sessions. Perfect for busy professionals like me who need results without disrupting their work life.',
    image: null,
    tag: 'France Immigration',
  },
];

const FAQ_DATA = [
  {
    q: 'What is the monthly price?',
    a: [
      'Our standard price is 400 CAD per month for 4 hours per week, totaling 16 hours per month.',
      'From time to time, we offer limited special rates. Please contact us directly to check if you are eligible for any current offers.',
    ],
  },
  {
    q: 'How does the referral program work?',
    a: [
      'For every student you refer who enrolls, you receive a 50 CAD discount.',
      'If you refer 5 students who enroll and remain active, you can receive up to 250 CAD in total discounts.',
    ],
  },
  {
    q: 'What is your refund policy?',
    a: [
      'Your satisfaction is important to us.',
    ],
    list: [
      'If you request a refund during the first week (after the first 4 hours), you receive a full refund.',
      'If you request a refund during the second or third week, you receive a refund for 4 hours plus half of the hours completed in the additional weeks.',
      'If you complete the fourth week without requesting a refund, the program becomes non-refundable and the full month must be completed.',
    ],
  },
  {
    q: 'How many hours per week do I study?',
    a: ['You will attend 4 hours per week of live classes, totaling 16 hours per month.'],
  },
  {
    q: 'Are classes live?',
    a: ['Yes. All sessions are live and interactive with a professional teacher.'],
  },
];

/* ───────────────────────── COMPONENT ───────────────────────── */

export default function HomeClient() {
  /* ---------- state ---------- */
  const [expandedCards, setExpandedCards] = useState({});
  const [teacherCounts, setTeacherCounts] = useState([]);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [articles, setArticles] = useState(null);
  const [contactStatus, setContactStatus] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState({});
  const [emailCaptureStatus, setEmailCaptureStatus] = useState(null);
  const [cardsPerView, setCardsPerView] = useState(3);
  const autoPlayRef = useRef(null);

  /* ---------- teacher counts ---------- */
  useEffect(() => {
    setTeacherCounts(
      TEACHERS.map(() => Math.floor(Math.random() * 11) + 20)
    );
  }, []);

  /* ---------- articles ---------- */
  useEffect(() => {
    fetch('/content/articles/index.json')
      .then((res) => res.json())
      .then((data) => setArticles(data.articles.slice(0, 6)))
      .catch(() => setArticles([]));
  }, []);

  /* ---------- responsive cards per view ---------- */
  useEffect(() => {
    function handleResize() {
      setCardsPerView(window.innerWidth < 768 ? 1 : 3);
    }
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* ---------- email capture modal (show after 30s if not dismissed) ---------- */
  useEffect(() => {
    if (typeof window !== 'undefined' && !sessionStorage.getItem('emailModalDismissed')) {
      const timer = setTimeout(() => setEmailModalOpen(true), 30000);
      return () => clearTimeout(timer);
    }
  }, []);

  /* ---------- carousel auto-advance ---------- */
  const totalSlides = TESTIMONIALS.length;
  const maxIndex = Math.max(totalSlides - cardsPerView, 0);

  const goToSlide = useCallback(
    (idx) => {
      setCarouselIndex(Math.max(0, Math.min(idx, maxIndex)));
    },
    [maxIndex]
  );

  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setCarouselIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(autoPlayRef.current);
  }, [maxIndex]);

  const handlePrev = () => {
    clearInterval(autoPlayRef.current);
    goToSlide(carouselIndex <= 0 ? maxIndex : carouselIndex - 1);
  };

  const handleNext = () => {
    clearInterval(autoPlayRef.current);
    goToSlide(carouselIndex >= maxIndex ? 0 : carouselIndex + 1);
  };

  /* ---------- dots ---------- */
  const dotCount = maxIndex + 1;
  const dots = useMemo(() => Array.from({ length: dotCount }, (_, i) => i), [dotCount]);

  /* ---------- enroll ---------- */
  async function handleEnrollClick(planType) {
    try {
      const { user } = await getCurrentUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }
      const session = await createCheckoutSession({
        planType,
        userId: user.id,
        userEmail: user.email,
        isNewUser: false,
      });
      window.location.href = session.url;
    } catch (err) {
      console.error('Enrollment error:', err);
    }
  }

  /* ---------- contact submit ---------- */
  async function handleContactSubmit(e) {
    e.preventDefault();
    setContactStatus('sending');
    try {
      const formData = new FormData(e.target);
      const response = await fetch('/api/contact/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(formData)),
      });
      if (response.ok) {
        setContactStatus('success');
        e.target.reset();
      } else {
        setContactStatus('error');
      }
    } catch {
      setContactStatus('error');
    }
  }

  /* ---------- email capture submit ---------- */
  async function handleEmailCapture(e) {
    e.preventDefault();
    setEmailCaptureStatus('sending');
    try {
      const formData = new FormData(e.target);
      const response = await fetch('/api/contact/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...Object.fromEntries(formData),
          subject: 'Newsletter Subscription',
          message: 'New newsletter subscription request.',
        }),
      });
      if (response.ok) {
        setEmailCaptureStatus('success');
        e.target.reset();
      } else {
        setEmailCaptureStatus('error');
      }
    } catch {
      setEmailCaptureStatus('error');
    }
  }

  /* ---------- toggle helpers ---------- */
  const toggleCard = (key) =>
    setExpandedCards((prev) => ({ ...prev, [key]: !prev[key] }));

  const toggleFaq = (idx) =>
    setFaqOpen((prev) => ({ ...prev, [idx]: !prev[idx] }));

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const closeEmailModal = () => {
    setEmailModalOpen(false);
    sessionStorage.setItem('emailModalDismissed', 'true');
  };

  /* ───────────────────────── RENDER ───────────────────────── */
  return (
    <main id="main-content">
      {/* ════════ HERO ════════ */}
      <section className="hero" id="home">
        <video
          className="hero-video hero-video-desktop"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/images/hero.mp4" type="video/mp4" />
        </video>
        <video
          className="hero-video hero-video-mobile"
          autoPlay
          muted
          loop
          playsInline
        >
          <source src="/images/hero_mobile.mp4" type="video/mp4" />
        </video>
        <div className="decorative-circle"></div>
        <div className="container hero-container">
          <div className="hero-content">
            <p className="hero-label">WE OFFER</p>
            <h1 className="hero-title hero-title-desktop">
              Specialized Tutoring To<br />
              Prepare You For TEF/TCF
            </h1>
            <button
              className="cta-button cta-desktop"
              onClick={() => scrollTo('pricing')}
            >
              Enroll Now
            </button>
            <div className="level-badges level-badges-desktop">
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                <span key={lvl} className="badge">
                  {lvl}
                </span>
              ))}
            </div>
          </div>

          <p className="hero-label hero-label-mobile">WE OFFER</p>
          <h1 className="hero-title hero-title-mobile">
            Specialized Tutoring To<br />
            Prepare You For TEF/TCF
          </h1>
          <div className="level-badges level-badges-mobile">
            {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
              <span key={lvl} className="badge">
                {lvl}
              </span>
            ))}
          </div>
          <button
            className="cta-button cta-mobile"
            onClick={() => scrollTo('pricing')}
          >
            Enroll Now
          </button>
        </div>
      </section>

      {/* ════════ INTRO ════════ */}
      <section className="intro-section">
        <div className="container">
          <h2 className="section-title scroll-animate">
            Personalized French Tutoring To Meet Express Entry Requirements
          </h2>
          <p className="intro-text scroll-animate">
            Learn French with expert tutors who adapt to your pace and learning
            style. From beginners to advanced learners, we have the perfect
            program for you. Our curriculum is specifically designed to help you
            succeed in TEF and TCF exams.
          </p>
        </div>
      </section>

      {/* ════════ FEATURES ════════ */}
      <section className="features-section">
        <div className="container">
          <div className="features-grid">
            {/* Canada Path */}
            <div className="feature-card card-cyan scroll-animate-left">
              <div className="feature-header">
                <h3>Canada</h3>
                <button
                  className="expand-btn cyan"
                  onClick={() => toggleCard('canada')}
                >
                  {expandedCards.canada ? '\u2212' : '+'}
                </button>
              </div>
              <div
                className="card-scroll-container"
                style={{
                  maxHeight: expandedCards.canada ? '500px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease',
                }}
              >
                <ul className="feature-list scrollable-content">
                  {[
                    'Express Entry & Francophone programs',
                    'TEF / TCF Canada preparation',
                    'CLB-focused training',
                    'Practical French for life and work in Canada',
                  ].map((item) => (
                    <li key={item}>
                      <CheckIcon color="cyan" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <a href="#pricing" className="feature-cta-btn cyan-btn">
                Prepare for Canada
              </a>
            </div>

            {/* France Path */}
            <div className="feature-card card-pink scroll-animate-right">
              <div className="feature-header">
                <h3>France</h3>
                <button
                  className="expand-btn pink"
                  onClick={() => toggleCard('france')}
                >
                  {expandedCards.france ? '\u2212' : '+'}
                </button>
              </div>
              <div
                className="card-scroll-container"
                style={{
                  maxHeight: expandedCards.france ? '500px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease',
                }}
              >
                <ul className="feature-list scrollable-content">
                  {[
                    'Studies, work & residency pathways',
                    'TEF / TCF France preparation',
                    'Level-based French training',
                    'Practical French for life in France',
                  ].map((item) => (
                    <li key={item}>
                      <CheckIcon color="pink" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <a href="#pricing" className="feature-cta-btn pink-btn">
                Prepare for France
              </a>
            </div>
          </div>

          {/* How You Will Learn */}
          <div className="why-card scroll-animate">
            <div className="feature-header">
              <h3>How You Will Learn with Enprico</h3>
              <button
                className="expand-btn purple"
                onClick={() => toggleCard('how')}
              >
                {expandedCards.how ? '\u2212' : '+'}
              </button>
            </div>
            <div
              className="card-scroll-container"
              style={{
                maxHeight: expandedCards.how ? '500px' : '0',
                overflow: 'hidden',
                transition: 'max-height 0.3s ease',
              }}
            >
              <ul className="why-list scrollable-content">
                {[
                  'Live 1-on-1 lessons with real certified tutors',
                  'Set your own pace and schedule',
                  'Comprehensive language training for all skills',
                  'Personalized programs for TEF / TCF exams',
                  'Try risk-free with a satisfaction guarantee',
                ].map((item) => (
                  <li key={item}>
                    <CheckIcon color="purple" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ GUARANTEE ════════ */}
      <section className="guarantee-section">
        <div className="decorative-bg-1"></div>
        <div className="decorative-bg-2"></div>
        <div className="container">
          <h2 className="scroll-animate">Your Learning, Our Commitment</h2>
          <p className="scroll-animate">Satisfaction guaranteed!</p>
        </div>
      </section>

      {/* ════════ TEACHERS ════════ */}
      <section className="teachers-section">
        <div className="container">
          <h2 className="section-title scroll-animate">
            Our Expert French Tutors Worldwide
          </h2>
          <p className="section-subtitle scroll-animate">
            Learn from certified French speakers around the globe
          </p>
          <div className="teachers-grid">
            {TEACHERS.map((t, i) => (
              <div key={t.name} className="teacher-country scroll-animate">
                <span className="country-flag">{t.flag}</span>
                <span className="country-name">{t.name}</span>
                <span className="teacher-count">
                  {teacherCounts[i] ?? 25}
                </span>
                <span className="teacher-label">tutors</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════ PRICING ════════ */}
      <section className="pricing-section" id="pricing">
        <div className="container">
          <h2 className="section-title scroll-animate">
            Our Classes And Fees
          </h2>
          <p className="section-subtitle scroll-animate">
            Choose the program that best fits your schedule and learning goals.
          </p>

          <div className="pricing-grid pricing-grid-two">
            {/* Flexible */}
            <div className="pricing-card scroll-animate">
              <div className="pricing-header pink-gradient">
                <span className="pricing-badge">Flexible</span>
                <div className="price-info">
                  <p className="price">
                    $250 <span className="currency-label">CAD</span>
                  </p>
                  <p className="price-details">
                    2 hours per week
                    <br />8 hours per month
                  </p>
                </div>
              </div>
              <div className="pricing-body">
                <h3 className="plan-title">2-Hrs One-on-One Program</h3>
                <p className="pricing-description">
                  Designed for students with busy schedules or those who prefer
                  a slower pace of learning
                </p>
                <button
                  className="enroll-btn pink-btn"
                  onClick={() => handleEnrollClick('starter')}
                >
                  Enroll Now
                </button>
                <div className="card-scroll-container">
                  <ul className="pricing-features scrollable-content">
                    {[
                      'Flexible Schedule: Customized to your availability',
                      '2 hours per week (1 hour, 2 days a week or 2 hours, 1 day a week)',
                      'Perfect for busy schedules',
                      'Slower pace of learning',
                      'Personalized attention',
                    ].map((f) => (
                      <li key={f}>
                        <CheckIconSmall />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Standard (featured) */}
            <div className="pricing-card pricing-card-featured scroll-animate">
              <div className="pricing-header blue-gradient">
                <span className="pricing-badge">Standard</span>
                <div className="price-info">
                  <p className="price">
                    $400 <span className="currency-label">CAD</span>
                  </p>
                  <p className="price-details">
                    4 hours per week
                    <br />
                    16 hours per month
                  </p>
                </div>
              </div>
              <div className="pricing-body">
                <h3 className="plan-title">
                  Standard One-on-One (4 hours/week)
                </h3>
                <p className="pricing-description">
                  Receive personalized French lessons tailored to your needs
                </p>
                <button
                  className="enroll-btn blue-btn"
                  onClick={() => handleEnrollClick('professional')}
                >
                  Enroll Now
                </button>
                <div className="card-scroll-container">
                  <ul className="pricing-features scrollable-content">
                    {[
                      'Flexible Schedule: Customized to your availability',
                      '4 Hours per Week (1-Hr, 4 days a week or 2-Hrs, 2 days a week)',
                      'Classes typically set up within 2-5 days of enrollment',
                      'Personalized curriculum',
                      'One-on-one attention',
                    ].map((f) => (
                      <li key={f}>
                        <CheckIconSmall />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Custom */}
            <div className="pricing-card scroll-animate">
              <div className="pricing-header purple-gradient">
                <span className="pricing-badge">Custom</span>
                <div className="price-info">
                  <p className="price">Contact Us</p>
                  <p className="price-details">Tailored to your needs</p>
                </div>
              </div>
              <div className="pricing-body">
                <h3 className="plan-title">Custom Program</h3>
                <p className="pricing-description">
                  Have specific requirements? Let us create a personalized
                  learning plan just for you.
                </p>
                <a href="#contact" className="enroll-btn purple-btn">
                  Contact Us
                </a>
                <div className="card-scroll-container">
                  <ul className="pricing-features scrollable-content">
                    {[
                      'Flexible hours based on your needs',
                      'Group lessons available',
                      'Corporate training options',
                      'Special scheduling arrangements',
                      'Volume discounts available',
                    ].map((f) => (
                      <li key={f}>
                        <CheckIconSmall />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ TRUST BADGES ════════ */}
      <div className="trust-badges">
        <div className="trust-badge-item">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0D66CF"
            strokeWidth="1.5"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <p>Secure Payments</p>
        </div>
        <div className="trust-badge-item">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0D66CF"
            strokeWidth="1.5"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <p>Satisfaction Guaranteed</p>
        </div>
        <div className="trust-badge-item">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0D66CF"
            strokeWidth="1.5"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <p>Flexible Scheduling</p>
        </div>
        <div className="trust-badge-item">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#0D66CF"
            strokeWidth="1.5"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <p>500+ Students</p>
        </div>
      </div>

      {/* ════════ FREE TRIAL ════════ */}
      <section className="free-trial-section" id="free-trial">
        <div className="container">
          <h2 className="scroll-animate">Try A Free Class</h2>
          <p className="scroll-animate">
            Not ready to commit? Book a free demo session to experience our
            teaching methodology firsthand.
          </p>
          <button
            className="cta-button scroll-animate"
            onClick={() => scrollTo('contact')}
          >
            Get Your Free Trial Class
          </button>
          <p className="free-trial-note scroll-animate">
            * Note: Free trials are subject to availability and limited to one
            per student.
          </p>
        </div>
      </section>

      {/* ════════ REFERRAL ════════ */}
      <section className="referral-section" id="referral">
        <div className="container">
          <h2 className="scroll-animate">Join Our Referral Program</h2>
          <p className="referral-highlight scroll-animate">
            $50 Off Every Month For You And Your Friends
          </p>
          <p className="scroll-animate">
            Help your friends learn French and save on your own education!
            It&apos;s a win-win for everyone involved in our community.
          </p>
          <button
            className="cta-button scroll-animate"
            onClick={() => scrollTo('contact')}
          >
            Contact Us To Refer
          </button>
          <p className="referral-note scroll-animate">
            Important Note: This referral discount applies only to the
            4-hours/week program. Discounts cannot be combined or stacked with
            any other offers.
          </p>
        </div>
      </section>

      {/* ════════ TESTIMONIALS ════════ */}
      <section className="testimonials-section" id="testimonials">
        <div className="container">
          <div className="google-reviews-header scroll-animate">
            <div className="google-logo">
              <GoogleLogoSvg size={28} />
              <span>Google Reviews</span>
            </div>
            <div className="google-rating">
              <div className="rating-score">4.9</div>
              <div className="rating-details">
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className="star filled">
                      &#9733;
                    </span>
                  ))}
                </div>
                <div className="rating-count">Based on 220 reviews</div>
              </div>
            </div>
          </div>

          <div className="testimonials-carousel scroll-animate">
            <button
              className="carousel-btn carousel-prev"
              aria-label="Previous reviews"
              onClick={handlePrev}
            >
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="currentColor"
              >
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>

            <div className="carousel-track-container">
              <div
                className="carousel-track"
                style={{
                  transform: `translateX(-${carouselIndex * (100 / cardsPerView)}%)`,
                  transition: 'transform 0.5s ease',
                }}
              >
                {TESTIMONIALS.map((t) => (
                  <div
                    key={t.name}
                    className="testimonial-card"
                    style={{ flex: `0 0 ${100 / cardsPerView}%` }}
                  >
                    <div className="review-header">
                      <div className="reviewer-avatar">
                        <img
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=${t.bg}&color=${t.fg}&size=48`}
                          alt={t.name.split(' ')[0] + ' ' + t.name.split(' ')[1]?.[0] + '.'}
                        />
                      </div>
                      <div className="reviewer-info">
                        <h4>{t.name}</h4>
                        <div className="review-meta">
                          <span className="review-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
                          <span className="review-date">{t.date}</span>
                        </div>
                      </div>
                      <div className="google-icon">
                        <GoogleLogoSvg size={20} />
                      </div>
                    </div>
                    <p className="review-text">{t.text}</p>
                    {t.image && (
                      <div className="review-result-image">
                        <img src={t.image} alt={t.imageAlt || ''} />
                      </div>
                    )}
                    <div className="review-footer">
                      <span className="review-tag">{t.tag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              className="carousel-btn carousel-next"
              aria-label="Next reviews"
              onClick={handleNext}
            >
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                fill="currentColor"
              >
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
              </svg>
            </button>
          </div>

          <div className="carousel-dots">
            {dots.map((d) => (
              <button
                key={d}
                className={`carousel-dot${d === carouselIndex ? ' active' : ''}`}
                aria-label={`Go to slide ${d + 1}`}
                onClick={() => {
                  clearInterval(autoPlayRef.current);
                  goToSlide(d);
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ════════ ARTICLES ════════ */}
      <section className="articles-section" id="articles">
        <div className="container">
          <h2 className="section-title scroll-animate">Latest Articles</h2>
          <p className="section-subtitle scroll-animate">
            Discover tips, guides, and insights to help you on your French
            learning journey.
          </p>

          <div className="articles-grid" id="articlesGrid">
            {articles === null ? (
              <div className="articles-loading">
                <div className="spinner"></div>
                <p>Loading articles...</p>
              </div>
            ) : articles.length === 0 ? (
              <p>No articles available at this time.</p>
            ) : (
              articles.map((article) => (
                <Link
                  key={article.slug}
                  href={`/articles/${article.slug}`}
                  className="article-card scroll-animate"
                >
                  {article.image && (
                    <div className="article-image">
                      <img
                        src={article.image}
                        alt={article.title}
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="article-content">
                    <h3 className="article-title">{article.title}</h3>
                    {article.date && (
                      <p className="article-date">{article.date}</p>
                    )}
                    <span className="article-link">Read More</span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ════════ ABOUT ════════ */}
      <section className="about-section" id="about">
        <div className="container">
          <div className="about-content scroll-animate">
            <div className="about-text">
              <h2 className="section-title">About Enprico</h2>
              <p className="about-description">
                Enprico is an online French learning platform dedicated to
                helping students achieve their immigration goals to Canada and
                France. Our qualified tutors tailor each lesson to your level
                and learning pace, guiding beginners to advanced students toward
                strong results in TEF and TCF exams.
              </p>
              <p className="about-description">
                Our mission is to provide practical and structured French
                training for Express Entry and residency programs. We believe
                that learning French should be engaging, personalized, and
                focused on real results.
              </p>
              <div className="about-stats">
                {[
                  { num: '87%', label: 'Improve Their TEF/TCF Score in 30 Days' },
                  { num: '500+', label: 'Students Passed Their Exams' },
                  { num: '95%', label: 'Satisfaction Rate' },
                  { num: '50+', label: 'Countries' },
                ].map((s) => (
                  <div key={s.num} className="stat-item scroll-animate">
                    <h3 className="stat-number">{s.num}</h3>
                    <p className="stat-label">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="about-image scroll-animate-right">
              <div className="about-image-placeholder">
                <svg viewBox="0 0 400 300" fill="none">
                  <rect
                    width="400"
                    height="300"
                    rx="12"
                    fill="url(#aboutGradient)"
                  />
                  <circle cx="200" cy="120" r="40" fill="white" opacity="0.2" />
                  <circle cx="150" cy="180" r="30" fill="white" opacity="0.15" />
                  <circle cx="250" cy="200" r="35" fill="white" opacity="0.1" />
                  <defs>
                    <linearGradient
                      id="aboutGradient"
                      x1="0"
                      y1="0"
                      x2="400"
                      y2="300"
                    >
                      <stop offset="0%" stopColor="#0c5ff9" />
                      <stop offset="100%" stopColor="#505089" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ CONTACT ════════ */}
      <section className="contact-section" id="contact">
        <div className="container">
          <h2 className="section-title scroll-animate">Get in Touch</h2>
          <p className="section-subtitle scroll-animate">
            Have questions? We&apos;d love to hear from you. Send us a message
            and we&apos;ll respond as soon as possible.
          </p>

          <div className="contact-wrapper">
            <div className="contact-form-container scroll-animate">
              <form className="contact-form" onSubmit={handleContactSubmit}>
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    placeholder="John Doe"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    placeholder="john@example.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    placeholder="How can we help?"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    required
                    placeholder="Your message here..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={contactStatus === 'sending'}
                >
                  {contactStatus === 'sending'
                    ? 'Sending...'
                    : 'Send Message'}
                </button>
                {contactStatus === 'success' && (
                  <p className="form-success">
                    Message sent successfully! We&apos;ll get back to you soon.
                  </p>
                )}
                {contactStatus === 'error' && (
                  <p className="form-error">
                    Something went wrong. Please try again.
                  </p>
                )}
              </form>
            </div>

            <div className="contact-info-container scroll-animate-right">
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
                      d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div>
                    <h4>Phone</h4>
                    <p>
                      <a href="tel:+19176721922">+1 (917) 672-1922</a>
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
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <path
                      d="M12 6V12L16 14"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div>
                    <h4>Business Hours</h4>
                    <p>
                      Mon-Fri: 9:00 AM - 6:00 PM
                      <br />
                      Sat-Sun: Closed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════ HELP MODAL ════════ */}
      {helpOpen && (
        <div className="modal" id="helpModal" style={{ display: 'flex' }}>
          <div
            className="modal-overlay"
            onClick={() => setHelpOpen(false)}
          ></div>
          <div className="modal-content help-modal-content">
            <button
              className="modal-close"
              aria-label="Close modal"
              onClick={() => setHelpOpen(false)}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <h2 className="modal-title">Frequently Asked Questions</h2>
            <div className="help-content">
              {FAQ_DATA.map((faq, idx) => (
                <div key={idx} className="faq-item">
                  <button
                    className={`faq-question${faqOpen[idx] ? ' active' : ''}`}
                    onClick={() => toggleFaq(idx)}
                  >
                    <span>{faq.q}</span>
                    <svg
                      className="faq-icon"
                      viewBox="0 0 20 20"
                      fill="none"
                      style={{
                        transform: faqOpen[idx]
                          ? 'rotate(180deg)'
                          : 'rotate(0)',
                        transition: 'transform 0.3s ease',
                      }}
                    >
                      <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </button>
                  {faqOpen[idx] && (
                    <div className="faq-answer">
                      {faq.a.map((p, pi) => (
                        <p key={pi}>{p}</p>
                      ))}
                      {faq.list && (
                        <ul>
                          {faq.list.map((li, li2) => (
                            <li key={li2}>{li}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="help-footer">
              <p>
                Still have questions?{' '}
                <a
                  href="#contact"
                  onClick={() => setHelpOpen(false)}
                >
                  Contact us
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ════════ EMAIL CAPTURE MODAL ════════ */}
      {emailModalOpen && (
        <div
          className="modal"
          id="emailCaptureModal"
          style={{ display: 'flex' }}
        >
          <div className="modal-overlay" onClick={closeEmailModal}></div>
          <div className="modal-content email-capture-content">
            <button
              className="modal-close"
              aria-label="Close modal"
              onClick={closeEmailModal}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M18 6L6 18M6 6L18 18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <div className="email-capture-icon">
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C19.5304 19 20.0391 18.7893 20.4142 18.4142C20.7893 18.0391 21 17.5304 21 17V7C21 6.46957 20.7893 5.96086 20.4142 5.58579C20.0391 5.21071 19.5304 5 19 5H5C4.46957 5 3.96086 5.21071 3.58579 5.58579C3.21071 5.96086 3 6.46957 3 7V17C3 17.5304 3.21071 18.0391 3.58579 18.4142C3.96086 18.7893 4.46957 19 5 19Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="modal-title">Get Free French Tips!</h2>
            <p className="modal-subtitle">
              Join our community and receive exclusive learning resources, tips,
              and special offers directly in your inbox.
            </p>
            <form className="email-capture-form" onSubmit={handleEmailCapture}>
              <div className="form-group">
                <label htmlFor="captureEmail">Email Address</label>
                <input
                  type="email"
                  id="captureEmail"
                  name="email"
                  required
                  placeholder="your@email.com"
                />
              </div>
              <button
                type="submit"
                className="submit-btn"
                disabled={emailCaptureStatus === 'sending'}
              >
                {emailCaptureStatus === 'sending'
                  ? 'Subscribing...'
                  : 'Subscribe Now'}
              </button>
              {emailCaptureStatus === 'success' && (
                <p className="form-success">
                  Subscribed successfully! Check your inbox.
                </p>
              )}
              {emailCaptureStatus === 'error' && (
                <p className="form-error">
                  Something went wrong. Please try again.
                </p>
              )}
            </form>
            <p className="email-capture-privacy">
              We respect your privacy. Unsubscribe at any time.
            </p>
          </div>
        </div>
      )}

      {/* Floating help button (triggers FAQ modal) */}
      <button
        className="help-btn floating-help-btn"
        onClick={() => setHelpOpen(true)}
        aria-label="Help / FAQ"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 999,
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0D66CF, #26BAFF)',
          color: 'white',
          border: 'none',
          fontSize: '1.25rem',
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ?
      </button>
    </main>
  );
}
