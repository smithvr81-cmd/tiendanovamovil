# Tiendanovamovil

Tienda de tecnología desarrollada con Next.js y preparada para Vercel.

## Incluye

- Catálogo filtrable.
- Buscador.
- Botones de compra por WhatsApp al número +51 953 587 927.
- Formulario de contacto.
- Etiqueta base de Google Ads `AW-18345503163`.
- Consent Mode para analítica y publicidad.
- Captura de atribución: UTM, `gclid`, `gbraid`, `wbraid` y `fbclid`.
- Eventos `whatsapp_click`, `contact`, `purchase_form_submit`, `generate_lead` y `add_to_cart`.
- Conversión directa de WhatsApp en Google Ads cuando se configura `NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_LABEL`.
- Conversión directa del formulario en Google Ads cuando se configura `NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL`.
- Integraciones opcionales con GA4, Google Tag Manager y Meta Pixel mediante variables de entorno.
- Diseño responsive.
- SEO técnico, sitemap y datos estructurados.
- Accesibilidad y estados de catálogo.
- Encabezados básicos de seguridad.

## Variables de marketing

Usa `.env.example` como referencia. En Vercel configura las variables públicas necesarias en Production, Preview y Development según corresponda.

Las dos variables más importantes para las conversiones directas de Google Ads son:

```text
NEXT_PUBLIC_GOOGLE_ADS_WHATSAPP_LABEL=<label de la acción WhatsApp>
NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL=<label de la acción formulario>
```

Los valores deben copiarse exactamente desde Google Ads. No deben inventarse.

## Publicación

Vercel detecta Next.js y ejecuta automáticamente `npm run build` cuando se actualiza la rama principal conectada al proyecto.
