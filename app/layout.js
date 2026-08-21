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
    default: 'Enprico — TEF & TCF Prep Online | Expert 1-on-1 French Tutoring for Canada PR',
    template: '%s | Enprico',
  },
  description: 'Online TEF & TCF exam preparation with expert 1-on-1 French tutors. Reach the CLB / NCLC levels you need for Canada Express Entry and permanent residency. Live personalized classes and a free trial.',
  keywords: ['TEF preparation', 'TCF preparation', 'TEF Canada', 'TCF Canada', 'French tutoring online', 'French for immigration', 'Canada Express Entry French', 'NCLC French', 'CLB French', 'TEF TCF online course'],
  authors: [{ name: 'Enprico' }],
  metadataBase: new URL('https://enprico.ca'),
  verification: {
    google: 'HpxDe1jLD8YCPBxrLuaifoEWR8aGfu6n6UckkN6kTy4',
  },
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
    <html lang="en" className={`${poppins.variable} ${inter.variable}`} suppressHydrationWarning>
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
        {process.env.NEXT_PUBLIC_REDDIT_PIXEL_ID && (
          <Script id="reddit-pixel" strategy="afterInteractive">
            {`
              !function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);
              rdt('init','${process.env.NEXT_PUBLIC_REDDIT_PIXEL_ID}');
              rdt('track','PageVisit');
            `}
          </Script>
        )}
      </head>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
