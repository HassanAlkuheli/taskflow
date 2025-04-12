import express from 'express';
import { register, login, verifyToken, forgotPassword, resetPassword } from '../controllers/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/verify', verifyToken, (req, res) => {
  res.status(200).json({ user: req.user });
});

export default router;