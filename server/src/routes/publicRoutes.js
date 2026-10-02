import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import Category from '../models/Category.js';
import Collection from '../models/Collection.js';
import Banner from '../models/Banner.js';
import FAQ from '../models/FAQ.js';
import Testimonial from '../models/Testimonial.js';
import crud from '../controllers/crudFactory.js';
import * as c from '../controllers/contentController.js';
import { validate } from '../middleware/validate.js';
import { contactSchema, newsletterSchema } from '../validators/schemas.js';

const formLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { success: false, message: 'Too many requests. Please try again later.' } });
const r = Router();

r.get('/home', c.homeData);
r.get('/settings', c.publicSettings);
r.get('/cms/:key', c.getCmsPage);
r.get('/categories', crud(Category).listPublic);
r.get('/collections', crud(Collection).listPublic);
r.get('/collections/:slug', c.collectionBySlug);
r.get('/banners', crud(Banner).listPublic);
r.get('/faqs', crud(FAQ).listPublic);
r.get('/testimonials', crud(Testimonial).listPublic);
r.post('/contact', formLimiter, validate(contactSchema), c.submitContact);
r.post('/newsletter', formLimiter, validate(newsletterSchema), c.subscribe);
export default r;
