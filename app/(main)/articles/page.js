import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import articlesData from '@/content/articles/index.json';
import './articles.css';

export const metadata = {
  title: 'Articles',
  description: 'Read helpful articles, tips, and guides to improve your French skills. Expert advice on learning French online for TEF & TCF exams from Enprico tutors.',
  alternates: { canonical: '/articles' },
};

export default function ArticlesPage() {
  return (
    <main>
      <PageHeader title="Latest Articles" subtitle="Discover tips, guides, and insights to help you on your French learning journey" />

      <section className="articles-listing">
        <div className="container">
          <div className="articles-grid">
            {articlesData.map((article) => (
              <Link href={`/articles/${article.slug}`} key={article.id} className="article-card-link">
                <article className="article-card">
                  <div className="article-card-image">
                    <img src={article.image} alt={article.title} loading="lazy" />
                  </div>
                  <div className="article-card-content">
                    <span className="article-card-category">{article.category}</span>
                    <h2 className="article-card-title">{article.title}</h2>
                    <p className="article-card-excerpt">{article.excerpt}</p>
                    <div className="article-card-meta">
                      <span>{new Date(article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                      <span>{article.readTime} min read</span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
