'use client';

import { useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { animate, inView } from 'motion';

gsap.registerPlugin(ScrollTrigger);

export default function Animations() {
  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // With reduced motion we create NO entrance tweens, so nothing is ever
    // hidden — every element stays at its natural (visible) state. This is the
    // safest possible fallback and can never leave content stuck invisible.
    if (prefersReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      gsap.defaults({ ease: 'power2.out', duration: 0.8 });

      const isMobile = window.matchMedia('(max-width: 1024px)').matches;
      const blur = (px) => `blur(${isMobile ? Math.round(px * 0.5) : px}px)`;

      // One-shot reveal: fires once when the element enters the viewport and
      // ALWAYS plays to completion (no scrub). Because it never depends on the
      // exact scroll position, buttons/text can never get stuck half-revealed.
      // `once` cleans the trigger up after it plays.
      const reveal = (trigger, start = 'top 85%') => ({
        trigger,
        start,
        toggleActions: 'play none none none',
        once: true,
      });

      // ─── Hero entrance (scoped to .hero so it never touches CTAs in other
      //     sections — that selector collision was causing button flicker) ───
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      heroTl
        .from('.hero .hero-label', { y: 20, opacity: 0, duration: 0.8 })
        .from('.hero .hero-title', { x: -60, opacity: 0, duration: 1 }, '-=0.4')
        .from('.hero .cta-button', { y: 20, opacity: 0, scale: 0.95, duration: 0.8 }, '-=0.5')
        .from('.hero .badge', { y: 15, opacity: 0, stagger: 0.1, duration: 0.5 }, '-=0.4');

      // Hero background parallax (background only — safe to scrub)
      if (document.querySelector('.hero-video')) {
        gsap.to('.hero-video', {
          y: 80,
          ease: 'none',
          scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
        });
      }

      // ─── Intro ───
      gsap.from('.intro-section .section-title', {
        y: 50, opacity: 0, filter: blur(10),
        scrollTrigger: reveal('.intro-section', 'top 90%'),
      });
      gsap.from('.intro-section .intro-text', {
        y: 35, opacity: 0, filter: blur(8),
        scrollTrigger: reveal('.intro-section', 'top 80%'),
      });

      // ─── Features ───
      gsap.from('.feature-card.card-cyan', {
        x: isMobile ? -40 : -80, opacity: 0, filter: blur(12),
        scrollTrigger: reveal('.features-grid'),
      });
      gsap.from('.feature-card.card-pink', {
        x: isMobile ? 40 : 80, opacity: 0, filter: blur(12),
        scrollTrigger: reveal('.features-grid', 'top 80%'),
      });
      gsap.from('.why-card', {
        y: 50, opacity: 0, filter: blur(8),
        scrollTrigger: reveal('.why-card', 'top 90%'),
      });

      // ─── Guarantee ───
      const guaranteeTl = gsap.timeline({ scrollTrigger: reveal('.guarantee-section') });
      guaranteeTl
        .from('.guarantee-section h2', { y: 60, opacity: 0, filter: blur(15), scale: 0.92, duration: 1 })
        .from('.guarantee-section p', { y: 30, opacity: 0, filter: blur(10), duration: 0.8 }, '-=0.4');

      // ─── Teachers ───
      gsap.from('.teachers-section .section-title', {
        y: 35, opacity: 0, filter: blur(8),
        scrollTrigger: reveal('.teachers-section'),
      });
      gsap.from('.teachers-section .section-subtitle', {
        y: 25, opacity: 0, filter: blur(6),
        scrollTrigger: reveal('.teachers-section', 'top 80%'),
      });
      gsap.from('.teacher-country', {
        y: 30, opacity: 0, filter: blur(6), stagger: 0.05, duration: 0.5,
        scrollTrigger: reveal('.teachers-grid'),
      });

      // ─── Pricing ───
      gsap.from('.pricing-section .section-title', {
        y: 35, opacity: 0, filter: blur(8),
        scrollTrigger: reveal('.pricing-section'),
      });
      gsap.from('.pricing-section .section-subtitle', {
        y: 25, opacity: 0, filter: blur(6),
        scrollTrigger: reveal('.pricing-section', 'top 80%'),
      });
      gsap.from('.pricing-card', {
        y: 60, opacity: 0, filter: blur(10), scale: 0.95, stagger: 0.15,
        scrollTrigger: reveal('.pricing-grid'),
      });

      // ─── Trust badges ───
      gsap.from('.trust-badges', {
        y: 20, opacity: 0, filter: blur(6),
        scrollTrigger: reveal('.trust-badges', 'top 92%'),
      });
      gsap.from('.trust-badge-item', {
        y: 15, opacity: 0, scale: 0.9, stagger: 0.08, duration: 0.5,
        scrollTrigger: reveal('.trust-badges', 'top 88%'),
      });

      // ─── Free trial + Referral (whole block plays on enter → CTA always shows) ───
      ['.free-trial-section', '.referral-section'].forEach((section) => {
        const tl = gsap.timeline({ scrollTrigger: reveal(section) });
        tl.from(section + ' h2', { y: 40, opacity: 0, filter: blur(10), duration: 0.9 })
          .from(section + ' p', { y: 25, opacity: 0, filter: blur(6), stagger: 0.15, duration: 0.7 }, '-=0.5')
          .from(section + ' .cta-button', { y: 20, opacity: 0, scale: 0.9, duration: 0.6 }, '-=0.3');
      });

      // ─── Testimonials ───
      gsap.from('.google-reviews-header', {
        y: 35, opacity: 0, filter: blur(8),
        scrollTrigger: reveal('.testimonials-section'),
      });
      gsap.from('.testimonials-carousel', {
        y: 40, opacity: 0, filter: blur(6),
        scrollTrigger: reveal('.testimonials-carousel', 'top 90%'),
      });

      // ─── Articles ───
      gsap.from('.articles-section .section-title', {
        y: 35, opacity: 0, filter: blur(8),
        scrollTrigger: reveal('.articles-section'),
      });
      gsap.from('.articles-section .section-subtitle', {
        y: 25, opacity: 0, filter: blur(6),
        scrollTrigger: reveal('.articles-section', 'top 80%'),
      });

      // ─── About ───
      gsap.from('.about-content .about-text', {
        y: 45, opacity: 0, filter: blur(8),
        scrollTrigger: reveal('.about-section'),
      });
      gsap.from('.stat-item', {
        y: 30, opacity: 0, filter: blur(6), scale: 0.9, stagger: 0.1, duration: 0.5,
        scrollTrigger: reveal('.about-stats', 'top 90%'),
      });
      gsap.from('.about-image', {
        x: isMobile ? 40 : 80, opacity: 0, filter: blur(12),
        scrollTrigger: reveal('.about-image', 'top 90%'),
      });

      // ─── Contact ───
      gsap.from('.contact-section .section-title', {
        y: 35, opacity: 0, filter: blur(8),
        scrollTrigger: reveal('.contact-section'),
      });
      gsap.from('.contact-section .section-subtitle', {
        y: 25, opacity: 0, filter: blur(6),
        scrollTrigger: reveal('.contact-section', 'top 80%'),
      });
      gsap.from('.contact-form-container', {
        x: isMobile ? -30 : -50, opacity: 0, filter: blur(8),
        scrollTrigger: reveal('.contact-wrapper', 'top 80%'),
      });
      gsap.from('.contact-info-container', {
        x: isMobile ? 30 : 50, opacity: 0, filter: blur(8),
        scrollTrigger: reveal('.contact-wrapper', 'top 75%'),
      });

      // ─── Footer ───
      gsap.from('.footer-section', {
        y: 20, opacity: 0, stagger: 0.08, duration: 0.5,
        scrollTrigger: reveal('.footer', 'top 92%'),
      });
      gsap.from('.footer-bottom', {
        y: 10, opacity: 0, duration: 0.5,
        scrollTrigger: reveal('.footer-bottom', 'top 95%'),
      });

      // =============================================
      // motion.dev MICRO-INTERACTIONS
      // =============================================
      document.querySelectorAll('.cta-button, .enroll-btn').forEach((btn) => {
        btn.addEventListener('mouseenter', () => animate(btn, { scale: 1.05 }, { duration: 0.2, easing: 'ease-out' }));
        btn.addEventListener('mouseleave', () => animate(btn, { scale: 1 }, { duration: 0.2, easing: 'ease-out' }));
      });
      document.querySelectorAll('.pricing-card').forEach((card) => {
        card.addEventListener('mouseenter', () => animate(card, { y: -8 }, { duration: 0.3, easing: 'ease-out' }));
        card.addEventListener('mouseleave', () => animate(card, { y: 0 }, { duration: 0.3, easing: 'ease-out' }));
      });
      document.querySelectorAll('.feature-card, .why-card').forEach((card) => {
        card.addEventListener('mouseenter', () => animate(card, { y: -4, scale: 1.01 }, { duration: 0.25, easing: 'ease-out' }));
        card.addEventListener('mouseleave', () => animate(card, { y: 0, scale: 1 }, { duration: 0.25, easing: 'ease-out' }));
      });
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

      document.querySelectorAll('.contact-form input, .contact-form textarea').forEach((input) => {
        input.addEventListener('focus', () => animate(input, { boxShadow: '0 0 0 3px rgba(13, 102, 207, 0.2)' }, { duration: 0.2 }));
        input.addEventListener('blur', () => animate(input, { boxShadow: '0 0 0 0px rgba(13, 102, 207, 0)' }, { duration: 0.2 }));
      });
      document.querySelectorAll('.testimonial-card').forEach((card) => {
        card.addEventListener('mouseenter', () => animate(card, { y: -4, scale: 1.02 }, { duration: 0.25, easing: 'ease-out' }));
        card.addEventListener('mouseleave', () => animate(card, { y: 0, scale: 1 }, { duration: 0.25, easing: 'ease-out' }));
      });
    });

    // Trigger positions are computed from a layout that is still settling
    // (the hero videos, testimonial images and web fonts all load async and
    // change the page height). Re-measure once each of those lands so reveals
    // fire at the right scroll positions instead of stale ones.
    const refresh = () => ScrollTrigger.refresh();
    const timeouts = [setTimeout(refresh, 300), setTimeout(refresh, 1200)];
    window.addEventListener('load', refresh);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(refresh).catch(() => {});
    }

    // Cleanup — gsap.context().revert() kills every tween/trigger created above
    return () => {
      timeouts.forEach(clearTimeout);
      window.removeEventListener('load', refresh);
      ctx.revert();
    };
  }, []);

  return null;
}
