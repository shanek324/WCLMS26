import { NextResponse } from "next/server";
import { updatePool } from "@/lib/db";

// POST { playerId, roundId, results: { team: 'W'|'L' } }  — admin only
export async function POST(req, { params }) {
  const { playerId, roundId, results } = await req.json();
  let result = null;

  await updatePool(params.slug, (pool) => {
    if (!pool) throw new Error("not found");
    if (playerId !== pool.config.adminId) { result = { error: "Admins only." }; return pool; }
    if (!pool.config.rounds.find((r) => r.id === roundId)) { result = { error: "Unknown round." }; return pool; }
    pool.results[roundId] = results || {};
    result = { ok: true };
    return pool;
  });

  if (result?.error) return NextResponse.json(result, { status: result.error === "Admins only." ? 403 : 400 });
  return NextResponse.json(result);
}
