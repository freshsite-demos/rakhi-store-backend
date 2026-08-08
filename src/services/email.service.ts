import axios from 'axios';
import { env } from '../config/env';
import { IOrder } from '../models/Order';

export const sendOrderNotificationEmail = async (order: IOrder): Promise<void> => {
  const apiKey = env.AUTOSEND_API_KEY;
  const adminEmail = env.ADMIN_EMAIL;

  const orderItemsList = order.items
    .map(
      (item) =>
        `<li><strong>${item.name}</strong> × ${item.quantity} - ₹${item.discountedPrice || item.price} each (Subtotal: ₹${item.subtotal})</li>`
    )
    .join('');

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
      ${order.deliveryAddress.instructions ? `<p><strong>Instructions:</strong> ${order.deliveryAddress.instructions}</p>` : ''}
      
      <h3 style="color: #4b5563; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px;">Items</h3>
      <ul style="padding-left: 20px;">
        ${orderItemsList}
      </ul>
      
      <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border-radius: 6px;">
        <p style="margin: 5px 0;"><strong>Subtotal:</strong> ₹${order.subtotal}</p>
        <p style="margin: 5px 0; color: #dc2626;"><strong>Discount:</strong> -₹${order.discount} ${order.couponCode ? `(Coupon: ${order.couponCode})` : ''}</p>
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
    Instructions: ${order.deliveryAddress.instructions || 'None'}
    
    Items:
    ${order.items.map((item) => `- ${item.name} x ${item.quantity} (₹${item.discountedPrice || item.price} each) = ₹${item.subtotal}`).join('\n')}
    
    Subtotal: ₹${order.subtotal}
    Discount: -₹${order.discount}
    Total: ₹${order.total}
    Status: ${order.status}
  `;

  if (!apiKey) {
    console.log('--- AUTOSEND NOT CONFIGURED (LOGGING EMAIL) ---');
    console.log('To:', adminEmail);
    console.log('Subject:', emailSubject);
    console.log('Body:', emailText);
    console.log('-----------------------------------------------');
    return;
  }

  try {
    const payload = {
      from: { email: 'no-reply@autosend.com', name: 'Rakhi Store' },
      to: { email: adminEmail, name: 'Admin' },
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
    };

    const response = await axios.post('https://api.autosend.com/v1/mails/send', payload, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Email notification successfully sent for order ${order.orderNumber}: status ${response.status}`);
  } catch (error: any) {
    // Standard rule: "If email sending fails, do not silently lose the order. The order should remain stored and the failure should be logged."
    console.error(`FAILED to send email notification for order ${order.orderNumber}:`, error.message || error);
  }
};
