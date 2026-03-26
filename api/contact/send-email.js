import { withCors } from '../_lib/cors.js';
import { sendEmail } from '../_lib/email.js';

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const data = req.body || {};
  const name = (data.name || '').trim();
  const email = (data.email || '').trim();
  const subject = (data.subject || '').trim();
  const message = (data.message || '').trim();

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address' });
  }

  const toEmail = data.to && emailRegex.test(data.to) ? data.to : 'learn@enprico.ca';
  const isSystemEmail = data.to && emailRegex.test(data.to);

  const year = new Date().getFullYear();
  const escapedMessage = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');

  let emailSubject, emailBody;

  if (isSystemEmail) {
    emailSubject = subject;
    emailBody = `<!DOCTYPE html>
<html><head><style>
body { font-family: Arial, sans-serif; line-height: 1.8; color: #333; }
.container { max-width: 600px; margin: 0 auto; padding: 20px; }
.header { background: linear-gradient(135deg, #0076c7, #0C5FF9); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
.content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
.footer { background: #f8f9fa; color: #666; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px; border: 1px solid #e0e0e0; border-top: none; }
</style></head><body>
<div class='container'>
<div class='header'><h1 style='margin:0; font-size: 28px;'>Welcome to Enprico!</h1></div>
<div class='content'>${escapedMessage}</div>
<div class='footer'>&copy; ${year} Enprico - French for TEF & TCF Exams<br><a href='https://enprico.com' style='color: #0076c7;'>www.enprico.com</a></div>
</div></body></html>`;
  } else {
    emailSubject = `[Enprico Contact] ${subject}`;
    const escapedName = name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escapedEmail = email.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const escapedSubject = subject.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    emailBody = `<!DOCTYPE html>
<html><head><style>
body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
.container { max-width: 600px; margin: 0 auto; padding: 20px; }
.header { background: linear-gradient(135deg, #0076c7, #0C5FF9); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
.content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }
.field { margin-bottom: 15px; }
.label { font-weight: bold; color: #0076c7; }
.footer { background: #333; color: #999; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
</style></head><body>
<div class='container'>
<div class='header'><h2 style='margin:0;'>New Contact Form Submission</h2></div>
<div class='content'>
<div class='field'><span class='label'>Name:</span><br>${escapedName}</div>
<div class='field'><span class='label'>Email:</span><br><a href='mailto:${escapedEmail}'>${escapedEmail}</a></div>
<div class='field'><span class='label'>Subject:</span><br>${escapedSubject}</div>
<div class='field'><span class='label'>Message:</span><br>${escapedMessage}</div>
</div>
<div class='footer'>This email was sent from the Enprico website contact form.<br>&copy; ${year} Enprico</div>
</div></body></html>`;
  }

  const result = await sendEmail(toEmail, emailSubject, emailBody);
  if (result) {
    return res.json({ success: true, message: 'Message sent successfully!' });
  }
  return res.status(500).json({ success: false, message: 'Failed to send message. Please try again later.' });
}

export default withCors(handler);
