import './globals.css';

export const metadata = {
  title: 'Tiendanovamovil Perú | Celulares, laptops y accesorios',
  description: 'Compra celulares, laptops y accesorios tecnológicos con atención personalizada y envíos a todo el Perú.',
  metadataBase: new URL('https://www.tiendanovamovil.com'),
  openGraph: {
    title: 'Tiendanovamovil Perú',
    description: 'Celulares, laptops y accesorios tecnológicos.',
    url: 'https://www.tiendanovamovil.com',
    siteName: 'Tiendanovamovil Perú',
    locale: 'es_PE',
    type: 'website'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="es-PE">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-18345503163"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-18345503163');
            `
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
