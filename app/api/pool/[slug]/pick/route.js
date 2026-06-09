import { NextResponse } from "next/server";
import { updatePool } from "@/lib/db";
import { computeStatus, usedTeams } from "@/lib/game";

// POST { playerId, roundId, team }
export async function POST(req, { params }) {
  const { playerId, roundId, team } = await req.json();
  let result = null;

  await updatePool(params.slug, (pool) => {
    if (!pool) throw new Error("not found");
    const round = pool.config.rounds.find((r) => r.id === roundId);
    if (!round) { result = { error: "Unknown round." }; return pool; }
    if (!pool.players[playerId]) { result = { error: "Unknown player." }; return pool; }

    // lock enforcement — the key reason picks stay honest
    if (Date.now() >= new Date(round.lockTime).getTime()) {
      result = { error: "This round is locked." }; return pool;
    }
    // must still be alive
    const status = computeStatus(pool.config, pool.players, pool.picks, pool.results);
    if (!status[playerId]?.alive) { result = { error: "You've been eliminated." }; return pool; }

    // team must be in this round
    const teams = round.fixtures.flatMap((f) => [f.home, f.away]);
    if (!teams.includes(team)) { result = { error: "That team isn't in this round." }; return pool; }

    // no reusing a team across rounds
    if (usedTeams(pool.config.rounds, pool.picks, playerId, roundId).has(team)) {
      result = { error: "You've already used that team." }; return pool;
    }

    pool.picks[roundId] = pool.picks[roundId] || {};
    pool.picks[roundId][playerId] = team;
    result = { ok: true };
    return pool;
  });

  if (result?.error) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
