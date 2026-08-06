const env = require('./env');

// ─── Demo mode: no-op Redis ────────────────────────────────────────
if (env.demoMode || !process.env.REDIS_URL) {
  const noop = {
    get:    async () => null,
    set:    async () => 'OK',
    del:    async () => 1,
    expire: async () => 1,
    incr:   async () => 1,
    on:     () => noop,
    connect: async () => {},
  };
  module.exports = noop;
  return;
}

// ─── Real Redis connection ─────────────────────────────────────────
const Redis = require('ioredis');

let isConnected = false;
let warningLogged = false;

const redis = new Redis(env.redis.url, {
  password:            env.redis.password,
  lazyConnect:         true,
  retryStrategy:       (times) => {
    if (times > 3) {
      if (!warningLogged) {
        warningLogged = true;
        console.warn('[Redis] Could not connect — token blacklist disabled (Redis server offline)');
      }
      return null; // Stop retrying when offline
    }
    return Math.min(times * 200, 1000);
  },
  enableOfflineQueue:  false,
  maxRetriesPerRequest: 3,
});

redis.on('error', (err) => {
  if (isConnected) {
    console.warn('[Redis] Connection error:', err.message);
  }
});

redis.connect().then(() => {
  isConnected = true;
  console.log('[Redis] Connected successfully');
}).catch(() => {
  if (!warningLogged) {
    warningLogged = true;
    console.warn('[Redis] Could not connect — token blacklist disabled (Redis server offline)');
  }
});

module.exports = redis;
