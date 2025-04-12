import app from './app.js';
import connectDB from './config/db.js';
import Category from './models/Category.js';
import User from './models/User.js';

const PORT = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

// Create default categories with admin user
const createDefaultCategories = async () => {
  try {
    // Find or create admin user
    let adminUser = await User.findOne({ email: 'admin@example.com' });
    if (!adminUser) {
      adminUser = await User.create({
        email: 'admin@example.com',
        password: 'admin123', // Change this in production
        isAdmin: true
      });
    }

    const defaultCategories = [
      { name: 'work', color: 'red', user: adminUser._id },
      { name: 'health', color: 'purple', user: adminUser._id },
      { name: 'event', color: 'green', user: adminUser._id },
      { name: 'other', color: 'blue', user: adminUser._id },
    ];

    for (const category of defaultCategories) {
      const existingCategory = await Category.findOne({ 
        name: category.name,
        user: adminUser._id 
      });
      
      if (!existingCategory) {
        await Category.create(category);
      }
    }
  } catch (error) {
    console.error('Error creating default categories:', error);
  }
};

// Initialize default data
const initializeData = async () => {
  try {
    await createDefaultCategories();
    console.log('Default categories created successfully');
  } catch (error) {
    console.error('Error initializing data:', error);
  }
};

initializeData();

// Enforce HTTPS
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit: http://localhost:${PORT}`);
});
