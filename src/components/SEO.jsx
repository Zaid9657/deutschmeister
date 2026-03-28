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
}) => {
  const siteTitle = 'DeutschMeister';
  const fullTitle = title ? `${title} | ${siteTitle}` : `${siteTitle} - Learn German`;
  const url = `${BASE_URL}${path}`;

  // Handle arrays of structured data
  const structuredDataArray = Array.isArray(structuredData) ? structuredData : structuredData ? [structuredData] : [];

  return (
    <Helmet>
      <html lang="de" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />
      <link rel="alternate" hrefLang="en" href={url} />
      <link rel="alternate" hrefLang="de" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:site_name" content={siteTitle} />
      <meta property="og:locale" content="de_DE" />
      <meta property="og:locale:alternate" content="en_US" />

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
