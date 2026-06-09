import { NextResponse } from "next/server";
import { getPool, setPool } from "@/lib/db";
import { buildRounds } from "@/lib/worldcup";

function slugify(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}
const uid = () => Math.random().toString(36).slice(2, 10);

export async function POST(req) {
  const body = await req.json();
  const { poolName, adminName, adminPin, drawSurvives } = body;
  if (!poolName || !adminName || !adminPin || adminPin.length < 4) {
    return NextResponse.json({ error: "Missing pool name, your name, or a 4+ digit PIN." }, { status: 400 });
  }
  let slug = slugify(poolName) || "pool";
  // ensure unique slug
  if (await getPool(slug)) slug = `${slug}-${uid().slice(0, 4)}`;

  const adminId = uid();
  const pool = {
    config: {
      slug,
      poolName,
      adminId,
      drawSurvives: !!drawSurvives,
      rounds: buildRounds(),
      createdAt: Date.now(),
    },
    players: { [adminId]: { id: adminId, name: adminName, pin: adminPin, joinedAt: Date.now() } },
    picks: {},
    results: {},
  };
  await setPool(slug, pool);
  return NextResponse.json({ slug, playerId: adminId });
}
