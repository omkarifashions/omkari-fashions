import mongoose from 'mongoose';
import env from '../src/config/env.js';
import User from '../src/models/User.js';

await mongoose.connect(env.mongoUri);
let admin = await User.findOne({ email: env.admin.email.toLowerCase() });
if (admin) {
  admin.role = 'admin';
  admin.password = env.admin.password;
  await admin.save();
  console.log(`Admin updated: ${admin.email}`);
} else {
  admin = await User.create({ name: env.admin.name, email: env.admin.email, phone: '9000000000', password: env.admin.password, role: 'admin' });
  console.log(`Admin created: ${admin.email}`);
}
await mongoose.disconnect();
