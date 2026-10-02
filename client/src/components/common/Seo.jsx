import { Helmet } from 'react-helmet-async';
import { siteUrl, imgUrl } from '../../utils/format.js';

export default function Seo({ title, description, path, image, type = 'website', jsonLd, noindex }) {
  const fullTitle = title ? `${title} | Omkari Fashions` : 'Omkari Fashions | Traditional Indian Jewellery';
  const desc = (description || 'Premium traditional Indian jewellery - God jewellery, Bharatnatyam sets, Jadau Kundan, Varalakshmi items, necklaces, earrings, bangles and more from Omkari Fashions.').slice(0, 300);
  const canonical = `${siteUrl()}${path ?? window.location.pathname}`;
  const ogImage = image ? (image.startsWith('http') ? image : `${siteUrl()}${imgUrl(image)}`) : `${siteUrl()}/images/logo.png`;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:site_name" content="Omkari Fashions" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={ogImage} />
      {blocks.map((b, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(b)}</script>
      ))}
    </Helmet>
  );
}
