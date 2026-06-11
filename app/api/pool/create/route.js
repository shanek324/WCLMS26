import { NextResponse } from "next/server";
import { getPool, setPool } from "@/lib/db";
import { buildRounds } from "@/lib/worldcup";

function slugify(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
}
const uid = () => Math.random().toString(36).slice(2, 10);

export async function POST(req) {
  const { poolName, adminName, adminPin, drawSurvives } = await req.json();
  if (!poolName || !adminName || !adminPin || adminPin.length < 4) {
    return NextResponse.json({ error: "Missing pool name, your name, or a 4+ digit PIN." }, { status: 400 });
  }
  let slug = slugify(poolName) || "pool";
  if (await getPool(slug)) slug = `${slug}-${uid().slice(0, 4)}`;

  const adminId = uid();
  const pool = {
    config: {
      slug, poolName, adminId,
      drawSurvives: !!drawSurvives,
      lives: 2,                 // spare lives — eliminated on the 3rd wrong pick
      slots: {},                // bracket slot -> team, assigned by admin after groups
      duos: [
        { id: "d1", name: "Team 1", members: [] },
        { id: "d2", name: "Team 2", members: [] },
      ],
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
