import { Redis } from "@upstash/redis";

let _redis = null;
function client() {
  if (!_redis) {
    _redis = new Redis({
      url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return _redis;
}

const key = (slug) => `pool:${slug}`;

export async function getPool(slug) {
  const data = await client().get(key(slug));
  return data || null;
}

export async function setPool(slug, pool) {
  await client().set(key(slug), pool);
  return pool;
}

export async function updatePool(slug, mutator) {
  const current = (await client().get(key(slug))) || null;
  const next = mutator(current);
  await client().set(key(slug), next);
  return next;
}
