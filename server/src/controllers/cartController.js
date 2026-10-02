import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import ApiError from '../utils/ApiError.js';
import asyncHandler from '../utils/asyncHandler.js';

const PRODUCT_FIELDS = 'name slug sku price salePrice finalPrice stock images isActive specifications stoneColor isReturnable';

async function loadCart(userId) {
  let cart = await Cart.findOne({ user: userId }).populate('items.product', PRODUCT_FIELDS);
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  // Drop products that were deleted / disabled, clamp quantities to available stock.
  let changed = false;
  cart.items = cart.items.filter((i) => {
    const ok = i.product && i.product.isActive;
    if (!ok) changed = true;
    return ok;
  });
  cart.items.forEach((i) => {
    if (i.product.stock > 0 && i.quantity > i.product.stock) {
      i.quantity = i.product.stock;
      changed = true;
    }
  });
  if (changed) await cart.save();
  return cart;
}

const send = (res, cart, extra = {}) =>
  res.json({ success: true, items: cart.items.map((i) => ({ product: i.product, quantity: i.quantity })), ...extra });

export const getCart = asyncHandler(async (req, res) => send(res, await loadCart(req.user._id)));

export const addToCart = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const quantity = Math.max(1, Math.min(20, parseInt(req.body.quantity, 10) || 1));
  const product = await Product.findOne({ _id: productId, isActive: true });
  if (!product) throw new ApiError(404, 'Product not found');
  if (product.stock < 1) throw new ApiError(409, 'This product is out of stock');
  const cart = await loadCart(req.user._id);
  const line = cart.items.find((i) => String(i.product._id) === String(productId));
  const next = (line ? line.quantity : 0) + quantity;
  if (next > product.stock) throw new ApiError(409, `Only ${product.stock} left in stock`);
  if (line) line.quantity = next;
  else cart.items.push({ product: product._id, quantity });
  await cart.save();
  send(res, await loadCart(req.user._id));
});

export const updateQuantity = asyncHandler(async (req, res) => {
  const quantity = parseInt(req.body.quantity, 10);
  if (!quantity || quantity < 1) throw new ApiError(400, 'Quantity must be at least 1');
  const cart = await loadCart(req.user._id);
  const line = cart.items.find((i) => String(i.product._id) === req.params.productId);
  if (!line) throw new ApiError(404, 'Item not in cart');
  if (quantity > line.product.stock) throw new ApiError(409, `Only ${line.product.stock} left in stock`);
  line.quantity = Math.min(quantity, 20);
  await cart.save();
  send(res, await loadCart(req.user._id));
});

export const removeItem = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (cart) {
    cart.items = cart.items.filter((i) => String(i.product) !== req.params.productId);
    await cart.save();
  }
  send(res, await loadCart(req.user._id));
});

export const clearCart = asyncHandler(async (req, res) => {
  await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });
  send(res, await loadCart(req.user._id));
});

// Merge a guest (localStorage) cart into the customer's cart after login.
export const mergeCart = asyncHandler(async (req, res) => {
  const incoming = Array.isArray(req.body.items) ? req.body.items.slice(0, 50) : [];
  const cart = await loadCart(req.user._id);
  for (const it of incoming) {
    if (!/^[a-f\d]{24}$/i.test(String(it.productId))) continue;
    // eslint-disable-next-line no-await-in-loop
    const product = await Product.findOne({ _id: it.productId, isActive: true, stock: { $gt: 0 } });
    if (!product) continue;
    const q = Math.max(1, Math.min(20, parseInt(it.quantity, 10) || 1));
    const line = cart.items.find((i) => String(i.product._id) === String(product._id));
    if (line) line.quantity = Math.min(product.stock, Math.max(line.quantity, q));
    else cart.items.push({ product: product._id, quantity: Math.min(product.stock, q) });
  }
  await cart.save();
  send(res, await loadCart(req.user._id));
});
