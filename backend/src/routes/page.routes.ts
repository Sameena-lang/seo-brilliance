import { Router } from 'express';
import * as pageController from '../controllers/page.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router({ mergeParams: true });

router.use(authenticate);

// Handle GET / based on whether scanId is present in params
router.get('/', (req: any, res, next) => {
  if (req.params.scanId) {
    return pageController.getScanPages(req, res, next);
  }
  return pageController.getAllPages(req, res, next);
});
// Expected to be mounted at /pages
router.get('/:pageId', pageController.getPageDetails);

export default router;
