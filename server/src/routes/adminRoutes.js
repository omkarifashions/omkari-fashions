import { Router } from 'express';
import Category from '../models/Category.js';
import Collection from '../models/Collection.js';
import Banner from '../models/Banner.js';
import FAQ from '../models/FAQ.js';
import Testimonial from '../models/Testimonial.js';
import Coupon from '../models/Coupon.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';
import crud from '../controllers/crudFactory.js';
import { adminOnly } from '../middleware/auth.js';
import { adminUpload } from '../middleware/upload.js';
import * as p from '../controllers/productController.js';
import * as o from '../controllers/orderController.js';
import * as ret from '../controllers/returnController.js';
import * as rv from '../controllers/reviewController.js';
import * as ct from '../controllers/contentController.js';
import * as a from '../controllers/adminController.js';

const r = Router();
r.use(adminOnly);

r.get('/dashboard', a.dashboard);
r.post('/uploads', adminUpload, ct.uploadImages);

// products
r.get('/products', p.adminList);
r.post('/products', p.createProduct);
r.get('/products/:id', p.adminGet);
r.put('/products/:id', p.updateProduct);
r.delete('/products/:id', p.deleteProduct);

// simple content resources
const mount = (path, handlers) => {
  r.get(path, handlers.listAdmin);
  r.get(`${path}/:id`, handlers.get);
  r.post(path, handlers.create);
  r.put(`${path}/:id`, handlers.update);
  r.delete(`${path}/:id`, handlers.remove);
};
mount('/categories', crud(Category, {
  slugFrom: 'name', sort: { displayOrder: 1, name: 1 }, label: 'Category',
  onDelete: async (cat) => {
    if (await Product.exists({ category: cat._id })) throw new ApiError(400, 'This category still has products. Move or delete them first.');
  },
}));
mount('/collections', crud(Collection, { slugFrom: 'title', populate: { path: 'products', select: 'name sku images' }, label: 'Collection' }));
mount('/banners', crud(Banner, { label: 'Banner' }));
mount('/faqs', crud(FAQ, { label: 'FAQ' }));
mount('/testimonials', crud(Testimonial, { label: 'Testimonial' }));
mount('/coupons', crud(Coupon, { sort: { createdAt: -1 }, label: 'Coupon' }));

// orders
r.get('/orders', o.adminOrders);
r.get('/orders/:id', o.adminGetOrder);
r.put('/orders/:id/status', o.adminUpdateStatus);
r.post('/orders/:id/refunded', o.adminMarkRefunded);
r.get('/orders/:id/invoice', o.adminInvoice);
r.get('/orders/:id/shipping-label', o.adminShippingLabel);

// returns
r.get('/returns', ret.adminListReturns);
r.get('/returns/:id', ret.adminGetReturn);
r.put('/returns/:id', ret.adminUpdateReturn);

// customers
r.get('/customers', a.customers);
r.put('/customers/:id/status', a.setCustomerStatus);
r.get('/customers/:id/orders', a.customerOrders);

// reviews
r.get('/reviews', rv.adminReviews);
r.put('/reviews/:id/status', rv.adminSetReviewStatus);
r.post('/reviews/:id/feature', rv.adminFeatureReview);
r.delete('/reviews/:id', rv.adminDeleteReview);

// messages / newsletter
r.get('/messages', ct.adminMessages);
r.put('/messages/:id/read', ct.adminMessageRead);
r.delete('/messages/:id', ct.adminMessageDelete);
r.get('/newsletter', ct.adminSubscribers);
r.delete('/newsletter/:id', ct.adminSubscriberDelete);

// cms + settings
r.get('/cms', ct.adminListCms);
r.put('/cms/:key', ct.adminSaveCms);
r.get('/settings', ct.adminSettings);
r.put('/settings', ct.adminUpdateSettings);

export default r;
