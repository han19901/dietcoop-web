import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  structuredData?: object | object[];
  noindex?: boolean;
  nofollow?: boolean;
  canonical?: string;
}

export default function SEO({
  title = 'DietCoop - Dijital Diyetisyen Ekosistemi',
  description = 'DietCoop, diyetisyenler için tasarlanmış kapsamlı dijital diyet yönetim platformu. Danışan takibi, diyet planı oluşturma, istatistikler ve daha fazlası tek platformda.',
  keywords = 'diyetisyen, diyet planı, danışan takibi, dijital diyet, diyet uygulaması, diyetisyen yazılımı, diyet yönetimi, sağlık teknolojisi, beslenme takibi',
  image = '/DietCoop Logo.png',
  url = 'https://www.dietcoop.com',
  type = 'website',
  author = 'DietCoop',
  publishedTime,
  modifiedTime,
  structuredData,
  noindex = false,
  nofollow = false,
  canonical,
}: SEOProps) {
  const siteUrl = 'https://www.dietcoop.com';
  const fullUrl = canonical || `${siteUrl}${url}`;
  const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;
  const robotsContent = `${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}`;

  return (
    <Helmet>
      {/* Temel Meta Taglar */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      <meta name="robots" content={robotsContent} />
      <link rel="canonical" href={fullUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title} />
      <meta property="og:site_name" content="DietCoop" />
      <meta property="og:locale" content="tr_TR" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={fullUrl} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:image:alt" content={title} />
      <meta name="twitter:creator" content="@dietcoop" />
      <meta name="twitter:site" content="@dietcoop" />

      {/* Article Meta (eğer type article ise) */}
      {type === 'article' && (
        <>
          {publishedTime && <meta property="article:published_time" content={publishedTime} />}
          {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
          <meta property="article:author" content={author} />
        </>
      )}

      {/* Structured Data (JSON-LD) */}
      {structuredData && (
        Array.isArray(structuredData) ? (
          structuredData.map((data, index) => (
            <script key={index} type="application/ld+json">
              {JSON.stringify(data)}
            </script>
          ))
        ) : (
          <script type="application/ld+json">
            {JSON.stringify(structuredData)}
          </script>
        )
      )}

      {/* Ek SEO Meta Taglar */}
      <meta name="theme-color" content="#00ff88" />
      <meta name="msapplication-TileColor" content="#00ff88" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="DietCoop" />
    </Helmet>
  );
}
