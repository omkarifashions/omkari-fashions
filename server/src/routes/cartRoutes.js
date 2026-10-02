import { Router } from 'express';
import * as c from '../controllers/cartController.js';
import { protect } from '../middleware/auth.js';

const r = Router();
r.use(protect);
r.get('/', c.getCart);
r.post('/', c.addToCart);
r.post('/merge', c.mergeCart);
r.put('/:productId', c.updateQuantity);
r.delete('/:productId', c.removeItem);
r.delete('/', c.clearCart);
export default r;
