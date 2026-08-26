import crypto from 'crypto';

// Reddit Conversions API (CAPI) — server-to-server events.
// Receives an event from the browser helper (lib/reddit/pixel.js), hashes PII,
// enriches it with IP / user-agent / rdt uuid the browser can't send reliably,
// and forwards it to Reddit with the same conversionId the Pixel used so the
// two are deduplicated.
//
// Configuration (.env.local):
//   NEXT_PUBLIC_REDDIT_PIXEL_ID       Pixel / advertiser id (e.g. a2_xxxxxxxx)
//   REDDIT_CONVERSION_ACCESS_TOKEN    Bearer token from Reddit Events Manager
//   REDDIT_AD_ACCOUNT_ID   (optional) Overrides the id used in the CAPI URL path
//   REDDIT_CAPI_ENDPOINT   (optional) Full override of the endpoint URL
//   REDDIT_CAPI_TEST_MODE  (optional) 'true' routes events to Reddit test mode

export const runtime = 'nodejs';

function sha256(value) {
  if (value == null || value === '') return undefined;
  return crypto.createHash('sha256').update(String(value).trim().toLowerCase()).digest('hex');
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const pair of header.split(';')) {
    const idx = pair.indexOf('=');
    if (idx === -1) continue;
    out[pair.slice(0, idx).trim()] = decodeURIComponent(pair.slice(idx + 1).trim());
  }
  return out;
}

export async function POST(request) {
  const pixelId = process.env.NEXT_PUBLIC_REDDIT_PIXEL_ID || process.env.REDDIT_PIXEL_ID;
  const token = process.env.REDDIT_CONVERSION_ACCESS_TOKEN;

  // Not fully configured yet → accept silently so the client never errors and
  // the Pixel keeps working on its own.
  if (!pixelId || !token) {
    return Response.json({ ok: true, skipped: 'capi_not_configured' });
  }

  let payload;
  try { payload = await request.json(); } catch { payload = {}; }

  const cookies = parseCookies(request.headers.get('cookie'));
  const ip = (request.headers.get('x-forwarded-for') || '').split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || undefined;
  const userAgent = request.headers.get('user-agent') || undefined;
  // The _rdt_uuid cookie is "<timestamp>.<rfc4122-uuid>"; CAPI wants only the
  // UUID part and rejects the whole event if it isn't RFC-4122 compliant.
  const uuidMatch = (cookies['_rdt_uuid'] || '').match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );
  const rdtUuid = uuidMatch ? uuidMatch[0] : undefined;

  // User identifiers — email / phone / external id are SHA-256 hashed.
  const user = {};
  const email = sha256(payload.email);
  if (email) user.email = email;
  const phone = sha256(payload.phone);
  if (phone) user.phone_number = phone;
  const externalId = sha256(payload.externalId);
  if (externalId) user.external_id = externalId;
  if (ip) user.ip_address = ip;
  if (userAgent) user.user_agent = userAgent;
  if (rdtUuid) user.uuid = rdtUuid;
  if (payload.screenWidth && payload.screenHeight) {
    user.screen_dimensions = {
      width: Number(payload.screenWidth),
      height: Number(payload.screenHeight),
    };
  }

  // Event metadata.
  const metadata = {};
  if (payload.conversionId) metadata.conversion_id = payload.conversionId;
  if (payload.currency) metadata.currency = payload.currency;
  if (payload.value != null && payload.value !== '') metadata.value_decimal = Number(payload.value);
  if (payload.itemCount != null) metadata.item_count = Number(payload.itemCount);
  if (Array.isArray(payload.products) && payload.products.length) {
    metadata.products = payload.products.map((p) => ({
      id: p.id != null ? String(p.id) : undefined,
      category: p.category,
      name: p.name,
    }));
  }

  const event = {
    event_at: new Date().toISOString(),
    event_type: { tracking_type: payload.eventType || 'PageVisit' },
    user,
    event_metadata: metadata,
  };
  if (payload.clickId) event.click_id = payload.clickId;

  const body = {
    test_mode: process.env.REDDIT_CAPI_TEST_MODE === 'true',
    events: [event],
  };

  const endpoint = process.env.REDDIT_CAPI_ENDPOINT
    || `https://ads-api.reddit.com/api/v2.0/conversions/events/${encodeURIComponent(process.env.REDDIT_AD_ACCOUNT_ID || pixelId)}`;

  try {
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text().catch(() => '');
      console.error('Reddit CAPI error', resp.status, text);
      // Don't surface failures to the client — the Pixel already covers the event.
      return Response.json({ ok: false, status: resp.status });
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error('Reddit CAPI request failed', err);
    return Response.json({ ok: false });
  }
}
