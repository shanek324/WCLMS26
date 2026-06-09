import { NextResponse } from "next/server";
import { updatePool } from "@/lib/db";

// POST { playerId, from, to } — admin only. Renames a team everywhere.
export async function POST(req, { params }) {
  const { playerId, from, to } = await req.json();
  let result = null;

  await updatePool(params.slug, (pool) => {
    if (!pool) throw new Error("not found");
    if (playerId !== pool.config.adminId) { result = { error: "Admins only." }; return pool; }
    const newName = (to || "").trim();
    if (!newName) { result = { error: "Enter a team name." }; return pool; }

    for (const r of pool.config.rounds) {
      for (const f of r.fixtures) {
        if (f.home === from) f.home = newName;
        if (f.away === from) f.away = newName;
      }
    }
    for (const rid of Object.keys(pool.picks)) {
      for (const pid of Object.keys(pool.picks[rid])) {
        if (pool.picks[rid][pid] === from) pool.picks[rid][pid] = newName;
      }
    }
    for (const rid of Object.keys(pool.results)) {
      if (pool.results[rid] && from in pool.results[rid]) {
        pool.results[rid][newName] = pool.results[rid][from];
        delete pool.results[rid][from];
      }
    }
    result = { ok: true };
    return pool;
  });

  if (result?.error) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
