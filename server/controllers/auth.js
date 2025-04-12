import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import sanitizeHtml from 'sanitize-html';
import Category from '../models/Category.js';
import { defaultCategories } from '../models/Category.js';
import keyManager from '../utils/keyManager.js';
import Token from '../models/Token.js';

const generateUniqueSecret = () => {
  return crypto.randomBytes(32).toString('hex');
};

const generateAccessToken = (userId, userSecret) => {
  return jwt.sign(
    { 
      id: userId, 
      type: 'access',
      nonce: crypto.randomBytes(16).toString('hex'), // Add random nonce
      iat: Math.floor(Date.now() / 1000) // Standard timestamp
    },
    userSecret || process.env.JWT_SECRET,
    { 
      expiresIn: '15m',
      jwtid: crypto.randomBytes(16).toString('hex') // Unique JWT ID
    }
  );
};

const generateRefreshToken = async (userId, userSecret) => {
  const uniqueId = crypto.randomBytes(8).toString('hex');
  const refreshToken = jwt.sign(
    { 
      id: userId, 
      type: 'refresh',
      jti: uniqueId, // Add unique token ID
      iat: Date.now() 
    },
    userSecret || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  // Store refresh token with family ID and user secret
  await Token.create({
    token: refreshToken,
    user: userId,
    family: crypto.randomBytes(32).toString('hex'),
    secret: userSecret, // Store user's secret
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  return refreshToken;
};

const generateToken = async (userId, type) => {
  const expiresIn = type === 'access' ? '15m' : '7d';
  const token = jwt.sign(
    { id: userId, type },
    process.env.JWT_SECRET,
    { expiresIn }
  );

  const expires = new Date(
    Date.now() + (type === 'access' ? 15 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000)
  );

  await Token.create({
    token,
    user: userId,
    type,
    expires
  });

  return token;
};

export const register = async (req, res, next) => {
  try {
    const email = sanitizeHtml(req.body.email);
    const password = sanitizeHtml(req.body.password);
    
    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate unique secret for user
    const userSecret = generateUniqueSecret();
    
    // Create user with secret
    const user = await User.create({
      email,
      password: hashedPassword,
      tokenSecret: userSecret // Store secret in user document
    });

    // Create categories first
    const createdCategories = [];
    for (const cat of defaultCategories) {
      try {
        const category = await Category.create({
          name: cat.name,
          color: cat.color,
          user: user._id,
          order: createdCategories.length // Set initial order
        });
        createdCategories.push(category);
      } catch (err) {
        console.error(`Failed to create category ${cat.name}:`, err);
      }
    }

    // Generate tokens
    const accessToken = await generateToken(user._id, 'access');
    const refreshToken = await generateToken(user._id, 'refresh');

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(201).json({
      success: true,
      token: accessToken,
      user: {
        id: user._id,
        email: user.email
      }
    });
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate tokens
    const accessToken = await generateToken(user._id, 'access');
    const refreshToken = await generateToken(user._id, 'refresh');

    // Set refresh token in HttpOnly cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      success: true,
      token: accessToken,
      user: {
        id: user._id,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    const refreshToken = req.signedCookies.refreshToken;
    const accessToken = req.headers.authorization?.split(' ')[1];
    
    if (refreshToken) {
      await Token.findOneAndUpdate(
        { token: refreshToken },
        { blacklisted: true }
      );
    }

    if (accessToken) {
      await Token.findOneAndUpdate(
        { token: accessToken },
        { blacklisted: true }
      );
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/'
    });
    
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed' });
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const email = sanitizeHtml(req.body.email);
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send resetToken via email (mocked here)
    console.log(`Password reset token: ${resetToken}`);

    res.status(200).json({ message: 'Password reset token sent' });
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const resetToken = req.params.token;
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    user.password = await bcrypt.hash(req.body.password, 10);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Invalidate all refresh tokens for this user
    await Token.updateMany(
      { user: user._id },
      { blacklisted: true }
    );

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    next(err);
  }
};

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    // Verify token signature first
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Then check database
    const tokenDoc = await Token.findOne({
      token,
      type: 'access',
      blacklisted: false,
      expires: { $gt: new Date() }
    });

    if (!tokenDoc) {
      return res.status(401).json({ message: 'Token expired or invalid' });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const verify = async (req, res) => {
  // User is already verified by verifyToken middleware
  res.json({ 
    user: {
      id: req.user._id,
      email: req.user.email
    }
  });
};

export const refreshToken = async (req, res) => {
  try {
    const currentRefreshToken = req.cookies.refreshToken;
    
    if (!currentRefreshToken) {
      return res.status(401).json({ 
        success: false,
        message: 'No refresh token found' 
      });
    }

    // Find and validate refresh token
    const tokenDoc = await Token.findOne({ 
      token: currentRefreshToken,
      type: 'refresh',
      blacklisted: false,
      expires: { $gt: new Date() }
    }).populate('user');

    if (!tokenDoc || !tokenDoc.user) {
      return res.status(401).json({ 
        success: false,
        message: 'Invalid refresh token' 
      });
    }

    // Verify token signature
    try {
      jwt.verify(currentRefreshToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ 
        success: false,
        message: 'Refresh token expired' 
      });
    }

    // Generate new tokens
    const accessToken = await generateToken(tokenDoc.user._id, 'access');
    
    // Send response
    return res.status(200).json({
      success: true,
      token: accessToken
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error during token refresh' 
    });
  }
};