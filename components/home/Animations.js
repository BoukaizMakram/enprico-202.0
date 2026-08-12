'use client';

import { useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { animate, inView } from 'motion';

gsap.registerPlugin(ScrollTrigger);

export default function Animations() {
  useLayoutEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // ─────────────────────────────────────────────────────────────
    // SCROLL REVEALS — IntersectionObserver + CSS transitions.
    //
    // The elements start hidden via the `.scroll-animate*` CSS classes and get
    // `.is-visible` added when they actually enter the viewport. Unlike a
    // scroll-scrubbed GSAP tween, this reads real on-screen visibility (no
    // cached scroll positions that go stale when the hero video / fonts / images
    // finish loading), so a section can never get stuck at opacity:0.
    // ─────────────────────────────────────────────────────────────
    const REVEAL_SELECTOR = '.scroll-animate, .scroll-animate-left, .scroll-animate-right';
    const revealDisabled = prefersReducedMotion || !('IntersectionObserver' in window);
    const show = (el) => el.classList.add('is-visible');
    const seen = new WeakSet();

    let io = null;
    if (!revealDisabled) {
      io = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              show(entry.target);
              observer.unobserve(entry.target);
            }
          });
        },
        { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
      );
    }

    // Observe (or, when disabled, immediately reveal) every reveal element,
    // including any that get added to the DOM later — e.g. the article cards,
    // which are rendered only after their async fetch resolves.
    const process = () => {
      document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        if (revealDisabled) show(el);
        else io.observe(el);
      });
    };
    process();

    let scheduled = false;
    const mo = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => { scheduled = false; process(); });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Hard safety net: if the observer ever fails to fire for something already
    // on screen (edge cases during async layout shifts), force it visible so no
    // content is ever left blank. Elements below the fold keep their scroll reveal.
    const safetyTimer = setTimeout(() => {
      document.querySelectorAll(REVEAL_SELECTOR).forEach((el) => {
        if (el.classList.contains('is-visible')) return;
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.98) show(el);
      });
    }, 2500);

    // ─────────────────────────────────────────────────────────────
    // GSAP — hero entrance, background parallax and hover micro-interactions.
    // These are above-the-fold / interaction-driven, so they are not subject to
    // the stale-position problem. Skipped entirely under reduced motion.
    // ─────────────────────────────────────────────────────────────
    let ctx = null;
    if (!prefersReducedMotion) {
      ctx = gsap.context(() => {
        gsap.defaults({ ease: 'power2.out', duration: 0.8 });

        // Hero entrance (scoped to .hero so it never touches CTAs elsewhere)
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
        // Testimonial cards hover
        document.querySelectorAll('.testimonial-card').forEach((card) => {
          card.addEventListener('mouseenter', () => animate(card, { y: -4, scale: 1.02 }, { duration: 0.25, easing: 'ease-out' }));
          card.addEventListener('mouseleave', () => animate(card, { y: 0, scale: 1 }, { duration: 0.25, easing: 'ease-out' }));
        });
        // Contact form input focus glow
        document.querySelectorAll('.contact-form input, .contact-form textarea').forEach((input) => {
          input.addEventListener('focus', () => animate(input, { boxShadow: '0 0 0 3px rgba(13, 102, 207, 0.2)' }, { duration: 0.2 }));
          input.addEventListener('blur', () => animate(input, { boxShadow: '0 0 0 0px rgba(13, 102, 207, 0)' }, { duration: 0.2 }));
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
      });
    }

    return () => {
      clearTimeout(safetyTimer);
      mo.disconnect();
      if (io) io.disconnect();
      if (ctx) ctx.revert();
    };
  }, []);

  return null;
}
