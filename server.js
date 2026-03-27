require('dotenv').config();
const http = require('http');
const app = require('./src/app');
const connectDB = require('./src/config/db');
const { redisClient } = require('./src/config/redis');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Redis client connection event listeners
redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    // Disconnect from Redis
    redisClient.quit(() => {
      console.log('Redis client disconnected');
      process.exit(0);
    });
  });
});
