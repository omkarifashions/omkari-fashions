import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import env from '../config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOAD_DIR = path.resolve(__dirname, '../../uploads');

export const cloudinaryEnabled = Boolean(env.cloudinary.name && env.cloudinary.key && env.cloudinary.secret);

if (cloudinaryEnabled) {
  cloudinary.config({ cloud_name: env.cloudinary.name, api_key: env.cloudinary.key, api_secret: env.cloudinary.secret, secure: true });
}

const EXT = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export async function storeImage(file, folder = 'omkari') {
  if (cloudinaryEnabled) {
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: `omkari/${folder}`, resource_type: 'image', transformation: [{ width: 1800, crop: 'limit', quality: 'auto', fetch_format: 'auto' }] },
        (err, res) => (err ? reject(err) : resolve(res))
      );
      stream.end(file.buffer);
    });
    return { url: result.secure_url, publicId: result.public_id };
  }
  const dir = path.join(UPLOAD_DIR, folder.replace(/[^a-z0-9_-]/gi, ''));
  await fs.promises.mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${EXT[file.mimetype] || 'jpg'}`;
  await fs.promises.writeFile(path.join(dir, name), file.buffer);
  const rel = `/uploads/${folder.replace(/[^a-z0-9_-]/gi, '')}/${name}`;
  return { url: rel, publicId: rel };
}

export async function removeImage(publicId) {
  if (!publicId) return;
  try {
    if (cloudinaryEnabled && !publicId.startsWith('/uploads')) await cloudinary.uploader.destroy(publicId);
    else if (publicId.startsWith('/uploads/')) {
      const full = path.join(UPLOAD_DIR, publicId.replace('/uploads/', ''));
      if (full.startsWith(UPLOAD_DIR)) await fs.promises.unlink(full).catch(() => {});
    }
  } catch (e) {
    console.warn('Could not remove image', publicId, e.message);
  }
}
