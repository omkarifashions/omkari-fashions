import http, { unwrap } from './http.js';

const get = (url, params) => unwrap(http.get(url, { params }));
const post = (url, data, cfg) => unwrap(http.post(url, data, cfg));
const put = (url, data) => unwrap(http.put(url, data));
const del = (url) => unwrap(http.delete(url));
const multipart = { headers: { 'Content-Type': 'multipart/form-data' } };

export const authApi = {
  register: (d) => post('/auth/register', d),
  login: (d) => post('/auth/login', d),
  logout: () => post('/auth/logout'),
  me: () => get('/auth/me'),
  updateProfile: (d) => put('/auth/profile', d),
  changePassword: (d) => put('/auth/password', d),
  addAddress: (d) => post('/auth/addresses', d),
  deleteAddress: (id) => del(`/auth/addresses/${id}`),
  forgot: (d) => post('/auth/forgot-password', d),
  reset: (token, d) => post(`/auth/reset-password/${token}`, d),
  adminLogin: (d) => post('/auth/admin/login', d),
  adminLogout: () => post('/auth/admin/logout'),
  adminMe: () => get('/auth/admin/me'),
  adminPassword: (d) => put('/auth/admin/password', d),
};

export const catalogApi = {
  products: (params) => get('/products', params),
  filters: (params) => get('/products/filters', params),
  suggest: (q) => get('/products/suggest', { q }),
  byIds: (ids) => get('/products/by-ids', { ids: ids.join(',') }),
  product: (slug) => get(`/products/${slug}`),
  delivery: (pincode) => get('/products/delivery-estimate', { pincode }),
  categories: () => get('/categories'),
  collections: () => get('/collections'),
  collection: (slug) => get(`/collections/${slug}`),
  home: () => get('/home'),
  settings: () => get('/settings'),
  cms: (key) => get(`/cms/${key}`),
  faqs: () => get('/faqs'),
  contact: (d) => post('/contact', d),
  subscribe: (d) => post('/newsletter', d),
};

export const cartApi = {
  get: () => get('/cart'),
  add: (productId, quantity) => post('/cart', { productId, quantity }),
  setQty: (productId, quantity) => put(`/cart/${productId}`, { quantity }),
  remove: (productId) => del(`/cart/${productId}`),
  merge: (items) => post('/cart/merge', { items }),
};

export const wishlistApi = {
  get: () => get('/wishlist'),
  add: (id) => post(`/wishlist/${id}`),
  remove: (id) => del(`/wishlist/${id}`),
};

export const orderApi = {
  quote: (params) => get('/orders/quote', params),
  coupon: (code) => post('/orders/coupon', { code }),
  create: (d) => post('/orders', d),
  verify: (d) => post('/orders/verify-payment', d),
  failed: (d) => post('/orders/payment-failed', d),
  list: (page) => get('/orders', { page }),
  get: (id) => get(`/orders/${id}`),
  cancel: (id, reason) => post(`/orders/${id}/cancel`, { reason }),
  invoice: (id) => http.get(`/orders/${id}/invoice`, { responseType: 'blob' }),
};

export const returnApi = {
  create: (formData) => post('/returns', formData, multipart),
  list: () => get('/returns'),
  get: (id) => get(`/returns/${id}`),
  respond: (id, formData) => post(`/returns/${id}/respond`, formData, multipart),
};

export const reviewApi = {
  forProduct: (id) => get(`/reviews/product/${id}`),
  eligibility: (id) => get(`/reviews/eligibility/${id}`),
  create: (formData) => post('/reviews', formData, multipart),
};

export const adminApi = {
  dashboard: () => get('/admin/dashboard'),
  upload: (files, folder, onProgress) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('images', f));
    return post(`/admin/uploads?folder=${folder || 'misc'}`, fd, { ...multipart, onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / (e.total || e.loaded || 1))) });
  },
  list: (resource, params) => get(`/admin/${resource}`, params),
  getOne: (resource, id) => get(`/admin/${resource}/${id}`),
  create: (resource, d) => post(`/admin/${resource}`, d),
  update: (resource, id, d) => put(`/admin/${resource}/${id}`, d),
  remove: (resource, id) => del(`/admin/${resource}/${id}`),
  updateOrderStatus: (id, d) => put(`/admin/orders/${id}/status`, d),
  markRefunded: (id, d) => post(`/admin/orders/${id}/refunded`, d),
  file: (path) => http.get(`/admin${path}`, { responseType: 'blob' }),
  updateReturn: (id, d) => put(`/admin/returns/${id}`, d),
  setCustomerStatus: (id, isActive) => put(`/admin/customers/${id}/status`, { isActive }),
  reviewStatus: (id, status) => put(`/admin/reviews/${id}/status`, { status }),
  featureReview: (id) => post(`/admin/reviews/${id}/feature`),
  messageRead: (id, isRead) => put(`/admin/messages/${id}/read`, { isRead }),
  saveCms: (key, d) => put(`/admin/cms/${key}`, d),
  settings: () => get('/admin/settings'),
  saveSettings: (d) => put('/admin/settings', d),
};
