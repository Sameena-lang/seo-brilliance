import { Page, IssueSeverity } from '@prisma/client';
import prisma from '../config/db';

export interface SeoRule {
  code: string;
  name: string;
  category: string;
  severity: IssueSeverity;
  evaluate: (page: Page) => Promise<{ hasIssue: boolean; evidence?: any; recommendation?: string } | null>;
}

export const rules: SeoRule[] = [
  {
    code: 'TITLE_MISSING',
    name: 'Title tag is missing',
    category: 'Content',
    severity: 'CRITICAL',
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
