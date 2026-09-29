import { Router } from 'express';
import * as integrationController from '../controllers/integration.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

// Callback route
router.get('/callback', integrationController.handleCallback);

// All other routes require authentication
router.use(authenticate);

// Mount under /api/v1/integrations in app.ts, so paths look like /api/v1/integrations/:projectId/:provider/...
router.get('/:projectId/:provider/status', integrationController.getStatus);
router.post('/:projectId/:provider/connect', integrationController.connect);
router.get('/:projectId/:provider/properties', integrationController.getProperties);
router.post('/:projectId/:provider/select-property', integrationController.selectProperty);
router.post('/:projectId/:provider/sync', integrationController.syncData);
router.delete('/:projectId/:provider', integrationController.disconnect);

export default router;
