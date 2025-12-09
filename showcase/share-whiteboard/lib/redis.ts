import Redis from "ioredis";

// Redis接続インスタンス（シングルトン）
let redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error("REDIS_URL environment variable is not set");
    }
    redis = new Redis(redisUrl);
  }
  return redis;
}

// ルーム関連のRedisキー
export const ROOM_KEY_PREFIX = "whiteboard:room:";
export const ROOM_LIST_KEY = "whiteboard:rooms";

// ルームの有効期限（24時間 = 86400秒）
export const ROOM_TTL = 60 * 60 * 24;
