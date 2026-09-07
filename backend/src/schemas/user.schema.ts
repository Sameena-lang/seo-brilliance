import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().min(2, 'Full name is required').optional(),
    email: z.string().email('Invalid email address').optional(),
    // Include notification settings or appearance prefs if needed later
  }),
});
