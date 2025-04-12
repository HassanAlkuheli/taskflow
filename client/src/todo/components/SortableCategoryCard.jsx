import { CSS } from '@dnd-kit/utilities';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateCategory } from '../../api/categoryService';
import { toast } from 'react-toastify';
import { useSortable } from '@dnd-kit/sortable';

// Predefined colors with their tailwind values
const tailwindColors = {
  red: {
    300: '#fca5a5',
    800: '#991b1b',
    name: 'Red'
  },
  blue: {
    300: '#93c5fd',
    800: '#1e40af',
    name: 'Blue'
  },
  green: {
    300: '#86efac',
    800: '#166534',
    name: 'Green'
  },
  yellow: {
    300: '#fde047',
    800: '#854d0e',
    name: 'Yellow'
  },
  purple: {
    300: '#d8b4fe',
    800: '#5b21b6',
    name: 'Purple'
  },
  indigo: {
    300: '#a5b4fc',
    800: '#3730a3',
    name: 'Indigo'
  },
  pink: {
    300: '#f9a8d4',
    800: '#9d174d',
    name: 'Pink'
  },
  orange: {
    300: '#fdba74',
    800: '#9a3412',
    name: 'Orange'
  },
  teal: {
    300: '#5eead4',
    800: '#115e59',
    name: 'Teal'
  },
  cyan: {
    300: '#67e8f9',
    800: '#155e75',
    name: 'Cyan'
  },
  lime: {
    300: '#bef264',
    800: '#3f6212',
    name: 'Lime'
  },
  emerald: {
    300: '#6ee7b7',
    800: '#065f46',
    name: 'Emerald'
  },
  violet: {
    300: '#c4b5fd',
    800: '#5b21b6',
    name: 'Violet'
  },
  fuchsia: {
    300: '#f0abfc',
    800: '#86198f',
    name: 'Fuchsia'
  },
  rose: {
    300: '#fda4af',
    800: '#9f1239',
    name: 'Rose'
  },
  sky: {
    300: '#7dd3fc',
    800: '#075985',
    name: 'Sky'
  },
  amber: {
    300: '#fcd34d',
    800: '#92400e',
    name: 'Amber'
  },
  slate: {
    300: '#94a3b8',  // Updated to more visible color
    800: '#334155',
    name: 'Slate'
  }
};

const SortableCategoryCard = ({ id, title, taskCount = 0, color = 'blue', darkMode, onCategoryUpdate }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)'
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1000 : 1,
    opacity: isDragging ? 0.8 : 1,
    touchAction: 'none',
    cursor: isDragging ? 'grabbing' : 'grab',
    position: 'relative'
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(title);
  const [selectedColor, setSelectedColor] = useState(color);

  // Get color values or default to blue
  const colorValues = tailwindColors[color] || tailwindColors.blue;
  const textColor = colorValues[800];

  const handleSaveEdit = async () => {
    try {
      if (!editName.trim()) {
        toast.error('Category name cannot be empty');
        return;
      }

      if (!selectedColor) {
        toast.error('Please select a color');
        return;
      }

      const payload = { 
        name: editName.trim(),
        color: selectedColor.toLowerCase()
      };

      const result = await updateCategory(id, payload);
        
      setIsEditModalOpen(false);
      if (onCategoryUpdate) {
        await onCategoryUpdate(result);
      }
      toast.success('Category updated successfully');
    } catch (error) {
      console.error('Failed to update category:', error);
      toast.error(error.message || 'Failed to update category');
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        className={`rounded-md p-4 shadow-md relative transition-shadow ${
          isDragging ? 'ring-2 ring-blue-500 shadow-xl' : ''
        }`}
        style={{
          ...style,
          backgroundColor: tailwindColors[color]?.['300'] || tailwindColors.blue['300'],
        }}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h2 style={{ color: textColor }} className="font-medium text-xl pointer-events-none">
              {title}
            </h2>
            <p style={{ color: textColor }} className="text-sm mt-1 pointer-events-none">
              {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
            </p>
          </div>
          
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="text-gray-600 hover:text-gray-800 focus:outline-none ml-2 p-2 rounded-full hover:bg-black/5 pointer-events-auto"
            aria-label="Edit category"
            style={{ cursor: 'pointer' }}
            onPointerDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Edit Modal - Moved outside the card div */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-[9999]"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={() => setIsEditModalOpen(false)}
          >
            <div 
              className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000]"
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96 max-w-[90%] shadow-xl"
              >
                <h3 className="text-lg font-semibold mb-4 dark:text-white">Edit Category</h3>
                
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:text-white"
                  placeholder="Category name"
                />

                <div className="grid grid-cols-6 gap-2 mb-4">
                  {Object.entries(tailwindColors).map(([colorKey, colorValue]) => (
                    <button
                      key={colorKey}
                      onClick={() => setSelectedColor(colorKey)}
                      className={`w-8 h-8 rounded-full ${
                        selectedColor === colorKey ? 'ring-2 ring-offset-2 ring-blue-500' : ''
                      }`}
                      style={{ backgroundColor: colorValue['300'] }}
                      title={colorValue.name}
                    />
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default SortableCategoryCard;