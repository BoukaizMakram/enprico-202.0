import HomeLoader from '@/components/home/HomeLoader';

export const metadata = {
  title: 'Enprico - French for TEF & TCF Exams | Expert 1-on-1 Tutors',
  description:
    'Practical and structured French training for Canada and France immigration. TEF & TCF exam preparation with personalized 1-on-1 tutoring. Certified tutors, flexible schedules.',
  keywords:
    'learn French online, French tutoring, TEF preparation, TCF preparation, French for immigration, Canada Express Entry, France visa, CLB French, 1-on-1 French lessons, French tutor, online French course',
  authors: [{ name: 'Enprico' }],
  alternates: {
    canonical: 'https://enprico.com/',
  },
  openGraph: {
    type: 'website',
    url: 'https://enprico.com/',
    title: 'Enprico - French for TEF & TCF Exams | Expert 1-on-1 Tutors',
    description:
      'Practical and structured French training for Canada and France immigration. TEF & TCF exam preparation with personalized 1-on-1 tutoring.',
    images: [
      {
        url: 'https://enprico.com/images/banner 2.png',
        width: 1200,
        height: 630,
      },
    ],
    siteName: 'Enprico',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Enprico - French for TEF & TCF Exams | Expert 1-on-1 Tutors',
    description:
      'Practical and structured French training for Canada and France immigration. TEF & TCF exam preparation with personalized 1-on-1 tutoring.',
    images: ['https://enprico.com/images/banner 2.png'],
  },
};

const jsonLdOrganization = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Enprico',
  url: 'https://enprico.com',
  logo: 'https://enprico.com/images/logo_white 1.png',
  description:
    'Enprico offers French coaching designed for Express Entry to Canada and France immigration. TEF & TCF exam preparation with personalized 1-on-1 tutoring.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Church Street',
    addressLocality: 'Toronto',
    addressRegion: 'ON',
    postalCode: 'M5B 1G8',
    addressCountry: 'CA',
  },
  telephone: '+19176721922',
  offers: {
    '@type': 'Offer',
    name: 'French Tutoring Plans',
    description: 'Personalized 1-on-1 French tutoring for TEF & TCF exams',
    priceCurrency: 'CAD',
    price: '250',
    priceValidUntil: '2026-12-31',
  },
};

const jsonLdCourse = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'French Language Tutoring for TEF & TCF',
  description:
    'Personalized 1-on-1 French lessons with certified tutors. Comprehensive training for speaking, writing, reading, and listening skills for immigration exams.',
  provider: {
    '@type': 'Organization',
    name: 'Enprico',
    url: 'https://enprico.com',
  },
  courseMode: 'online',
  educationalLevel: 'Beginner to Advanced',
  inLanguage: 'en',
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'online',
    courseWorkload: 'PT4H',
    instructor: {
      '@type': 'Person',
      name: 'Enprico Certified French Tutors',
    },
  },
  offers: {
    '@type': 'Offer',
    category: 'Paid',
    priceCurrency: 'CAD',
    price: '400',
    priceValidUntil: '2026-12-31',
  },
};

const jsonLdFaq = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the monthly price for French tutoring at Enprico?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Our standard price is 400 CAD per month for 4 hours per week, totaling 16 hours per month. From time to time, we offer limited special rates. Please contact us directly to check if you are eligible for any current offers.',
      },
    },
    {
      '@type': 'Question',
      name: 'How does the Enprico referral program work?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'For every student you refer who enrolls, you receive a 50 CAD discount. If you refer 5 students who enroll and remain active, you can receive up to 250 CAD in total discounts.',
      },
    },
    {
      '@type': 'Question',
      name: "What is Enprico's refund policy?",
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'If you request a refund during the first week (after the first 4 hours), you receive a full refund. If you request a refund during the second or third week, you receive a refund for 4 hours plus half of the hours completed in the additional weeks. If you complete the fourth week without requesting a refund, the program becomes non-refundable.',
      },
    },
    {
      '@type': 'Question',
      name: 'How many hours per week do I study French at Enprico?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You will attend 4 hours per week of live classes, totaling 16 hours per month.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are Enprico French classes live?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. All sessions are live and interactive with a professional teacher.',
      },
    },
  ],
};

const jsonLdService = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  serviceType: 'French Language Tutoring',
  provider: {
    '@type': 'Organization',
    name: 'Enprico',
  },
  areaServed: {
    '@type': 'Place',
    name: 'Worldwide',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'French Tutoring Plans',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Monthly French Tutoring - 16 hours',
          description:
            '4 hours per week of live 1-on-1 French tutoring for TEF/TCF exam preparation',
        },
        price: '400',
        priceCurrency: 'CAD',
      },
    ],
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdOrganization),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdCourse),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdFaq),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLdService),
        }}
      />
      <HomeLoader />
    </>
  );
}
