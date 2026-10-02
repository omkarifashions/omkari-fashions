// Strips MongoDB operators ($, .) from user supplied objects and neutralises basic XSS payloads.
const clean = (value) => {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (k.startsWith('$') || k.includes('.')) continue;
      out[k] = clean(v);
    }
    return out;
  }
  if (typeof value === 'string') {
    return value.replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi, '').replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '').replace(/javascript:/gi, '');
  }
  return value;
};

export const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') req.body = clean(req.body);
  if (req.query) {
    const q = clean(req.query);
    Object.keys(req.query).forEach((k) => delete req.query[k]);
    Object.assign(req.query, q);
  }
  next();
};
