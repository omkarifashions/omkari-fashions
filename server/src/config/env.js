import dotenv from 'dotenv';
dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  serverUrl: process.env.SERVER_URL || 'http://localhost:5000',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/omkari_fashions',
  jwtSecret: process.env.JWT_SECRET || 'dev_only_secret_change_me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  cloudinary: {
    name: process.env.CLOUDINARY_CLOUD_NAME || '',
    key: process.env.CLOUDINARY_API_KEY || '',
    secret: process.env.CLOUDINARY_API_SECRET || '',
  },
  resendKey: process.env.RESEND_API_KEY || '',
  emailFrom: process.env.EMAIL_FROM || 'Omkari Fashions <onboarding@resend.dev>',
  admin: {
    name: process.env.ADMIN_NAME || 'Omkari Admin',
    email: process.env.ADMIN_EMAIL || 'admin@omkarifashions.com',
    password: process.env.ADMIN_PASSWORD || 'ChangeMe@123',
  },
};

if (env.isProd && env.jwtSecret === 'dev_only_secret_change_me') {
  throw new Error('JWT_SECRET must be set in production');
}

export default env;
