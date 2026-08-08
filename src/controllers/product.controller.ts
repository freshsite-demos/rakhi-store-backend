import { Request, Response, NextFunction } from 'express';
import { Product } from '../models/Product';
import { uploadImageToCloudinary } from '../services/cloudinary.service';

export const getAllProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, category, minPrice, maxPrice, sort, isAvailable, societyId } = req.query;

    const query: any = {};

    // 1. Search Query (matches name, description or category keyword)
    if (search) {
      const searchRegex = new RegExp(String(search), 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
      ];
    }

    // 2. Category Filter
    if (category) {
      query.category = String(category);
    }

    // 3. Price Filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // 4. Availability Filter
    if (isAvailable !== undefined) {
      query.isAvailable = isAvailable === 'true';
    }

    // 5. Region/Society Filter — show global products (empty array) OR products tagged to this society
    if (societyId) {
      query.$and = [
        ...(query.$and || []),
        {
          $or: [
            { availableSocieties: { $size: 0 } },
            { availableSocieties: societyId },
          ],
        },
      ];
    }

    // Prepare search
    let productsQuery = Product.find(query);

    // 5. Sorting
    if (sort) {
      if (sort === 'price_asc') {
        // Sort by selling price. Since price and discountedPrice exist, we can sort by price.
        productsQuery = productsQuery.sort({ price: 1 });
      } else if (sort === 'price_desc') {
        productsQuery = productsQuery.sort({ price: -1 });
      } else if (sort === 'newest') {
        productsQuery = productsQuery.sort({ createdAt: -1 });
      } else if (sort === 'popular') {
        // Simulating popular by sorting by stock or created date
        productsQuery = productsQuery.sort({ stock: -1 });
      }
    } else {
      // Default sort
      productsQuery = productsQuery.sort({ createdAt: -1 });
    }

    const products = await productsQuery;
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, price, discountedPrice, category, stock, isAvailable } = req.body;
    let imageUrl = req.body.imageUrl || '';

    if (req.file) {
      imageUrl = await uploadImageToCloudinary(req.file.buffer);
    }

    if (!name || !description || !price || !category || stock === undefined || !imageUrl) {
      res.status(400).json({ success: false, message: 'Please provide all required fields' });
      return;
    }

    // Parse availableSocieties from JSON string or comma-separated
    let availableSocieties: string[] = [];
    if (req.body.availableSocieties) {
      try {
        availableSocieties = JSON.parse(req.body.availableSocieties);
      } catch {
        availableSocieties = String(req.body.availableSocieties).split(',').filter(Boolean);
      }
    }

    const newProduct = await Product.create({
      name,
      description,
      imageUrl,
      price: Number(price),
      discountedPrice: discountedPrice ? Number(discountedPrice) : undefined,
      category,
      stock: Number(stock),
      isAvailable: isAvailable === 'true' || isAvailable === true,
      availableSocieties,
    });

    res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, price, discountedPrice, category, stock, isAvailable } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    let imageUrl = product.imageUrl;
    if (req.file) {
      imageUrl = await uploadImageToCloudinary(req.file.buffer);
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    }

    // Parse availableSocieties
    let availableSocieties: string[] | undefined;
    if (req.body.availableSocieties !== undefined) {
      try {
        availableSocieties = JSON.parse(req.body.availableSocieties);
      } catch {
        availableSocieties = String(req.body.availableSocieties).split(',').filter(Boolean);
      }
    }

    const updateFields: any = {
      name: name !== undefined ? name : product.name,
      description: description !== undefined ? description : product.description,
      imageUrl,
      price: price !== undefined ? Number(price) : product.price,
      category: category !== undefined ? category : product.category,
      stock: stock !== undefined ? Number(stock) : product.stock,
      isAvailable: isAvailable !== undefined ? (isAvailable === 'true' || isAvailable === true) : product.isAvailable,
      ...(availableSocieties !== undefined && { availableSocieties }),
    };

    if (discountedPrice !== undefined) {
      updateFields.discountedPrice = discountedPrice === '' || discountedPrice === null ? undefined : Number(discountedPrice);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updatedProduct });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};
