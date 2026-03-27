const Redis = require('ioredis');

const redisClient = new Redis(process.env.UPSTASH_REDIS_URL);

module.exports = { redisClient };
