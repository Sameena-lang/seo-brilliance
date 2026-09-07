import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Project name is required'),
    domain: z.string().min(1, 'Domain is required'),
    rootUrl: z.string().url('Must be a valid URL').optional(),
    crawlSettings: z.object({
      maxPages: z.number().int().positive().default(100),
      maxDepth: z.number().int().positive().default(3),
      respectRobots: z.boolean().default(true),
      crawlSitemap: z.boolean().default(true),
      checkBrokenLinks: z.boolean().default(true),
      analyzeImages: z.boolean().default(true),
      analyzeSchema: z.boolean().default(true),
      measurePerformance: z.boolean().default(true),
      includeSubdomains: z.boolean().default(false),
      excludePatterns: z.array(z.string()).default([]),
    }).optional(),
  }),
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Project name is required').optional(),
    domain: z.string().min(1, 'Domain is required').optional(),
    rootUrl: z.string().url('Must be a valid URL').optional(),
    crawlSettings: z.any().optional(), // Can be more strictly typed based on frontend
    status: z.string().optional(),
  }),
});
