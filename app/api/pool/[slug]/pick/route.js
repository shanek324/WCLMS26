import { NextResponse } from "next/server";
import { updatePool } from "@/lib/db";
import { computeStatus, usedTeams, fixtureTeams } from "@/lib/game";

// POST { playerId, roundId, team }            for mode "one"
// POST { playerId, roundId, picksMap:{m:t} }  for mode "all" (merged with existing)
export async function POST(req, { params }) {
  const { playerId, roundId, team, picksMap } = await req.json();
  let result = null;

  await updatePool(params.slug, (pool) => {
    if (!pool) throw new Error("not found");
    const round = pool.config.rounds.find((r) => r.id === roundId);
    if (!round) { result = { error: "Unknown round." }; return pool; }
    if (!pool.players[playerId]) { result = { error: "Unknown player." }; return pool; }
    if (Date.now() >= new Date(round.lockTime).getTime()) {
      result = { error: "This round is locked." }; return pool;
    }
    const status = computeStatus(pool.config, pool.players, pool.picks, pool.results);
    if (!status[playerId]?.alive) { result = { error: "You've been eliminated." }; return pool; }

    pool.picks[roundId] = pool.picks[roundId] || {};

    if (round.mode === "one") {
      const names = round.fixtures.flatMap((f) => {
        const { home, away } = fixtureTeams(f, pool.config, pool.results);
        return [home, away].filter(Boolean);
      });
      if (!names.includes(team)) { result = { error: "That team isn't available in this round yet." }; return pool; }
      if (round.type === "group" &&
          usedTeams(pool.config, pool.picks, playerId, roundId).has(team)) {
        result = { error: "You've already used that team in the groups." }; return pool;
      }
      pool.picks[roundId][playerId] = team;
    } else {
      if (!picksMap || typeof picksMap !== "object") { result = { error: "No picks given." }; return pool; }
      const existing = (typeof pool.picks[roundId][playerId] === "object" && pool.picks[roundId][playerId]) || {};
      for (const [mStr, t] of Object.entries(picksMap)) {
        const f = round.fixtures.find((x) => String(x.match) === String(mStr));
        if (!f) { result = { error: `Unknown match ${mStr}.` }; return pool; }
        const { home, away } = fixtureTeams(f, pool.config, pool.results);
        if (t !== home && t !== away) { result = { error: `${t} isn't in match ${mStr}.` }; return pool; }
        existing[f.match] = t;
      }
      pool.picks[roundId][playerId] = existing;
    }
    result = { ok: true };
    return pool;
  });

  if (result?.error) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
