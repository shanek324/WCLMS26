"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [poolName, setPoolName] = useState("World Cup 2026");
  const [adminName, setAdminName] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [drawSurvives, setDrawSurvives] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function create() {
    setErr(""); setBusy(true);
    try {
      const res = await fetch("/api/pool/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poolName, adminName, adminPin, drawSurvives }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Something went wrong."); setBusy(false); return; }
      localStorage.setItem(`lts:${data.slug}`, data.playerId);
      router.push(`/${data.slug}`);
    } catch {
      setErr("Network error — try again."); setBusy(false);
    }
  }

  return (
    <div className="wrap splash">
      <span className="eyebrow">Set up your pool</span>
      <div className="big mt">LAST TEAM<br /><span className="last">STANDING</span></div>
      <p className="sub">
        Pick one team to win each round. Win and you survive. Lose or draw and you're out.
        Last person standing takes the pot. Built for the 2026 World Cup group stage — 18 rounds, all fixtures loaded.
      </p>

      <div className="card">
        <h2 className="sec">Create the pool</h2>
        <label className="fld">Pool name</label>
        <input className="txt" value={poolName} onChange={(e) => setPoolName(e.target.value)} />
        <label className="fld">Your name (you'll be the admin)</label>
        <input className="txt" value={adminName} onChange={(e) => setAdminName(e.target.value)} placeholder="e.g. Dave" />
        <label className="fld">Your PIN (to log back in)</label>
        <input className="txt mono" value={adminPin} inputMode="numeric" maxLength={8}
               onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" />

        <label className="fld">Draw rule</label>
        <div className="seg">
          <button className={!drawSurvives ? "on" : ""} onClick={() => setDrawSurvives(false)}>Draw = out (strict)</button>
          <button className={drawSurvives ? "on" : ""} onClick={() => setDrawSurvives(true)}>Draw survives</button>
        </div>
        <div className="small mt">You can still mark each result by hand later; this just sets the default expectation for players.</div>

        <button className="btn" onClick={create} disabled={busy}>{busy ? "Creating…" : "Create pool"}</button>
        {err && <div className="err">{err}</div>}
      </div>
    </div>
  );
}
