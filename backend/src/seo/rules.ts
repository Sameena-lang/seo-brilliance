import { Page, IssueSeverity } from '@prisma/client';
import prisma from '../config/db';

export interface SeoRule {
  code: string;
  name: string;
  category: string;
  severity: IssueSeverity;
  whyItMatters: string;
  howToFix: string;
  example?: string;
  evaluate: (page: Page) => Promise<{ hasIssue: boolean; evidence?: any; recommendation?: string } | null>;
}

export const rules: SeoRule[] = [
  {
    code: 'TITLE_MISSING',
    name: 'Title tag is missing',
    category: 'Content',
    severity: 'CRITICAL',
    whyItMatters: 'Search engines use the title tag to understand the main topic of the page and display it in search results. Without a title, the page may rank poorly or display poorly in search results.',
    howToFix: 'Add a unique, descriptive <title> tag inside the <head> section of your HTML.',
    example: '<head>\n  <title>SEO Intelligence | Website SEO Audit</title>\n</head>',
    evaluate: async (page) => {
      if (!page.title) {
        return { hasIssue: true, recommendation: 'Add a descriptive <title> tag to this page.' };
      }
      return null;
    }
  },
  {
    code: 'TITLE_TOO_LONG',
    name: 'Title tag is too long',
    category: 'Content',
    severity: 'WARNING',
    whyItMatters: 'If a title is too long, search engines will truncate it in search results, potentially hiding important keywords and reducing click-through rates.',
    howToFix: 'Shorten your <title> tag to be under 60 characters while keeping it descriptive and relevant.',
    example: '<title>Best SEO Audit Tools 2024</title>',
    evaluate: async (page) => {
      if (page.title && page.title.length > 60) {
        return { hasIssue: true, evidence: { length: page.title.length }, recommendation: 'Shorten title to under 60 characters.' };
      }
      return null;
    }
  },
  {
    code: 'TITLE_TOO_SHORT',
    name: 'Title tag is too short',
    category: 'Content',
    severity: 'WARNING',
    whyItMatters: 'A very short title misses out on valuable keyword opportunities and might not clearly convey what the page is about to users.',
    howToFix: 'Expand your <title> tag to adequately describe the page content, typically between 30 and 60 characters.',
    example: '<title>SEO Audit Tool - Analyze Your Website Health</title>',
    evaluate: async (page) => {
      if (page.title && page.title.length > 0 && page.title.length < 30) {
        return { hasIssue: true, evidence: { length: page.title.length }, recommendation: 'Lengthen title to at least 30 characters.' };
      }
      return null;
    }
  },
  {
    code: 'TITLE_DUPLICATE',
    name: 'Duplicate title tag',
    category: 'Content',
    severity: 'WARNING',
    whyItMatters: 'Duplicate titles confuse search engines about which page is most relevant for a given search query, potentially hurting rankings for both pages.',
    howToFix: 'Ensure every indexable page on your website has a completely unique <title> tag reflecting its specific content.',
    evaluate: async (page) => {
      if (!page.title) return null;
      const dup = await prisma.page.findFirst({
        where: { scanId: page.scanId, title: page.title, id: { not: page.id } }
      });
      if (dup) {
        return { hasIssue: true, evidence: { duplicateUrl: dup.url }, recommendation: 'Make the title tag unique across the site.' };
      }
      return null;
    }
  },
  {
    code: 'META_DESCRIPTION_MISSING',
    name: 'Meta description is missing',
    category: 'Content',
    severity: 'WARNING',
    whyItMatters: 'While not a direct ranking factor, the meta description is often used as the snippet in search results. A missing or poorly written description reduces click-through rates.',
    howToFix: 'Add a unique and relevant <meta name="description"> tag inside the <head> of your page.',
    example: '<meta name="description" content="Discover the best SEO audit tools to improve your website rankings today.">',
    evaluate: async (page) => {
      if (!page.metaDescription) {
        return { hasIssue: true, recommendation: 'Add a unique meta description.' };
      }
      return null;
    }
  },
  {
    code: 'META_DESCRIPTION_TOO_LONG',
    name: 'Meta description is too long',
    category: 'Content',
    severity: 'WARNING',
    whyItMatters: 'Search engines typically truncate meta descriptions longer than 155-160 characters, meaning users will not see the full message.',
    howToFix: 'Edit your meta description to be concise and compelling, ideally under 160 characters.',
    evaluate: async (page) => {
      if (page.metaDescription && page.metaDescription.length > 160) {
        return { hasIssue: true, evidence: { length: page.metaDescription.length }, recommendation: 'Shorten meta description to under 160 characters.' };
      }
      return null;
    }
  },
  {
    code: 'META_DESCRIPTION_TOO_SHORT',
    name: 'Meta description is too short',
    category: 'Content',
    severity: 'WARNING',
    whyItMatters: 'A very short description fails to fully sell the page to potential visitors in search results.',
    howToFix: 'Expand your meta description to provide more context and a strong call-to-action, aiming for at least 50 characters.',
    evaluate: async (page) => {
      if (page.metaDescription && page.metaDescription.length > 0 && page.metaDescription.length < 50) {
        return { hasIssue: true, evidence: { length: page.metaDescription.length }, recommendation: 'Lengthen meta description to at least 50 characters.' };
      }
      return null;
    }
  },
  {
    code: 'META_DESCRIPTION_DUPLICATE',
    name: 'Duplicate meta description',
    category: 'Content',
    severity: 'WARNING',
    whyItMatters: 'Using the same description across multiple pages looks like spam or low-quality content to search engines, and provides poor user experience in search snippets.',
    howToFix: 'Write unique meta descriptions for every single indexable page on your site.',
    evaluate: async (page) => {
      if (!page.metaDescription) return null;
      const dup = await prisma.page.findFirst({
        where: { scanId: page.scanId, metaDescription: page.metaDescription, id: { not: page.id } }
      });
      if (dup) {
        return { hasIssue: true, evidence: { duplicateUrl: dup.url }, recommendation: 'Make the meta description unique across the site.' };
      }
      return null;
    }
  },
  {
    code: 'H1_MISSING',
    name: 'H1 tag is missing',
    category: 'Content',
    severity: 'WARNING',
    whyItMatters: 'The H1 tag is heavily weighted by search engines to understand the primary topic of a page.',
    howToFix: 'Add one clear primary <h1> heading representing the page topic near the top of the body content.',
    example: '<h1>Comprehensive SEO Audit Guide</h1>',
    evaluate: async (page) => {
      if (page.h1Count === 0) {
        return { hasIssue: true, recommendation: 'Add exactly one <h1> tag describing the main topic.' };
      }
      return null;
    }
  },
  {
    code: 'H1_MULTIPLE',
    name: 'Multiple H1 tags found',
    category: 'Content',
    severity: 'INFO',
    whyItMatters: 'While HTML5 technically allows multiple H1s, best practice for SEO is to use a single H1 to strongly signal the core topic of the page.',
    howToFix: 'Ensure only the main title of the page uses an <h1> tag. Change subsequent headings to <h2>, <h3>, etc.',
    evaluate: async (page) => {
      if (page.h1Count > 1) {
        return { hasIssue: true, evidence: { count: page.h1Count }, recommendation: 'Use only one <h1> tag per page.' };
      }
      return null;
    }
  },
  {
    code: 'HEADING_STRUCTURE',
    name: 'Poor heading structure',
    category: 'Content',
    severity: 'INFO',
    whyItMatters: 'A logical heading structure (H1 -> H2 -> H3) helps search engines understand the hierarchy and relationship of content on your page.',
    howToFix: 'Use heading tags sequentially. Do not skip levels (e.g., jumping from H1 directly to H4).',
    evaluate: async (page) => {
      if (page.headingsCount === 0) {
        return { hasIssue: true, recommendation: 'Use heading tags (H1-H6) to structure page content.' };
      }
      return null;
    }
  },
  {
    code: 'IMAGE_MISSING_ALT',
    name: 'Images missing alt attribute',
    category: 'Accessibility',
    severity: 'WARNING',
    whyItMatters: 'Alt text describes images to visually impaired users and helps search engines understand the image content for image search ranking.',
    howToFix: 'Add descriptive and concise alt text to every informative image. Use empty alt text (alt="") only for purely decorative images.',
    example: '<img src="seo-chart.png" alt="A bar chart showing SEO score improvements over 6 months">',
    evaluate: async (page) => {
      if (page.imagesMissingAlt > 0) {
        return { hasIssue: true, evidence: { count: page.imagesMissingAlt }, recommendation: 'Add descriptive alt attributes to all images.' };
      }
      return null;
    }
  },
  {
    code: 'CANONICAL_MISSING',
    name: 'Canonical URL is missing',
    category: 'Technical',
    severity: 'INFO',
    whyItMatters: 'Canonical tags prevent duplicate content issues by telling search engines which version of a URL is the "master" or primary version.',
    howToFix: 'Add a self-referencing <link rel="canonical"> tag to the <head> of every indexable page.',
    example: '<link rel="canonical" href="https://www.example.com/page-url" />',
    evaluate: async (page) => {
      if (!page.canonicalUrl) {
        return { hasIssue: true, recommendation: 'Add a self-referencing canonical URL.' };
      }
      return null;
    }
  },
  {
    code: 'ROBOTS_NOINDEX',
    name: 'Page is blocked from indexing',
    category: 'Technical',
    severity: 'WARNING',
    whyItMatters: 'A noindex tag explicitly tells search engines NOT to show this page in search results. If applied accidentally to important pages, organic traffic will drop to zero.',
    howToFix: 'Review the page intent. If it should be in search results, remove the "noindex" directive from the meta robots tag or X-Robots-Tag HTTP header.',
    example: 'Remove: <meta name="robots" content="noindex">',
    evaluate: async (page) => {
      if (page.robotsDirectives && page.robotsDirectives.toLowerCase().includes('noindex')) {
        return { hasIssue: true, evidence: { directives: page.robotsDirectives }, recommendation: 'Remove noindex directive if this page should be indexed.' };
      }
      return null;
    }
  },
  {
    code: 'SCHEMA_ERROR',
    name: 'Schema markup error',
    category: 'Technical',
    severity: 'WARNING',
    whyItMatters: 'Invalid structured data (Schema.org) prevents search engines from parsing your rich snippets (like star ratings, prices, or FAQs) correctly.',
    howToFix: 'Validate your JSON-LD or Microdata using Google\'s Rich Results Test tool and fix the syntax or missing property errors.',
    evaluate: async (page) => {
      if (page.schemaErrors && page.schemaErrors.length > 0) {
        return { hasIssue: true, evidence: { errors: page.schemaErrors }, recommendation: 'Fix JSON-LD schema parsing errors.' };
      }
      return null;
    }
  },
  {
    code: 'BROKEN_LINK',
    name: 'Broken link (404)',
    category: 'Technical',
    severity: 'CRITICAL',
    whyItMatters: 'Broken links create a poor user experience and waste search engine crawl budget. They signal that a site may be poorly maintained.',
    howToFix: 'Find the broken URL in your content and update it to a working URL, remove the link entirely, or implement a 301 redirect if the destination moved.',
    evaluate: async (page) => {
      if (page.statusCode === 404) {
        return { hasIssue: true, recommendation: 'Fix or remove links pointing to this broken page.' };
      }
      return null;
    }
  },
  {
    code: 'REDIRECT_CHAIN',
    name: 'Redirect chain',
    category: 'Technical',
    severity: 'WARNING',
    whyItMatters: 'Multiple redirects slow down page loading and dilute link equity (PageRank). Search engines may stop following redirects if the chain is too long.',
    howToFix: 'Update your internal links to point directly to the final destination URL instead of the redirected URL.',
    evaluate: async (page) => {
      if (page.statusCode && page.statusCode >= 300 && page.statusCode < 400) {
        return { hasIssue: true, evidence: { statusCode: page.statusCode }, recommendation: 'Update links to point directly to the final destination URL.' };
      }
      return null;
    }
  }
];

export const evaluatePage = async (page: Page) => {
  const issues = [];
  for (const rule of rules) {
    const result = await rule.evaluate(page);
    if (result && result.hasIssue) {
      issues.push({
        ruleCode: rule.code,
        severity: rule.severity,
        title: rule.name,
        evidence: result.evidence || {},
        recommendation: result.recommendation || '',
      });
    }
  }
  return issues;
};
