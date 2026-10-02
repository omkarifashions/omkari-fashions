import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';
import { uniqueSlug } from '../utils/helpers.js';

/**
 * Builds public + admin handlers for simple content models
 * (categories, collections, banners, faqs, testimonials, coupons).
 */
export default function crud(Model, { slugFrom, populate, sort = { displayOrder: 1, createdAt: -1 }, onDelete, beforeSave, label = 'Item' } = {}) {
  const strip = (b) => {
    const body = { ...b };
    delete body._id;
    delete body.createdAt;
    delete body.updatedAt;
    delete body.__v;
    return body;
  };

  return {
    listPublic: asyncHandler(async (req, res) => {
      let q = Model.find({ isActive: true }).sort(sort);
      if (populate) q = q.populate(populate);
      res.json({ success: true, items: await q.lean() });
    }),
    listAdmin: asyncHandler(async (req, res) => {
      let q = Model.find().sort(sort);
      if (populate) q = q.populate(populate);
      res.json({ success: true, items: await q.lean() });
    }),
    get: asyncHandler(async (req, res) => {
      let q = Model.findById(req.params.id);
      if (populate) q = q.populate(populate);
      const item = await q;
      if (!item) throw new ApiError(404, `${label} not found`);
      res.json({ success: true, item });
    }),
    create: asyncHandler(async (req, res) => {
      const body = strip(req.body);
      if (slugFrom) body.slug = await uniqueSlug(Model, body.slug || body[slugFrom]);
      if (beforeSave) await beforeSave(body);
      const item = await Model.create(body);
      res.status(201).json({ success: true, item });
    }),
    update: asyncHandler(async (req, res) => {
      const item = await Model.findById(req.params.id);
      if (!item) throw new ApiError(404, `${label} not found`);
      const body = strip(req.body);
      if (slugFrom && body.slug !== undefined) body.slug = await uniqueSlug(Model, body.slug || body[slugFrom] || item[slugFrom], item._id);
      if (beforeSave) await beforeSave(body, item);
      item.set(body);
      await item.save();
      res.json({ success: true, item });
    }),
    remove: asyncHandler(async (req, res) => {
      const item = await Model.findById(req.params.id);
      if (!item) throw new ApiError(404, `${label} not found`);
      if (onDelete) await onDelete(item);
      await item.deleteOne();
      res.json({ success: true });
    }),
  };
}
