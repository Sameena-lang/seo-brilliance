import { Router } from 'express';
import * as projectController from '../controllers/project.controller';
import { validate } from '../middlewares/validate.middleware';
import { createProjectSchema, updateProjectSchema } from '../schemas/project.schema';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', validate(createProjectSchema), projectController.create);
router.get('/', projectController.getAll);
router.get('/:id', projectController.getById);
router.put('/:id', validate(updateProjectSchema), projectController.update);
router.delete('/:id', projectController.remove);

router.get('/:id/health', projectController.getHealth);
router.get('/:id/opportunities', projectController.getOpportunities);
router.get('/:id/history', projectController.getHistory);
router.get('/:id/keywords', projectController.getKeywords);
router.post('/:id/keywords', projectController.addKeyword);
router.get('/:id/competitors', projectController.getCompetitors);
router.post('/:id/competitors', projectController.addCompetitor);
router.get('/:id/search-console', projectController.getSearchConsoleMetrics);
router.get('/:id/analytics', projectController.getAnalyticsMetrics);

export default router;
