import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "main", unique: true },
    storeName: { type: String, default: "Omkari Fashions" },
    phone: { type: String, default: "9177447021 / 9441090785" },
    whatsapp: { type: String, default: "919177447021" },
    email: { type: String, default: "omkarifashions1@gmail.com" },
    address: { type: String, default: "" },
    supportHours: { type: String, default: "Mon to Sat (10:00 AM - 8:00 PM)" },
    newsletterText: {
      type: String,
      default:
        "Be the first to know about new designs, special events and much more!",
    },
    social: {
      facebook: { type: String, default: "#" },
      pinterest: { type: String, default: "#" },
      instagram: { type: String, default: "#" },
      youtube: { type: String, default: "#" },
    },
    // commerce
    returnWindowDays: { type: Number, default: 7, min: 0 },
    returnsEnabled: { type: Boolean, default: true },
    shippingFee: { type: Number, default: 99, min: 0 },
    freeShippingAbove: { type: Number, default: 2000, min: 0 },
    taxPercent: { type: Number, default: 3, min: 0 },
    deliveryDays: { type: Number, default: 5, min: 1 },
    codEnabled: { type: Boolean, default: true },
    // email
    email_settings: {
      enabled: { type: Boolean, default: true },
      fromName: { type: String, default: "Omkari Fashions" },
      adminEmail: { type: String, default: "" },
      notifyAdminNewOrder: { type: Boolean, default: true },
      notifyAdminReturn: { type: Boolean, default: true },
      notifyAdminContact: { type: Boolean, default: true },
      sendWelcome: { type: Boolean, default: true },
      sendOrderEmails: { type: Boolean, default: true },
      sendReturnEmails: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

export default mongoose.model("SiteSettings", settingsSchema);
