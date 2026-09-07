import { Router } from 'express';
import * as scanController from '../controllers/scan.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

router.use(authenticate);

import * as resultsController from '../controllers/results.controller';
import pageRoutes from './page.routes';
import issueRoutes from './issue.routes';
import reportRoutes from './report.routes';

// Note: projectId is needed for create scan, but scan details use scanId directly.
// We will mount this router twice, once under projects/:projectId/scans, and once under /scans
router.post('/', scanController.create);
router.get('/:scanId', scanController.getScan);
router.post('/:scanId/cancel', scanController.cancelScan);
router.get('/:scanId/progress', scanController.getProgress);
router.get('/:scanId/logs', scanController.getLogs);
router.get('/:scanId/results', resultsController.getAuditResults);

router.use('/:scanId/pages', pageRoutes);
router.use('/:scanId/issues', issueRoutes);
router.use('/:scanId/reports', reportRoutes);

export default router;
