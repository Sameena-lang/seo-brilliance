import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import * as subscriptionController from '../controllers/subscription.controller';

const router = Router();

router.use(authenticate);

router.get('/status', subscriptionController.getSubscriptionStatus);
router.post('/upgrade', subscriptionController.upgradeToPro);

export default router;
