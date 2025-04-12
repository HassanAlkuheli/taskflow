import mongoose from 'mongoose';

const validColors = [
  'red', 'blue', 'green', 'yellow', 'purple', 'indigo', 
  'pink', 'orange', 'teal', 'cyan', 'lime', 'emerald',
  'violet', 'fuchsia', 'rose', 'sky', 'amber', 'slate'
];

// Default categories that will be created for new users
export const defaultCategories = [
  { name: 'Personal', color: 'blue' },
  { name: 'Work', color: 'red' },
  { name: 'Shopping', color: 'green' },
  { name: 'Health', color: 'purple' },
  { name: 'Study', color: 'indigo' },
  { name: 'Finance', color: 'emerald' }
];

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    minLength: [2, 'Category name must be at least 2 characters'],
    maxLength: [30, 'Category name cannot exceed 30 characters']
  },
  color: {
    type: String,
    required: [true, 'Color is required'],
    lowercase: true,
    enum: {
      values: validColors,
      message: '{VALUE} is not a valid color'
    }
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true // Add index for better query performance
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Add compound index for user + order
CategorySchema.index({ user: 1, order: 1 });

// Pre-save middleware to handle order for new categories
CategorySchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastCategory = await this.constructor.findOne({ 
      user: this.user 
    }).sort({ order: -1 });
    
    this.order = lastCategory ? lastCategory.order + 1 : 0;
  }
  next();
});

// Create the model first
const Category = mongoose.model('Category', CategorySchema);

// Then try to drop indexes if needed
const resetIndexes = async () => {
  try {
    await Category.collection.dropIndexes();
    console.log('Category indexes dropped successfully');
  } catch (err) {
    console.error('Error dropping indexes:', err);
  }
};

// Run resetIndexes asynchronously
resetIndexes();

export default Category;