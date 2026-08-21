'use client';

// Reddit Pixel + Conversions API helper.
//
// trackReddit() fires the browser Pixel AND mirrors the same event to our
// server-side Conversions API route (/api/reddit/capi). Both carry the same
// conversionId so Reddit deduplicates them — that's the whole point of running
// Pixel + CAPI together: minimise signal loss without double-counting.

function makeConversionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Reddit delivers the click id as the `rdt_cid` query param on the landing URL.
// Persist it so conversions that happen on a later page still carry attribution.
function getClickId() {
  if (typeof window === 'undefined') return null;
  try {
    const fromUrl = new URL(window.location.href).searchParams.get('rdt_cid');
    if (fromUrl) {
      try { localStorage.setItem('rdt_cid', fromUrl); } catch {}
      return fromUrl;
    }
    return localStorage.getItem('rdt_cid');
  } catch {
    return null;
  }
}

/**
 * Fire a Reddit conversion event on both the Pixel and the Conversions API.
 *
 * @param {string} eventName  One of Reddit's tracking types (PageVisit,
 *                            ViewContent, Search, AddToCart, AddToWishlist,
 *                            Purchase, Lead, SignUp) or a custom name.
 * @param {object} metadata   { conversionId?, value?, currency?, itemCount?, products? }
 * @param {object} user       { email?, externalId?, phone? } — PII is hashed
 *                            server-side (CAPI) and by Reddit (Pixel).
 * @returns {string} the conversionId used (shared by Pixel + CAPI).
 */
export function trackReddit(eventName, metadata = {}, user = {}) {
  const conversionId = metadata.conversionId || makeConversionId();

  // 1) Browser Pixel
  if (typeof window !== 'undefined' && typeof window.rdt === 'function') {
    const payload = { conversion_id: conversionId };
    if (metadata.value != null) payload.value = metadata.value;
    if (metadata.currency) payload.currency = metadata.currency;
    if (metadata.itemCount != null) payload.itemCount = metadata.itemCount;
    if (metadata.products) payload.products = metadata.products;
    if (user.email) payload.email = user.email;
    if (user.externalId != null) payload.externalId = String(user.externalId);
    if (user.phone) payload.phoneNumber = user.phone;
    window.rdt('track', eventName, payload);
  }

  // 2) Conversions API (server-to-server), same conversionId for dedup.
  if (typeof fetch === 'function') {
    const body = {
      eventType: eventName,
      conversionId,
      clickId: getClickId(),
      email: user.email || null,
      externalId: user.externalId != null ? String(user.externalId) : null,
      phone: user.phone || null,
      screenWidth: typeof window !== 'undefined' ? window.screen?.width : undefined,
      screenHeight: typeof window !== 'undefined' ? window.screen?.height : undefined,
      value: metadata.value,
      currency: metadata.currency,
      itemCount: metadata.itemCount,
      products: metadata.products,
    };
    fetch('/api/reddit/capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  }

  return conversionId;
}
