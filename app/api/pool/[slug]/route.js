import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";

// GET ?viewer=<playerId> — returns a sanitized pool:
//  - PINs removed
//  - picks for a round are hidden from other players until that round locks
export async function GET(req, { params }) {
  const pool = await getPool(params.slug);
  if (!pool) return NextResponse.json({ error: "Pool not found" }, { status: 404 });

  const viewer = new URL(req.url).searchParams.get("viewer");
  const now = Date.now();

  const players = {};
  for (const [id, p] of Object.entries(pool.players)) {
    players[id] = { id: p.id, name: p.name, joinedAt: p.joinedAt }; // no PIN
  }

  const picks = {};
  for (const r of pool.config.rounds) {
    const locked = now >= new Date(r.lockTime).getTime();
    const roundPicks = pool.picks[r.id] || {};
    if (locked) {
      picks[r.id] = roundPicks; // reveal everyone
    } else {
      // only the viewer's own pick is exposed before lock
      picks[r.id] = viewer && roundPicks[viewer] ? { [viewer]: roundPicks[viewer] } : {};
    }
  }

  return NextResponse.json({
    config: pool.config,
    players,
    picks,
    results: pool.results,
    serverTime: now,
  });
}
