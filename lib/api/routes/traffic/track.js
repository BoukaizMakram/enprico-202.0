import { supabaseRest } from '@/lib/api/supabase.js';
import { withCors } from '@/lib/api/cors.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const data = req.body;
  if (!data) return res.status(400).json({ success: false, message: 'Invalid request' });

  // ── Session heartbeat: update how long they stayed + how much they clicked ──
  // Sent periodically and on page-exit (via navigator.sendBeacon). Patches the
  // most recent visit row for this session rather than inserting a new one.
  if (data.type === 'update' && data.session_id) {
    const patch = { ended_at: new Date().toISOString() };
    if (data.duration_seconds !== undefined) patch.duration_seconds = Math.max(0, parseInt(data.duration_seconds, 10) || 0);
    if (data.click_count !== undefined) patch.click_count = Math.max(0, parseInt(data.click_count, 10) || 0);
    if (data.enroll_clicks !== undefined) patch.enroll_clicks = Math.max(0, parseInt(data.enroll_clicks, 10) || 0);
    if (data.scroll_depth !== undefined) patch.scroll_depth = Math.min(100, Math.max(0, parseInt(data.scroll_depth, 10) || 0));
    if (data.last_page !== undefined) patch.last_page = data.last_page;

    const { status } = await supabaseRest(
      'PATCH',
      `/rest/v1/traffic?session_id=eq.${encodeURIComponent(data.session_id)}`,
      patch,
      { Prefer: 'return=minimal' }
    );
    if (status === 200 || status === 204) return res.json({ success: true });
    return res.json({ success: false, message: 'Failed to update session' });
  }

  const userAgent = data.user_agent || '';

  // Detect device type
  let deviceType = 'desktop';
  if (/Mobile|Android|iPhone|iPad|iPod/i.test(userAgent)) {
    deviceType = /iPad|Tablet/i.test(userAgent) ? 'tablet' : 'mobile';
  }

  // Detect browser
  let browser = 'Unknown';
  if (/Chrome\/[\d.]+/i.test(userAgent) && !/Edg/i.test(userAgent)) browser = 'Chrome';
  else if (/Firefox\/[\d.]+/i.test(userAgent)) browser = 'Firefox';
  else if (/Safari\/[\d.]+/i.test(userAgent) && !/Chrome/i.test(userAgent)) browser = 'Safari';
  else if (/Edg\/[\d.]+/i.test(userAgent)) browser = 'Edge';
  else if (/MSIE|Trident/i.test(userAgent)) browser = 'Internet Explorer';

  // Detect OS
  let os = 'Unknown';
  if (/Windows NT/i.test(userAgent)) os = 'Windows';
  else if (/Macintosh|Mac OS X/i.test(userAgent)) os = 'macOS';
  else if (/Linux/i.test(userAgent) && !/Android/i.test(userAgent)) os = 'Linux';
  else if (/Android/i.test(userAgent)) os = 'Android';
  else if (/iPhone|iPad|iPod/i.test(userAgent)) os = 'iOS';

  const trafficData = {};
  const fields = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
    'referrer', 'landing_page', 'user_agent', 'screen_resolution', 'language', 'timezone', 'session_id'];
  for (const f of fields) {
    if (data[f] !== undefined && data[f] !== null) trafficData[f] = data[f];
  }
  trafficData.device_type = deviceType;
  trafficData.browser = browser;
  trafficData.os = os;
  trafficData.visited_at = new Date().toISOString();

  const { status } = await supabaseRest('POST', '/rest/v1/traffic', trafficData, { 'Prefer': 'return=minimal' });

  if (status === 201 || status === 200) return res.json({ success: true });
  return res.json({ success: false, message: 'Failed to save' });
}

export default withCors(handler);
