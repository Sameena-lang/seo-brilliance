import { Router } from 'express';
import { submitFeedback } from '../controllers/feedback.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, submitFeedback);

export default router;
