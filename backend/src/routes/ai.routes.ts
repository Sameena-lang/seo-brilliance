import { Router } from 'express';
import * as aiController from '../controllers/ai.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/chat', aiController.chat);
router.post('/voice', aiController.explainVoice);
router.post('/explain-issue', aiController.explainIssue);
router.post('/generate-title', aiController.generateTitle);
router.post('/generate-meta-description', aiController.generateMetaDescription);
router.post('/generate-alt-text', aiController.generateAltText);
router.post('/analyze-content', aiController.analyzeContent);
router.post('/action-plan', aiController.generateActionPlan);

export default router;
