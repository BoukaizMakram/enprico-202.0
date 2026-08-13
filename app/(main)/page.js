import HomeLoader from '@/components/home/HomeLoader';

export const metadata = {
  title: 'TEF & TCF Prep Online | Expert 1-on-1 French Tutoring for Canada PR — Enprico',
  description:
    'Online TEF & TCF exam preparation with expert 1-on-1 French tutors. Reach the CLB / NCLC levels you need for Canada Express Entry and PR. Live personalized classes, flexible scheduling, free trial class.',
  keywords:
    'TEF preparation, TCF preparation, TEF Canada, TCF Canada, TEF exam prep, TCF exam prep, French tutoring online, French tutor for immigration, Express Entry French, Canada PR French exam, NCLC French, CLB French, learn French online, French classes for immigration, TEF TCF online course, French for Canada immigration',
  authors: [{ name: 'Enprico' }],
  alternates: {
    canonical: 'https://enprico.ca/',
  },
  openGraph: {
    type: 'website',
    url: 'https://enprico.ca/',
    title: 'TEF & TCF Prep Online | Expert 1-on-1 French Tutoring for Canada PR',
    description:
      'Online TEF & TCF exam preparation with expert 1-on-1 French tutors. Reach the CLB / NCLC levels you need for Canada Express Entry and PR. Live personalized classes and a free trial.',
    images: [
      {
        url: 'https://enprico.ca/images/banner 2.png',
        width: 1200,
        height: 630,
      },
    ],
    siteName: 'Enprico',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TEF & TCF Prep Online | Expert 1-on-1 French Tutoring for Canada PR',
    description:
      'Online TEF & TCF exam preparation with expert 1-on-1 French tutors for Canada Express Entry and PR. Live personalized classes and a free trial.',
    images: ['https://enprico.ca/images/banner 2.png'],
  },
};

const jsonLdOrganization = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'Enprico',
  url: 'https://enprico.ca',
  logo: 'https://enprico.ca/images/logo_white 1.png',
  description:
    'Enprico offers online TEF & TCF exam preparation with expert 1-on-1 French tutors, helping applicants reach the CLB / NCLC levels required for Canada Express Entry and permanent residency. Personalized live classes with flexible scheduling.',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Church Street',
    addressLocality: 'Toronto',
    addressRegion: 'ON',
    postalCode: 'M5B 1G8',
    addressCountry: 'CA',
  },
  telephone: '+19176721922',
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '220',
    bestRating: '5',
    worstRating: '1',
  },
  offers: {
    '@type': 'Offer',
    name: 'French Tutoring Plans',
    description: 'Personalized 1-on-1 French tutoring for TEF & TCF exams',
    priceCurrency: 'CAD',
    price: '250',
    priceValidUntil: '2026-12-31',
  },
};

const jsonLdLocalBusiness = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://enprico.ca/#localbusiness',
  name: 'Enprico',
  image: 'https://enprico.ca/images/banner 2.png',
  url: 'https://enprico.ca',
  telephone: '+19176721922',
  email: 'learn@enprico.ca',
  priceRange: 'CAD 250–400',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Church Street',
    addressLocality: 'Toronto',
    addressRegion: 'ON',
    postalCode: 'M5B 1G8',
    addressCountry: 'CA',
  },
  areaServed: {
    '@type': 'Country',
    name: 'Canada',
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    opens: '09:00',
    closes: '18:00',
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '220',
    bestRating: '5',
    worstRating: '1',
  },
};

const jsonLdCourse = {
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'French Language Tutoring for TEF & TCF',
  description:
    'Personalized 1-on-1 French lessons with expert tutors covering speaking, writing, reading, and listening for the TEF and TCF exams required for Canada Express Entry and permanent residency.',
  provider: {
    '@type': 'Organization',
    name: 'Enprico',
    url: 'https://enprico.ca',
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
      name: 'Enprico Native Spanish-Speaking French Tutors',
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
            '4 hours per week of live 1-on-1 French tutoring with native Spanish-speaking tutors for TEF/TCF exam preparation',
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
          __html: JSON.stringify(jsonLdLocalBusiness),
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
