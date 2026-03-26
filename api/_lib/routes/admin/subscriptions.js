import { supabaseRest } from '../../supabase.js';
import { withCors } from '../../cors.js';

async function handler(req, res) {
  if (req.method === 'GET') {
    // Try with join first
    let result = await supabaseRest('GET', '/rest/v1/subscriptions?select=*,profiles(full_name,email)&order=created_at.desc');
    if (result.status === 200) {
      const data = result.data.map(sub => {
        if (sub.profiles) {
          sub.user_name = sub.profiles.full_name || null;
          sub.user_email = sub.profiles.email || null;
          delete sub.profiles;
        }
        return sub;
      });
      return res.json({ success: true, data });
    }
    // Fallback without join
    result = await supabaseRest('GET', '/rest/v1/subscriptions?order=created_at.desc');
    if (result.status === 200) return res.json({ success: true, data: result.data });
    return res.json({ success: false, message: 'Failed to fetch subscriptions', data: [] });
  }

  return res.status(405).json({ success: false, message: 'Method not allowed' });
}

export default withCors(handler);
