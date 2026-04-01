/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['nodemailer'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'bzophrxgmwhobbucnvkf.supabase.co',
      },
    ],
  },
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      { source: '/login.html', destination: '/login', permanent: true },
      { source: '/register.html', destination: '/register', permanent: true },
      { source: '/signup.html', destination: '/#pricing', permanent: true },
      { source: '/signup', destination: '/#pricing', permanent: true },
      { source: '/dashboard.html', destination: '/dashboard', permanent: true },
      { source: '/admin.html', destination: '/admin', permanent: true },
      { source: '/tutor.html', destination: '/tutor', permanent: true },
      { source: '/success.html', destination: '/success', permanent: true },
      { source: '/article.html', destination: '/articles', permanent: true },
      { source: '/privacy-policy.html', destination: '/privacy-policy', permanent: true },
      { source: '/cookies-policy.html', destination: '/cookies-policy', permanent: true },
      { source: '/refund-policy.html', destination: '/refund-policy', permanent: true },
      { source: '/about-us-learn-french-online.html', destination: '/about-us-learn-french-online', permanent: true },
      { source: '/learn-french-online-tef-tcf.html', destination: '/learn-french-online-tef-tcf', permanent: true },
      { source: '/learn-french-online-why-learning-french.html', destination: '/learn-french-online-why-learning-french', permanent: true },
      { source: '/learn-french-online-enprico-articles', destination: '/articles', permanent: true },
    ];
  },
};

export default nextConfig;
