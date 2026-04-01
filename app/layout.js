import { Poppins, Inter } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-poppins',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: {
    default: 'Enprico - French for TEF & TCF Exams | Expert 1-on-1 Tutors',
    template: '%s | Enprico',
  },
  description: 'Practical and structured French training for Canada and France immigration. TEF & TCF exam preparation with personalized 1-on-1 tutoring.',
  keywords: ['learn French online', 'French tutoring', 'TEF preparation', 'TCF preparation', 'French for immigration', 'Canada Express Entry'],
  authors: [{ name: 'Enprico' }],
  metadataBase: new URL('https://enprico.com'),
  openGraph: {
    type: 'website',
    siteName: 'Enprico',
    locale: 'en_US',
    images: [{ url: '/images/banner 2.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/images/banner 2.png'],
  },
  icons: {
    icon: '/images/fav icon.png',
    apple: '/images/fav icon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
      <head>
        <Script
          src="//script.crazyegg.com/pages/scripts/0132/5650.js"
          strategy="afterInteractive"
        />
        {process.env.NEXT_PUBLIC_GTAG_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GTAG_ID}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GTAG_ID}');
              `}
            </Script>
          </>
        )}
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
