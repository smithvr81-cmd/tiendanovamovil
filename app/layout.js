import './globals.css';
import './v3.css';
import './v3-extra.css';
import './hero-products.css';
import MarketingTracker from '../components/MarketingTracker';

export const metadata = {
  title: {
    default: 'Tiendanovamovil Perú | Celulares, laptops y accesorios',
    template: '%s | Tiendanovamovil Perú'
  },
  description: 'Compra celulares, laptops y accesorios tecnológicos con atención personalizada y envíos a todo el Perú.',
  metadataBase: new URL('https://www.tiendanovamovil.com'),
  alternates: { canonical: '/' },
  keywords: ['celulares Perú', 'laptops Perú', 'tienda de tecnología', 'accesorios tecnológicos'],
  robots: { index: true, follow: true },
  icons: { icon: '/logo-tiendanovamovil.png', apple: '/logo-tiendanovamovil.png' },
  openGraph: {
    title: 'Tiendanovamovil Perú',
    description: 'Celulares, laptops y accesorios tecnológicos.',
    url: 'https://www.tiendanovamovil.com',
    siteName: 'Tiendanovamovil Perú',
    locale: 'es_PE',
    type: 'website',
    images: [{ url: '/logo-tiendanovamovil.png', width: 1000, height: 1000, alt: 'Tiendanovamovil Perú' }]
  },
  twitter: { card: 'summary', title: 'Tiendanovamovil Perú', description: 'Celulares, laptops y accesorios con atención personalizada.', images: ['/logo-tiendanovamovil.png'] }
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#07111f' };

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'Tiendanovamovil Perú',
  url: 'https://www.tiendanovamovil.com',
  logo: 'https://www.tiendanovamovil.com/logo-tiendanovamovil.png',
  telephone: '+51 916 599 383',
  areaServed: 'PE',
  contactPoint: { '@type': 'ContactPoint', telephone: '+51 916 599 383', contactType: 'sales', availableLanguage: 'Spanish' }
};

export default function RootLayout({ children }) {
  return (
    <html lang="es-PE">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('consent', 'default', {
            analytics_storage: 'denied',
            ad_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            wait_for_update: 500
          });
          gtag('js', new Date());
          gtag('config', 'AW-18345503163', { allow_enhanced_conversions: true });
        ` }} />
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-18345503163"></script>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      </head>
      <body>
        <MarketingTracker />
        {children}
      </body>
    </html>
  );
}
