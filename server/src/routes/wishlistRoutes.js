import { Router } from 'express';
import * as c from '../controllers/wishlistController.js';
import { protect } from '../middleware/auth.js';

const r = Router();
r.use(protect);
r.get('/', c.getWishlist);
r.post('/:productId', c.addToWishlist);
r.delete('/:productId', c.removeFromWishlist);
export default r;
