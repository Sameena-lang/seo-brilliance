import { Router } from 'express';
import * as publicController from '../controllers/public.controller';

const router = Router();

router.post('/analyze', publicController.analyzeUrl);

export default router;
