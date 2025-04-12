import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const colorMap = {
  red: 'bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-300',
  blue: 'bg-blue-100 text-blue-500 dark:bg-blue-900 dark:text-blue-300',
  green: 'bg-green-100 text-green-500 dark:bg-green-900 dark:text-green-300',
  purple: 'bg-purple-100 text-purple-500 dark:bg-purple-900 dark:text-purple-300',
  yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300',
  indigo: 'bg-indigo-100 text-indigo-500 dark:bg-indigo-900 dark:text-indigo-300',
  pink: 'bg-pink-100 text-pink-500 dark:bg-pink-900 dark:text-pink-300',
  orange: 'bg-orange-100 text-orange-500 dark:bg-orange-900 dark:text-orange-300',
  teal: 'bg-teal-100 text-teal-500 dark:bg-teal-900 dark:text-teal-300',
  cyan: 'bg-cyan-100 text-cyan-500 dark:bg-cyan-900 dark:text-cyan-300',
  lime: 'bg-lime-100 text-lime-500 dark:bg-lime-900 dark:text-lime-300',
  emerald: 'bg-emerald-100 text-emerald-500 dark:bg-emerald-900 dark:text-emerald-300',
  violet: 'bg-violet-100 text-violet-500 dark:bg-violet-900 dark:text-violet-300',
  fuchsia: 'bg-fuchsia-100 text-fuchsia-500 dark:bg-fuchsia-900 dark:text-fuchsia-300',
  rose: 'bg-rose-100 text-rose-500 dark:bg-rose-900 dark:text-rose-300',
  slate: 'bg-slate-100 text-slate-500 dark:bg-slate-900 dark:text-slate-300'
};

const TaskItem = ({ 
  id,
  _id,
  taskTitle, 
  category, 
  subTask = [], 
  isCompleted,
  darkMode,
  editMode,
  isCreatingNew,
  onSubmit,
  onCancel,
  onAddSubtask,
  onDeleteSubtask,
  onToggleComplete,
  onToggleSubtask,
  categories,
  onEdit,
  isDragging,
  isDraggingAny,
  isAnyHolding, // Add this prop
  isHolding,
}) => {
  const [localTitle, setLocalTitle] = useState(taskTitle);
  const [selectedCategory, setSelectedCategory] = useState(category || null);
  const [newSubtask, setNewSubtask] = useState('');
  const titleInputRef = useRef(null);

  useEffect(() => {
    if (isCreatingNew && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isCreatingNew]);

  useEffect(() => {
    if ((editMode || isCreatingNew) && onEdit) {
      onEdit({
        taskTitle: localTitle,
        category: selectedCategory,
        subTask,
        isCompleted
      });
    }
  }, [localTitle, selectedCategory, subTask, editMode, isCreatingNew]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!localTitle.trim()) {
      alert('Task title is required');
      return;
    }

    if (!selectedCategory) {
      alert('Category is required');
      return;
    }

    onSubmit({
      taskTitle: localTitle,
      category: selectedCategory,
      subTask: subTask,
      isCompleted: isCompleted || false,
    });
  };

  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      onAddSubtask(newSubtask);
      setNewSubtask('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  const handleCategoryChange = (e) => {
    const selected = categories.find(c => c._id === e.target.value);
    setSelectedCategory(selected ? { 
      id: selected._id, 
      name: selected.name, 
      color: selected.color 
    } : null);
  };

  const handleToggleComplete = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const taskId = _id || id;
    if (onToggleComplete && taskId) {
      onToggleComplete(taskId, e.target.checked);
    }
  };

  // Subtasks animation variants
  const subtasksVariants = {
    visible: {
      opacity: 1,
      height: 'auto',
      transition: { duration: 0 }
    },
    hidden: {
      opacity: 0,
      height: 0,
      transition: { duration: 0 }
    }
  };

  const subtaskItemVariants = {
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.2,
        ease: 'easeOut'
      }
    },
    hidden: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.15,
        ease: 'easeIn'
      }
    }
  };

  if (editMode || isCreatingNew) {
    return (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="mt-5 mb-6" // Added mb-6 here for bottom margin
      >
        <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <input
            type="text"
            ref={titleInputRef}
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            placeholder="Task title"
            className={`w-full p-2 mb-3 rounded border ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'}`}
          />
          
          <select 
            value={selectedCategory?.id || ''}
            onChange={handleCategoryChange}
            className={`w-full p-2 mb-3 rounded border ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'}`}
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>

          <div className="mb-3">
            {subTask.map((sub) => (
              <div key={sub.id} className="flex items-center mb-1">
                <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {sub.text}
                </span>
                <button
                  type="button"
                  onClick={() => onDeleteSubtask(sub.id)}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={newSubtask}
              onChange={(e) => setNewSubtask(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Add subtask"
              className={`flex-1 p-2 rounded border ${darkMode ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'}`}
            />
            <button
              type="button"
              onClick={handleAddSubtask}
              className={`px-3 py-1 rounded ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`}
            >
              Add
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
      layout
      className={`mt-5 ${isCompleted ? 'opacity-60' : ''} overflow-hidden`}
      initial={false}
      animate={{ 
        height: isDragging || isHolding ? 90 : 'auto',
        transition: {
          type: "spring",
          bounce: 0,
          duration: 0.3,  // Reduced from 0.6
          stiffness: 500, // Increased from 150
          damping: 40    // Increased from 20
        }
      }}
    >
      <motion.div layout="position">
        {/* Main content - always visible */}
        <div className="flex items-center min-h-[40px] ml-4">
          <input 
            type="checkbox" 
            checked={isCompleted}
            onChange={handleToggleComplete}
            className={`appearance-none size-6 border-2 rounded-md checked:bg-blue-400 focus:outline-none focus:ring-2 ${
              darkMode ? 'border-gray-500 focus:ring-blue-800' : 'border-gray-300 focus:ring-blue-200'
            } transition-all`}
          />
          <h2 className={`ml-2 text-xl font-medium truncate ${isCompleted ? 'line-through' : ''} ${
            darkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            {taskTitle}
          </h2>
        </div>
        
        {/* Category - with left margin */}
        {category && (
          <div className={`ml-12 mt-2 mb-2 inline-block px-2 py-1 rounded-lg font-medium ${
            colorMap[category.color] || 'bg-gray-100 text-gray-500 dark:bg-gray-600 dark:text-gray-300'
          }`}>
            {category.name}
          </div>
        )}
        
        {/* Subtasks - with increased margins */}
        <AnimatePresence mode="wait">
          {(!isDragging && !isHolding) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ 
                opacity: 1, 
                height: 'auto',
                transition: {
                  height: { 
                    type: "spring",
                    bounce: 0,
                    duration: 0.3,   // Reduced duration
                    stiffness: 500,  // Increased stiffness
                    damping: 40      // Increased damping
                  },
                  opacity: { duration: 0.2 }
                }
              }}
              exit={{ 
                opacity: 0, 
                height: 0,
                transition: {
                  height: { 
                    type: "spring",
                    bounce: 0,
                    duration: 0.3,
                    stiffness: 500,
                    damping: 40
                  },
                  opacity: { duration: 0.15 }
                }
              }}
              className="ml-12 mb-3 overflow-hidden"
            >
              {(subTask || []).map((sub) => (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: {
                      type: "spring",
                      stiffness: 400,
                      damping: 30
                    }
                  }}
                  exit={{ 
                    opacity: 0, 
                    y: -10,
                    transition: {
                      duration: 0.2
                    }
                  }}
                  className="flex items-center mt-1"
                >
                  <input 
                    type="checkbox" 
                    checked={sub.isCompleted}
                    onChange={(e) => onToggleSubtask(sub.id, e.target.checked)}
                    className={`appearance-none w-4 h-4 border rounded ${
                      darkMode ? 'border-gray-500' : 'border-gray-300'
                    } checked:bg-blue-500 checked:border-transparent`}
                  />
                  <p className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'} ${
                    sub.isCompleted ? 'line-through' : ''
                  }`}>
                    {sub.text}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        
        <hr className={`mt-3 pb-3 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`} />
      </motion.div>
    </motion.div>
  );
};

export default TaskItem;