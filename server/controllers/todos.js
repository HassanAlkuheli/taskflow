// controllers/todoController.js
import Todo from '../models/Todo.js';

export const getTodos = async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.user.id })
      .populate('category', 'name color')
      .sort({ order: 1 }); // Sort by order field
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTodo = async (req, res) => {
  try {
    const { taskTitle, category, subTask, isCompleted } = req.body;
    
    if (!taskTitle || !category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Task title and category are required' 
      });
    }

    const newTodo = new Todo({
      taskTitle,
      category,
      subTask: Array.isArray(subTask) ? subTask.map(st => ({
        id: st.id || `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: st.text,
        isCompleted: st.isCompleted || false
      })) : [],
      isCompleted: isCompleted || false,
      user: req.user.id
    });

    const savedTodo = await newTodo.save();
    const populatedTodo = await Todo.findById(savedTodo._id)
      .populate('category', 'name color');
    
    res.status(201).json(populatedTodo);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateTodo = async (req, res) => {
  try {
    const { isCompleted, taskTitle, category, subTask } = req.body;
    
    const updatedTodo = await Todo.findByIdAndUpdate(
      req.params.id,
      { 
        isCompleted,
        taskTitle,
        category,
        subTask: subTask ? subTask.map(st => ({
          id: st.id || `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          text: st.text,
          isCompleted: st.isCompleted || false
        })) : []
      },
      { new: true }
    ).populate('category', 'name color');
    
    if (!updatedTodo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    
    res.json(updatedTodo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) {
      return res.status(404).json({ message: 'Todo not found' });
    }
    await todo.remove();
    res.json({ message: 'Todo deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const reorderTodos = async (req, res) => {
  try {
    const { tasks } = req.body;
    
    // Update each task's order sequentially to maintain consistency
    for (let i = 0; i < tasks.length; i++) {
      const { id } = tasks[i];
      await Todo.findByIdAndUpdate(
        id,
        { $set: { order: i } },
        { new: true }
      );
    }

    // Return the updated list
    const updatedTodos = await Todo.find({ 
      user: req.user.id,
      _id: { $in: tasks.map(t => t.id) }
    })
    .populate('category', 'name color')
    .sort({ order: 1 });

    res.json({ 
      success: true,
      data: updatedTodos
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
};