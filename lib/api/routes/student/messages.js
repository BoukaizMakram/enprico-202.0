import { supabaseRest } from '@/lib/api/supabase.js';
import { withCors } from '@/lib/api/cors.js';
import { sendEmail } from '@/lib/api/email.js';

const SUPPORT_EMAIL = 'learn@enprico.ca';

function escapeHtml(str = '') {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function handler(req, res) {
  // GET /api/student/messages?user_id=... -> full support thread
  if (req.method === 'GET') {
    const userId = req.query.user_id;
    if (!userId) return res.status(400).json({ success: false, message: 'user_id required' });

    const { status, data } = await supabaseRest(
      'GET',
      `/rest/v1/support_messages?user_id=eq.${userId}&order=created_at.asc&limit=200`
    );
    if (status === 200) return res.json({ success: true, data: Array.isArray(data) ? data : [] });
    return res.json({ success: false, message: 'Failed to fetch messages', data: [] });
  }

  // POST /api/student/messages -> student sends a message
  if (req.method === 'POST') {
    const body = req.body || {};
    const userId = body.user_id;
    const message = (body.message || '').trim();
    if (!userId) return res.status(400).json({ success: false, message: 'user_id required' });
    if (!message) return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    if (message.length > 4000) return res.status(400).json({ success: false, message: 'Message is too long' });

    const { status, data } = await supabaseRest(
      'POST',
      '/rest/v1/support_messages',
      { user_id: userId, sender: 'student', message },
      { Prefer: 'return=representation' }
    );

    if (status < 200 || status >= 300) {
      return res.status(500).json({ success: false, message: 'Failed to send message' });
    }

    const saved = Array.isArray(data) ? data[0] : data;

    // Let the Enprico team know a student is reaching out. Best-effort — never
    // block the chat on the email transport.
    try {
      const name = escapeHtml(body.full_name || '');
      const email = escapeHtml(body.email || '');
      await sendEmail(
        SUPPORT_EMAIL,
        `[Dashboard Support] Message from ${body.full_name || 'a student'}`,
        `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#333">
          <h2 style="color:#0076c7">New dashboard support message</h2>
          <p><strong>Student:</strong> ${name || 'Unknown'}${email ? ` (${email})` : ''}</p>
          <p><strong>User ID:</strong> ${escapeHtml(userId)}</p>
          <p style="background:#f8fafc;border-radius:8px;padding:16px;white-space:pre-wrap">${escapeHtml(message)}</p>
          <p style="color:#888;font-size:13px">Reply from the admin panel or by inserting a support_messages row with sender = 'support'.</p>
        </div>`
      );
    } catch (e) {
      console.error('Support notification email failed:', e);
    }

    return res.json({ success: true, data: saved });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default withCors(handler);
