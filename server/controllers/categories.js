import Category from '../models/Category.js';
import Todo from '../models/Todo.js';
import { defaultCategories } from '../models/Category.js';

export const getCategories = async (req, res, next) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not authenticated' 
      });
    }

    // Always sort by order field
    const categories = await Category.find({ 
      user: req.user._id 
    }).sort({ order: 1 });
    
    // Get task counts for user's categories
    const categoryCounts = await Todo.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const categoriesWithCounts = categories.map(cat => {
      const countObj = categoryCounts.find(c => c._id.toString() === cat._id.toString());
      return {
        ...cat.toObject(),
        taskCount: countObj ? countObj.count : 0
      };
    });

    res.json(categoriesWithCounts);
  } catch (err) {
    next(err);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { name, color } = req.body;
    
    // Fixed validation logic - was checking !color which is wrong
    if (!name || !color) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and color are required' 
      });
    }

    // Find and update category
    const updatedCategory = await Category.findOneAndUpdate(
      { 
        _id: req.params.id,
        user: req.user._id 
      },
      { 
        name: name.trim(),
        color: color.toLowerCase()
      },
      { 
        new: true, 
        runValidators: true
      }
    );

    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or unauthorized'
      });
    }

    res.status(200).json({ 
      success: true, 
      data: updatedCategory 
    });
  } catch (err) {
    // Add better error logging
    console.error('Update category error:', err, 'Payload:', req.body);
    next(err);
  }
};

// Prevent adding new categories
export const createCategory = async (req, res, next) => {
  res.status(403).json({ success: false, message: 'Adding new categories is not allowed.' });
};

// Prevent deleting categories
export const deleteCategory = async (req, res, next) => {
  res.status(403).json({ success: false, message: 'Deleting categories is not allowed.' });
};

export const reorderCategories = async (req, res) => {
  try {
    const { categories } = req.body;
    
    if (!Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid categories data'
      });
    }

    // Use a transaction to ensure all updates succeed or none do
    const session = await Category.startSession();
    await session.withTransaction(async () => {
      // Update each category's order
      for (let i = 0; i < categories.length; i++) {
        await Category.findOneAndUpdate(
          { 
            _id: categories[i].id,
            user: req.user._id 
          },
          { $set: { order: i } },
          { session }
        );
      }
    });
    
    // Fetch updated categories after reordering
    const updatedCategories = await Category.find({
      user: req.user._id
    }).sort({ order: 1 });

    // Get task counts
    const categoryCounts = await Todo.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const categoriesWithCounts = updatedCategories.map(cat => ({
      ...cat.toObject(),
      taskCount: categoryCounts.find(c => 
        c._id.toString() === cat._id.toString()
      )?.count || 0
    }));

    res.json({
      success: true,
      data: categoriesWithCounts
    });
  } catch (error) {
    console.error('Reorder categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reorder categories'
    });
  }
};
