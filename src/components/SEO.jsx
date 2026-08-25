import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://deutsch-meister.de';

const SEO = ({
  title,
  description,
  keywords,
  path = '',
  type = 'website',
  image = 'https://deutsch-meister.de/og-image.png',
  structuredData,
  extraStructuredData,
  noindex = false,
  lang, // set 'de' on German-language pages (FAQ, Über uns) — default keeps index.html's en
}) => {
  const siteTitle = 'DeutschMeister';
  // Idempotent: several pages already end their title with the brand, which
  // produced "… | DeutschMeister | DeutschMeister" in the tab and in og:title.
  const fullTitle = title
    ? (title.trim().endsWith(siteTitle) ? title.trim() : `${title} | ${siteTitle}`)
    : `${siteTitle} - Learn German`;
  const url = `${BASE_URL}${path}`;

  // Mirrors the rule in scripts/prerender-spa-routes.mjs. These were hardcoded
  // en_US, which was invisible while Helmet merely APPENDED a second og:locale
  // beside the prerendered de_DE one — document order kept the right value in
  // front. Once index.html's twins carried data-rh, Helmet started REPLACING
  // instead of appending, and /faq/ and /ueber-uns/ hydrated to <html lang="de">
  // next to og:locale=en_US. Derive it from the same prop that sets lang.
  const ogLocale = lang === 'de' ? 'de_DE' : 'en_US';
  const ogLocaleAlt = ogLocale === 'de_DE' ? 'en_US' : 'de_DE';

  // Handle arrays of structured data
  const structuredDataArray = Array.isArray(structuredData) ? structuredData : structuredData ? [structuredData] : [];

  return (
    <Helmet {...(lang ? { htmlAttributes: { lang } } : {})}>
      {/* Page content is English (explanations for English speakers learning
          German) — must match index.html's lang="en" to avoid conflicting
          language signals. */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={url} />
      {/* No hreflang: there is only one URL per page (no language variants).
          Emitting en+de pointing at the same URL sends conflicting signals. */}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:locale:alternate" content={ogLocaleAlt} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Structured Data */}
      {structuredDataArray.map((data, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
      {extraStructuredData && (
        <script type="application/ld+json">
          {JSON.stringify(extraStructuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
