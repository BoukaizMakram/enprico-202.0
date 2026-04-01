'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isHomepage = pathname === '/';

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close menu when clicking outside
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClick = (e) => {
      const menu = document.querySelector('.mobile-menu');
      const burger = document.querySelector('.burger-menu');
      if (menu && burger && !menu.contains(e.target) && !burger.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [mobileMenuOpen]);

  const navLinks = isHomepage
    ? [
        { href: '#home', label: 'Home' },
        { href: '#articles', label: 'Articles' },
        { href: '#pricing', label: 'Pricing' },
        { href: '#contact', label: 'Contact Us' },
        { href: '#about', label: 'About' },
      ]
    : [
        { href: '/', label: 'Home' },
        { href: '/#articles', label: 'Articles' },
        { href: '/#pricing', label: 'Pricing' },
        { href: '/#contact', label: 'Contact Us' },
        { href: '/about-us-learn-french-online', label: 'About' },
      ];

  const handleSmoothScroll = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      setMobileMenuOpen(false);
    }
  };

  return (
    <header className="header">
      <div className="container">
        <Link href="/" className="logo">
          <img src="/images/logo_white 1.png" alt="Enprico Logo" className="logo-img" width={96} height={32} />
        </Link>

        <nav className="nav-center">
          <ul className="nav-links">
            {navLinks.map((link) => (
              <li key={link.href}>
                {link.href.startsWith('#') ? (
                  <a
                    href={link.href}
                    onClick={(e) => handleSmoothScroll(e, link.href)}
                    className={link.href === '#home' ? 'active' : ''}
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    href={link.href}
                    className={pathname === link.href ? 'active' : ''}
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <div className="nav-right">
          <Link href="/login" className="login-btn">Log In</Link>
          <button
            className="burger-menu"
            aria-label="Toggle menu"
            onClick={(e) => {
              e.stopPropagation();
              setMobileMenuOpen(!mobileMenuOpen);
            }}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile Menu */}
        <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
          <div className="mobile-menu-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M16 7C16 9.20914 14.2091 11 12 11C9.79086 11 8 9.20914 8 7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7Z" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 14C8.13401 14 5 17.134 5 21H19C19 17.134 15.866 14 12 14Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <Link href="/login" className="mobile-login">Log In</Link>
            <button className="mobile-close" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
          <nav className="mobile-nav">
            {navLinks.map((link) => (
              link.href.startsWith('#') ? (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => handleSmoothScroll(e, link.href)}
                >
                  {link.label}
                </a>
              ) : (
                <Link key={link.href} href={link.href}>{link.label}</Link>
              )
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
