import axios from "axios";
import { env } from "../config/env";
import { IOrder } from "../models/Order";

export const sendOrderNotificationEmail = async (
  order: IOrder,
): Promise<void> => {
  const apiKey = env.AUTOSEND_API_KEY;
  const adminEmail = env.TO_EMAIL;
  const fromEmail = env.FROM_EMAIL;

  const orderItemsList = order.items
    .map(
      (item) =>
        `<li><strong>${item.name}</strong> × ${item.quantity} - ₹${item.discountedPrice || item.price} each (Subtotal: ₹${item.subtotal})</li>`,
    )
    .join("");

  const emailSubject = `New Rakhi Order 🎉 - ${order.orderNumber}`;
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #d97706; text-align: center; border-bottom: 2px solid #f59e0b; padding-bottom: 10px;">New Rakhi Order Received!</h2>
      <p style="font-size: 16px;"><strong>Order Number:</strong> ${order.orderNumber}</p>
      
      <h3 style="color: #4b5563; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Customer Details</h3>
      <p><strong>Name:</strong> ${order.customer.name}</p>
      <p><strong>Phone:</strong> ${order.customer.phone}</p>
      
      <h3 style="color: #4b5563; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Delivery Location</h3>
      <p><strong>Society:</strong> ${order.deliveryAddress.societyName}</p>
      <p><strong>Block/Tower:</strong> ${order.deliveryAddress.block}</p>
      <p><strong>Floor:</strong> ${order.deliveryAddress.floor}</p>
      <p><strong>Flat/House Number:</strong> ${order.deliveryAddress.flatNumber}</p>
      ${order.deliveryAddress.instructions ? `<p><strong>Instructions:</strong> ${order.deliveryAddress.instructions}</p>` : ""}
      
      <h3 style="color: #4b5563; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Items</h3>
      <ul style="padding-left: 20px;">
        ${orderItemsList}
      </ul>
      
      <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
        <p style="margin: 5px 0;"><strong>Subtotal:</strong> ₹${order.subtotal}</p>
        <p style="margin: 5px 0; color: #dc2626;"><strong>Discount:</strong> -₹${order.discount} ${order.couponCode ? `(Coupon: ${order.couponCode})` : ""}</p>
        <h3 style="margin: 10px 0 0 0; color: #111827;"><strong>Total:</strong> ₹${order.total}</h3>
      </div>
      
      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 30px;">Society Rakhi Store Automation</p>
    </div>
  `;

  const emailText = `
    New Rakhi Order 🎉
    Order: ${order.orderNumber}
    
    Customer:
    ${order.customer.name}
    Phone: ${order.customer.phone}
    
    Delivery Address:
    Society: ${order.deliveryAddress.societyName}
    Block: ${order.deliveryAddress.block}
    Floor: ${order.deliveryAddress.floor}
    Flat: ${order.deliveryAddress.flatNumber}
    Instructions: ${order.deliveryAddress.instructions || "None"}
    
    Items:
    ${order.items.map((item) => `- ${item.name} x ${item.quantity} (₹${item.discountedPrice || item.price} each) = ₹${item.subtotal}`).join("\n")}
    
    Subtotal: ₹${order.subtotal}
    Discount: -₹${order.discount}
    Total: ₹${order.total}
    Status: ${order.status}
  `;

  if (!apiKey) {
    console.log("--- AUTOSEND NOT CONFIGURED (LOGGING EMAIL) ---");
    console.log("To:", adminEmail);
    console.log("Subject:", emailSubject);
    console.log("Body:", emailText);
    console.log("-----------------------------------------------");
    return;
  }

  try {
    const payload = {
      from: { email: fromEmail, name: "Rakhi Store" },
      to: { email: adminEmail, name: "Admin" },
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    };

    const response = await axios.post(
      "https://api.autosend.com/v1/mails/send",
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );

    console.log(
      `Email notification successfully sent for order ${order.orderNumber}: status ${response.status}`,
    );
  } catch (error: any) {
    const errorMsg = error.response?.data
      ? JSON.stringify(error.response.data)
      : error.message || error;
    console.error(
      `FAILED to send email notification for order ${order.orderNumber}:`,
      errorMsg,
    );
  }
};

// ─── Status Update Email to Customer ───────────────────────────────────────

const STATUS_LABELS: Record<string, { subject: string; headline: string; emoji: string; color: string }> = {
  PLACED:           { subject: 'Order Received',         headline: "We've received your order!",          emoji: '🎉', color: '#d97706' },
  CONFIRMED:        { subject: 'Order Confirmed',        headline: 'Your order is confirmed!',             emoji: '✅', color: '#059669' },
  PACKED:           { subject: 'Your Rakhis Are Packed', headline: 'Your Rakhis are beautifully packed!',  emoji: '🎁', color: '#7c3aed' },
  OUT_FOR_DELIVERY: { subject: 'Out for Delivery',       headline: 'Your Rakhis are on the way!',          emoji: '🚚', color: '#2563eb' },
  DELIVERED:        { subject: 'Delivered!',             headline: 'Your Rakhis have been delivered!',     emoji: '💝', color: '#dc2626' },
  CANCELLED:        { subject: 'Order Cancelled',        headline: 'Your order has been cancelled.',       emoji: '❌', color: '#6b7280' },
};

const ALL_STEPS = ['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED'];
const STEP_LABELS: Record<string, string> = {
  PLACED: 'Placed', CONFIRMED: 'Confirmed', PACKED: 'Packed',
  OUT_FOR_DELIVERY: 'Delivery', DELIVERED: 'Delivered',
};

export const sendOrderStatusUpdateEmail = async (order: IOrder): Promise<void> => {
  const customerEmail = order.customer.email;
  if (!customerEmail) return; // No email provided — silently skip

  const apiKey = env.AUTOSEND_API_KEY;
  const fromEmail = env.FROM_EMAIL;
  const frontendUrl = env.FRONTEND_URL || 'http://localhost:5173';

  const meta = STATUS_LABELS[order.status] || STATUS_LABELS['PLACED'];
  const currentIdx = ALL_STEPS.indexOf(order.status);

  const stepsHtml = ALL_STEPS.map((step, idx) => {
    const isDone = idx <= currentIdx;
    const isCurrent = idx === currentIdx;
    const bg = isCurrent ? meta.color : isDone ? '#374151' : '#e5e7eb';
    const textColor = isDone ? '#ffffff' : '#9ca3af';
    return `<td align="center" style="padding:0 4px;vertical-align:top;">
      <div style="width:34px;height:34px;border-radius:50%;background:${bg};display:table-cell;vertical-align:middle;text-align:center;font-size:12px;font-weight:bold;color:${textColor};">${isDone ? '✓' : String(idx + 1)}</div>
      <div style="font-size:9px;font-weight:600;color:${isDone ? '#374151' : '#9ca3af'};margin-top:4px;text-transform:uppercase;letter-spacing:0.5px;">${STEP_LABELS[step]}</div>
    </td>`;
  }).join('');

  const itemsHtml = order.items.map((item) => {
    const price = item.discountedPrice !== undefined ? item.discountedPrice : item.price;
    return `<tr>
      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#374151;font-weight:600;">${item.name} <span style="color:#9ca3af;font-weight:400;">× ${item.quantity}</span></td>
      <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;font-weight:700;text-align:right;">₹${price * item.quantity}</td>
    </tr>`;
  }).join('');

  const trackUrl = `${frontendUrl}/track`;
  const emailSubject = `${meta.emoji} ${meta.subject} — ${order.orderNumber} | Rakhi Atelier`;

  const emailHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1c1917 0%,#292524 100%);padding:32px 40px;text-align:center;">
            <div style="font-size:11px;font-weight:800;letter-spacing:3px;color:#d97706;text-transform:uppercase;margin-bottom:8px;">Rakhi Atelier</div>
            <div style="font-size:26px;margin-bottom:6px;">${meta.emoji}</div>
            <h1 style="margin:0;font-size:21px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">${meta.headline}</h1>
            <p style="margin:8px 0 0;font-size:13px;color:#a8a29e;">Order <strong style="color:#fbbf24;">${order.orderNumber}</strong></p>
          </td>
        </tr>
        ${order.status !== 'CANCELLED' ? `
        <tr>
          <td style="padding:28px 40px 20px;background:#fafaf9;border-bottom:1px solid #f3f4f6;">
            <p style="margin:0 0 16px;font-size:10px;font-weight:800;letter-spacing:2px;color:#9ca3af;text-transform:uppercase;">Delivery Progress</p>
            <table width="100%" cellpadding="0" cellspacing="0"><tr>${stepsHtml}</tr></table>
          </td>
        </tr>` : `
        <tr>
          <td style="padding:20px 40px;background:#fef2f2;border-bottom:1px solid #fecaca;">
            <p style="margin:0;font-size:13px;color:#991b1b;font-weight:600;">This order has been cancelled. If you believe this is an error, please contact us.</p>
          </td>
        </tr>`}
        <tr>
          <td style="padding:28px 40px;">
            <p style="margin:0 0 12px;font-size:10px;font-weight:800;letter-spacing:2px;color:#9ca3af;text-transform:uppercase;">Order Summary</p>
            <table width="100%" cellpadding="0" cellspacing="0">${itemsHtml}</table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
              ${order.discount > 0 ? `<tr><td style="font-size:12px;color:#6b7280;padding:2px 0;">Discount</td><td style="font-size:12px;color:#dc2626;font-weight:700;text-align:right;">-₹${order.discount}</td></tr>` : ''}
              <tr><td style="font-size:15px;font-weight:800;color:#111827;padding-top:8px;border-top:2px solid #111827;">Total</td><td style="font-size:15px;font-weight:800;color:#111827;text-align:right;padding-top:8px;border-top:2px solid #111827;">₹${order.total}</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 28px;">
            <p style="margin:0 0 8px;font-size:10px;font-weight:800;letter-spacing:2px;color:#9ca3af;text-transform:uppercase;">Delivery To</p>
            <p style="margin:0;font-size:13px;color:#374151;font-weight:600;">${order.customer.name}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#6b7280;">${order.deliveryAddress.societyName}${order.deliveryAddress.block ? `, ${order.deliveryAddress.block}` : ''}${order.deliveryAddress.floor ? ` · Floor ${order.deliveryAddress.floor}` : ''} · Flat ${order.deliveryAddress.flatNumber}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:0 40px 36px;text-align:center;">
            <a href="${trackUrl}" style="display:inline-block;background:#1c1917;color:#ffffff;text-decoration:none;font-size:12px;font-weight:800;letter-spacing:2px;text-transform:uppercase;padding:14px 36px;border-radius:8px;">Track Your Order →</a>
          </td>
        </tr>
        <tr>
          <td style="background:#fafaf9;border-top:1px solid #f3f4f6;padding:20px 40px;text-align:center;">
            <p style="margin:0;font-size:11px;color:#9ca3af;">Rakhi Atelier · Society delivery service</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  const emailText = `${meta.emoji} ${meta.headline}\nOrder: ${order.orderNumber} | Status: ${order.status}\nTotal: ₹${order.total}\nTrack your order: ${trackUrl}`;

  if (!apiKey) {
    console.log(`--- [CUSTOMER EMAIL - NO API KEY] To: ${customerEmail} | Subject: ${emailSubject} ---`);
    return;
  }

  try {
    await axios.post(
      'https://api.autosend.com/v1/mails/send',
      {
        from: { email: fromEmail, name: 'Rakhi Atelier' },
        to: { email: customerEmail, name: order.customer.name },
        subject: emailSubject,
        html: emailHtml,
        text: emailText,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
    console.log(`Customer status email sent for ${order.orderNumber} → ${customerEmail} [${order.status}]`);
  } catch (error: any) {
    const msg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    console.error(`FAILED to send customer status email for order ${order.orderNumber}:`, msg);
  }
};
