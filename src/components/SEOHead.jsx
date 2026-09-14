import { useEffect } from 'react';

/**
 * Lightweight dynamic document head management component for single-page apps.
 * Updates document.title, meta descriptions, Open Graph, and Twitter cards per route.
 */
export default function SEOHead({
  title = 'Anchor — Zero-Bloat Fitness OS',
  description = 'The minimalist, local-first fitness OS designed for sub-15-second tracking and progressive overload.',
  ogImage = '/og-image.png',
  canonicalUrl = window.location.href
}) {
  useEffect(() => {
    // 1. Title
    document.title = title;

    // Helper: update or create meta tag
    const setMeta = (attrName, attrValue, content) => {
      let meta = document.querySelector(`meta[${attrName}="${attrValue}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attrName, attrValue);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Helper: update or create link tag
    const setLink = (rel, href) => {
      let link = document.querySelector(`link[rel="${rel}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    // 2. Standard Meta Tags
    setMeta('name', 'description', description);
    setLink('canonical', canonicalUrl);

    // 3. Open Graph Tags
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', ogImage);
    setMeta('property', 'og:url', canonicalUrl);
    setMeta('property', 'og:type', 'website');
    setMeta('property', 'og:site_name', 'Anchor Fitness OS');

    // 4. Twitter Card Tags
    setMeta('name', 'twitter:card', 'summary_large_image');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', ogImage);
  }, [title, description, ogImage, canonicalUrl]);

  return null;
}
