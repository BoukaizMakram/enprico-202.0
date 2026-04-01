import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import articlesData from '@/content/articles/index.json';
import './article.css';

export async function generateStaticParams() {
  return articlesData.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = articlesData.find((a) => a.slug === slug);
  if (!article) return {};

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/articles/${slug}` },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      images: [{ url: article.image }],
      publishedTime: article.date,
      authors: [article.author],
    },
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const article = articlesData.find((a) => a.slug === slug);

  if (!article) {
    notFound();
  }

  // Try to read the markdown file
  let htmlContent = '';
  try {
    const mdPath = path.join(process.cwd(), 'content', 'articles', `${slug}.md`);
    const mdContent = fs.readFileSync(mdPath, 'utf-8');
    htmlContent = marked(mdContent);
  } catch {
    htmlContent = '<p>Article content is being loaded...</p>';
  }

  return (
    <main>
      <div className="gradient-banner"></div>

      <div className="article-page-container">
        <div className="article-layout">
          <div className="article-main">
            <nav className="article-breadcrumb">
              <Link href="/">Home</Link>
              <span>/</span>
              <Link href="/articles">Articles</Link>
              <span>/</span>
              <span>{article.title}</span>
            </nav>

            <article className="article-content-wrapper">
              <header className="article-header">
                <span className="article-category-badge">{article.category}</span>
                <h1>{article.title}</h1>
                <div className="article-meta">
                  <span>By {article.author}</span>
                  <span>|</span>
                  <span>{new Date(article.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                  <span>|</span>
                  <span>{article.readTime} min read</span>
                </div>
              </header>

              {article.image && (
                <div className="article-hero-image">
                  <img src={article.image} alt={article.title} />
                </div>
              )}

              <div
                className="article-body"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            </article>
          </div>

          <aside className="article-sidebar">
            <div className="sidebar-cta">
              <h3>Ready to Start Learning?</h3>
              <p>Join students who are mastering French for TEF/TCF with Enprico.</p>
              <Link href="/register" className="sidebar-cta-btn">Get Started</Link>
            </div>

            <div className="sidebar-related">
              <h3>More Articles</h3>
              <ul>
                {articlesData
                  .filter((a) => a.slug !== slug)
                  .slice(0, 3)
                  .map((a) => (
                    <li key={a.slug}>
                      <Link href={`/articles/${a.slug}`}>{a.title}</Link>
                    </li>
                  ))}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
