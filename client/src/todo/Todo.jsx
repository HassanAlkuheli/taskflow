import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, TouchSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, rectSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { getTodos, createTodo, updateTodo, deleteTodo } from '../api/todoService';
import { getCategories, updateCategory, reorderCategories } from '../api/categoryService';
import { useAuth } from '../auth/AuthContext';
import { toast } from 'react-toastify';
import Header from './components/Header';
import SortableCategoryCard from './components/SortableCategoryCard';
import SortableTaskItem from './components/SortableTaskItem';
import TaskItem from './components/TaskItem';
import FloatingActionButton from './components/FloatingActionButton';
import api from '../api/axios';

function Todo() {
  const navigate = useNavigate();
  const { csrfToken, currentUser } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [categories, setCategories] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [editedTasks, setEditedTasks] = useState({});
  const [newTaskData, setNewTaskData] = useState(null);
  const [isDraggingAny, setIsDraggingAny] = useState(false);
  const [isAnyHolding, setIsAnyHolding] = useState(false);

  const handleStartHolding = () => {
    setIsAnyHolding(true);
  };

  const handleStopHolding = () => {
    setIsAnyHolding(false);
  };

  useEffect(() => {
    // Reset holding state when drag starts
    if (isDraggingAny) {
      setIsAnyHolding(false);
    }
  }, [isDraggingAny]);

  useEffect(() => {
    const savedMode = localStorage.getItem('theme');
    const osPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (savedMode === 'dark' || (!savedMode && osPrefersDark)) {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    }

    // Fetch initial data
    fetchCategories();
    fetchTasks();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await getCategories();
      if (Array.isArray(response)) {
        setCategories(response);
      } else {
        console.error('Invalid categories response:', response);
        setCategories([]);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      if (error.response?.status === 401) {
        navigate('/login');
      }
      setCategories([]);
    }
  };

  // Add a function to refresh categories after task changes
  const refreshCategories = async () => {
    await fetchCategories();
  };

  const fetchTasks = async () => {
    try {
      const data = await getTodos();
      setTasks(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login');
      }
      console.error('Error fetching tasks:', error);
      setTasks([]);
    }
  };

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setDarkMode(!darkMode);
  };

  const handleAddTask = () => {
    if (!categories.length) {
      console.error('No categories available');
      return;
    }

    const newTask = {
      id: `temp-${Date.now()}`,
      taskTitle: '',
      category: {
        id: categories[0]._id,
        name: categories[0].name,
        color: categories[0].color
      },
      subTask: [],
      isCompleted: false,
    };

    setNewTaskData(newTask);
    setIsCreatingNew(true);
  };

  const handleSaveNewTask = async () => {
    try {
      if (!newTaskData?.taskTitle) {
        toast.error('Task title is required');
        return;
      }

      const payload = {
        taskTitle: newTaskData.taskTitle,
        category: newTaskData.category.id,
        subTask: newTaskData.subTask || [],
        isCompleted: newTaskData.isCompleted || false,
      };

      const { data } = await api.post('/todos', payload);
      setTasks(prev => [data, ...prev]);
      setNewTaskData(null);
      setIsCreatingNew(false);
      toast.success('Task created successfully');
      await refreshCategories();
    } catch (error) {
      console.error('Error saving new task:', error);
      toast.error('Failed to save task');
    }
  };

  const handleCancelNewTask = () => {
    setNewTaskData(null);
    setIsCreatingNew(false);
  };

  const handleNewTaskChange = (updatedFields) => {
    setNewTaskData(prev => ({
      ...prev,
      ...updatedFields,
      category: updatedFields.category || prev?.category
    }));
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  const handleTaskSubmit = async (taskId, updatedTask) => {
    try {
      const payload = {
        taskTitle: updatedTask.taskTitle,
        category: updatedTask.category.id,
        subTask: updatedTask.subTask.map(sub => ({ text: sub.text })),
        isCompleted: updatedTask.isCompleted
      };

      let data;
      if (taskId.startsWith('temp-')) {
        const response = await api.post('/todos', payload);
        data = response.data;
      } else {
        const response = await api.put(`/todos/${taskId}`, payload);
        data = response.data;
      }

      setTasks(prev => prev.map(task => 
        task.id === taskId ? data : task
      ));
      setIsCreatingNew(false);
      setEditMode(false);
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
    }
  };

  const cancelEdit = (taskId) => {
    if (isCreatingNew) {
      setTasks(prev => prev.filter(task => task.id !== taskId));
    }
    setIsCreatingNew(false);
    setEditMode(false);
  };

  const addSubtask = (taskId, text) => {
    if (!text || !text.trim()) return;

    if (isCreatingNew && newTaskData?.id === taskId) {
      const newSubTask = {
        id: `sub-${Date.now()}`,
        text: text.trim(),
        isCompleted: false
      };
      setNewTaskData(prev => ({
        ...prev,
        subTask: [...(prev.subTask || []), newSubTask]
      }));
    } else {
      setTasks(prev => prev.map(task => {
        if (task.id === taskId || task._id === taskId) {
          const newSubTask = {
            id: `sub-${Date.now()}`,
            text: text.trim(),
            isCompleted: false
          };
          return {
            ...task,
            subTask: [...(task.subTask || []), newSubTask]
          };
        }
        return task;
      }));
    }
  };

  const deleteSubtask = (taskId, subtaskId) => {
    if (isCreatingNew && newTaskData?.id === taskId) {
      setNewTaskData(prev => ({
        ...prev,
        subTask: prev.subTask.filter(sub => sub.id !== subtaskId)
      }));
    } else {
      setTasks(prev => prev.map(task => {
        if (task.id === taskId || task._id === taskId) {
          return {
            ...task,
            subTask: task.subTask.filter(sub => sub.id !== subtaskId)
          };
        }
        return task;
      }));
    }
  };

  const toggleSubtaskComplete = (taskId, subtaskId, completed) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId || task._id === taskId) {
        return {
          ...task,
          subTask: task.subTask.map(sub => 
            sub.id === subtaskId ? { ...sub, isCompleted: completed } : sub
          )
        };
      }
      return task;
    }));
  };

  const toggleTaskComplete = async (taskId, completed) => {
    try {
      const task = tasks.find(t => String(t.id || t._id) === String(taskId));
      if (!task) {
        console.error('Task not found:', taskId);
        return;
      }

      const payload = {
        taskTitle: task.taskTitle,
        category: task.category.id,
        subTask: task.subTask || [],
        isCompleted: completed
      };

      const { data } = await api.put(`/todos/${task._id}`, payload);
      setTasks(prev => prev.map(t => 
        (String(t.id || t._id) === String(taskId)) ? data : t
      ));
      await refreshCategories();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleSaveAll = async () => {
    try {
      const updates = Object.values(editedTasks);
      const updatePromises = updates.map(task => 
        api.put(`/todos/${task._id || task.id}`, {
          taskTitle: task.taskTitle,
          category: task.category.id,
          subTask: task.subTask,
          isCompleted: task.isCompleted
        })
      );

      const responses = await Promise.all(updatePromises);
      const updatedTasks = responses.map(response => response.data);
      
      setTasks(prev => prev.map(task => {
        const updated = updatedTasks.find(u => u._id === (task._id || task.id));
        return updated || task;
      }));
      
      setEditedTasks({});
      setEditMode(false);
      toast.success('All changes saved successfully');
    } catch (error) {
      console.error('Error saving tasks:', error);
      toast.error('Failed to save changes');
    }
  };

  const handleCancelEdit = () => {
    setEditedTasks({});
    setEditMode(false);
    fetchTasks(); // Refresh to original state
  };

  // Modify handleTaskEdit to store changes
  const handleTaskEdit = (taskId, updatedFields) => {
    const task = tasks.find(t => (t.id || t._id) === taskId);
    if (!task) return;

    const updatedTask = {
      ...task,
      ...updatedFields
    };

    setTasks(prev => prev.map(t => 
      (t.id || t._id) === taskId ? updatedTask : t
    ));

    setEditedTasks(prev => ({
      ...prev,
      [taskId]: updatedTask
    }));
  };

  const handleCategoryUpdate = async (updatedCategory) => {
    setCategories(prev => prev.map(cat => 
      cat._id === updatedCategory._id ? updatedCategory : cat
    ));
    // Refresh tasks to get updated category info
    await fetchTasks();
  };

  const sensors = useSensors(
    useSensor(TouchSensor, {
      // Require a bit of movement before activating
      activationConstraint: {
        delay: 100,
        tolerance: 8,
      },
    }),
    useSensor(PointerSensor, {
      // Require a bit of movement before activating
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  const handleTaskDragEnd = async (event) => {
    const { active, over } = event;
    // Ensure we reset the dragging state after a slight delay
    // to allow animations to complete
    setTimeout(() => {
      setIsDraggingAny(false);
    }, 50);
  
    if (active.id !== over.id) {
      setTasks(prev => {
        const oldIndex = prev.findIndex(task => String(task._id || task.id) === String(active.id));
        const newIndex = prev.findIndex(task => String(task._id || task.id) === String(over.id));
        const newOrder = arrayMove(prev, oldIndex, newIndex);
        
        // Save the new order to backend
        saveTaskOrder(newOrder).catch(console.error);
        
        return newOrder;
      });
    }
  };

  const saveTaskOrder = async (newOrder) => {
    try {   
      const { data } = await api.put('/todos/reorder', {
        tasks: newOrder.map((task, index) => ({
          id: task._id || task.id
        }))
      });

      if (data.success && data.data) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error('Failed to save task order:', error);
      toast.error('Failed to save task order');
    }
  };

  const saveCategoryOrder = async (newOrder) => {
    try {
      const response = await reorderCategories(newOrder);
      if (response?.success && response?.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Failed to save category order:', error);
      toast.error('Failed to save category order');
      // Revert to previous order if save fails
      await fetchCategories();
    }
  };

  const handleCategoryDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      setCategories(prev => {
        const oldIndex = prev.findIndex(cat => cat._id === active.id);
        const newIndex = prev.findIndex(cat => cat._id === over.id);
        const newOrder = arrayMove(prev, oldIndex, newIndex);
        
        // Save the new order immediately
        saveCategoryOrder(newOrder).catch(console.error);
        return newOrder;
      });
    }
  };

  const handleDragStart = () => {
    setIsDraggingAny(true);
  };

  const renderTasks = () => {
    if (!Array.isArray(tasks)) {
      console.error('Tasks is not an array:', tasks);
      return null;
    }

    return (
      <div className="my-4">
        {isCreatingNew && newTaskData && (
          <TaskItem 
            {...newTaskData}
            darkMode={darkMode}
            editMode={true}
            isCreatingNew={true}
            onSubmit={handleSaveNewTask}
            onCancel={handleCancelNewTask}
            onAddSubtask={(text) => addSubtask(newTaskData.id, text)}
            onDeleteSubtask={(subtaskId) => deleteSubtask(newTaskData.id, subtaskId)}
            onEdit={handleNewTaskChange}
            categories={categories}
          />
        )}
        {tasks.map((task) => (
          <SortableTaskItem 
            key={task.id || task._id}
            {...task}
            darkMode={darkMode}
            editMode={editMode}
            isDraggingAny={isDraggingAny}  // Add this prop
            isAnyHolding={isAnyHolding}
            onStartHolding={handleStartHolding}
            onStopHolding={handleStopHolding}
            onEdit={(updatedFields) => handleTaskEdit(task.id || task._id, updatedFields)}
            onAddSubtask={(text) => addSubtask(task.id || task._id, text)}
            onDeleteSubtask={(subtaskId) => deleteSubtask(task.id || task._id, subtaskId)}
            onToggleSubtask={(subtaskId, completed) => toggleSubtaskComplete(task.id || task._id, subtaskId, completed)}
            onToggleComplete={toggleTaskComplete}
            categories={categories}
          />
        ))}
      </div>
    );
  };

  const renderCategories = () => {
    if (!Array.isArray(categories) || categories.length === 0) {
      return (
        <div className="text-center p-4 text-gray-500">
          No categories available
        </div>
      );
    }

    return (
      <div className="grid grid-cols-2 gap-4 my-4 auto-rows-fr">
        {categories.map((category) => (
          <SortableCategoryCard 
            key={category._id}
            id={category._id}
            title={category.name}
            taskCount={category.taskCount}
            color={category.color}
            darkMode={darkMode}
            onCategoryUpdate={handleCategoryUpdate}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[var(--color-bg)] text-black dark:text-[var(--color-text)]">
      <div className="relative mx-auto max-w-4xl p-4">
        <Header darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        
        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter}
          onDragEnd={handleCategoryDragEnd}
        >
          <SortableContext 
            items={(Array.isArray(categories) ? categories : []).map(cat => cat._id)} 
            strategy={rectSortingStrategy}
          >
            {renderCategories()}
          </SortableContext>
        </DndContext>

        <DndContext 
          sensors={sensors} 
          collisionDetection={closestCenter}
          onDragEnd={handleTaskDragEnd}
          onDragStart={handleDragStart}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        >
          <SortableContext 
            items={Array.isArray(tasks) ? tasks.map(task => task._id || task.id).filter(Boolean) : []} 
            strategy={verticalListSortingStrategy}
          >
            {renderTasks()}
          </SortableContext>
        </DndContext>

        <FloatingActionButton 
          onAddTask={handleAddTask}
          onToggleEditMode={toggleEditMode}
          onSaveAll={handleSaveAll}
          onCancelEdit={handleCancelEdit}
          onSaveNewTask={handleSaveNewTask}
          onCancelNewTask={handleCancelNewTask}
          darkMode={darkMode}
          editMode={editMode}
          isCreatingNew={isCreatingNew}
        />
      </div>
    </div>
  );
}

export default Todo;