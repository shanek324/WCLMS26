"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { flag } from "@/lib/worldcup";
import { computeStatus, usedTeams } from "@/lib/game";

const fmtTime = (iso) =>
  new Date(iso).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
function fmtCountdown(ms) {
  if (ms <= 0) return "LOCKED";
  const s = Math.floor(ms / 1000), d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${ss}s`;
  return `${ss}s`;
}

export default function PoolPage() {
  const { slug } = useParams();
  const [state, setState] = useState(null);
  const [me, setMe] = useState(null);
  const [tab, setTab] = useState("play");
  const [toast, setToast] = useState(null);
  const [tick, setTick] = useState(Date.now());
  const [notFound, setNotFound] = useState(false);
  const meRef = useRef(null);

  const flash = (m) => { setToast(m); setTimeout(() => setToast(null), 2200); };

  const load = useCallback(async () => {
    const viewer = meRef.current || "";
    const res = await fetch(`/api/pool/${slug}?viewer=${viewer}`, { cache: "no-store" });
    if (res.status === 404) { setNotFound(true); return; }
    const data = await res.json();
    setState(data);
  }, [slug]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(`lts:${slug}`) : null;
    if (saved) { meRef.current = saved; setMe(saved); }
    load();
  }, [slug, load]);

  useEffect(() => { const id = setInterval(() => setTick(Date.now()), 1000); return () => clearInterval(id); }, []);
  useEffect(() => { const id = setInterval(load, 15000); return () => clearInterval(id); }, [load]);

  if (notFound) return <div className="wrap loading">Pool not found. Check the link.</div>;
  if (!state) return <div className="wrap loading">loading the pool…</div>;

  const { config, players } = state;
  const amMember = me && players[me];

  if (!amMember) {
    return <Join slug={slug} players={players} config={config} onIn={(pid) => {
      localStorage.setItem(`lts:${slug}`, pid); meRef.current = pid; setMe(pid); load();
    }} />;
  }

  const isAdmin = me === config.adminId;
  const shared = { slug, state, me, isAdmin, tick, flash, reload: load, setState };

  return (
    <div className="wrap">
      <header className="app">
        <div className="title">LAST TEAM<br /><span className="last">STANDING</span></div>
        <div className="pill">{config.poolName}</div>
      </header>
      {tab === "play" && <Play {...shared} />}
      {tab === "table" && <Standings {...shared} />}
      {tab === "admin" && isAdmin && <Admin {...shared} />}
      <nav className="tabs">
        <button className={"t" + (tab === "play" ? " on" : "")} onClick={() => setTab("play")}><span className="ic">⚽</span>PICK</button>
        <button className={"t" + (tab === "table" ? " on" : "")} onClick={() => setTab("table")}><span className="ic">🏆</span>TABLE</button>
        {isAdmin && <button className={"t" + (tab === "admin" ? " on" : "")} onClick={() => setTab("admin")}><span className="ic">⚙︎</span>ADMIN</button>}
      </nav>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

/* ---------------- PICK ---------------- */
function Play({ slug, state, me, tick, flash, reload }) {
  const { config, players, picks, results } = state;
  const rounds = config.rounds;
  const firstOpen = () => { for (const r of rounds) if (Date.now() < new Date(r.lockTime).getTime()) return r.id; return rounds[rounds.length - 1]?.id; };
  const [sel, setSel] = useState(firstOpen());
  const round = rounds.find((r) => r.id === sel) || rounds[0];

  const lockMs = new Date(round.lockTime).getTime();
  const locked = tick >= lockMs;
  const used = usedTeams(rounds, picks, me, round.id);
  const myPick = picks?.[round.id]?.[me] || null;
  const [choice, setChoice] = useState(myPick);
  useEffect(() => { setChoice(picks?.[round.id]?.[me] || null); }, [sel]); // eslint-disable-line

  const status = computeStatus(config, players, picks, results);
  const alive = status[me]?.alive;

  async function submit() {
    if (!choice) return;
    const res = await fetch(`/api/pool/${slug}/pick`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: me, roundId: round.id, team: choice }),
    });
    const data = await res.json();
    if (!res.ok) { flash(data.error || "Couldn't save."); return; }
    flash("Pick locked in: " + choice); reload();
  }

  return (
    <>
      <div className="roundsel">
        {rounds.map((r) => {
          const lk = Date.now() >= new Date(r.lockTime).getTime();
          return <button key={r.id} className={"rb" + (r.id === sel ? " on" : "")} onClick={() => setSel(r.id)}>{r.name}{lk ? " ·" : ""}</button>;
        })}
      </div>

      {!alive && (
        <div className="card tight" style={{ borderColor: "var(--out)" }}>
          <span className="eyebrow" style={{ color: "var(--out)" }}>Eliminated</span>
          <div className="muted mt" style={{ fontSize: 14 }}>You're out, but stick around to watch the survivors sweat.</div>
        </div>
      )}

      <div className="card">
        <span className="eyebrow">{round.name} · {round.sub}</span>
        <h2 className="sec" style={{ marginTop: 4 }}>Pick one team to win</h2>
        <div className={"lockbar " + (locked ? "shut" : "open")}>
          {locked ? <>🔒 Picks revealed · locked {fmtTime(round.lockTime)}</>
                  : <>🔓 Locks in <span className="countdown">{fmtCountdown(lockMs - tick)}</span></>}
        </div>

        {!locked && alive && (
          <>
            <div className="fixtures">
              {round.fixtures.map((f, i) => {
                const uH = used.has(f.home), uA = used.has(f.away);
                return (
                  <div className="fixture" key={i}>
                    <button className={"side" + (choice === f.home ? " sel" : "") + (uH ? " used" : "")} onClick={() => !uH && setChoice(f.home)}>
                      <span className="fl">{flag(f.home)}</span><span className="tn">{f.home}</span>
                      <span className={"tick" + (choice === f.home ? " on" : "")}>{choice === f.home ? "✓" : ""}</span>
                    </button>
                    <span className="vs">v</span>
                    <button className={"side away" + (choice === f.away ? " sel" : "") + (uA ? " used" : "")} onClick={() => !uA && setChoice(f.away)}>
                      <span className={"tick" + (choice === f.away ? " on" : "")}>{choice === f.away ? "✓" : ""}</span>
                      <span className="tn">{f.away}</span><span className="fl">{flag(f.away)}</span>
                    </button>
                  </div>
                );
              })}
            </div>
            <button className="btn" disabled={!choice || choice === myPick} onClick={submit}>
              {myPick ? (choice === myPick ? `Locked in: ${myPick}` : `Change to ${choice}`) : (choice ? `Lock in ${choice}` : "Tap a team above")}
            </button>
            {myPick && <div className="small center mt">You can change your pick until it locks. Nobody else can see it yet.</div>}
            <div className="small center mt">Greyed-out teams are ones you've already used.</div>
          </>
        )}

        {!locked && !alive && <div className="muted mt">Picking is closed for eliminated players.</div>}
        {locked && <Reveal config={config} players={players} round={round} picks={picks} results={results} />}
      </div>
    </>
  );
}

function Reveal({ config, players, round, picks, results }) {
  const pk = picks?.[round.id] || {};
  const res = results?.[round.id] || {};
  const resolved = Object.keys(res).length > 0;
  const rows = Object.keys(players)
    .map((pid) => ({ pid, name: players[pid].name, team: pk[pid] }))
    .sort((a, b) => (a.team || "~").localeCompare(b.team || "~"));
  return (
    <div className="mt">
      <span className="eyebrow">Everyone's picks</span>
      {rows.map((r) => {
        const o = r.team ? res[r.team] : null;
        return (
          <div className="row" key={r.pid}>
            <div className="avatar">{r.name.slice(0, 2).toUpperCase()}</div>
            <div className="name">{r.name}</div>
            <div className="tag" style={{ background: "var(--surface2)", color: o === "W" ? "var(--alive)" : (o ? "var(--out)" : "var(--text)") }}>
              {r.team ? `${flag(r.team)} ${r.team}` : "— no pick —"} {resolved && r.team && (o === "W" ? "✓" : "✕")}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- TABLE ---------------- */
function Standings({ state }) {
  const { config, players, picks, results } = state;
  const status = computeStatus(config, players, picks, results);
  const list = Object.keys(players).map((pid) => ({ pid, name: players[pid].name, ...status[pid] }));
  const alive = list.filter((p) => p.alive).sort((a, b) => a.name.localeCompare(b.name));
  const dead = list.filter((p) => !p.alive).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <div className="card tight" style={{ display: "flex", justifyContent: "space-around", textAlign: "center" }}>
        <div><div className="big" style={{ fontSize: 40, color: "var(--alive)" }}>{alive.length}</div><div className="small">still alive</div></div>
        <div><div className="big" style={{ fontSize: 40, color: "var(--out)" }}>{dead.length}</div><div className="small">eliminated</div></div>
        <div><div className="big" style={{ fontSize: 40 }}>{list.length}</div><div className="small">players</div></div>
      </div>

      {alive.length === 1 && (
        <div className="card center" style={{ borderColor: "var(--gold)" }}>
          <span className="eyebrow">Winner</span>
          <div className="big" style={{ color: "var(--gold)", marginTop: 6 }}>{alive[0].name}</div>
          <div className="muted mt">Last team standing. 🏆</div>
        </div>
      )}

      <div className="card">
        <h2 className="sec">Survivors</h2>
        {alive.length === 0 && <div className="muted">Nobody left standing.</div>}
        {alive.map((p) => <PlayerRow key={p.pid} p={p} alive />)}
      </div>
      {dead.length > 0 && (
        <div className="card">
          <h2 className="sec" style={{ color: "var(--muted)" }}>Knocked out</h2>
          {dead.map((p) => <PlayerRow key={p.pid} p={p} />)}
        </div>
      )}
    </>
  );
}

function PlayerRow({ p, alive }) {
  return (
    <div className={"row " + (alive ? "alive" : "out")} style={{ alignItems: "flex-start" }}>
      <div className="status-dot" style={{ marginTop: 6 }} />
      <div style={{ flex: 1 }}>
        <div className="name">{p.name} <span className={"tag " + (alive ? "alive" : "out")}>{alive ? "ALIVE" : "OUT"}</span></div>
        <div className="streak">
          {p.history.map((h, i) => {
            if (h.outcome === "dead" || h.outcome === "none") return null;
            let cls = "";
            let txt = h.team ? `${flag(h.team)} ${h.team}` : "—";
            if (h.outcome === "W") cls = "W";
            else if (h.outcome === "L") cls = "L";
            else if (h.outcome === "miss") { cls = "L"; txt = "no pick"; }
            return <span key={i} className={"chip " + cls}>{txt}{h.outcome === "W" ? " ✓" : (cls === "L" ? " ✕" : "")}</span>;
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------- ADMIN ---------------- */
function Admin({ slug, state, me, flash, reload }) {
  const { config, players, picks, results } = state;
  const [sel, setSel] = useState(config.rounds[0]?.id);
  const round = config.rounds.find((r) => r.id === sel);
  const [local, setLocal] = useState({});
  useEffect(() => { setLocal(results?.[sel] || {}); }, [sel, results]);

  const picked = Array.from(new Set(Object.values(picks?.[sel] || {}).filter(Boolean)));
  const [shareUrl, setShareUrl] = useState("");
  useEffect(() => { setShareUrl(typeof window !== "undefined" ? window.location.href : ""); }, []);

  async function saveResults() {
    const res = await fetch(`/api/pool/${slug}/results`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: me, roundId: sel, results: local }),
    });
    const data = await res.json();
    if (!res.ok) { flash(data.error || "Save failed."); return; }
    flash("Results saved — survivors updated."); reload();
  }

  const [renameFrom, setRenameFrom] = useState("");
  const [renameTo, setRenameTo] = useState("");
  const allTeams = Array.from(new Set(config.rounds.flatMap((r) => r.fixtures.flatMap((f) => [f.home, f.away])))).sort();

  async function rename() {
    if (!renameFrom || !renameTo.trim()) { flash("Pick a team and enter a new name."); return; }
    const res = await fetch(`/api/pool/${slug}/round`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: me, from: renameFrom, to: renameTo.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { flash(data.error || "Rename failed."); return; }
    flash(`Renamed to ${renameTo.trim()}`); setRenameFrom(""); setRenameTo(""); reload();
  }

  return (
    <>
      <div className="card tight">
        <span className="eyebrow">Share this link with your group</span>
        <div className="copybar">
          <input className="txt" readOnly value={shareUrl} onFocus={(e) => e.target.select()} />
          <button className="btn ghost" style={{ marginTop: 0, width: "auto", padding: "13px 14px" }}
                  onClick={() => { navigator.clipboard?.writeText(shareUrl); flash("Link copied"); }}>Copy</button>
        </div>
        <div className="small mt">Anyone with the link can join with a name + PIN.</div>
      </div>

      <div className="card">
        <h2 className="sec">Enter results</h2>
        <div className="roundsel">
          {config.rounds.map((r) => <button key={r.id} className={"rb" + (r.id === sel ? " on" : "")} onClick={() => setSel(r.id)}>{r.name}</button>)}
        </div>
        {picked.length === 0 ? (
          <p className="muted mt">No picks made for {round?.name} yet.</p>
        ) : (
          <>
            <p className="small">Mark each picked team Won or Out. {config.drawSurvives ? "House rule: a draw survives, so mark drawing teams Won." : "A loss or draw knocks a player out."}</p>
            {picked.map((t) => (
              <div className="resultrow" key={t}>
                <div style={{ flex: 1, fontWeight: 600 }}>{flag(t)} {t}</div>
                <div className="seg" style={{ flex: "0 0 auto" }}>
                  <button className={local[t] === "W" ? "on" : ""} style={local[t] === "W" ? { background: "var(--alive)" } : {}} onClick={() => setLocal({ ...local, [t]: "W" })}>Won</button>
                  <button className={local[t] === "L" ? "on" : ""} style={local[t] === "L" ? { background: "var(--out)" } : {}} onClick={() => setLocal({ ...local, [t]: "L" })}>Out</button>
                </div>
              </div>
            ))}
            <button className="btn" onClick={saveResults}>Save results for {round?.name}</button>
          </>
        )}
      </div>

      <div className="card">
        <h2 className="sec">Rename a team</h2>
        <p className="small">All 48 teams are confirmed, but if a name needs fixing it updates everywhere.</p>
        <label className="fld">Team</label>
        <select className="txt" value={renameFrom} onChange={(e) => setRenameFrom(e.target.value)}>
          <option value="">Select…</option>
          {allTeams.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <label className="fld">New name</label>
        <input className="txt" value={renameTo} onChange={(e) => setRenameTo(e.target.value)} />
        <button className="btn ghost" onClick={rename}>Rename</button>
      </div>

      <div className="card">
        <h2 className="sec">Players ({Object.keys(players).length})</h2>
        {Object.values(players).map((p) => (
          <div className="row" key={p.id}>
            <div className="avatar">{p.name.slice(0, 2).toUpperCase()}</div>
            <div className="name">{p.name}{p.id === config.adminId ? " · admin" : ""}</div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ---------------- JOIN ---------------- */
function Join({ slug, players, config, onIn }) {
  const [mode, setMode] = useState("new");
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [who, setWho] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const existing = Object.values(players);

  async function go() {
    setErr(""); setBusy(true);
    const body = mode === "new" ? { mode, name, pin } : { mode: "back", playerId: who, pin };
    const res = await fetch(`/api/pool/${slug}/join`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { setErr(data.error || "Try again."); setBusy(false); return; }
    onIn(data.playerId);
  }

  return (
    <div className="wrap splash">
      <span className="eyebrow">{config.poolName}</span>
      <div className="big mt">LAST TEAM<br /><span className="last">STANDING</span></div>
      <p className="sub">Pick one team to win each round. Win and you survive. Lose or draw and you're out. Last person standing takes it all.</p>
      <div className="card">
        <div className="seg" style={{ marginBottom: 6 }}>
          <button className={mode === "new" ? "on" : ""} onClick={() => { setMode("new"); setErr(""); }}>I'm new</button>
          <button className={mode === "back" ? "on" : ""} onClick={() => { setMode("back"); setErr(""); }}>I'm returning</button>
        </div>
        {mode === "new" ? (
          <>
            <label className="fld">Your name</label>
            <input className="txt" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Dave" />
            <label className="fld">Set a PIN</label>
            <input className="txt mono" value={pin} inputMode="numeric" maxLength={8} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" />
          </>
        ) : (
          <>
            <label className="fld">Who are you?</label>
            <select className="txt" value={who} onChange={(e) => setWho(e.target.value)}>
              <option value="">Select your name…</option>
              {existing.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <label className="fld">Your PIN</label>
            <input className="txt mono" value={pin} inputMode="numeric" maxLength={8} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" />
          </>
        )}
        <button className="btn" onClick={go} disabled={busy}>{busy ? "…" : (mode === "new" ? "Join the pool" : "Log back in")}</button>
        {err && <div className="err">{err}</div>}
      </div>
      <div className="small center mt">{existing.length} player{existing.length !== 1 ? "s" : ""} in so far</div>
    </div>
  );
}
