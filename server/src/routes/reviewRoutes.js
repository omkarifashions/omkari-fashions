import { Router } from 'express';
import * as c from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';
import { proofUpload } from '../middleware/upload.js';

const r = Router();
r.get('/product/:productId', c.productReviews);
r.get('/eligibility/:productId', protect, c.eligibility);
r.post('/', protect, proofUpload, c.createReview);
export default r;
