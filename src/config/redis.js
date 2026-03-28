const Redis = require('ioredis');

const redisClient = new Redis(process.env.UPSTASH_REDIS_URL, {
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: null,
  enableOfflineQueue: true,
  connectTimeout: 10000
});

redisClient.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

redisClient.on('connect', () => {
  console.log('Redis connected successfully');
});

module.exports = { redisClient };
