import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import './about.css';

export const metadata = {
  title: 'About Us - Enprico | French for TEF & TCF Exams',
  description:
    'Learn about Enprico, the online French learning platform for Canada and France immigration. Meet our team of expert tutors and discover our mission to help you succeed in TEF and TCF exams.',
  keywords:
    'about Enprico, French learning platform, online French tutors, TEF preparation, TCF preparation, French for immigration, Canada Express Entry',
  alternates: {
    canonical: 'https://enprico.com/about-us-learn-french-online',
  },
  openGraph: {
    type: 'website',
    url: 'https://enprico.com/about-us-learn-french-online',
    title: 'About Us - Enprico | French for TEF & TCF Exams',
    description:
      'Learn about Enprico, the online French learning platform for Canada and France immigration with expert tutors.',
    images: ['https://enprico.com/images/banner 2.png'],
    siteName: 'Enprico',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Us - Enprico | French for TEF & TCF Exams',
    description:
      'Learn about Enprico, the online French learning platform for Canada and France immigration.',
    images: ['https://enprico.com/images/banner 2.png'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  mainEntity: {
    '@type': 'EducationalOrganization',
    name: 'Enprico',
    description:
      'Enprico is an online French learning platform dedicated to helping students achieve their TEF and TCF exam goals for Canada and France immigration through personalized 1-on-1 tutoring.',
    url: 'https://enprico.com',
    logo: 'https://enprico.com/images/logo_white 1.png',
    foundingDate: '2023',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Church Street',
      addressLocality: 'Toronto',
      addressRegion: 'ON',
      postalCode: 'M5B 1G8',
      addressCountry: 'CA',
    },
  },
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link> <span>/</span> <span>About Us</span>
      </nav>

      {/* Page Header */}
      <PageHeader
        title="About Enprico"
        subtitle="Empowering learners worldwide to achieve French fluency for TEF & TCF exams through personalized education"
      />

      <main>
        {/* Mission Section */}
        <section className="mission-section">
          <div className="container">
            <div className="mission-content">
              <h2>Our Mission</h2>
              <p>
                To provide practical and structured French training for Canada
                and France immigration. We believe that language should never be
                a barrier to achieving your dreams, and we&apos;re committed to
                helping our students succeed in TEF and TCF exams through
                personalized, effective learning experiences.
              </p>
            </div>
          </div>
        </section>

        {/* Unique Features Section */}
        <section className="unique-features">
          <div className="container">
            <h2>What Makes Enprico Different</h2>
            <p className="section-subtitle">
              We understand that every learner is unique - that&apos;s why we
              built something special
            </p>

            <div className="features-highlight-grid">
              {/* Feature 1: Native Language Learning */}
              <div className="feature-highlight-card">
                <div className="feature-highlight-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <h3>French for Immigration Goals</h3>
                <p>
                  Our curriculum is specifically designed for TEF and TCF exam
                  preparation for Canada and France immigration. We understand
                  the specific requirements for Express Entry, Francophone
                  programs, and residency applications.
                </p>
                <div className="language-flags">
                  <span className="language-flag">&#x1F1E8;&#x1F1E6;</span>
                  <span className="language-flag">&#x1F1EB;&#x1F1F7;</span>
                  <span className="language-flag">&#x1F4DD;</span>
                  <span className="language-flag">&#x1F3AF;</span>
                </div>
              </div>

              {/* Feature 2: Bilingual Tutors */}
              <div className="feature-highlight-card">
                <div className="feature-highlight-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3>Certified French Tutors</h3>
                <p>
                  Our tutors are certified French speakers who understand the TEF
                  and TCF exam formats. Get personalized guidance, practice with
                  real exam materials, and build confidence for your immigration
                  journey.
                </p>
                <div className="language-flags">
                  <span className="language-flag">&#x1F5E3;&#xFE0F;</span>
                  <span className="language-flag">&#x1F4AC;</span>
                  <span className="language-flag">&#x1F3AF;</span>
                  <span className="language-flag">&#x2728;</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="story-section">
          <div className="container-narrow">
            <h2>Our Story</h2>
            <p>
              Enprico was founded with a simple yet powerful vision: to help
              learners achieve their French language goals for immigration to
              Canada and France. We recognized that many aspiring immigrants
              struggle to find quality, focused French training for TEF and TCF
              exams.
            </p>
            <p>
              Our founders, experienced educators and language specialists, set
              out to create something different. They envisioned a platform where
              students could learn at their own pace, with dedicated tutors who
              understand the specific requirements of immigration exams and
              programs like Express Entry.
            </p>
            <p>
              Today, Enprico has grown into a community of learners from around
              the world, all working toward their dream of living in Canada or
              France. We&apos;ve helped students achieve the CLB scores they
              need, pass their TEF and TCF exams, and build the French skills
              necessary for life and work abroad.
            </p>
            <p>
              But we&apos;re just getting started. Every day, we work to improve
              our platform, expand our tutor network, and develop new ways to
              make French learning more engaging and effective. Our commitment to
              our students remains unchanged: personalized education that
              delivers real results for your immigration journey.
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Students Worldwide</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Expert Tutors</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">95%</div>
              <div className="stat-label">Satisfaction Rate</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">Countries Served</div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="values-section">
          <div className="container">
            <h2>Our Values</h2>
            <div className="values-grid">
              <div className="value-card">
                <div className="value-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3>Excellence</h3>
                <p>
                  We strive for excellence in everything we do, from our
                  curriculum design to our tutor selection process.
                </p>
              </div>
              <div className="value-card">
                <div className="value-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3>Personalization</h3>
                <p>
                  Every student is unique. We tailor our approach to match
                  individual learning styles, goals, and pace.
                </p>
              </div>
              <div className="value-card">
                <div className="value-icon">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <h3>Accessibility</h3>
                <p>
                  Quality education should be available to everyone. We work to
                  break down barriers and make learning accessible.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="team-section">
          <div className="container">
            <h2>Meet Our Leadership</h2>
            <p className="team-subtitle">
              Passionate educators and innovators dedicated to transforming
              French education
            </p>
            <div className="team-grid">
              <div className="team-card">
                <div className="team-avatar">S</div>
                <h3>Sarah Mitchell</h3>
                <p className="team-role">Founder &amp; CEO</p>
                <p className="team-bio">
                  Former DELF/DALF examiner with 15+ years in French education.
                  Passionate about making learning accessible.
                </p>
              </div>
              <div className="team-card">
                <div className="team-avatar">J</div>
                <h3>James Chen</h3>
                <p className="team-role">Head of Curriculum</p>
                <p className="team-bio">
                  PhD in Applied Linguistics. Designs our award-winning
                  curriculum and tutor training programs.
                </p>
              </div>
              <div className="team-card">
                <div className="team-avatar">E</div>
                <h3>Emily Roberts</h3>
                <p className="team-role">Head of Tutors</p>
                <p className="team-bio">
                  Manages our global network of 500+ certified tutors and
                  ensures quality standards.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <div className="container">
            <h2>Ready to Start Your Journey?</h2>
            <p>
              Join thousands of students who are achieving their French learning
              goals with Enprico.
            </p>
            <Link href="/#pricing" className="cta-btn">
              Get Started Today
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
