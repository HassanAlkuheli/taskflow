import express from 'express';
import { getTodos, createTodo, updateTodo, deleteTodo, reorderTodos } from '../controllers/todos.js';
import { verifyToken } from '../controllers/auth.js';

const router = express.Router();

router.route('/')
  .get(verifyToken, getTodos)
  .post(verifyToken, createTodo);

router.route('/reorder')  // Add reorder endpoint
  .put(verifyToken, reorderTodos);

router.route('/:id')
  .put(verifyToken, updateTodo)
  .delete(verifyToken, deleteTodo);

export default router;
