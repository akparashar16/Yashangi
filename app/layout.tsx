import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import ConditionalLayout from '@/components/Layout/ConditionalLayout';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://yashangi.com'), // Update with your actual domain
  title: 'Yashangi - Women\'s Clothing | Ethnic & Western Wear Online',
  description: 'Shop the latest collection of women\'s clothing including ethnic wear (kurtas, kurta sets, kurti) and western wear (tops, dresses, co-ord sets). Premium quality women\'s fashion at best prices. Free shipping available.',
  keywords: [
    'women\'s clothing',
    'women\'s fashion',
    'women\'s dresses',
    'women\'s ethnic wear',
    'women\'s western wear',
    'women\'s kurtas',
    'women\'s kurti',
    'women\'s kurta sets',
    'women\'s tops',
    'women\'s co-ord sets',
    'women clothing online',
    'ethnic wear for women',
    'western wear for women',
    'kurtas for women',
    'kurti online',
    'women\'s fashion store',
    'buy women\'s clothing',
    'women\'s apparel',
    'women\'s outfits',
    'trendy women\'s clothing'
  ],
  authors: [{ name: 'Yashangi' }],
  creator: 'Yashangi',
  publisher: 'Yashangi',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://yashangi.com', // Update with your actual domain
    siteName: 'Yashangi',
    title: 'Yashangi - Women\'s Clothing | Ethnic & Western Wear Online',
    description: 'Shop the latest collection of women\'s clothing including ethnic wear and western wear. Premium quality women\'s fashion at best prices.',
    images: [
      {
        url: '/assets/images/StaticProduct/brandlogo/brandlogo.png', // Update with your logo or hero image
        width: 1200,
        height: 630,
        alt: 'Yashangi - Women\'s Clothing Store',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Yashangi - Women\'s Clothing | Ethnic & Western Wear',
    description: 'Shop the latest collection of women\'s clothing including ethnic wear and western wear.',
    images: ['/assets/images/StaticProduct/brandlogo/brandlogo.png'],
  },
  alternates: {
    canonical: 'https://yashangi.com', // Update with your actual domain
  },
  category: 'Fashion',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Search Console Verification */}
        <meta
          name="google-site-verification"
          content="f9039984872cf9a0"
        />
        
        {/* Additional SEO Meta Tags */}
        <meta name="keywords" content="women's clothing, women's fashion, women's dresses, women's ethnic wear, women's western wear, women's kurtas, women's kurti, women's kurta sets, women's tops, women's co-ord sets, women clothing online, ethnic wear for women, western wear for women, kurtas for women, kurti online, women's fashion store, buy women's clothing, women's apparel, women's outfits, trendy women's clothing" />
        <meta name="author" content="Yashangi" />
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        <meta name="theme-color" content="#ff6b9d" />
        
        {/* Geographic Targeting */}
        <meta name="geo.region" content="IN" />
        <meta name="geo.placename" content="India" />
        
        {/* Structured Data for E-commerce */}
        <Script
          id="structured-data"
          type="application/ld+json"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Store",
              "name": "Yashangi",
              "description": "Online store for women's clothing including ethnic wear and western wear",
              "url": "https://yashangi.com", // Update with your actual domain
              "logo": "https://yashangi.com/assets/images/StaticProduct/brandlogo/brandlogo.png",
              "image": "https://yashangi.com/assets/images/StaticProduct/brandlogo/brandlogo.png",
              "priceRange": "$$",
              "address": {
                "@type": "PostalAddress",
                "addressCountry": "IN"
              },
              "sameAs": [
                // Add your social media links here
              ],
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://yashangi.com/collection?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        
        {/* Bootstrap CSS - using local version from ECommerce.Web */}
        <link
          rel="stylesheet"
          href="/assets/css/bootstrap.min.css"
        />
        {/* Font Awesome - using CDN for better reliability */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
        {/* Owl Carousel CSS - using local version */}
        <link
          rel="stylesheet"
          href="/assets/css/owl.carousel.min.css"
        />
        <link
          rel="stylesheet"
          href="/assets/css/owl.theme.min.css"
        />
        {/* Main style.css from ECommerce.Web - must load after Bootstrap */}
        <link
          rel="stylesheet"
          href="/assets/css/style.css"
        />
        {/* Responsive CSS - must load last */}
        <link
          rel="stylesheet"
          href="/assets/css/responsive.css"
        />
        {/* Header fix CSS - load after responsive to override */}
        <link
          rel="stylesheet"
          href="/assets/css/header-fix.css"
        />
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-YSRE1RL5SV"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-YSRE1RL5SV');
          `}
        </Script>
      </head>
      <body>
        <ConditionalLayout>{children}</ConditionalLayout>
        <Script
          src="https://code.jquery.com/jquery-3.6.0.min.js"
          strategy="beforeInteractive"
        />
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/owl.carousel.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

