import mongoose from 'mongoose';

const TodoSchema = new mongoose.Schema({
  taskTitle: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true,
    maxlength: [100, 'Task title cannot exceed 100 characters']
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    validate: {
      validator: async function(value) {
        const category = await mongoose.model('Category').findById(value);
        return !!category;
      },
      message: 'Invalid category reference'
    }
  },
  subTask: [{
    id: {
      type: String,
      default: () => Math.random().toString(36).substring(2, 9)
    },
    text: {
      type: String,
      required: [true, 'Subtask text is required'],
      trim: true
    },
    isCompleted: {
      type: Boolean,
      default: false
    }
  }],
  isCompleted: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

TodoSchema.index({ user: 1, category: 1 });

export default mongoose.model('Todo', TodoSchema);