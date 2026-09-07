import { Router } from 'express';
import * as reportController from '../controllers/report.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

router.use(authenticate);

// Expected to be mounted at /scans/:scanId/reports
router.post('/', reportController.generateReport);

// Expected to be mounted at /reports
router.get('/', reportController.getReports);
router.get('/:reportId', reportController.getReport);
router.get('/:reportId/download', reportController.downloadReport);

export default router;
