import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import './tef-tcf.css';

export const metadata = {
  title: 'TEF & TCF Preparation Online | Learn French with Enprico',
  description: 'Prepare for TEF and TCF exams with Enprico\'s expert tutors. Get personalized 1-on-1 coaching for Canada Express Entry and France immigration. Achieve your target CLB score.',
  alternates: {
    canonical: 'https://enprico.com/learn-french-online-tef-tcf',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'TEF & TCF Exam Preparation',
  description: 'Comprehensive online preparation course for TEF and TCF exams with personalized 1-on-1 tutoring for Canada and France immigration.',
  provider: {
    '@type': 'Organization',
    name: 'Enprico',
    url: 'https://enprico.com',
  },
  courseMode: 'online',
  educationalLevel: 'Intermediate to Advanced',
  inLanguage: 'en',
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'online',
    instructor: {
      '@type': 'Organization',
      name: 'Enprico Expert Tutors',
    },
  },
};

const CheckIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

export default function TefTcfPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link> <span>/</span> <span>TEF &amp; TCF Preparation</span>
      </nav>

      {/* Page Header */}
      <PageHeader
        title="TEF & TCF Preparation"
        subtitle="Achieve your target CLB score with personalized 1-on-1 tutoring for Canada and France immigration"
      />

      <main>
        {/* Intro Section */}
        <section className="intro-section">
          <div className="container">
            <h2>Your Path to Exam Success Starts Here</h2>
            <p>Whether you&#39;re applying for Canada Express Entry, French citizenship, or work/study visas, we provide comprehensive preparation for both TEF and TCF exams. Our expert tutors have helped thousands of students achieve their target CLB scores through personalized coaching and proven strategies.</p>
          </div>
        </section>

        {/* Exams Grid */}
        <section className="content-section">
          <div className="container-wide">
            <div className="exams-grid">
              {/* TEF Card */}
              <div className="exam-card">
                <span className="exam-badge tef-badge">TEF Preparation</span>
                <h3>Test d&#39;Evaluation de Francais</h3>
                <p>The official French proficiency test recognized by IRCC for Canada immigration. Required for Express Entry and Francophone programs.</p>
                <ul className="exam-features">
                  <li>
                    <CheckIcon />
                    <span>TEF Canada and TEF France preparation</span>
                  </li>
                  <li>
                    <CheckIcon />
                    <span>Speaking, Writing, Reading, Listening practice</span>
                  </li>
                  <li>
                    <CheckIcon />
                    <span>Mock tests with detailed feedback</span>
                  </li>
                  <li>
                    <CheckIcon />
                    <span>CLB score improvement strategies</span>
                  </li>
                  <li>
                    <CheckIcon />
                    <span>Certified French tutors</span>
                  </li>
                </ul>
                <Link href="/#pricing" className="exam-cta">Start TEF Prep</Link>
              </div>

              {/* TCF Card */}
              <div className="exam-card">
                <span className="exam-badge tcf-badge">TCF Preparation</span>
                <h3>Test de Connaissance du Francais</h3>
                <p>The official French proficiency test for French citizenship, studies, and work in France. Also accepted for Canada immigration.</p>
                <ul className="exam-features">
                  <li>
                    <CheckIcon />
                    <span>TCF Canada and TCF France preparation</span>
                  </li>
                  <li>
                    <CheckIcon />
                    <span>Compulsory and complementary tests</span>
                  </li>
                  <li>
                    <CheckIcon />
                    <span>Full-length practice tests</span>
                  </li>
                  <li>
                    <CheckIcon />
                    <span>Time management and test strategies</span>
                  </li>
                  <li>
                    <CheckIcon />
                    <span>French vocabulary and grammar building</span>
                  </li>
                </ul>
                <Link href="/#pricing" className="exam-cta">Start TCF Prep</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <div className="container-wide">
            <h2>Why Prepare with Enprico?</h2>
            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3>Expert Tutors</h3>
                <p>Learn from former examiners and certified specialists with proven track records</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                    <path d="M16 13H8" />
                    <path d="M16 17H8" />
                    <path d="M10 9H8" />
                  </svg>
                </div>
                <h3>Practice Tests</h3>
                <p>Unlimited access to authentic practice materials and mock exams</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h3>Detailed Feedback</h3>
                <p>Receive comprehensive feedback on every practice test and assignment</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3>Personalized Plan</h3>
                <p>Customized study plan targeting your weak areas for maximum improvement</p>
              </div>
            </div>
          </div>
        </section>

        {/* Scores Section */}
        <section className="scores-section">
          <div className="container">
            <h2>Our Students&#39; Success</h2>
            <p>Average score improvements achieved by our students</p>
            <div className="scores-grid">
              <div className="score-card">
                <div className="score-value">+1.5</div>
                <div className="score-label">IELTS Band Score</div>
                <div className="score-desc">Average improvement in 8 weeks</div>
              </div>
              <div className="score-card">
                <div className="score-value">+25</div>
                <div className="score-label">TOEFL Points</div>
                <div className="score-desc">Average improvement in 8 weeks</div>
              </div>
              <div className="score-card">
                <div className="score-value">94%</div>
                <div className="score-label">Target Score Rate</div>
                <div className="score-desc">Students achieving their goals</div>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Section */}
        <section className="comparison-section">
          <div className="container-wide">
            <h2>IELTS vs TOEFL: Quick Comparison</h2>
            <div className="comparison-table">
              <table>
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>IELTS</th>
                    <th>TOEFL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Duration</td>
                    <td>2 hours 45 minutes</td>
                    <td>3 hours</td>
                  </tr>
                  <tr>
                    <td>Scoring</td>
                    <td>Band 0-9</td>
                    <td>0-120 points</td>
                  </tr>
                  <tr>
                    <td>Speaking Test</td>
                    <td>Face-to-face interview</td>
                    <td>Computer-recorded</td>
                  </tr>
                  <tr>
                    <td>Accent</td>
                    <td>British/Australian/American</td>
                    <td>Primarily American</td>
                  </tr>
                  <tr>
                    <td>Best For</td>
                    <td>UK, Australia, Canada</td>
                    <td>USA, Canada</td>
                  </tr>
                  <tr>
                    <td>Validity</td>
                    <td>2 years</td>
                    <td>2 years</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="container">
            <h2>Start Preparing for Your Exam Today</h2>
            <p>Get a personalized study plan and achieve your target score faster</p>
            <Link href="/#pricing" className="cta-btn">Get Started Free</Link>
          </div>
        </section>
      </main>
    </>
  );
}
