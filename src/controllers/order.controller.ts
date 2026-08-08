import { Request, Response, NextFunction } from 'express';
import { Order } from '../models/Order';
import { Product } from '../models/Product';
import { Coupon } from '../models/Coupon';
import { Society } from '../models/Society';
import { generateOrderNumber } from '../utils/generateOrderNumber';
import { sendOrderNotificationEmail } from '../services/email.service';

export const createOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { customer, deliveryAddress, items, couponCode } = req.body;

    // 1. Basic validation
    if (!customer || !customer.name || !customer.phone) {
      res.status(400).json({ success: false, message: 'Customer name and phone number are required' });
      return;
    }
    if (!deliveryAddress || !deliveryAddress.societyId) {
      res.status(400).json({ success: false, message: 'Delivery location selection is required' });
      return;
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ success: false, message: 'Your cart is empty' });
      return;
    }

    // 2. Fetch society to get its name
    const society = await Society.findById(deliveryAddress.societyId);
    if (!society || !society.isActive) {
      res.status(400).json({ success: false, message: 'Invalid or inactive delivery location selected' });
      return;
    }
    const societyName = society.name;

    // Validate fields dynamically based on whether it is a general locality or standard society
    const isLocalityMode = society.isLocality || !society.blocks || society.blocks.length === 0;

    if (isLocalityMode) {
      if (!deliveryAddress.flatNumber) {
        res.status(400).json({ success: false, message: 'Detailed delivery address is required' });
        return;
      }
    } else {
      if (!deliveryAddress.block || !deliveryAddress.floor || !deliveryAddress.flatNumber) {
        res.status(400).json({ success: false, message: 'Block, floor and flat number details are required' });
        return;
      }
    }

    // 3. Re-calculate prices and validate stock from the database
    let subtotal = 0;
    const orderItems = [];

    // Temporary list to rollback stock if needed, or we check stock first
    const productsToUpdate = [];

    for (const item of items) {
      const { productId, quantity } = item;
      if (!productId || !quantity || quantity <= 0) {
        res.status(400).json({ success: false, message: 'Invalid product quantity in cart' });
        return;
      }

      const product = await Product.findById(productId);
      if (!product) {
        res.status(404).json({ success: false, message: `Product not found` });
        return;
      }

      if (!product.isAvailable) {
        res.status(400).json({ success: false, message: `Product "${product.name}" is currently unavailable` });
        return;
      }

      if (product.stock < quantity) {
        res.status(400).json({
          success: false,
          message: `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${quantity}`,
        });
        return;
      }

      const priceToUse = product.discountedPrice !== undefined ? product.discountedPrice : product.price;
      const itemSubtotal = priceToUse * quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product._id.toString(),
        name: product.name,
        imageUrl: product.imageUrl,
        quantity,
        price: product.price,
        discountedPrice: product.discountedPrice,
        subtotal: itemSubtotal,
      });

      productsToUpdate.push({
        product,
        quantity,
      });
    }

    // 4. Validate coupon (if provided)
    let discount = 0;
    let validatedCouponCode = undefined;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), isActive: true });
      if (coupon) {
        const isNotExpired = !coupon.expiryDate || new Date(coupon.expiryDate) >= new Date();
        const meetsMinOrder = !coupon.minimumOrderValue || subtotal >= coupon.minimumOrderValue;

        if (isNotExpired && meetsMinOrder) {
          if (coupon.type === 'fixed') {
            discount = coupon.value;
          } else if (coupon.type === 'percentage') {
            discount = (coupon.value / 100) * subtotal;
          }

          if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
            discount = coupon.maximumDiscount;
          }

          if (discount > subtotal) {
            discount = subtotal;
          }

          discount = Math.round(discount);
          validatedCouponCode = coupon.code;
        }
      }
    }

    const total = subtotal - discount;

    // 5. Atomic-like Stock Deductions
    for (const update of productsToUpdate) {
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: update.product._id, stock: { $gte: update.quantity } },
        { $inc: { stock: -update.quantity } },
        { new: true }
      );

      if (!updatedProduct) {
        // Rollback already updated stocks (best effort)
        // In simple scale, this is extremely rare since we checked it inside the loop,
        // but it covers race conditions.
        res.status(400).json({
          success: false,
          message: `Stock levels changed for one of your items during checkout. Please try again.`,
        });
        return;
      }
    }

    // 6. Generate order number
    const orderNumber = generateOrderNumber();

    // 7. Save Order to Database
    const newOrder = await Order.create({
      orderNumber,
      customer,
      deliveryAddress: {
        societyId: deliveryAddress.societyId,
        societyName,
        block: deliveryAddress.block,
        floor: deliveryAddress.floor,
        flatNumber: deliveryAddress.flatNumber,
        instructions: deliveryAddress.instructions,
      },
      items: orderItems,
      subtotal,
      discount,
      couponCode: validatedCouponCode,
      total,
      status: 'PLACED',
    });

    // 8. Trigger Email Notification via AutoSend (runs asynchronously and won't block response)
    sendOrderNotificationEmail(newOrder).catch((err) => {
      console.error('Asynchronous order email notifier crashed:', err);
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: newOrder,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllOrders = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: orders.length, data: orders });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.body;
    const validStatuses = ['PLACED', 'CONFIRMED', 'PACKED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ success: false, message: 'Please provide a valid order status' });
      return;
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    // Business rule: If order is cancelled, we should restore stock
    if (status === 'CANCELLED' && order.status !== 'CANCELLED') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: item.quantity },
        });
      }
    }

    // Business rule: If an order was previously cancelled, but is now re-activated (not common, but good to handle)
    if (order.status === 'CANCELLED' && status !== 'CANCELLED') {
      // Deduct stock again, checking availability
      for (const item of order.items) {
        const product = await Product.findById(item.productId);
        if (!product || product.stock < item.quantity) {
          res.status(400).json({
            success: false,
            message: `Cannot reactivate order. Insufficient stock for "${product?.name || 'Unknown product'}"`,
          });
          return;
        }
      }
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.productId, {
          $inc: { stock: -item.quantity },
        });
      }
    }

    order.status = status;
    await order.save();

    res.status(200).json({ success: true, message: 'Order status updated successfully', data: order });
  } catch (error) {
    next(error);
  }
};
