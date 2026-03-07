import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://deutsch-meister.de';

const SEO = ({ title, description, path = '/', type = 'website', structuredData }) => {
  const fullTitle = title ? `${title} | DeutschMeister` : 'DeutschMeister - Learn German';
  const canonicalUrl = `${BASE_URL}${path}`;

  return (
    <Helmet>
      <html lang="de" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="en" href={canonicalUrl} />
      <link rel="alternate" hrefLang="de" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="DeutschMeister" />
      <meta property="og:locale" content="de_DE" />
      <meta property="og:locale:alternate" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
};

export default SEO;
