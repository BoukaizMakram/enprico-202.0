import PageHeader from '@/components/PageHeader';

export const metadata = {
  title: 'Refund Policy',
  description: "Enprico's Refund Policy. We offer a money-back guarantee if you're not satisfied with our French tutoring services.",
  alternates: { canonical: '/refund-policy' },
};

export default function RefundPolicyPage() {
  return (
    <main>
      <PageHeader title="Refund Policy" subtitle="Our commitment to your satisfaction" />

      <div className="policy-content">
        <div className="last-updated">
          <strong>Last Updated:</strong> December 24, 2025
        </div>

        <div className="highlight-box">
          <h3>Money-Back Guarantee</h3>
          <p>At Enprico, we stand behind the quality of our French tutoring services. If you&apos;re not satisfied with your experience, we offer a full refund - no questions asked.</p>
        </div>

        <h2>1. Our Guarantee</h2>
        <p>We are confident in the quality of our French tutoring services. If you are not completely satisfied with your learning experience, you are entitled to a full refund under the following conditions:</p>

        <h2>2. Eligibility for Refund</h2>
        <p>You may request a refund if:</p>
        <ul>
          <li>You request a refund within <strong>14 days</strong> of your initial purchase</li>
          <li>You have completed fewer than 50% of your purchased lesson hours</li>
          <li>You are a first-time customer</li>
        </ul>

        <h2>3. Refund Amount</h2>
        <h3>Full Refund (100%)</h3>
        <p>You are eligible for a full refund if:</p>
        <ul>
          <li>You request within 14 days of purchase</li>
          <li>You have used less than 2 hours of your lesson package</li>
        </ul>

        <h3>Pro-Rated Refund</h3>
        <p>If you have used between 2 hours and 50% of your package, you may receive a pro-rated refund calculated as:</p>
        <ul>
          <li>Total paid amount minus the cost of hours used at the standard hourly rate</li>
        </ul>

        <h3>No Refund</h3>
        <p>Refunds are not available if:</p>
        <ul>
          <li>More than 14 days have passed since purchase</li>
          <li>You have used more than 50% of your lesson hours</li>
          <li>You have previously received a refund from Enprico</li>
        </ul>

        <h2>4. How to Request a Refund</h2>
        <p>To request a refund, please follow these steps:</p>
        <ul>
          <li><strong>Step 1:</strong> Send an email to <a href="mailto:learn@enprico.ca">learn@enprico.ca</a> with the subject line &ldquo;Refund Request&rdquo;</li>
          <li><strong>Step 2:</strong> Include your account email address and order/transaction ID</li>
          <li><strong>Step 3:</strong> Briefly explain the reason for your refund request (optional but helpful)</li>
        </ul>

        <h2>5. Processing Time</h2>
        <p>Once your refund request is received and approved:</p>
        <ul>
          <li>We will review your request within <strong>2 business days</strong></li>
          <li>Approved refunds will be processed within <strong>5-7 business days</strong></li>
          <li>The refund will be credited to your original payment method (PayPal)</li>
          <li>Please allow additional time for your bank or payment provider to process the refund</li>
        </ul>

        <h2>6. Subscription Cancellations</h2>
        <p>For monthly subscription plans:</p>
        <ul>
          <li>You may cancel your subscription at any time through your dashboard</li>
          <li>Cancellation takes effect at the end of your current billing period</li>
          <li>No refunds are provided for partial months</li>
          <li>Unused hours do not roll over after cancellation</li>
        </ul>

        <h2>7. Exceptions</h2>
        <p>We may make exceptions to this policy at our discretion in cases of:</p>
        <ul>
          <li>Technical issues that prevented you from accessing lessons</li>
          <li>Significant service quality issues verified by our team</li>
          <li>Medical or emergency circumstances (documentation may be required)</li>
        </ul>

        <h2>8. Contact Us</h2>
        <p>If you have any questions about our refund policy, please contact us:</p>
        <ul>
          <li><strong>Email:</strong> <a href="mailto:learn@enprico.ca">learn@enprico.ca</a></li>
          <li><strong>Response Time:</strong> Within 24-48 hours</li>
        </ul>

        <div className="highlight-box">
          <h3>Our Promise</h3>
          <p>Your satisfaction is our priority. We&apos;re committed to providing exceptional French tutoring services, and we want you to feel confident in your decision to learn with Enprico.</p>
        </div>
      </div>
    </main>
  );
}
