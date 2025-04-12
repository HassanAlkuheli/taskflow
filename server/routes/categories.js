import express from 'express';
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import { updateCategory, createCategory, deleteCategory, reorderCategories } from '../controllers/categories.js';
import { verifyToken } from '../controllers/auth.js';

const router = express.Router();

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const categories = await Category.find({ user: req.user._id });
    // Calculate task count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await mongoose.model('Todo').countDocuments({
          category: cat._id,
          user: req.user._id
        });
        return {
          _id: cat._id,
          name: cat.name,
          color: cat.color,
          taskCount: count
        };
      })
    );
    res.json(categoriesWithCount);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.route('/')
  .post(createCategory);

// Move reorder route before /:id to prevent path conflicts
router.route('/reorder')
  .put(reorderCategories);

router.route('/:id')
  .put(updateCategory)
  .delete(deleteCategory);

export default router;
