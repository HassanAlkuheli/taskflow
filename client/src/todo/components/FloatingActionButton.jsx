import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FloatingActionButton = ({ 
  onAddTask, 
  onToggleEditMode, 
  onSaveAll, 
  onCancelEdit,
  onSaveNewTask,
  onCancelNewTask,
  darkMode, 
  editMode,
  isCreatingNew 
}) => {
  const [showOptions, setShowOptions] = useState(false);

  const handleAddTask = () => {
    console.log('Add Task button clicked'); // Debugging log
    if (onAddTask) {
      console.log('Calling onAddTask function'); // Debugging log
      onAddTask(); // Call the onAddTask function
    } else {
      console.error('onAddTask function is not defined'); // Debugging log
    }
    setShowOptions(false); // Close the options menu
  };

  const buttonVariants = {
    initial: { 
      scale: 0.8, 
      opacity: 0,
      y: 20
    },
    animate: { 
      scale: 1, 
      opacity: 1,
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        duration: 0.3
      }
    },
    exit: { 
      scale: 0.8, 
      opacity: 0,
      y: 20,
      transition: { 
        duration: 0.2,
        ease: "easeInOut"
      }
    },
    hover: { 
      scale: 1.1,
      transition: { 
        type: "spring", 
        stiffness: 400, 
        damping: 25
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-20">
      <div className="flex flex-col-reverse items-end gap-3 relative">
        {/* Save/Cancel Buttons Container */}
        <AnimatePresence mode="wait">
          {(editMode || isCreatingNew) ? (
            <div className="flex flex-col gap-3">
              <motion.button
                initial="initial"
                animate="animate"
                exit="exit"
                whileHover="hover"
                variants={buttonVariants}
                onClick={editMode ? onCancelEdit : onCancelNewTask}
                className="w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg flex items-center justify-center transform-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
              <motion.button
                initial="initial"
                animate="animate"
                exit="exit"
                whileHover="hover"
                variants={buttonVariants}
                onClick={editMode ? onSaveAll : onSaveNewTask}
                className="w-12 h-12 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center transform-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.button>
            </div>
          ) : (
            <motion.div
              className="flex flex-col gap-3"
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                onClick={onToggleEditMode}
                className={`w-12 h-12 ${darkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'} text-white rounded-full shadow-lg flex items-center justify-center transform-none`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793z" />
                  <path d="M11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
              </motion.button>
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                onClick={handleAddTask} // Use the handleAddTask function
                className={`w-12 h-12 ${darkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white rounded-full shadow-lg flex items-center justify-center transform-none`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FloatingActionButton;