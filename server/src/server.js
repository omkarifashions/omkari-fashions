import app from "./app.js";
import env from "./config/env.js";
import connectDB from "./config/db.js";
import Order from "./models/Order.js";
import { restoreStock, pushStatus } from "./services/orderService.js";

// Releases stock held by online-payment orders that were abandoned (no payment within 30 minutes).
async function releaseAbandonedOrders() {
  try {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000);
    const stale = await Order.find({
      paymentMethod: "razorpay",
      paymentStatus: "pending",
      orderStatus: "placed",
      createdAt: { $lt: cutoff },
    });
    for (const order of stale) {
      pushStatus(order, "cancelled", "Payment not completed");
      order.paymentStatus = "failed";
      order.cancellation = {
        reason: "Payment not completed in time",
        cancelledAt: new Date(),
        cancelledBy: "system",
      };
      // eslint-disable-next-line no-await-in-loop
      await restoreStock(order);
      // eslint-disable-next-line no-await-in-loop
      await order.save();
    }
  } catch (e) {
    console.warn("releaseAbandonedOrders failed:", e.message);
  }
}

connectDB()
  .then(() => {
    app.listen(env.port, () =>
      console.log(`API running on ${env.serverUrl} 🥳`),
    );
    setInterval(releaseAbandonedOrders, 10 * 60 * 1000).unref();
  })
  .catch((err) => {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  });

process.on("unhandledRejection", (err) =>
  console.error("Unhandled rejection:", err),
);
