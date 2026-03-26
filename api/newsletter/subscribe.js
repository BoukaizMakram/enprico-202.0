import { supabaseRest } from '../_lib/supabase.js';
import { withCors } from '../_lib/cors.js';
import { sendEmail, newsletterWelcomeHtml } from '../_lib/email.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const data = req.body || {};
  const email = (data.email || '').trim().toLowerCase();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Valid email address is required' });
  }

  // Save to database
  const { status } = await supabaseRest('POST', '/rest/v1/newsletter_subscribers', {
    email, subscribed_at: new Date().toISOString(), source: 'website_popup'
  }, { 'Prefer': 'return=minimal' });

  if (status === 409) {
    return res.json({ success: true, message: 'You are already subscribed!' });
  }

  // Send welcome email with discount
  try {
    await sendEmail(email, "Welcome to Enprico! Here's Your $20 Discount", newsletterWelcomeHtml(email));
    return res.json({ success: true, message: 'Thank you for subscribing! Check your inbox for your $20 discount code.' });
  } catch (e) {
    console.error('Newsletter email error:', e);
    return res.json({ success: true, message: "Thank you for subscribing! You'll receive updates soon." });
  }
}

export default withCors(handler);
