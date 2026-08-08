import { Request, Response, NextFunction } from 'express';
import { Coupon } from '../models/Coupon';

export const getAllCoupons = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: coupons.length, data: coupons });
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, type, value, minimumOrderValue, maximumDiscount, expiryDate, isActive } = req.body;

    if (!code || !type || value === undefined) {
      res.status(400).json({ success: false, message: 'Please provide coupon code, type and value' });
      return;
    }

    const couponExists = await Coupon.findOne({ code: code.toUpperCase() });
    if (couponExists) {
      res.status(400).json({ success: false, message: 'Coupon code already exists' });
      return;
    }

    const newCoupon = await Coupon.create({
      code: code.toUpperCase(),
      type,
      value: Number(value),
      minimumOrderValue: minimumOrderValue ? Number(minimumOrderValue) : 0,
      maximumDiscount: maximumDiscount ? Number(maximumDiscount) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({ success: true, data: newCoupon });
  } catch (error) {
    next(error);
  }
};

export const updateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, type, value, minimumOrderValue, maximumDiscount, expiryDate, isActive } = req.body;
    
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      res.status(404).json({ success: false, message: 'Coupon not found' });
      return;
    }

    const updateFields: any = {
      code: code ? code.toUpperCase() : coupon.code,
      type: type || coupon.type,
      value: value !== undefined ? Number(value) : coupon.value,
      minimumOrderValue: minimumOrderValue !== undefined ? Number(minimumOrderValue) : coupon.minimumOrderValue,
      maximumDiscount: maximumDiscount !== undefined ? (maximumDiscount === '' || maximumDiscount === null ? undefined : Number(maximumDiscount)) : coupon.maximumDiscount,
      expiryDate: expiryDate !== undefined ? (expiryDate === '' || expiryDate === null ? undefined : new Date(expiryDate)) : coupon.expiryDate,
      isActive: isActive !== undefined ? isActive : coupon.isActive,
    };

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updatedCoupon });
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
      res.status(404).json({ success: false, message: 'Coupon not found' });
      return;
    }

    await Coupon.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Coupon deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const validateCoupon = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { code, orderValue } = req.body;

    if (!code || orderValue === undefined) {
      res.status(400).json({ success: false, message: 'Please provide coupon code and order subtotal value' });
      return;
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) {
      res.status(400).json({ success: false, message: 'Invalid or inactive coupon code' });
      return;
    }

    // Check expiry
    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      res.status(400).json({ success: false, message: 'Coupon code has expired' });
      return;
    }

    // Check minimum order value
    if (coupon.minimumOrderValue && Number(orderValue) < coupon.minimumOrderValue) {
      res.status(400).json({
        success: false,
        message: `Minimum order value of ₹${coupon.minimumOrderValue} is required to use this coupon`,
      });
      return;
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'fixed') {
      discount = coupon.value;
    } else if (coupon.type === 'percentage') {
      discount = (coupon.value / 100) * Number(orderValue);
    }

    // Cap at maximum discount
    if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
      discount = coupon.maximumDiscount;
    }

    // Ensure discount does not exceed order value
    if (discount > Number(orderValue)) {
      discount = Number(orderValue);
    }

    res.status(200).json({
      success: true,
      message: 'Coupon validated successfully',
      data: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount: Math.round(discount),
      },
    });
  } catch (error) {
    next(error);
  }
};
