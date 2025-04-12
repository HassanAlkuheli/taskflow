import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState, useEffect, useRef } from 'react';
import TaskItem from './TaskItem';

const SortableTaskItem = (props) => {
  const [isHolding, setIsHolding] = useState(false);
  const holdTimeout = useRef(null);
  const releaseTimeout = useRef(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useSortable({ 
    id: props.id || props._id,
    transition: { duration: 0 }
  });

  useEffect(() => {
    return () => {
      if (holdTimeout.current) clearTimeout(holdTimeout.current);
      if (releaseTimeout.current) clearTimeout(releaseTimeout.current);
    };
  }, []);

  const handlePointerDown = (e) => {
    if (holdTimeout.current) clearTimeout(holdTimeout.current);
    if (releaseTimeout.current) clearTimeout(releaseTimeout.current);
    
    holdTimeout.current = setTimeout(() => {
      setIsHolding(true);
      props.onStartHolding?.(); // This will hide all subtasks
    }, 150);
  };

  const handlePointerUp = () => {
    if (holdTimeout.current) {
      clearTimeout(holdTimeout.current);
    }
    
    releaseTimeout.current = setTimeout(() => {
      if (!isDragging) {
        setIsHolding(false);
        props.onStopHolding?.();
      }
    }, 50);
  };

  // Add cleanup for drag end
  useEffect(() => {
    if (!isDragging && !props.isDraggingAny) {
      setIsHolding(false);
      props.onStopHolding?.();
    }
  }, [isDragging, props.isDraggingAny]);

  const style = {
    transform: CSS.Transform.toString(transform),
    position: 'relative',
    touchAction: 'none',
    zIndex: isDragging ? 1000 : 1,
    transition: 'height 0.2s ease', // Add transition for height
    height: props.isDraggingAny || isDragging || props.isAnyHolding ? '114px' : 'auto',
  };

  // Update height reset logic
  useEffect(() => {
    if (!isDragging && !props.isDraggingAny && !props.isAnyHolding) {
      // Need to wait for drag animations to complete
      const timer = setTimeout(() => {
        if (setNodeRef.current) {
          setNodeRef.current.style.height = 'auto';
        }
      }, 200); // Match the transition duration
      return () => clearTimeout(timer);
    }
  }, [isDragging, props.isDraggingAny, props.isAnyHolding]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative mb-6  rounded-lg ${
        props.darkMode ? 'bg-gray-800' : 'bg-white'
      } ${isDragging ? 'shadow-xl ring-2 ring-blue-500' : 'shadow-sm border border-gray-200 dark:border-gray-700'}`}
    >
      <TaskItem 
        {...props} 
        isDragging={props.isDraggingAny || isDragging || isHolding || props.isAnyHolding} 
      />
      {!props.editMode && !props.isCreatingNew && (
        <div 
          className={`absolute right-2 inset-y-0 flex items-center cursor-grab active:cursor-grabbing`}
          {...attributes}
          {...{
            ...listeners,
            onPointerDown: (e) => {
              listeners.onPointerDown(e);
              handlePointerDown(e);
            },
            onPointerUp: (e) => {
              listeners.onPointerUp?.(e);
              handlePointerUp();
            },
            onPointerCancel: (e) => {
              listeners.onPointerCancel?.(e);
              handlePointerUp();
            }
          }}
        >
          <div className={`p-2 rounded-md ${
            props.darkMode 
              ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' 
              : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
          }`}>
            <svg 
              viewBox="0 0 20 20" 
              width="16" 
              height="16"
              className="pointer-events-none"
            >
              <path 
                fill="currentColor"
                d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default SortableTaskItem;
