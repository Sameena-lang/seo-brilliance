import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/chat', aiController.chat);
router.post('/voice', aiController.explainVoice);

export default router;
