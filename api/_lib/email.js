import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: process.env.SMTP_USER || 'learn@enprico.com',
        pass: process.env.SMTP_PASS,
      },
      tls: { rejectUnauthorized: false },
    });
  }
  return transporter;
}

export async function sendEmail(to, subject, html) {
  try {
    await getTransporter().sendMail({
      from: `Enprico <${process.env.SMTP_USER || 'learn@enprico.com'}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('Email send error:', err.message);
    return false;
  }
}

export function welcomeEmailHtml(firstName, email, password, planName) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.8; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0076c7, #0C5FF9); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .credentials { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .credentials p { margin: 8px 0; }
        .credentials strong { color: #0076c7; }
        .footer { background: #f8f9fa; color: #666; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px; border: 1px solid #e0e0e0; border-top: none; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1 style='margin:0; font-size: 28px;'>Welcome to Enprico!</h1>
        </div>
        <div class='content'>
            <p>Hello ${firstName},</p>
            <p>Thank you for your payment and for choosing Enprico's <strong>${planName}</strong>. We truly appreciate your trust.</p>
            <p>Our team will review your request and will be in touch within 5 business days with the next steps.</p>
            <div class='credentials'>
                <p style='margin-bottom: 15px; font-weight: bold; color: #333;'>Your Account Details:</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Temporary Password:</strong> ${password}</p>
                <p><strong>Login:</strong> <a href='https://enprico.com/login.html' style='color: #0076c7;'>https://enprico.com/login.html</a></p>
            </div>
            <p><strong style='color: #dc2626;'>Important:</strong> For security reasons, we strongly recommend changing your password after your first login.</p>
            <p>If you need any further information or assistance, feel free to contact us at <a href='mailto:learn@enprico.com' style='color: #0076c7;'>learn@enprico.com</a>.</p>
            <p>Best regards,<br><strong>The Enprico Team</strong></p>
        </div>
        <div class='footer'>
            &copy; ${year} Enprico - Learn French with Expert Tutors<br>
            <a href='https://enprico.com' style='color: #0076c7;'>www.enprico.com</a>
        </div>
    </div>
</body>
</html>`;
}

export function adminNotificationHtml(customerEmail, planName, amount, hours, transactionId, userType, date) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.8; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0076c7, #0C5FF9); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .info { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info p { margin: 8px 0; }
        .info strong { color: #0076c7; }
        .footer { background: #f8f9fa; color: #666; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px; border: 1px solid #e0e0e0; border-top: none; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1 style='margin:0; font-size: 24px;'>New Payment Received!</h1>
        </div>
        <div class='content'>
            <p>A student has just completed a payment.</p>
            <div class='info'>
                <p><strong>User Type:</strong> ${userType}</p>
                <p><strong>Student Email:</strong> ${customerEmail}</p>
                <p><strong>Plan:</strong> ${planName}</p>
                <p><strong>Amount:</strong> $${amount}</p>
                <p><strong>Hours:</strong> ${hours} hours/month</p>
                <p><strong>Transaction ID:</strong> ${transactionId}</p>
                <p><strong>Date:</strong> ${date}</p>
            </div>
        </div>
        <div class='footer'>
            &copy; ${year} Enprico - Admin Notification
        </div>
    </div>
</body>
</html>`;
}

export function hoursAddedEmailHtml(planName, hours) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.8; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0076c7, #0C5FF9); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; }
        .info { background: #f8f9fa; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .info p { margin: 8px 0; }
        .info strong { color: #0076c7; }
        .footer { background: #f8f9fa; color: #666; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px; border: 1px solid #e0e0e0; border-top: none; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1 style='margin:0; font-size: 28px;'>Payment Confirmed!</h1>
        </div>
        <div class='content'>
            <p>Hello,</p>
            <p>Thank you for your payment! Your hours have been added to your account.</p>
            <div class='info'>
                <p><strong>Plan:</strong> ${planName}</p>
                <p><strong>Hours Added:</strong> ${hours} hours/month</p>
                <p><strong>Login:</strong> <a href='https://enprico.com/login.html' style='color: #0076c7;'>https://enprico.com/login.html</a></p>
            </div>
            <p>Our team will be in touch within 5 business days to schedule your sessions.</p>
            <p>If you have any questions, feel free to contact us at <a href='mailto:learn@enprico.com' style='color: #0076c7;'>learn@enprico.com</a>.</p>
            <p>Best regards,<br><strong>The Enprico Team</strong></p>
        </div>
        <div class='footer'>
            &copy; ${year} Enprico - Learn French with Expert Tutors<br>
            <a href='https://enprico.com' style='color: #0076c7;'>www.enprico.com</a>
        </div>
    </div>
</body>
</html>`;
}

export function newsletterWelcomeHtml(email) {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.8; color: #333; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #0076c7, #0C5FF9); color: white; padding: 40px 30px; border-radius: 8px 8px 0 0; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; }
        .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
        .discount-box { background: linear-gradient(135deg, #fdbb33, #f0a500); color: #333; padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0; }
        .discount-box h2 { margin: 0 0 10px 0; font-size: 32px; color: #083d7a; }
        .discount-box p { margin: 0; font-size: 16px; }
        .discount-code { background: #083d7a; color: white; padding: 15px 30px; border-radius: 8px; display: inline-block; font-size: 24px; font-weight: bold; letter-spacing: 2px; margin-top: 15px; }
        .button { display: inline-block; background: #0076c7; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; margin: 20px 0; }
        .benefits { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .benefits h3 { color: #0076c7; margin-top: 0; }
        .benefits ul { margin: 0; padding-left: 20px; }
        .benefits li { margin: 8px 0; }
        .footer { background: #f8f9fa; color: #666; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; font-size: 13px; border: 1px solid #e0e0e0; border-top: none; }
        .footer a { color: #0076c7; }
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>Welcome to Enprico!</h1>
            <p style='margin: 10px 0 0 0; opacity: 0.9;'>Your French Learning Journey Starts Here</p>
        </div>
        <div class='content'>
            <p>Hi there!</p>
            <p>Thank you for subscribing to Enprico! We're thrilled to have you join our community of French learners preparing for TEF and TCF exams.</p>
            <div class='discount-box'>
                <h2>$20 OFF</h2>
                <p>Your exclusive discount on the Professional Plan</p>
                <div class='discount-code'>WELCOME20</div>
            </div>
            <p style='text-align: center;'>Use code <strong>WELCOME20</strong> at checkout to save $20 on your Professional Plan subscription!</p>
            <div style='text-align: center;'>
                <a href='https://enprico.com/#pricing' class='button'>View Our Plans</a>
            </div>
            <div class='benefits'>
                <h3>What You'll Get:</h3>
                <ul>
                    <li><strong>1-on-1 Live Sessions</strong> with certified French teachers</li>
                    <li><strong>TEF & TCF Exam Prep</strong> focused curriculum</li>
                    <li><strong>Flexible Scheduling</strong> that fits your lifestyle</li>
                    <li><strong>Personalized Learning</strong> tailored to your goals</li>
                </ul>
            </div>
            <p>Have questions? Simply reply to this email or contact us at <a href='mailto:learn@enprico.com'>learn@enprico.com</a>.</p>
            <p>À bientôt!<br><strong>The Enprico Team</strong></p>
        </div>
        <div class='footer'>
            &copy; ${year} Enprico - French for TEF & TCF Exams<br>
            <a href='https://enprico.com'>www.enprico.com</a><br><br>
            <small>You're receiving this email because you subscribed at enprico.com.<br>
            <a href='https://enprico.com/unsubscribe?email=${encodeURIComponent(email)}'>Unsubscribe</a></small>
        </div>
    </div>
</body>
</html>`;
}

export function getPlanName(planType) {
  if (planType === 'starter') return 'Starter Package (2 hours/week)';
  if (planType === 'professional') return 'Professional Package (4 hours/week)';
  return planType.charAt(0).toUpperCase() + planType.slice(1) + ' Package';
}
