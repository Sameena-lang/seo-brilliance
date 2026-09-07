import * as cheerio from 'cheerio';

export interface ExtractedData {
  title: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  robotsDirectives: string | null;
  h1: string | null;
  h1Count: number;
  headingsCount: number;
  imagesTotal: number;
  imagesMissingAlt: number;
  internalLinks: string[];
  externalLinks: string[];
  schemaTypes: string[];
  schemaErrors: string[];
}

export const extractPageData = (html: string, baseUrl: string): ExtractedData => {
  const $ = cheerio.load(html);
  
  const title = $('title').text() || null;
  const metaDescription = $('meta[name="description"]').attr('content') || null;
  const canonicalUrl = $('link[rel="canonical"]').attr('href') || null;
  const robotsDirectives = $('meta[name="robots"]').attr('content') || null;

  const h1Elements = $('h1');
  const h1Count = h1Elements.length;
  const h1 = h1Count > 0 ? h1Elements.first().text().trim() : null;

  const headingsCount = $('h1, h2, h3, h4, h5, h6').length;

  const imageElements = $('img');
  const imagesTotal = imageElements.length;
  let imagesMissingAlt = 0;
  imageElements.each((_, el) => {
    const alt = $(el).attr('alt');
    if (alt === undefined || alt.trim() === '') {
      imagesMissingAlt++;
    }
  });

  const internalLinks: string[] = [];
  const externalLinks: string[] = [];

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    
    // Ignore mailto, tel, javascript
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) return;

    try {
      const url = new URL(href, baseUrl);
      const base = new URL(baseUrl);
      
      if (url.hostname === base.hostname || url.hostname.endsWith(base.hostname)) {
        internalLinks.push(url.href);
      } else {
        externalLinks.push(url.href);
      }
    } catch {
      // Ignore invalid URLs
    }
  });

  // Basic schema.org extraction
  const schemaTypes: string[] = [];
  const schemaErrors: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const content = $(el).html();
      if (content) {
        const json = JSON.parse(content);
        // Can be array or object
        if (Array.isArray(json)) {
          json.forEach(item => {
            if (item['@type']) schemaTypes.push(item['@type']);
          });
        } else if (json['@type']) {
          schemaTypes.push(json['@type']);
        }
      }
    } catch (e: any) {
      schemaErrors.push(`Failed to parse JSON-LD: ${e.message}`);
    }
  });

  return {
    title,
    metaDescription,
    canonicalUrl,
    robotsDirectives,
    h1,
    h1Count,
    headingsCount,
    imagesTotal,
    imagesMissingAlt,
    internalLinks: [...new Set(internalLinks)], // deduplicate
    externalLinks: [...new Set(externalLinks)],
    schemaTypes: [...new Set(schemaTypes)],
    schemaErrors,
  };
};
