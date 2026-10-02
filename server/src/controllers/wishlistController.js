import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const FIELDS = 'name slug sku price salePrice finalPrice stock images isBestseller isActive';

async function load(userId) {
  const wl = (await Wishlist.findOne({ user: userId })) || (await Wishlist.create({ user: userId, products: [] }));
  return wl;
}
const send = async (res, wl) => {
  const populated = await Wishlist.findById(wl._id).populate('products', FIELDS);
  res.json({ success: true, products: populated.products.filter((p) => p && p.isActive) });
};

export const getWishlist = asyncHandler(async (req, res) => send(res, await load(req.user._id)));

export const addToWishlist = asyncHandler(async (req, res) => {
  if (!(await Product.exists({ _id: req.params.productId, isActive: true }))) throw new ApiError(404, 'Product not found');
  const wl = await load(req.user._id);
  if (!wl.products.some((p) => String(p) === req.params.productId)) wl.products.push(req.params.productId);
  await wl.save();
  await send(res, wl);
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  const wl = await load(req.user._id);
  wl.products = wl.products.filter((p) => String(p) !== req.params.productId);
  await wl.save();
  await send(res, wl);
});
