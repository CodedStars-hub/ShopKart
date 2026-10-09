/**
 * Product Image Utilities for ShopKart
 *
 * Provides accurate category- and keyword-aware fallback image mappings
 * ensuring no product displays an unrelated image (e.g. a book or jacket
 * never falls back to a smart watch).
 */

export const CATEGORY_FALLBACK_IMAGES = {
  Electronics: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
  Fashion: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
  Books: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
  Home: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80',
};

const KEYWORD_IMAGE_MAPPINGS = [
  {
    regex: /keyboard/i,
    url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80',
  },
  {
    regex: /mouse/i,
    url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&auto=format&fit=crop&q=80',
  },
  {
    regex: /headphone|audio|earphone/i,
    url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80',
  },
  {
    regex: /watch|smartwatch/i,
    url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
  },
  {
    regex: /jacket|denim|coat|shirt|apparel/i,
    url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80',
  },
  {
    regex: /backpack|bag|leather/i,
    url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
  },
  {
    regex: /book|handbook|programmer|data-intensive|guide/i,
    url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
  },
  {
    regex: /coffee|pour-over|dripper|carafe/i,
    url: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&auto=format&fit=crop&q=80',
  },
  {
    regex: /diffuser|humidifier|aroma/i,
    url: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=80',
  },
];

/**
 * Returns a reliable, topic-appropriate fallback image matching the product's
 * name and category keywords.
 */
export function getProductFallbackImage(product) {
  const name = product?.name || '';
  const category = product?.category || '';

  for (const mapping of KEYWORD_IMAGE_MAPPINGS) {
    if (mapping.regex.test(name)) {
      return mapping.url;
    }
  }

  if (CATEGORY_FALLBACK_IMAGES[category]) {
    return CATEGORY_FALLBACK_IMAGES[category];
  }

  return CATEGORY_FALLBACK_IMAGES.Electronics;
}

/**
 * Graceful image error handler. Sets a category-matching fallback and prevents
 * infinite error cascades.
 */
export function handleProductImageError(event, product) {
  event.currentTarget.onerror = null;
  event.currentTarget.src = getProductFallbackImage(product);
}
