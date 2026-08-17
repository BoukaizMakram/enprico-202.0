import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import './our-courses.css';

export const metadata = {
  title: 'Our Courses - Enprico | TEF & TCF French Courses (A1 to B2) for Canada PR',
  description:
    'Explore Enprico\'s structured French courses from A1 to B2, built for the TEF and TCF exams and Canada Express Entry. Live 1-on-1 tutoring, real exam practice, and a clear path to the CLB / NCLC levels you need.',
  keywords:
    'French courses online, TEF course, TCF course, A1 A2 B1 B2 French, learn French for Express Entry, CLB NCLC French, French exam preparation, Enprico courses',
  alternates: {
    canonical: 'https://enprico.ca/our-courses',
  },
  openGraph: {
    type: 'website',
    url: 'https://enprico.ca/our-courses',
    title: 'Our Courses - Enprico | TEF & TCF French Courses for Canada PR',
    description:
      'Structured A1-to-B2 French courses built for the TEF and TCF exams, with live 1-on-1 tutoring and real exam practice.',
    images: ['https://enprico.ca/images/banner 2.png'],
    siteName: 'Enprico',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Our Courses - Enprico | TEF & TCF French Courses',
    description:
      'Structured A1-to-B2 French courses for the TEF and TCF exams, with live 1-on-1 tutoring.',
    images: ['https://enprico.ca/images/banner 2.png'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'French for TEF & TCF Exams (A1 to B2)',
  description:
    'A structured French program that takes learners from complete beginner (A1) to upper-intermediate (B2) proficiency for the TEF and TCF exams required for Canada Express Entry and permanent residency.',
  provider: {
    '@type': 'EducationalOrganization',
    name: 'Enprico',
    url: 'https://enprico.ca',
    logo: 'https://enprico.ca/images/logo_white 1.png',
  },
  educationalCredentialAwarded: 'TEF / TCF exam readiness (CLB / NCLC levels)',
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'online',
    courseWorkload: 'PT4H',
  },
};

const levels = [
  {
    code: 'A1',
    name: 'Beginner',
    text:
      'For absolute beginners with no prior French. You build core vocabulary, pronunciation, and the everyday phrases you need to understand and be understood from day one.',
  },
  {
    code: 'A2',
    name: 'Elementary',
    text:
      'Builds on your A1 foundation. You handle routine conversations, past and future tenses, and the practical situations that show up throughout the TEF and TCF.',
  },
  {
    code: 'B1',
    name: 'Intermediate',
    text:
      'The level most Express Entry candidates target. You communicate more fluently, express opinions, and handle the listening, reading, and speaking tasks the exams demand.',
  },
  {
    code: 'B2',
    name: 'Upper Intermediate',
    text:
      'For advanced communication and top CLB / NCLC scores. You argue a point of view, understand complex texts, and perform with confidence under real exam conditions.',
  },
];

const phases = [
  {
    title: 'Language Foundation',
    duration: '4–6 months',
    text:
      'Grammar, vocabulary, and pronunciation built step by step in live 1-on-1 lessons, tailored to your starting level and pace.',
  },
  {
    title: 'Exam Preparation',
    duration: '1–3 months',
    text:
      'Focused TEF / TCF practice with mock tests, timed drills, and section-by-section strategy for listening, reading, writing, and speaking.',
  },
  {
    title: 'Ongoing Support',
    duration: 'Throughout',
    text:
      'Access to official-style practice materials and mock tests, plus continuous feedback from your tutor between sessions.',
  },
];

const features = [
  {
    title: 'Regular Homework',
    text: 'Targeted assignments after each session so new French sticks and compounds week over week.',
  },
  {
    title: 'Assessment Tests',
    text: 'Checkpoints at every level (A1–B2) so you always know exactly where you stand against the exam.',
  },
  {
    title: 'Personalized Feedback',
    text: 'Direct, specific corrections from your tutor on speaking and writing — the two sections learners find hardest.',
  },
  {
    title: 'Tailored Curriculum',
    text: 'Your plan is shaped around your goals, timeline, and target CLB / NCLC score — not a one-size-fits-all syllabus.',
  },
  {
    title: 'Skill-Specific Practice',
    text: 'Dedicated sessions for each exam skill: comprehension orale, comprehension écrite, expression orale, and expression écrite.',
  },
  {
    title: 'Real Exam Practice',
    text: 'Official-style mock tests and timed practice so exam day feels familiar, not stressful.',
  },
];

export default function OurCoursesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Page Header */}
      <PageHeader
        title="Our Courses"
        subtitle="A structured path from complete beginner to B2 — built for the TEF and TCF exams you need for Canada Express Entry."
      />

      <main>
        {/* Course Structure */}
        <section className="courses-intro">
          <div className="container">
            <h2>Course Structure</h2>
            <p className="section-subtitle">
              Our courses guide you from complete beginner to B2-level proficiency
              for the TEF / TCF — the French required for Express Entry and
              Canadian permanent residency.
            </p>

            <div className="levels-grid">
              {levels.map((lvl) => (
                <div className="level-card" key={lvl.code}>
                  <div className="level-badge">{lvl.code}</div>
                  <h3>{lvl.name}</h3>
                  <p>{lvl.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Teaching Methodology */}
        <section className="methodology-section">
          <div className="container">
            <h2>How We Teach</h2>
            <p className="section-subtitle">
              A proven three-part approach that moves you from your first French
              word to exam-day confidence.
            </p>

            <div className="phases-grid">
              {phases.map((phase, i) => (
                <div className="phase-card" key={phase.title}>
                  <div className="phase-number">{i + 1}</div>
                  <div className="phase-duration">{phase.duration}</div>
                  <h3>{phase.title}</h3>
                  <p>{phase.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Learning Features */}
        <section className="features-section">
          <div className="container">
            <h2>What Every Course Includes</h2>
            <p className="section-subtitle">
              Everything you need to learn efficiently and walk into the exam
              prepared.
            </p>

            <div className="features-grid">
              {features.map((f) => (
                <div className="course-feature-card" key={f.title}>
                  <div className="course-feature-check">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </div>
                  <div>
                    <h3>{f.title}</h3>
                    <p>{f.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Referral */}
        <section className="referral-section">
          <div className="container">
            <div className="referral-card">
              <h2>Learn Together, Save Together</h2>
              <p>
                Invite a friend to join Enprico and you can both save on your
                monthly fees. Preparing for the TEF or TCF alongside someone else
                keeps you accountable — and it&apos;s more affordable.
              </p>
              <Link href="/contact" className="referral-btn">
                Ask Us About Referrals
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="cta-section">
          <div className="container">
            <h2>Ready to Start Your French Journey?</h2>
            <p>
              Book your spot and get matched with an expert tutor who will build
              a plan around your goals and timeline.
            </p>
            <Link href="/#pricing" className="cta-btn">
              View Plans &amp; Enroll
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
