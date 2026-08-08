import { Request, Response, NextFunction } from 'express';
import { Society } from '../models/Society';

export const getAllSocieties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { activeOnly } = req.query;
    const filter = activeOnly === 'true' ? { isActive: true } : {};

    const societies = await Society.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, count: societies.length, data: societies });
  } catch (error) {
    next(error);
  }
};

export const createSociety = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, blocks, isActive } = req.body;

    if (!name || !blocks || !Array.isArray(blocks)) {
      res.status(400).json({ success: false, message: 'Please provide society name and blocks list' });
      return;
    }

    const societyExists = await Society.findOne({ name });
    if (societyExists) {
      res.status(400).json({ success: false, message: 'Society already exists' });
      return;
    }

    const newSociety = await Society.create({
      name,
      blocks,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({ success: true, data: newSociety });
  } catch (error) {
    next(error);
  }
};

export const updateSociety = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, blocks, isActive } = req.body;

    const society = await Society.findById(req.params.id);
    if (!society) {
      res.status(404).json({ success: false, message: 'Society not found' });
      return;
    }

    const updatedSociety = await Society.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          name: name !== undefined ? name : society.name,
          blocks: blocks !== undefined ? blocks : society.blocks,
          isActive: isActive !== undefined ? isActive : society.isActive,
        },
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({ success: true, data: updatedSociety });
  } catch (error) {
    next(error);
  }
};

export const deleteSociety = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const society = await Society.findById(req.params.id);
    if (!society) {
      res.status(404).json({ success: false, message: 'Society not found' });
      return;
    }

    await Society.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Society deleted successfully' });
  } catch (error) {
    next(error);
  }
};
