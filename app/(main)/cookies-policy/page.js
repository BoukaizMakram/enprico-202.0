import PageHeader from '@/components/PageHeader';

export const metadata = {
  title: 'Cookies Policy',
  description: 'Learn how Enprico uses cookies to improve your experience on our French learning platform.',
  alternates: { canonical: '/cookies-policy' },
};

export default function CookiesPolicyPage() {
  return (
    <main>
      <PageHeader title="Cookies Policy" subtitle="How we use cookies to enhance your experience" />

      <div className="policy-content">
        <div className="last-updated">
          <strong>Last Updated:</strong> December 24, 2025
        </div>

        <p>This Cookies Policy explains what cookies are, how Enprico uses them, and how you can control them when visiting our website.</p>

        <h2>1. What Are Cookies?</h2>
        <p>Cookies are small text files that are stored on your device (computer, tablet, or mobile) when you visit a website. They help the website remember your preferences and improve your browsing experience.</p>
        <p>Cookies can be &ldquo;persistent&rdquo; (remaining on your device until deleted) or &ldquo;session&rdquo; cookies (deleted when you close your browser).</p>

        <h2>2. How We Use Cookies</h2>
        <p>Enprico uses cookies for the following purposes:</p>
        <ul>
          <li><strong>Authentication:</strong> To keep you logged in to your account</li>
          <li><strong>Preferences:</strong> To remember your language and display settings</li>
          <li><strong>Analytics:</strong> To understand how visitors interact with our website</li>
          <li><strong>Security:</strong> To help protect your account and our services</li>
        </ul>

        <h2>3. Types of Cookies We Use</h2>

        <table className="cookie-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Purpose</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><span className="cookie-type cookie-essential">Essential</span></td>
              <td>Required for the website to function. These enable core functionality like security, authentication, and session management.</td>
              <td>Session / 1 year</td>
            </tr>
            <tr>
              <td><span className="cookie-type cookie-functional">Functional</span></td>
              <td>Remember your preferences such as language selection and login details.</td>
              <td>1 year</td>
            </tr>
            <tr>
              <td><span className="cookie-type cookie-analytics">Analytics</span></td>
              <td>Help us understand how visitors interact with our website by collecting anonymous information.</td>
              <td>2 years</td>
            </tr>
          </tbody>
        </table>

        <h2>4. Specific Cookies We Use</h2>

        <h3>Essential Cookies</h3>
        <ul>
          <li><strong>supabase-auth-token:</strong> Manages your authentication session</li>
          <li><strong>sb-access-token:</strong> Secure access to your account</li>
        </ul>

        <h3>Functional Cookies</h3>
        <ul>
          <li><strong>language:</strong> Stores your preferred language (English/French)</li>
          <li><strong>theme:</strong> Stores your display preferences</li>
        </ul>

        <h3>Analytics Cookies</h3>
        <ul>
          <li><strong>_ga, _gid:</strong> Google Analytics cookies to track website usage</li>
          <li><strong>_gat:</strong> Used to throttle request rate</li>
        </ul>

        <h2>5. Third-Party Cookies</h2>
        <p>Some cookies are placed by third-party services that appear on our pages:</p>
        <ul>
          <li><strong>Google Analytics:</strong> Website analytics and performance tracking</li>
          <li><strong>PayPal:</strong> Payment processing (when making purchases)</li>
          <li><strong>Google Ads:</strong> Advertising and conversion tracking</li>
        </ul>
        <p>These third parties have their own privacy and cookie policies, which we encourage you to review.</p>

        <h2>6. Managing Cookies</h2>
        <p>You can control and manage cookies in several ways:</p>

        <h3>Browser Settings</h3>
        <p>Most browsers allow you to:</p>
        <ul>
          <li>View what cookies are stored and delete them individually</li>
          <li>Block third-party cookies</li>
          <li>Block all cookies from specific sites</li>
          <li>Block all cookies from being set</li>
          <li>Delete all cookies when you close your browser</li>
        </ul>

        <h3>How to Manage Cookies in Popular Browsers:</h3>
        <ul>
          <li><strong>Chrome:</strong> Settings &gt; Privacy and Security &gt; Cookies</li>
          <li><strong>Firefox:</strong> Options &gt; Privacy &amp; Security &gt; Cookies</li>
          <li><strong>Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data</li>
          <li><strong>Edge:</strong> Settings &gt; Privacy &gt; Cookies</li>
        </ul>

        <h3>Opt-Out Links</h3>
        <ul>
          <li><a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Google Analytics Opt-out</a></li>
        </ul>

        <h2>7. Impact of Disabling Cookies</h2>
        <p>Please note that disabling certain cookies may affect the functionality of our website:</p>
        <ul>
          <li>You may not be able to stay logged in</li>
          <li>Your preferences may not be saved</li>
          <li>Some features may not work correctly</li>
        </ul>

        <h2>8. Updates to This Policy</h2>
        <p>We may update this Cookies Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. Please revisit this page regularly to stay informed about our use of cookies.</p>

        <h2>9. Contact Us</h2>
        <p>If you have any questions about our use of cookies, please contact us:</p>
        <ul>
          <li><strong>Email:</strong> <a href="mailto:learn@enprico.ca">learn@enprico.ca</a></li>
          <li><strong>Address:</strong> Church Street, Toronto, ON M5B 1G8, Canada</li>
        </ul>
      </div>
    </main>
  );
}
