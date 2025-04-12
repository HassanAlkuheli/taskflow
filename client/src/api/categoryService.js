import api from './axios';

export const getCategories = async () => {
  const { data } = await api.get('/categories');
  return data;
};

export const updateCategory = async (id, category) => {
  const { data } = await api.put(`/categories/${id}`, category);
  return data.data;
};

export const reorderCategories = async (categories) => {
  try {
    const { data } = await api.put('/categories/reorder', {
      categories: categories.map((cat, index) => ({
        id: cat._id,
        order: index // Use array index as the order
      }))
    });
    
    if (!data.success) {
      throw new Error(data.message || 'Failed to reorder categories');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to reorder categories:', error);
    throw error;
  }
};
