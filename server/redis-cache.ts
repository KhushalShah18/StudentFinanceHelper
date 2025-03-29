import { createClient } from 'redis';

let redisClient: any = null;
let isRedisConnected = false;
let connectionAttempts = 0;
const MAX_REDIS_CONNECTION_ATTEMPTS = 3;
const isDevelopment = process.env.NODE_ENV !== "production";
const localCache = new Map<string, { data: string; expiry: number }>();

export function initRedisClient() {
  // If we already have a client or reached max attempts in dev mode, don't try again
  if (redisClient || (isDevelopment && connectionAttempts >= MAX_REDIS_CONNECTION_ATTEMPTS)) {
    if (isDevelopment && connectionAttempts >= MAX_REDIS_CONNECTION_ATTEMPTS && !isRedisConnected) {
      console.log('Using in-memory cache only (Redis connection attempts exceeded)');
    }
    return redisClient;
  }
  
  connectionAttempts++;
  
  try {
    // Check if Redis connection string is available
    const redisUrl = process.env.AZURE_REDIS_CONNECTION_STRING;
    
    if (!redisUrl) {
      console.warn('Redis connection string not found. Using in-memory cache only.');
      isRedisConnected = false;
      return null;
    }
    
    redisClient = createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          // Limit reconnection attempts in development mode
          if (isDevelopment && retries >= 2) {
            console.warn(`Redis reconnection attempts exceeded (${retries}). Using in-memory cache only.`);
            isRedisConnected = false;
            return new Error('Redis reconnection attempts exceeded');
          }
          
          // Exponential backoff
          return Math.min(retries * 100, 3000);
        }
      }
    });
    
    redisClient.on('error', (err: any) => {
      if (connectionAttempts <= MAX_REDIS_CONNECTION_ATTEMPTS) {
        console.error('Redis client error:', err);
      }
      isRedisConnected = false;
    });
    
    redisClient.on('connect', () => {
      console.log('Redis client connected');
      isRedisConnected = true;
    });
    
    // Connect asynchronously
    redisClient.connect().catch((err: any) => {
      if (connectionAttempts <= MAX_REDIS_CONNECTION_ATTEMPTS) {
        console.error('Redis connection error:', err);
      }
      redisClient = null;
      isRedisConnected = false;
      
      if (isDevelopment) {
        console.warn('Running with in-memory cache fallback in development mode');
      }
    });
  } catch (error) {
    if (connectionAttempts <= MAX_REDIS_CONNECTION_ATTEMPTS) {
      console.error('Error initializing Redis client:', error);
    }
    redisClient = null;
    isRedisConnected = false;
    
    if (isDevelopment) {
      console.warn('Running with in-memory cache fallback in development mode');
    }
  }
  
  return redisClient;
}

export function getRedisClient() {
  if (!redisClient) {
    return initRedisClient();
  }
  return redisClient;
}

export async function cacheData(key: string, data: any, ttlSeconds = 3600) {
  const jsonData = JSON.stringify(data);
  
  // Always update our local cache for fallback
  if (isDevelopment) {
    const now = Date.now();
    const expiry = now + (ttlSeconds * 1000);
    localCache.set(key, { data: jsonData, expiry });
  }
  
  // Try Redis if connected
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.set(key, jsonData, { EX: ttlSeconds });
      return true;
    } catch (error) {
      console.error('Redis cache error:', error);
      // Fallback to local cache was already done above
      return isDevelopment;
    }
  } else if (isDevelopment) {
    return true; // Using local cache in development
  }
  
  return false;
}

export async function getCachedData<T>(key: string): Promise<T | null> {
  // Try Redis if connected
  if (isRedisConnected && redisClient) {
    try {
      const data = await redisClient.get(key);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Redis get cache error:', error);
      // Fall through to local cache
    }
  }
  
  // Try local cache if in development
  if (isDevelopment) {
    const cachedItem = localCache.get(key);
    if (cachedItem) {
      // Check if expired
      if (cachedItem.expiry > Date.now()) {
        return JSON.parse(cachedItem.data);
      } else {
        // Remove expired item
        localCache.delete(key);
      }
    }
  }
  
  return null;
}

export async function invalidateCache(key: string) {
  // Clear from local cache
  if (isDevelopment) {
    localCache.delete(key);
  }
  
  // Try Redis if connected
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Redis invalidate cache error:', error);
      return isDevelopment; // Return true in dev mode as we cleared local cache
    }
  }
  
  return isDevelopment;
}
