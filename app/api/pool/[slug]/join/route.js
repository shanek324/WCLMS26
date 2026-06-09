import { NextResponse } from "next/server";
import { updatePool } from "@/lib/db";

const uid = () => Math.random().toString(36).slice(2, 10);

// POST { mode:'new'|'back', name, pin, playerId? }
export async function POST(req, { params }) {
  const { mode, name, pin, playerId } = await req.json();
  let result = null;

  await updatePool(params.slug, (pool) => {
    if (!pool) throw new Error("not found");

    if (mode === "back") {
      // log back in: match by playerId + pin, or by name + pin
      const p = playerId
        ? pool.players[playerId]
        : Object.values(pool.players).find((x) => x.name.toLowerCase() === (name || "").toLowerCase());
      if (!p || p.pin !== pin) { result = { error: "Wrong name or PIN." }; return pool; }
      result = { playerId: p.id };
      return pool;
    }

    // new join
    const nm = (name || "").trim();
    if (nm.length < 2) { result = { error: "Enter your name." }; return pool; }
    if (!pin || pin.length < 4) { result = { error: "Pick a 4+ digit PIN." }; return pool; }
    if (Object.values(pool.players).some((x) => x.name.toLowerCase() === nm.toLowerCase())) {
      result = { error: "That name is taken — use \"I'm returning\" instead." };
      return pool;
    }
    const id = uid();
    pool.players[id] = { id, name: nm, pin, joinedAt: Date.now() };
    result = { playerId: id };
    return pool;
  });

  if (result?.error) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
