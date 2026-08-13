'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Fire-and-forget visitor analytics.
 * - Records ONE traffic row per browser session (source, referrer, device…).
 * - Tracks how long they stayed (duration) and how much they clicked, sent as
 *   heartbeats + a final beacon on page exit.
 */
export default function TrafficTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Stable per-tab session id.
    let sessionId = sessionStorage.getItem('enprico_sid');
    if (!sessionId) {
      sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem('enprico_sid', sessionId);
    }

    const params = new URLSearchParams(window.location.search);
    const start = Number(sessionStorage.getItem('enprico_start') || Date.now());
    sessionStorage.setItem('enprico_start', String(start));

    let clicks = Number(sessionStorage.getItem('enprico_clicks') || 0);

    // Record the initial pageview only once per session.
    if (!sessionStorage.getItem('enprico_tracked')) {
      sessionStorage.setItem('enprico_tracked', '1');
      const payload = {
        utm_source: params.get('utm_source'),
        utm_medium: params.get('utm_medium'),
        utm_campaign: params.get('utm_campaign'),
        utm_term: params.get('utm_term'),
        utm_content: params.get('utm_content'),
        referrer: document.referrer || null,
        landing_page: window.location.pathname,
        user_agent: navigator.userAgent,
        screen_resolution: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        session_id: sessionId,
      };
      fetch('/api/traffic/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }

    const sendUpdate = (useBeacon) => {
      const body = JSON.stringify({
        type: 'update',
        session_id: sessionId,
        duration_seconds: Math.round((Date.now() - start) / 1000),
        click_count: clicks,
        last_page: window.location.pathname,
      });
      if (useBeacon && navigator.sendBeacon) {
        navigator.sendBeacon('/api/traffic/track', new Blob([body], { type: 'application/json' }));
      } else {
        fetch('/api/traffic/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    };

    const onClick = () => {
      clicks += 1;
      sessionStorage.setItem('enprico_clicks', String(clicks));
    };
    const onHide = () => {
      if (document.visibilityState === 'hidden') sendUpdate(true);
    };

    document.addEventListener('click', onClick, true);
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', () => sendUpdate(true));

    // Periodic heartbeat so long sessions are captured even without an exit.
    const interval = setInterval(() => sendUpdate(false), 20000);

    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('visibilitychange', onHide);
      clearInterval(interval);
      sendUpdate(false);
    };
  }, [pathname]);

  return null;
}
