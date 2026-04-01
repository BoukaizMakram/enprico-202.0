import PageHeader from '@/components/PageHeader';

export const metadata = {
  title: 'Privacy Policy',
  description: "Enprico's Privacy Policy explains how we collect, use, and protect your personal information when you use our French learning platform.",
  alternates: { canonical: '/privacy-policy' },
};

export default function PrivacyPolicyPage() {
  return (
    <main>
      <PageHeader title="Privacy Policy" subtitle="How we collect, use, and protect your information" />

      <div className="policy-content">
        <div className="last-updated">
          <strong>Last Updated:</strong> December 24, 2025
        </div>

        <p>At Enprico (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;), we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website enprico.com and use our French learning services.</p>

        <h2>1. Information We Collect</h2>

        <h3>Personal Information</h3>
        <p>We may collect personal information that you voluntarily provide to us when you:</p>
        <ul>
          <li>Register for an account</li>
          <li>Subscribe to our services</li>
          <li>Contact us through our contact form</li>
          <li>Subscribe to our newsletter</li>
        </ul>
        <p>This information may include:</p>
        <ul>
          <li>Name and email address</li>
          <li>Payment information (processed securely through PayPal)</li>
          <li>Learning preferences and goals</li>
          <li>Communication history with our tutors</li>
        </ul>

        <h3>Automatically Collected Information</h3>
        <p>When you visit our website, we may automatically collect certain information, including:</p>
        <ul>
          <li>IP address and browser type</li>
          <li>Device information</li>
          <li>Pages visited and time spent</li>
          <li>Referring website</li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide and maintain our French tutoring services</li>
          <li>Process payments and manage subscriptions</li>
          <li>Communicate with you about your account and lessons</li>
          <li>Send you marketing communications (with your consent)</li>
          <li>Improve our website and services</li>
          <li>Comply with legal obligations</li>
        </ul>

        <h2>3. Information Sharing</h2>
        <p>We do not sell your personal information. We may share your information with:</p>
        <ul>
          <li><strong>Service Providers:</strong> Third parties who help us operate our business (e.g., payment processors, hosting providers)</li>
          <li><strong>Tutors:</strong> Your assigned tutors will have access to relevant information to provide lessons</li>
          <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
        </ul>

        <h2>4. Data Security</h2>
        <p>We implement appropriate technical and organizational measures to protect your personal information, including:</p>
        <ul>
          <li>SSL encryption for data transmission</li>
          <li>Secure password storage</li>
          <li>Regular security assessments</li>
          <li>Limited access to personal data</li>
        </ul>

        <h2>5. Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal information</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Withdraw consent for marketing communications</li>
          <li>Data portability</li>
        </ul>
        <p>To exercise these rights, please contact us at <a href="mailto:learn@enprico.ca">learn@enprico.ca</a>.</p>

        <h2>6. Cookies</h2>
        <p>We use cookies and similar technologies to enhance your experience. For more information, please see our <a href="/cookies-policy">Cookies Policy</a>.</p>

        <h2>7. Third-Party Services</h2>
        <p>Our website may contain links to third-party websites. We are not responsible for their privacy practices. We use the following third-party services:</p>
        <ul>
          <li><strong>PayPal:</strong> For payment processing</li>
          <li><strong>Supabase:</strong> For secure data storage</li>
          <li><strong>Google Analytics:</strong> For website analytics</li>
        </ul>

        <h2>8. Children&apos;s Privacy</h2>
        <p>Our services are not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe we have collected such information, please contact us immediately.</p>

        <h2>9. Changes to This Policy</h2>
        <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the &ldquo;Last Updated&rdquo; date.</p>

        <h2>10. Contact Us</h2>
        <p>If you have questions about this Privacy Policy, please contact us:</p>
        <ul>
          <li><strong>Email:</strong> <a href="mailto:learn@enprico.ca">learn@enprico.ca</a></li>
          <li><strong>Address:</strong> Church Street, Toronto, ON M5B 1G8, Canada</li>
        </ul>
      </div>
    </main>
  );
}
