import { Router } from 'express';
import * as issueController from '../controllers/issue.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

router.use(authenticate);

// Handle GET / based on whether scanId is present in params
router.get('/', (req: any, res, next) => {
  if (req.params.scanId) {
    return issueController.getScanIssues(req, res, next);
  }
  return issueController.getAllIssues(req, res, next);
});

router.get('/:issueId', issueController.getIssue);
router.patch('/:issueId/status', issueController.updateIssueStatus);

export default router;
