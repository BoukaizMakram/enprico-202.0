import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import ContactClient from './ContactClient';
import './contact.css';

export const metadata = {
  title: 'Contact Us - Enprico | French for TEF & TCF Exams',
  description:
    'Get in touch with Enprico. Ask about our TEF and TCF French courses, 1-on-1 tutoring, pricing, or referrals. We usually reply within one business day.',
  keywords:
    'contact Enprico, French tutoring support, TEF TCF help, learn French online contact',
  alternates: {
    canonical: 'https://enprico.ca/contact',
  },
  openGraph: {
    type: 'website',
    url: 'https://enprico.ca/contact',
    title: 'Contact Us - Enprico',
    description:
      'Get in touch with Enprico about our TEF and TCF French courses, tutoring, and pricing.',
    images: ['https://enprico.ca/images/banner 2.png'],
    siteName: 'Enprico',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact Us - Enprico',
    description: 'Get in touch with Enprico about our French courses and tutoring.',
    images: ['https://enprico.ca/images/banner 2.png'],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'ContactPage',
  name: 'Contact Enprico',
  url: 'https://enprico.ca/contact',
  mainEntity: {
    '@type': 'Organization',
    name: 'Enprico',
    email: 'learn@enprico.ca',
    telephone: '+1-917-672-1922',
    url: 'https://enprico.ca',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Church Street',
      addressLocality: 'Toronto',
      addressRegion: 'ON',
      postalCode: 'M5B 1G8',
      addressCountry: 'CA',
    },
  },
};

export default function ContactPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/">Home</Link> <span>/</span> <span>Contact Us</span>
      </nav>

      {/* Page Header */}
      <PageHeader
        title="Contact Us"
        subtitle="Questions about our French courses, tutoring, or pricing? Send us a message and we'll get back to you within one business day."
      />

      <ContactClient />
    </>
  );
}
