import { NextResponse } from "next/server";
import { updatePool } from "@/lib/db";

// Admin actions. POST { playerId, action, ... }
//  action:"rename"  { from, to }      — rename a team everywhere
//  action:"slots"   { slots:{slot:team} } — assign bracket slots (merged)
//  action:"duos"    { duos:[{id,name,members}] } — set the 2v2 teams
export async function POST(req, { params }) {
  const body = await req.json();
  const { playerId, action } = body;
  let result = null;

  await updatePool(params.slug, (pool) => {
    if (!pool) throw new Error("not found");
    if (playerId !== pool.config.adminId) { result = { error: "Admins only." }; return pool; }

    if (action === "slots") {
      pool.config.slots = { ...(pool.config.slots || {}), ...(body.slots || {}) };
      for (const k of Object.keys(pool.config.slots)) {
        if (!pool.config.slots[k]) delete pool.config.slots[k]; // allow clearing
      }
      result = { ok: true };
      return pool;
    }

    if (action === "duos") {
      if (!Array.isArray(body.duos)) { result = { error: "Bad duos." }; return pool; }
      pool.config.duos = body.duos.map((d) => ({
        id: d.id, name: (d.name || "").trim() || "Team", members: Array.isArray(d.members) ? d.members : [],
      }));
      result = { ok: true };
      return pool;
    }

    if (action === "rename") {
      const from = body.from, to = (body.to || "").trim();
      if (!from || !to) { result = { error: "Pick a team and a new name." }; return pool; }
      for (const r of pool.config.rounds) {
        for (const f of r.fixtures) {
          if (f.home === from) f.home = to;
          if (f.away === from) f.away = to;
        }
      }
      for (const s of Object.keys(pool.config.slots || {})) {
        if (pool.config.slots[s] === from) pool.config.slots[s] = to;
      }
      for (const rid of Object.keys(pool.picks)) {
        for (const pid of Object.keys(pool.picks[rid])) {
          const v = pool.picks[rid][pid];
          if (v === from) pool.picks[rid][pid] = to;
          else if (v && typeof v === "object") {
            for (const m of Object.keys(v)) if (v[m] === from) v[m] = to;
          }
        }
      }
      for (const rid of Object.keys(pool.results)) {
        if (pool.results[rid] && from in pool.results[rid]) {
          pool.results[rid][to] = pool.results[rid][from];
          delete pool.results[rid][from];
        }
      }
      result = { ok: true };
      return pool;
    }

    result = { error: "Unknown action." };
    return pool;
  });

  if (result?.error) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
