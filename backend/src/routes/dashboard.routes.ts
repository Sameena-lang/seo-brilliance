import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/overview', dashboardController.getOverview);
router.get('/recent-scans', dashboardController.getRecentScans);

export default router;
