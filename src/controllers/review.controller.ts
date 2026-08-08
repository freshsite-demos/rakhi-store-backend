import { Request, Response, NextFunction } from 'express';
import { Review } from '../models/Review';
import { Order } from '../models/Order';

// Submit a review for a delivered order item
export const createReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderNumber, productId, rating, comment } = req.body;

    if (!orderNumber || !productId) {
      res.status(400).json({ success: false, message: 'Order number and Product ID are required' });
      return;
    }

    if (!rating && !comment) {
      res.status(400).json({ success: false, message: 'Please provide either a star rating, a review comment, or both' });
      return;
    }

    if (rating && (Number(rating) < 1 || Number(rating) > 5)) {
      res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars' });
      return;
    }

    // Check if order exists and is DELIVERED
    const order = await Order.findOne({ orderNumber: String(orderNumber).trim().toUpperCase() });
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    if (order.status !== 'DELIVERED') {
      res.status(400).json({
        success: false,
        message: 'Reviews can only be submitted once the order has been delivered',
      });
      return;
    }

    // Verify product was part of this order
    const item = order.items.find((i) => i.productId === String(productId));
    if (!item) {
      res.status(400).json({ success: false, message: 'Product was not found in this order' });
      return;
    }

    // Check if review already exists for this product in this order
    const existing = await Review.findOne({
      orderNumber: order.orderNumber,
      productId: item.productId,
    });

    if (existing) {
      // Update existing review
      existing.rating = rating ? Number(rating) : existing.rating;
      existing.comment = comment ? String(comment).trim() : existing.comment;
      existing.isApproved = false; // Reset to pending approval when updated
      await existing.save();

      res.status(200).json({
        success: true,
        message: 'Your review has been updated and submitted for approval',
        data: existing,
      });
      return;
    }

    const review = await Review.create({
      orderNumber: order.orderNumber,
      productId: item.productId,
      productName: item.name,
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      rating: rating ? Number(rating) : undefined,
      comment: comment ? String(comment).trim() : undefined,
      isApproved: false, // Pending admin approval
    });

    res.status(201).json({
      success: true,
      message: 'Thank you! Your review has been submitted and is pending verification.',
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// Get approved reviews for a product (Storefront)
export const getProductReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ productId, isApproved: true }).sort({ createdAt: -1 });

    // Calculate rating summary
    const ratedReviews = reviews.filter((r) => r.rating !== undefined && r.rating !== null);
    const totalRated = ratedReviews.length;
    const ratingSum = ratedReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const averageRating = totalRated > 0 ? Number((ratingSum / totalRated).toFixed(1)) : 0;

    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratedReviews.forEach((r) => {
      if (r.rating && r.rating >= 1 && r.rating <= 5) {
        distribution[r.rating] = (distribution[r.rating] || 0) + 1;
      }
    });

    res.status(200).json({
      success: true,
      data: reviews,
      summary: {
        averageRating,
        totalReviews: reviews.length,
        totalRatings: totalRated,
        distribution,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get existing reviews for an order (Customer review page)
export const getOrderReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { orderNumber } = req.params;

    const order = await Order.findOne({ orderNumber: String(orderNumber).trim().toUpperCase() });
    if (!order) {
      res.status(404).json({ success: false, message: 'Order not found' });
      return;
    }

    const reviews = await Review.find({ orderNumber: order.orderNumber });

    res.status(200).json({
      success: true,
      order: {
        orderNumber: order.orderNumber,
        status: order.status,
        customerName: order.customer.name,
        items: order.items,
      },
      reviews,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Get all reviews (Moderation dashboard)
export const getAdminReviews = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status } = req.query; // all | pending | approved

    const filter: any = {};
    if (status === 'pending') filter.isApproved = false;
    if (status === 'approved') filter.isApproved = true;

    const reviews = await Review.find(filter).sort({ createdAt: -1 });

    const total = await Review.countDocuments();
    const pendingCount = await Review.countDocuments({ isApproved: false });
    const approvedCount = await Review.countDocuments({ isApproved: true });

    res.status(200).json({
      success: true,
      data: reviews,
      counts: { total, pending: pendingCount, approved: approvedCount },
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Toggle review approval status (Approve / Hide)
export const toggleReviewApproval = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    review.isApproved = !review.isApproved;
    await review.save();

    res.status(200).json({
      success: true,
      message: `Review ${review.isApproved ? 'approved and published' : 'hidden from storefront'}`,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

// Admin: Delete review
export const deleteReview = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndDelete(id);
    if (!review) {
      res.status(404).json({ success: false, message: 'Review not found' });
      return;
    }

    res.status(200).json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    next(error);
  }
};
