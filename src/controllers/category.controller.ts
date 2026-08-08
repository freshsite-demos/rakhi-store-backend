import { Request, Response, NextFunction } from 'express';
import { Category } from '../models/Category';

export const getAllCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { activeOnly } = req.query;
    const filter = activeOnly === 'true' ? { isActive: true } : {};
    
    const categories = await Category.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, count: categories.length, data: categories });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, isActive } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Category name is required' });
      return;
    }

    const categoryExists = await Category.findOne({ name });
    if (categoryExists) {
      res.status(400).json({ success: false, message: 'Category already exists' });
      return;
    }

    const newCategory = await Category.create({
      name,
      description,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({ success: true, data: newCategory });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, isActive } = req.body;
    
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: name !== undefined ? name : category.name,
          description: description !== undefined ? description : category.description,
          isActive: isActive !== undefined ? isActive : category.isActive,
        },
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updatedCategory });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      res.status(404).json({ success: false, message: 'Category not found' });
      return;
    }

    await Category.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};
