import { Router } from 'express';
import * as o from '../controllers/orderController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { orderSchema } from '../validators/schemas.js';

const r = Router();
r.use(protect);
r.get('/quote', o.quote);
r.post('/coupon', o.applyCoupon);
r.post('/', validate(orderSchema), o.createOrder);
r.post('/verify-payment', o.verifyPayment);
r.post('/payment-failed', o.paymentFailed);
r.get('/', o.myOrders);
r.get('/:id', o.getMyOrder);
r.post('/:id/cancel', o.cancelMyOrder);
r.get('/:id/invoice', o.myInvoice);
export default r;
