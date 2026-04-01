'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { animate, inView } from 'motion';

gsap.registerPlugin(ScrollTrigger);

export default function Animations() {
  useEffect(() => {
    const SCRUB_SMOOTH = 1.5;
    const SCRUB_FAST = 1;
    const SCRUB_SLOW = 2;

    gsap.defaults({ ease: 'power2.out' });

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      gsap.set('.scroll-animate, .scroll-animate-left, .scroll-animate-right', {
        opacity: 1, filter: 'blur(0px)', x: 0, y: 0, scale: 1,
      });
      gsap.set('.hero-label, .hero-title, .cta-button, .badge', {
        opacity: 1, x: 0, y: 0, scale: 1,
      });
      gsap.set('.trust-badges', { opacity: 1 });
      return;
    }

    const isMobile = window.matchMedia('(max-width: 1024px)').matches;
    const blur = (px) => `blur(${isMobile ? Math.round(px * 0.5) : px}px)`;

    function mobileScrollTrigger(trigger, opts) {
      if (isMobile) {
        return { trigger, start: opts.start || 'top 90%', toggleActions: 'play none none none' };
      }
      return { trigger, start: opts.start || 'top 85%', end: opts.end || 'top 20%', scrub: opts.scrub || SCRUB_SMOOTH };
    }

    // Hero entrance
    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    heroTl
      .from('.hero-label', { y: 20, opacity: 0, duration: 0.8 })
      .from('.hero-title', { x: -60, opacity: 0, duration: 1 }, '-=0.4')
      .from('.cta-button', { y: 20, opacity: 0, scale: 0.95, duration: 0.8 }, '-=0.5')
      .from('.badge', { y: 15, opacity: 0, stagger: 0.1, duration: 0.5 }, '-=0.4');

    // Hero parallax
    gsap.to('.hero-video', {
      y: 80, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });

    // Intro section
    gsap.from('.intro-section .section-title', {
      y: 50, opacity: 0, filter: blur(10), duration: isMobile ? 0.8 : undefined,
      scrollTrigger: mobileScrollTrigger('.intro-section', { start: 'top 90%', end: 'top 35%', scrub: SCRUB_SMOOTH }),
    });
    gsap.from('.intro-section .intro-text', {
      y: 35, opacity: 0, filter: blur(8), duration: isMobile ? 0.8 : undefined,
      scrollTrigger: mobileScrollTrigger('.intro-section', { start: 'top 80%', end: 'top 30%', scrub: SCRUB_SMOOTH }),
    });

    // Features
    gsap.from('.feature-card.card-cyan', {
      x: isMobile ? -40 : -80, opacity: 0, filter: blur(12), duration: isMobile ? 0.8 : undefined,
      scrollTrigger: mobileScrollTrigger('.features-grid', { start: 'top 85%', end: 'top 30%', scrub: SCRUB_SMOOTH }),
    });
    gsap.from('.feature-card.card-pink', {
      x: isMobile ? 40 : 80, opacity: 0, filter: blur(12), duration: isMobile ? 0.8 : undefined,
      scrollTrigger: mobileScrollTrigger('.features-grid', { start: 'top 80%', end: 'top 25%', scrub: SCRUB_SMOOTH }),
    });
    gsap.from('.why-card', {
      y: 50, opacity: 0, filter: blur(8), duration: isMobile ? 0.8 : undefined,
      scrollTrigger: mobileScrollTrigger('.why-card', { start: 'top 90%', end: 'top 40%', scrub: SCRUB_SMOOTH }),
    });

    // Guarantee
    const guaranteeTl = gsap.timeline({
      scrollTrigger: mobileScrollTrigger('.guarantee-section', { start: 'top 85%', end: 'top 20%', scrub: SCRUB_SLOW }),
    });
    guaranteeTl
      .from('.guarantee-section h2', { y: 60, opacity: 0, filter: blur(15), scale: 0.92, duration: isMobile ? 0.8 : 1 })
      .from('.guarantee-section p', { y: 30, opacity: 0, filter: blur(10), duration: isMobile ? 0.6 : 0.8 }, '-=0.3');

    // Teachers
    gsap.from('.teachers-section .section-title', {
      y: 35, opacity: 0, filter: blur(8), duration: isMobile ? 0.8 : undefined,
      scrollTrigger: mobileScrollTrigger('.teachers-section', { start: 'top 85%', end: 'top 50%', scrub: SCRUB_SMOOTH }),
    });
    gsap.from('.teachers-section .section-subtitle', {
      y: 25, opacity: 0, filter: blur(6), duration: isMobile ? 0.8 : undefined,
      scrollTrigger: mobileScrollTrigger('.teachers-section', { start: 'top 80%', end: 'top 45%', scrub: SCRUB_SMOOTH }),
    });
    gsap.from('.teacher-country', {
      y: 30, opacity: 0, filter: blur(6), stagger: 0.05, duration: isMobile ? 0.5 : undefined,
      scrollTrigger: mobileScrollTrigger('.teachers-grid', { start: 'top 85%', end: 'top 25%', scrub: SCRUB_SMOOTH }),
    });

    // Pricing
    gsap.from('.pricing-section .section-title', {
      y: 35, opacity: 0, filter: blur(8), duration: isMobile ? 0.8 : undefined,
      scrollTrigger: mobileScrollTrigger('.pricing-section', { start: 'top 85%', end: 'top 50%', scrub: SCRUB_SMOOTH }),
    });
    gsap.from('.pricing-section .section-subtitle', {
      y: 25, opacity: 0, filter: blur(6), duration: isMobile ? 0.8 : undefined,
      scrollTrigger: mobileScrollTrigger('.pricing-section', { start: 'top 80%', end: 'top 45%', scrub: SCRUB_SMOOTH }),
    });
    gsap.from('.pricing-card', {
      y: 60, opacity: 0, filter: blur(10), scale: 0.95, stagger: 0.15, duration: isMobile ? 0.6 : undefined,
      scrollTrigger: mobileScrollTrigger('.pricing-grid', { start: 'top 85%', end: 'top 20%', scrub: SCRUB_SLOW }),
    });

    // Trust badges
    gsap.from('.trust-badges', {
      y: 20, opacity: 0, filter: blur(6), duration: isMobile ? 0.8 : undefined,
      scrollTrigger: mobileScrollTrigger('.trust-badges', { start: 'top 92%', end: 'top 60%', scrub: SCRUB_SMOOTH }),
    });
    gsap.from('.trust-badge-item', {
      y: 15, opacity: 0, scale: 0.9, stagger: 0.08, duration: isMobile ? 0.5 : undefined,
      scrollTrigger: mobileScrollTrigger('.trust-badges', { start: 'top 88%', end: 'top 50%', scrub: SCRUB_SMOOTH }),
    });

    // Free trial + Referral
    ['.free-trial-section', '.referral-section'].forEach((section) => {
      const tl = gsap.timeline({
        scrollTrigger: mobileScrollTrigger(section, { start: 'top 85%', end: 'top 25%', scrub: SCRUB_SMOOTH }),
      });
      tl.from(section + ' h2', { y: 40, opacity: 0, filter: blur(10), duration: isMobile ? 0.6 : 1 })
        .from(section + ' p', { y: 25, opacity: 0, filter: blur(6), stagger: 0.15, duration: isMobile ? 0.5 : 0.8 }, '-=0.5')
        .from(section + ' .cta-button', { y: 20, opacity: 0, scale: 0.9, duration: isMobile ? 0.4 : 0.6 }, '-=0.3');
    });

    // Testimonials
    gsap.from('.google-reviews-header', {
      y: 35, opacity: 0, filter: blur(8), duration: isMobile ? 0.8 : undefined,
      scrollTrigger: mobileScrollTrigger('.testimonials-section', { start: 'top 85%', end: 'top 50%', scrub: SCRUB_SMOOTH }),
    });
    gsap.from('.testimonials-carousel', {
      y: 40, opacity: 0, filter: blur(6), duration: isMobile ? 0.8 : undefined,
      scrollTrigger: mobileScrollTrigger('.testimonials-carousel', { start: 'top 90%', end: 'top 45%', scrub: SCRUB_SMOOTH }),
    });

    // Articles
    gsap.from('.articles-section .section-title', {
      y: 35, opacity: 0, filter: blur(8), duration: isMobile ? 0.8 : undefined,
      scrollTrigger: mobileScrollTrigger('.articles-section', { start: 'top 85%', end: 'top 50%', scrub: SCRUB_SMOOTH }),
    });
    gsap.from('.articles-section .section-subtitle', {
      y: 25, opacity: 0, filter: blur(6), duration: isMobile ? 0.8 : undefined,
      scrollTrigger: mobileScrollTrigger('.articles-section', { start: 'top 80%', end: 'top 45%', scrub: SCRUB_SMOOTH }),
    });

    // About
    gsap.from('.about-content .about-text', {
      y: 45, opacity: 0, filter: blur(8), duration: isMobile ? 0.8 : undefined,
      scrollTrigger: mobileScrollTrigger('.about-section', { start: 'top 85%', end: 'top 35%', scrub: SCRUB_SMOOTH }),
    });
    gsap.from('.stat-item', {
      y: 30, opacity: 0, filter: blur(6), scale: 0.9, stagger: 0.1, duration: isMobile ? 0.5 : undefined,
      scrollTrigger: mobileScrollTrigger('.about-stats', { start: 'top 90%', end: 'top 40%', scrub: SCRUB_SMOOTH }),
    });
    gsap.from('.about-image', {
      x: isMobile ? 40 : 80, opacity: 0, filter: blur(12), duration: isMobile ? 0.8 : undefined,
      scrollTrigger: mobileScrollTrigger('.about-image', { start: 'top 90%', end: 'top 35%', scrub: SCRUB_SMOOTH }),
    });

    // Contact
    gsap.from('.contact-section .section-title', {
      y: 35, opacity: 0, filter: blur(8), duration: isMobile ? 0.8 : undefined,
      scrollTrigger: mobileScrollTrigger('.contact-section', { start: 'top 85%', end: 'top 50%', scrub: SCRUB_SMOOTH }),
    });
    gsap.from('.contact-section .section-subtitle', {
      y: 25, opacity: 0, filter: blur(6), duration: isMobile ? 0.8 : undefined,
      scrollTrigger: mobileScrollTrigger('.contact-section', { start: 'top 80%', end: 'top 45%', scrub: SCRUB_SMOOTH }),
    });
    gsap.from('.contact-form-container', {
      x: isMobile ? -30 : -50, opacity: 0, filter: blur(8), duration: isMobile ? 0.8 : undefined,
      scrollTrigger: mobileScrollTrigger('.contact-wrapper', { start: 'top 80%', end: 'top 30%', scrub: SCRUB_SMOOTH }),
    });
    gsap.from('.contact-info-container', {
      x: isMobile ? 30 : 50, opacity: 0, filter: blur(8), duration: isMobile ? 0.8 : undefined,
      scrollTrigger: mobileScrollTrigger('.contact-wrapper', { start: 'top 75%', end: 'top 25%', scrub: SCRUB_SMOOTH }),
    });

    // Footer
    gsap.from('.footer-section', {
      y: 20, opacity: 0, stagger: 0.08, duration: isMobile ? 0.5 : undefined,
      scrollTrigger: mobileScrollTrigger('.footer', { start: 'top 92%', end: 'top 55%', scrub: SCRUB_FAST }),
    });
    gsap.from('.footer-bottom', {
      y: 10, opacity: 0, duration: isMobile ? 0.5 : undefined,
      scrollTrigger: mobileScrollTrigger('.footer-bottom', { start: 'top 95%', end: 'top 70%', scrub: SCRUB_FAST }),
    });

    // =============================================
    // motion.dev MICRO-INTERACTIONS
    // =============================================

    // CTA button hover pulse
    document.querySelectorAll('.cta-button, .enroll-btn').forEach((btn) => {
      btn.addEventListener('mouseenter', () => animate(btn, { scale: 1.05 }, { duration: 0.2, easing: 'ease-out' }));
      btn.addEventListener('mouseleave', () => animate(btn, { scale: 1 }, { duration: 0.2, easing: 'ease-out' }));
    });

    // Pricing card hover lift
    document.querySelectorAll('.pricing-card').forEach((card) => {
      card.addEventListener('mouseenter', () => animate(card, { y: -8 }, { duration: 0.3, easing: 'ease-out' }));
      card.addEventListener('mouseleave', () => animate(card, { y: 0 }, { duration: 0.3, easing: 'ease-out' }));
    });

    // Feature + why cards hover
    document.querySelectorAll('.feature-card, .why-card').forEach((card) => {
      card.addEventListener('mouseenter', () => animate(card, { y: -4, scale: 1.01 }, { duration: 0.25, easing: 'ease-out' }));
      card.addEventListener('mouseleave', () => animate(card, { y: 0, scale: 1 }, { duration: 0.25, easing: 'ease-out' }));
    });

    // Teacher country cards hover
    document.querySelectorAll('.teacher-country').forEach((card) => {
      card.addEventListener('mouseenter', () => animate(card, { scale: 1.08, y: -4 }, { duration: 0.2, easing: 'ease-out' }));
      card.addEventListener('mouseleave', () => animate(card, { scale: 1, y: 0 }, { duration: 0.2, easing: 'ease-out' }));
    });

    // Stat number count-up animation
    inView('.about-stats', () => {
      document.querySelectorAll('.stat-number').forEach((numEl) => {
        const text = numEl.textContent;
        const num = parseInt(text);
        if (isNaN(num)) return;
        const suffix = text.replace(/[\d]/g, '');
        animate((progress) => {
          numEl.textContent = Math.round(progress * num) + suffix;
        }, { duration: 1.5, easing: 'ease-out' });
      });
    });

    // Contact form input focus glow
    document.querySelectorAll('.contact-form input, .contact-form textarea').forEach((input) => {
      input.addEventListener('focus', () => animate(input, { boxShadow: '0 0 0 3px rgba(13, 102, 207, 0.2)' }, { duration: 0.2 }));
      input.addEventListener('blur', () => animate(input, { boxShadow: '0 0 0 0px rgba(13, 102, 207, 0)' }, { duration: 0.2 }));
    });

    // Testimonial cards hover
    document.querySelectorAll('.testimonial-card').forEach((card) => {
      card.addEventListener('mouseenter', () => animate(card, { y: -4, scale: 1.02 }, { duration: 0.25, easing: 'ease-out' }));
      card.addEventListener('mouseleave', () => animate(card, { y: 0, scale: 1 }, { duration: 0.25, easing: 'ease-out' }));
    });

    // Cleanup
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      gsap.killTweensOf('*');
    };
  }, []);

  return null;
}
