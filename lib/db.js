import Redis from "ioredis";

let _redis = null;
function client() {
  if (!_redis) {
    _redis = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      lazyConnect: false,
    });
  }
  return _redis;
}

const key = (slug) => `pool:${slug}`;

export async function getPool(slug) {
  const data = await client().get(key(slug));
  return data ? JSON.parse(data) : null;
}

export async function setPool(slug, pool) {
  await client().set(key(slug), JSON.stringify(pool));
  return pool;
}

export async function updatePool(slug, mutator) {
  const raw = await client().get(key(slug));
  const current = raw ? JSON.parse(raw) : null;
  const next = mutator(current);
  await client().set(key(slug), JSON.stringify(next));
  return next;
}
