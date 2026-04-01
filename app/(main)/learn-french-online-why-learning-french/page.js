import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import './why-learn.css';

export const metadata = {
  title: 'Why Learn French? | Benefits of French for Immigration - Enprico',
  description: 'Discover why learning French is essential for immigration to Canada and France. Explore the benefits of mastering French for Express Entry, TEF/TCF exams, and life abroad.',
  alternates: {
    canonical: 'https://enprico.com/learn-french-online-why-learning-french',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Why Learn French? Benefits of French for Immigration',
  description: 'Discover why learning French is essential for immigration to Canada and France.',
  author: {
    '@type': 'Organization',
    name: 'Enprico',
  },
  publisher: {
    '@type': 'Organization',
    name: 'Enprico',
    logo: {
      '@type': 'ImageObject',
      url: 'https://enprico.com/images/logo_white 1.png',
    },
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': 'https://enprico.com/learn-french-online-why-learning-french',
  },
};

export default function WhyLearnFrenchPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link> <span>/</span> <span>Why Learn French</span>
      </nav>

      {/* Page Header */}
      <PageHeader
        title="Why Learn French for Immigration?"
        subtitle="Discover how mastering French can transform your immigration journey to Canada and France"
      />

      {/* Main Content */}
      <main className="content-section">
        <div className="content-grid">
          <article className="main-content">
            <h2>French: Your Gateway to Canada and France</h2>
            <p>French is one of the most valuable languages for immigration. As an official language of Canada and the native language of France, French proficiency opens doors to immigration programs, citizenship, and life in two of the world&#39;s most desirable destinations.</p>

            <p>With over 300 million French speakers worldwide and growing demand for French-speaking immigrants in Canada, mastering this language gives you a significant competitive advantage in your immigration journey.</p>

            <div className="benefit-card">
              <h3>Canada Express Entry Advantage</h3>
              <p>French proficiency can add up to 50+ additional CRS points to your Express Entry profile. With TEF/TCF scores at CLB 7 or higher, you significantly increase your chances of receiving an Invitation to Apply (ITA).</p>
            </div>

            <h2>Top Reasons to Learn French for Immigration</h2>

            <ul>
              <li><strong>Express Entry Points:</strong> French as a second language (or first) provides substantial Comprehensive Ranking System (CRS) bonus points for Canadian immigration.</li>
              <li><strong>Francophone Immigration Programs:</strong> Canada offers dedicated streams like Mobilit&eacute; Francophone and Provincial Nominee Programs specifically for French speakers.</li>
              <li><strong>Quebec Immigration:</strong> French is mandatory for Quebec&#39;s immigration programs (PEQ, QSWP), offering a direct path to Canadian permanent residence.</li>
              <li><strong>French Citizenship:</strong> A B1 level in French is required for naturalization in France, opening doors to EU residency and travel.</li>
              <li><strong>Career Opportunities:</strong> Bilingual professionals earn 10-15% more in Canada. Federal government jobs often require French.</li>
            </ul>

            <div className="benefit-card">
              <h3>TEF/TCF Certification</h3>
              <p>The TEF Canada and TCF Canada are recognized official tests for proving French proficiency. Higher scores translate directly to more immigration points and better program eligibility.</p>
            </div>

            <h2>Why Learn French Online with Enprico?</h2>
            <p>Online French learning has become the preferred choice for busy professionals and aspiring immigrants. Here&#39;s why Enprico is your ideal partner:</p>

            <ul>
              <li><strong>TEF/TCF Focused:</strong> Our curriculum is designed specifically for immigration exam success, covering all four skills tested.</li>
              <li><strong>1-on-1 Tutoring:</strong> Get personalized attention from certified French tutors who understand immigration requirements.</li>
              <li><strong>Flexible Scheduling:</strong> Learn at your own pace, fitting lessons around your work and family commitments.</li>
              <li><strong>CLB-Aligned Training:</strong> Our lessons target specific Canadian Language Benchmark (CLB) levels for your immigration goals.</li>
              <li><strong>Native French Speakers:</strong> Practice with tutors from France, Quebec, Belgium, and other Francophone countries.</li>
            </ul>

            <h2>Immigration Pathways That Require French</h2>

            <ul>
              <li><strong>Federal Skilled Worker (FSW):</strong> French proficiency adds bonus CRS points and opens additional streams.</li>
              <li><strong>Quebec Skilled Worker Program (QSWP):</strong> French is heavily weighted in the selection criteria.</li>
              <li><strong>Programme de l&#39;exp&eacute;rience qu&eacute;b&eacute;coise (PEQ):</strong> Requires intermediate French (B2) level.</li>
              <li><strong>Atlantic Immigration Program:</strong> French abilities can strengthen your application.</li>
              <li><strong>French Naturalization:</strong> B1 speaking and listening required for French citizenship.</li>
            </ul>

            <h2>Start Your French Journey Today</h2>
            <p>At Enprico, we&#39;ve helped hundreds of students achieve their TEF/TCF goals and successfully immigrate to Canada and France. Our certified tutors, immigration-focused curriculum, and flexible scheduling make learning French both effective and achievable.</p>

            <p>Whether you&#39;re just starting your French journey or need to boost your CLB scores for Express Entry, we have a personalized plan for you. Join the Enprico community and take the first step toward your new life in Canada or France.</p>
          </article>

          <aside className="sidebar">
            <div className="cta-card">
              <h3>Ready to Start Learning?</h3>
              <p>Join students who are mastering French for TEF/TCF with Enprico.</p>
              <Link href="/register" className="btn">Get Started</Link>
              <div className="stats-grid">
                <div className="stat-box">
                  <div className="number">CLB 7+</div>
                  <div className="label">Target Level</div>
                </div>
                <div className="stat-box">
                  <div className="number">1-on-1</div>
                  <div className="label">Tutoring</div>
                </div>
                <div className="stat-box">
                  <div className="number">TEF/TCF</div>
                  <div className="label">Focused</div>
                </div>
                <div className="stat-box">
                  <div className="number">Flexible</div>
                  <div className="label">Schedule</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
