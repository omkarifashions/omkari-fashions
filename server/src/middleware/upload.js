import multer from 'multer';
import ApiError from '../utils/ApiError.js';

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

const make = (maxFiles) =>
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: maxFiles },
    fileFilter: (req, file, cb) => {
      if (!ALLOWED.includes(file.mimetype)) return cb(new ApiError(400, 'Only JPG, PNG or WEBP images are allowed'));
      return cb(null, true);
    },
  }).array('images', maxFiles);

export const adminUpload = make(10);
export const proofUpload = make(5);
