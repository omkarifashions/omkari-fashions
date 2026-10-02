import { Resend } from "resend";
import env from "../config/env.js";
import { getSettings } from "./settingsService.js";
import { money } from "../utils/helpers.js";

const resend = env.resendKey ? new Resend(env.resendKey) : null;

/* =========================================================
   EMAIL WRAPPER
========================================================= */

const wrap = (title, body) => `
<div style="font-family:Arial,Helvetica,sans-serif;background:#faede3;padding:24px">
  <div style="max-width:560px;margin:auto;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #ecd5c6">

    <div style="
      background:linear-gradient(90deg,#a84300,#4a1d00);
      padding:18px 24px;
      color:#fff;
      font-size:20px;
      font-family:Georgia,serif
    ">
      Omkari Fashions
    </div>

    <div style="
      padding:24px;
      color:#3b2314;
      line-height:1.55
    ">
      <h2 style="
        margin:0 0 12px;
        color:#7a2e00;
        font-family:Georgia,serif
      ">
        ${title}
      </h2>

      ${body}
    </div>

    <div style="
      background:#faede3;
      padding:14px 24px;
      font-size:12px;
      color:#7a5a48
    ">
      Omkari Fashions - Traditional Indian Jewellery since 1975
    </div>

  </div>
</div>`;

/* =========================================================
   SEND EMAIL
========================================================= */

export async function sendEmail({
  to,
  subject,
  title,
  html,
  category = "general",
}) {
  try {
    const s = await getSettings();
    const cfg = s.email_settings || {};

    if (cfg.enabled === false) {
      return false;
    }

    /* Customer email settings */

    if (category === "welcome" && cfg.sendWelcome === false) {
      return false;
    }

    if (category === "order" && cfg.sendOrderEmails === false) {
      return false;
    }

    if (category === "return" && cfg.sendReturnEmails === false) {
      return false;
    }

    if (!to) {
      return false;
    }

    const body = wrap(title || subject, html);

    /* Development / dry-run */

    if (!resend) {
      console.log(
        `[email:dry-run] to=${to} subject="${subject}" (set RESEND_API_KEY to send real emails)`,
      );

      return false;
    }

    const from = cfg.fromName
      ? `${cfg.fromName} <${
          env.emailFrom.match(/<(.+)>/)?.[1] || env.emailFrom
        }>`
      : env.emailFrom;

    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      html: body,
    });

    if (error) {
      console.warn("Resend error:", error.message || error);
      return false;
    }

    return true;
  } catch (e) {
    console.warn("Email failed:", e.message);
    return false;
  }
}

/* =========================================================
   ADMIN EMAIL NOTIFICATION
========================================================= */

export async function notifyAdmin(kind, subject, html) {
  try {
    const s = await getSettings();
    const cfg = s.email_settings || {};

    /*
     * Admin notification settings
     *
     * customer  -> new customer registration
     * order     -> new order
     * cancel    -> order cancellation
     * return    -> new return request
     */

    const flag = {
      customer: "notifyAdminNewCustomer",
      order: "notifyAdminNewOrder",
      cancel: "notifyAdminOrderCancelled",
      return: "notifyAdminReturn",
    }[kind];

    if (flag && cfg[flag] === false) {
      return false;
    }

    const to = cfg.adminEmail || s.email;

    return sendEmail({
      to,
      subject,
      title: subject,
      html,
      category: "admin",
    });
  } catch (e) {
    console.warn("Admin notification failed:", e.message);
    return false;
  }
}

/* =========================================================
   ORDER TABLE
========================================================= */

const orderTable = (order) =>
  `<table style="width:100%;border-collapse:collapse;font-size:14px">

    ${order.items
      .map(
        (i) => `
        <tr>
          <td style="
            padding:6px 0;
            border-bottom:1px solid #f0e2d8
          ">
            ${i.name} x ${i.quantity}
          </td>

          <td style="
            text-align:right;
            border-bottom:1px solid #f0e2d8
          ">
            ${money(i.price * i.quantity)}
          </td>
        </tr>
      `,
      )
      .join("")}

    <tr>
      <td style="padding-top:8px">
        <b>Total</b>
      </td>

      <td style="
        text-align:right;
        padding-top:8px
      ">
        <b>${money(order.total)}</b>
      </td>
    </tr>

  </table>`;

/* =========================================================
   EMAIL TEMPLATES
========================================================= */

export const mail = {
  /* =======================================================
     CUSTOMER
  ======================================================= */

  /*
   * Customer welcome email
   */
  welcome: (user) =>
    sendEmail({
      to: user.email,
      subject: "Welcome to Omkari Fashions",
      title: `Welcome, ${user.name}!`,
      category: "welcome",

      html: `
        <p>
          Thank you for joining Omkari Fashions.
        </p>

        <p>
          Explore our God Jewellery, Bharatnatyam sets,
          Jadau Kundan and much more.
        </p>
      `,
    }),

  /*
   * Password reset
   */
  passwordReset: (user, link) =>
    sendEmail({
      to: user.email,
      subject: "Reset your Omkari Fashions password",
      title: "Password reset",
      category: "auth",

      html: `
        <p>
          We received a request to reset your password.
          This link is valid for 30 minutes.
        </p>

        <p>
          <a
            href="${link}"
            style="
              background:#a84300;
              color:#fff;
              padding:10px 18px;
              border-radius:6px;
              text-decoration:none
            "
          >
            Reset Password
          </a>
        </p>

        <p style="font-size:12px;color:#7a5a48">
          If you did not request this, you can safely ignore this email.
        </p>
      `,
    }),

  /*
   * Customer order confirmation
   */
  orderConfirmation: (user, order) =>
    sendEmail({
      to: user.email,
      subject: `Order ${order.orderNumber} confirmed`,
      title: "Thank you for your order",
      category: "order",

      html: `
        <p>
          Your order
          <b>${order.orderNumber}</b>
          has been placed successfully.
        </p>

        ${orderTable(order)}

        <p>
          Payment:
          <b>
            ${
              order.paymentMethod === "cod"
                ? "Cash on Delivery"
                : "Online (Razorpay)"
            }
          </b>
        </p>
      `,
    }),

  /*
   * Customer payment received
   */
  paymentReceived: (user, order) =>
    sendEmail({
      to: user.email,
      subject: `Payment received for ${order.orderNumber}`,
      title: "Payment received",
      category: "order",

      html: `
        <p>
          We have received your payment of
          <b>${money(order.total)}</b>
          for order
          <b>${order.orderNumber}</b>.
        </p>

        <p>
          Payment ID:
          ${order.razorpay?.paymentId || "-"}
        </p>
      `,
    }),

  /*
   * Customer order status
   */
  orderStatus: (user, order) =>
    sendEmail({
      to: user.email,
      subject: `Order ${order.orderNumber}: ${order.orderStatus.replace(
        /_/g,
        " ",
      )}`,
      title: "Order update",
      category: "order",

      html: `
        <p>
          Your order
          <b>${order.orderNumber}</b>
          is now
          <b>${order.orderStatus.replace(/_/g, " ")}</b>.
        </p>

        ${
          order.trackingId
            ? `
              <p>
                Tracking ID:
                <b>${order.trackingId}</b>
                (${order.courier || "Courier"})
              </p>
            `
            : ""
        }
      `,
    }),

  /* =======================================================
     ADMIN - NEW CUSTOMER
  ======================================================= */

  adminNewCustomer: (user) =>
    notifyAdmin(
      "customer",
      "New customer registered",
      `
        <p>
          A new customer has registered on Omkari Fashions.
        </p>

        <table style="
          width:100%;
          border-collapse:collapse;
          font-size:14px;
        ">

          <tr>
            <td style="padding:6px 0;color:#7a5a48">
              Name
            </td>

            <td style="padding:6px 0;text-align:right">
              <b>${user.name}</b>
            </td>
          </tr>

          <tr>
            <td style="padding:6px 0;color:#7a5a48">
              Email
            </td>

            <td style="padding:6px 0;text-align:right">
              <b>${user.email}</b>
            </td>
          </tr>

          ${
            user.phone
              ? `
                <tr>
                  <td style="padding:6px 0;color:#7a5a48">
                    Phone
                  </td>

                  <td style="padding:6px 0;text-align:right">
                    <b>${user.phone}</b>
                  </td>
                </tr>
              `
              : ""
          }

        </table>
      `,
    ),

  /* =======================================================
     ADMIN - NEW ORDER
  ======================================================= */

  adminNewOrder: (order, user) =>
    notifyAdmin(
      "order",
      `New order ${order.orderNumber}`,
      `
        <p>
          <b>${user.name}</b>
          (${user.email})
          placed a new order.
        </p>

        <p>
          Order value:
          <b>${money(order.total)}</b>
        </p>

        <p>
          Payment:
          <b>
            ${
              order.paymentMethod === "cod"
                ? "Cash on Delivery"
                : "Online (Razorpay)"
            }
          </b>
        </p>

        ${orderTable(order)}
      `,
    ),

  /* =======================================================
     ADMIN - ORDER CANCELLED
  ======================================================= */

  adminOrderCancelled: (order, user) =>
    notifyAdmin(
      "cancel",
      `Order ${order.orderNumber} cancelled`,
      `
        <p>
          <b>${user.name}</b>
          (${user.email})
          has cancelled order
          <b>${order.orderNumber}</b>.
        </p>

        <p>
          Order value:
          <b>${money(order.total)}</b>
        </p>

        ${orderTable(order)}
      `,
    ),

  /* =======================================================
     CUSTOMER - RETURN REQUEST
  ======================================================= */

  returnReceived: (user, ret) =>
    sendEmail({
      to: user.email,
      subject: `Return request ${ret.returnNumber} received`,
      title: "Return request received",
      category: "return",

      html: `
        <p>
          We received your return request for
          <b>${ret.item.name}</b>
          from order
          <b>${ret.orderNumber}</b>.
        </p>

        <p>
          Our team will review it shortly.
        </p>
      `,
    }),

  /* =======================================================
     ADMIN - NEW RETURN
  ======================================================= */

  adminReturn: (ret, user) =>
    notifyAdmin(
      "return",
      `New return request ${ret.returnNumber}`,
      `
        <p>
          <b>${user.name}</b>
          (${user.email})
          requested a return.
        </p>

        <p>
          Product:
          <b>${ret.item.name}</b>
        </p>

        <p>
          Order:
          <b>${ret.orderNumber}</b>
        </p>

        <p>
          Reason:
          <b>${ret.reason}</b>
        </p>
      `,
    ),

  /* =======================================================
     CUSTOMER - RETURN STATUS
  ======================================================= */

  returnStatus: (user, ret) => {
    const label = ret.status.replace(/_/g, " ");

    const subjectMap = {
      approved: "approved",
      rejected: "rejected",
      refund_processing: "refund initiated",
      refund_completed: "refund completed",
    };

    return sendEmail({
      to: user.email,

      subject: `Return ${ret.returnNumber} ${subjectMap[ret.status] || label}`,

      title: "Return update",

      category: "return",

      html: `
        <p>
          Your return
          <b>${ret.returnNumber}</b>
          for
          <b>${ret.item.name}</b>
          is now
          <b>${label}</b>.
        </p>

        ${
          ret.status === "refund_completed"
            ? `
              <p>
                Refund amount
                <b>${money(ret.refundAmount)}</b>
                has been completed.
              </p>
            `
            : ""
        }
      `,
    });
  },
};
