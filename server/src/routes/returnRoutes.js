import { Router } from 'express';
import * as c from '../controllers/returnController.js';
import { protect } from '../middleware/auth.js';
import { proofUpload } from '../middleware/upload.js';

const r = Router();
r.use(protect);
r.post('/', proofUpload, c.createReturn);
r.get('/', c.myReturns);
r.get('/:id', c.getMyReturn);
r.post('/:id/respond', proofUpload, c.respondToReturn);
export default r;
