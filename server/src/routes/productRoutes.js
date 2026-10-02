import { Router } from 'express';
import * as p from '../controllers/productController.js';

const r = Router();
r.get('/', p.listProducts);
r.get('/filters', p.productFilters);
r.get('/suggest', p.suggest);
r.get('/by-ids', p.productsByIds);
r.get('/delivery-estimate', p.deliveryEstimate);
r.get('/:slug', p.getProduct);
export default r;
