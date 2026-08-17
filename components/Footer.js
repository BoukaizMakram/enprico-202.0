import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-grid">
          <div className="footer-section">
            <img
              src="/images/enprico logo footer.png"
              alt="Enprico Logo"
              className="footer-logo-img"
              width={150}
              height={50}
              loading="lazy"
            />
          </div>

          <div className="footer-section">
            <h3 className="footer-title">CONTACT US</h3>
            <div className="contact-info">
              <p>&#127464;&#127462; Church Street<br />Toronto, ON M5B 1G8, Canada</p>
            </div>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">ABOUT US</h3>
            <ul className="footer-links">
              <li><Link href="/our-courses">Our Courses</Link></li>
              <li><Link href="/learn-french-online-why-learning-french">Why Learn French</Link></li>
              <li><Link href="/about-us-learn-french-online">About Us</Link></li>
              <li><Link href="/learn-french-online-tef-tcf">TEF &amp; TCF Prep</Link></li>
              <li><Link href="/articles">Articles</Link></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">SUPPORT</h3>
            <Link href="/contact" className="support-link">Need any help?</Link>
          </div>

          <div className="footer-section">
            <h3 className="footer-title">RESOURCES</h3>
            <ul className="footer-links">
              <li>
                <a href="https://vidmo.app" target="_blank" rel="noopener">
                  Motion Design
                </a>
              </li>
              <li>
                <a href="https://imageprompting.org" target="_blank" rel="noopener">
                  Image to Prompt
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-divider"></div>

        <div className="footer-bottom">
          <p>Copyright &copy; {currentYear} Enprico. All rights reserved.</p>
          <div className="footer-legal">
            <Link href="/privacy-policy">Privacy Policy</Link>
            <span>|</span>
            <Link href="/cookies-policy">Cookies Policy</Link>
            <span>|</span>
            <Link href="/refund-policy">Refund Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
