import { Redis } from "@upstash/redis";

// Uses Upstash Redis. On Vercel, add the Upstash integration (free) and it sets
// these env vars automatically. Locally, put them in .env.local
const redis = new Redis({
  url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Single pool document keyed by a slug. Everything for one pool lives here.
// Shape: { config, players: {id:{name,pin}}, picks: {roundId:{pid:team}}, results: {roundId:{team:'W'|'L'}} }
const key = (slug) => `pool:${slug}`;

export async function getPool(slug) {
  const data = await redis.get(key(slug));
  return data || null;
}

export async function setPool(slug, pool) {
  await redis.set(key(slug), pool);
  return pool;
}

// Atomic-ish update: read, mutate, write. Fine for a 10-20 person pool.
export async function updatePool(slug, mutator) {
  const current = (await redis.get(key(slug))) || null;
  const next = mutator(current);
  await redis.set(key(slug), next);
  return next;
}
