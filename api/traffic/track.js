import { supabaseRest } from '../_lib/supabase.js';
import { withCors } from '../_lib/cors.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const data = req.body;
  if (!data) return res.status(400).json({ success: false, message: 'Invalid request' });

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
