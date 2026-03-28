const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000, 
      socketTimeoutMS: 45000, 
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    // Don't exit process, let it try to reconnect or just fail requests
    console.log('Server continuing to run... (Database might be unavailable)');
  }
};

module.exports = connectDB;
