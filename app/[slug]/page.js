"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { flag, prettySlot, ASSIGNABLE_SLOTS, ALL_TEAMS } from "@/lib/worldcup";
import { computeStatus, usedTeams, fixtureTeams, duoStatus } from "@/lib/game";

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
const hearts = (n) => "❤️".repeat(n) + "🖤".repeat(Math.max(0, 2 - n));

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
    setState(await res.json());
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
  const shared = { slug, state, me, isAdmin, tick, flash, reload: load };

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
  const status = computeStatus(config, players, picks, results);
  const meStat = status[me] || { alive: true, livesLeft: config.lives ?? 2 };

  return (
    <>
      <div className="card tight" style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span className="hearts">{hearts(meStat.livesLeft)}</span>
        <span className="small">{meStat.alive ? `${meStat.livesLeft} spare ${meStat.livesLeft === 1 ? "life" : "lives"} left — out on your 3rd wrong pick` : "You're eliminated"}</span>
      </div>

      <div className="roundsel">
        {rounds.map((r) => {
          const lk = Date.now() >= new Date(r.lockTime).getTime();
          return <button key={r.id} className={"rb" + (r.id === sel ? " on" : "")} onClick={() => setSel(r.id)}>{r.name}{lk ? " ·" : ""}</button>;
        })}
      </div>

      <div className="card">
        <span className="eyebrow">{round.name} · {round.sub}</span>
        <div className={"lockbar " + (locked ? "shut" : "open")}>
          {locked ? <>🔒 Picks revealed · locked {fmtTime(round.lockTime)}</>
                  : <>🔓 Locks in <span className="countdown">{fmtCountdown(lockMs - tick)}</span></>}
        </div>

        {!locked && meStat.alive && round.mode === "one" &&
          <PickOne slug={slug} state={state} me={me} round={round} flash={flash} reload={reload} />}
        {!locked && meStat.alive && round.mode === "all" &&
          <PickAll slug={slug} state={state} me={me} round={round} flash={flash} reload={reload} />}

        {!locked && !meStat.alive && <div className="muted mt">Picking is closed for eliminated players — enjoy the show.</div>}
        {locked && <Reveal config={config} players={players} round={round} picks={picks} results={results} />}
      </div>
    </>
  );
}

function FixtureRow({ f, config, results, choiceFor, onPick, used }) {
  const { home, away } = fixtureTeams(f, config, results);
  const hName = home || prettySlot(f.homeSlot);
  const aName = away || prettySlot(f.awaySlot);
  const hOk = !!home && !used?.has(home);
  const aOk = !!away && !used?.has(away);
  return (
    <div className="fixture fixko">
      <button className={"side" + (choiceFor === home && home ? " sel" : "") + (!home ? " tbd" : "") + (home && used?.has(home) ? " used" : "")}
              onClick={() => hOk && onPick(home, f)}>
        <span className="fl">{home ? flag(home) : "❔"}</span><span className="tn">{hName}</span>
        <span className={"tick" + (choiceFor === home && home ? " on" : "")}>{choiceFor === home && home ? "✓" : ""}</span>
      </button>
      <span className="vs">v</span>
      <button className={"side away" + (choiceFor === away && away ? " sel" : "") + (!away ? " tbd" : "") + (away && used?.has(away) ? " used" : "")}
              onClick={() => aOk && onPick(away, f)}>
        <span className={"tick" + (choiceFor === away && away ? " on" : "")}>{choiceFor === away && away ? "✓" : ""}</span>
        <span className="tn">{aName}</span><span className="fl">{away ? flag(away) : "❔"}</span>
      </button>
    </div>
  );
}

function PickOne({ slug, state, me, round, flash, reload }) {
  const { config, picks, results } = state;
  const myPick = typeof picks?.[round.id]?.[me] === "string" ? picks[round.id][me] : null;
  const [choice, setChoice] = useState(myPick);
  useEffect(() => { setChoice(typeof picks?.[round.id]?.[me] === "string" ? picks[round.id][me] : null); }, [round.id]); // eslint-disable-line
  const used = round.type === "group" ? usedTeams(config, picks, me, round.id) : new Set();

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
      <div className="fixtures">
        {round.fixtures.map((f, i) =>
          <FixtureRow key={i} f={f} config={config} results={results} choiceFor={choice} used={used}
                      onPick={(t) => setChoice(t)} />)}
      </div>
      <button className="btn" disabled={!choice || choice === myPick} onClick={submit}>
        {myPick ? (choice === myPick ? `Locked in: ${myPick}` : `Change to ${choice}`) : (choice ? `Lock in ${choice}` : "Tap a team above")}
      </button>
      {myPick && <div className="small center mt">You can change your pick until it locks. Nobody else can see it yet.</div>}
      {round.type === "group" && <div className="small center mt">Greyed-out teams are ones you've already used (groups only).</div>}
    </>
  );
}

function PickAll({ slug, state, me, round, flash, reload }) {
  const { config, picks, results } = state;
  const saved = (picks?.[round.id]?.[me] && typeof picks[round.id][me] === "object") ? picks[round.id][me] : {};
  const [map, setMap] = useState({ ...saved });
  useEffect(() => {
    const s = (picks?.[round.id]?.[me] && typeof picks[round.id][me] === "object") ? picks[round.id][me] : {};
    setMap({ ...s });
  }, [round.id]); // eslint-disable-line

  const total = round.fixtures.length;
  const pickedCount = round.fixtures.filter((f) => map[f.match] || map[String(f.match)]).length;

  async function submit() {
    const res = await fetch(`/api/pool/${slug}/pick`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: me, roundId: round.id, picksMap: map }),
    });
    const data = await res.json();
    if (!res.ok) { flash(data.error || "Couldn't save."); return; }
    flash("Picks saved."); reload();
  }

  return (
    <>
      <div className="fixtures">
        {round.fixtures.map((f, i) =>
          <FixtureRow key={i} f={f} config={config} results={results}
                      choiceFor={map[f.match] || map[String(f.match)] || null}
                      onPick={(t) => setMap({ ...map, [f.match]: t })} />)}
      </div>
      <div className="progress center">{pickedCount} of {total} games picked — every wrong pick costs a life</div>
      <button className="btn" disabled={pickedCount === 0} onClick={submit}>Save picks ({pickedCount}/{total})</button>
      <div className="small center mt">You can change picks until the round locks.</div>
    </>
  );
}

function Reveal({ config, players, round, picks, results }) {
  const pk = picks?.[round.id] || {};
  const res = results?.[round.id] || {};
  const mark = (t) => {
    const o = res[t];
    if (o === undefined) return "";
    if (o === "W") return " ✓";
    if (o === "D") return config.drawSurvives ? " ＝✓" : " ＝✕";
    return " ✕";
  };
  const rows = Object.keys(players).map((pid) => ({ pid, name: players[pid].name, v: pk[pid] }));
  return (
    <div className="mt">
      <span className="eyebrow">Everyone's picks</span>
      {rows.map((r) => (
        <div className="row" key={r.pid} style={{ alignItems: "flex-start" }}>
          <div className="avatar">{r.name.slice(0, 2).toUpperCase()}</div>
          <div style={{ flex: 1 }}>
            <div className="name">{r.name}</div>
            {typeof r.v === "string" && <div className="streak"><span className="chip">{flag(r.v)} {r.v}{mark(r.v)}</span></div>}
            {r.v && typeof r.v === "object" && (
              <div className="streak">
                {round.fixtures.map((f) => {
                  const t = r.v[f.match] || r.v[String(f.match)];
                  return <span key={f.match} className="chip">M{f.match}: {t ? `${flag(t)} ${t}${mark(t)}` : "—"}</span>;
                })}
              </div>
            )}
            {!r.v && <div className="streak"><span className="chip">— no pick —</span></div>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------------- TABLE ---------------- */
function Standings({ state }) {
  const { config, players, picks, results } = state;
  const status = computeStatus(config, players, picks, results);
  const duos = duoStatus(config, status).filter((d) => d.members.length > 0);
  const aliveDuos = duos.filter((d) => d.alive);
  const assigned = new Set(duos.flatMap((d) => d.members));
  const solo = Object.keys(players).filter((pid) => !assigned.has(pid));

  return (
    <>
      {duos.length > 0 && aliveDuos.length === 1 && duos.length > 1 && (
        <div className="card center" style={{ borderColor: "var(--gold)" }}>
          <span className="eyebrow">Winners</span>
          <div className="big" style={{ color: "var(--gold)", marginTop: 6 }}>{aliveDuos[0].name}</div>
          <div className="muted mt">Breakfast is on the losers. 🥓</div>
        </div>
      )}

      {duos.map((d) => (
        <div key={d.id} className={"card duo" + (d.alive && aliveDuos.length === 1 && duos.length > 1 ? " winner" : "")}>
          <h3>{d.name} <span className={"tag " + (d.alive ? "alive" : "out")}>{d.alive ? "ALIVE" : "OUT"}</span></h3>
          <div className="members">
            {d.members.map((pid) => <PlayerRow key={pid} name={players[pid]?.name || "?"} s={status[pid]} />)}
          </div>
        </div>
      ))}

      {solo.length > 0 && (
        <div className="card">
          <h2 className="sec">Players</h2>
          {solo.map((pid) => <PlayerRow key={pid} name={players[pid].name} s={status[pid]} />)}
        </div>
      )}
    </>
  );
}

function PlayerRow({ name, s }) {
  if (!s) return null;
  return (
    <div className={"row " + (s.alive ? "alive" : "out")} style={{ alignItems: "flex-start" }}>
      <div className="status-dot" style={{ marginTop: 6 }} />
      <div style={{ flex: 1 }}>
        <div className="name">{name} <span className="hearts">{s.alive ? hearts(s.livesLeft) : "💀"}</span></div>
        <div className="streak">
          {s.entries.map((e, i) => (
            <span key={i} className={"chip " + (e.ok === true ? "W" : e.ok === false ? "L" : "")}>
              {e.team ? `${flag(e.team)} ${e.team}` : "no pick"}{e.ok === true ? " ✓" : e.ok === false ? " ✕" : ""}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------- ADMIN ---------------- */
function Admin({ slug, state, me, flash, reload }) {
  const { config, players, picks, results } = state;

  return (
    <>
      <ShareCard flash={flash} />
      <ResultsCard slug={slug} me={me} config={config} results={results} flash={flash} reload={reload} />
      <DuosCard slug={slug} me={me} config={config} players={players} flash={flash} reload={reload} />
      <SlotsCard slug={slug} me={me} config={config} flash={flash} reload={reload} />
      <RenameCard slug={slug} me={me} flash={flash} reload={reload} />
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

function ShareCard({ flash }) {
  const [url, setUrl] = useState("");
  useEffect(() => { setUrl(window.location.href); }, []);
  return (
    <div className="card tight">
      <span className="eyebrow">Share this link with the family</span>
      <div className="copybar">
        <input className="txt" readOnly value={url} onFocus={(e) => e.target.select()} />
        <button className="btn ghost" style={{ marginTop: 0, width: "auto", padding: "13px 14px" }}
                onClick={() => { navigator.clipboard?.writeText(url); flash("Link copied"); }}>Copy</button>
      </div>
    </div>
  );
}

function ResultsCard({ slug, me, config, results, flash, reload }) {
  const [sel, setSel] = useState(config.rounds[0]?.id);
  const round = config.rounds.find((r) => r.id === sel);
  const [local, setLocal] = useState({});
  useEffect(() => { setLocal({ ...(results?.[sel] || {}) }); }, [sel, results]);

  function setOutcome(home, away, kind) {
    const next = { ...local };
    if (kind === "H") { next[home] = "W"; next[away] = "L"; }
    if (kind === "A") { next[home] = "L"; next[away] = "W"; }
    if (kind === "D") { next[home] = "D"; next[away] = "D"; }
    setLocal(next);
  }

  async function save() {
    const res = await fetch(`/api/pool/${slug}/results`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: me, roundId: sel, results: local }),
    });
    const data = await res.json();
    if (!res.ok) { flash(data.error || "Save failed."); return; }
    flash("Results saved — table updated."); reload();
  }

  return (
    <div className="card">
      <h2 className="sec">Enter results</h2>
      <div className="roundsel">
        {config.rounds.map((r) => <button key={r.id} className={"rb" + (r.id === sel ? " on" : "")} onClick={() => setSel(r.id)}>{r.name}</button>)}
      </div>
      <p className="small">Tap who won each game{round?.type === "group" ? " (or Draw)" : ""}. Wrong picks cost players a life. Winners feed the next knockout round automatically.</p>
      {round?.fixtures.map((f, i) => {
        const { home, away } = fixtureTeams(f, config, results);
        if (!home || !away) return <div key={i} className="resultrow"><div className="small">M{f.match || i + 1}: teams not decided yet</div></div>;
        const o = local[home];
        const kind = o === "W" ? "H" : o === "D" ? "D" : local[away] === "W" ? "A" : null;
        return (
          <div key={i} className="resultrow">
            <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{flag(home)} {home} v {away} {flag(away)}</div>
            <div className="resbtns">
              <button className={kind === "H" ? "on" : ""} style={kind === "H" ? { background: "var(--alive)" } : {}} onClick={() => setOutcome(home, away, "H")}>{home.slice(0, 3)}</button>
              {round.type === "group" && <button className={kind === "D" ? "on" : ""} style={kind === "D" ? { background: "var(--gold)" } : {}} onClick={() => setOutcome(home, away, "D")}>Draw</button>}
              <button className={kind === "A" ? "on" : ""} style={kind === "A" ? { background: "var(--alive)" } : {}} onClick={() => setOutcome(home, away, "A")}>{away.slice(0, 3)}</button>
            </div>
          </div>
        );
      })}
      <button className="btn" onClick={save}>Save results for {round?.name}</button>
    </div>
  );
}

function DuosCard({ slug, me, config, players, flash, reload }) {
  const [duos, setDuos] = useState(config.duos || []);
  useEffect(() => { setDuos(config.duos || []); }, [config.duos]);

  const memberOf = (pid) => duos.find((d) => d.members.includes(pid))?.id || "";
  function assign(pid, duoId) {
    setDuos(duos.map((d) => ({
      ...d,
      members: duoId === d.id
        ? Array.from(new Set([...d.members.filter((x) => x !== pid), pid]))
        : d.members.filter((x) => x !== pid),
    })));
  }
  function renameDuo(id, name) { setDuos(duos.map((d) => (d.id === id ? { ...d, name } : d))); }

  async function save() {
    const res = await fetch(`/api/pool/${slug}/round`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: me, action: "duos", duos }),
    });
    const data = await res.json();
    if (!res.ok) { flash(data.error || "Save failed."); return; }
    flash("Teams saved."); reload();
  }

  return (
    <div className="card">
      <h2 className="sec">2v2 Teams</h2>
      {duos.map((d) => (
        <div key={d.id}>
          <label className="fld">Team name</label>
          <input className="txt" value={d.name} onChange={(e) => renameDuo(d.id, e.target.value)} />
        </div>
      ))}
      <label className="fld">Who's on which team</label>
      {Object.values(players).map((p) => (
        <div className="row" key={p.id}>
          <div className="name" style={{ flex: 1 }}>{p.name}</div>
          <select className="txt" style={{ width: "auto", padding: "8px 10px" }} value={memberOf(p.id)} onChange={(e) => assign(p.id, e.target.value)}>
            <option value="">No team</option>
            {duos.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      ))}
      <button className="btn" onClick={save}>Save teams</button>
    </div>
  );
}

function SlotsCard({ slug, me, config, flash, reload }) {
  const [local, setLocal] = useState({});
  useEffect(() => { setLocal({ ...(config.slots || {}) }); }, [config.slots]);

  async function save() {
    const res = await fetch(`/api/pool/${slug}/round`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: me, action: "slots", slots: local }),
    });
    const data = await res.json();
    if (!res.ok) { flash(data.error || "Save failed."); return; }
    flash("Bracket updated."); reload();
  }

  return (
    <div className="card">
      <h2 className="sec">Knockout bracket slots</h2>
      <p className="small">Once the groups finish, assign who actually finished where. The Round of 32 fills in from these, and later rounds fill in from your results.</p>
      {ASSIGNABLE_SLOTS.map((s) => (
        <div className="row" key={s}>
          <div className="small" style={{ flex: 1 }}>{prettySlot(s)}</div>
          <select className="txt" style={{ width: "auto", padding: "8px 10px" }} value={local[s] || ""} onChange={(e) => setLocal({ ...local, [s]: e.target.value })}>
            <option value="">TBD</option>
            {ALL_TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      ))}
      <button className="btn" onClick={save}>Save bracket slots</button>
    </div>
  );
}

function RenameCard({ slug, me, flash, reload }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  async function rename() {
    if (!from || !to.trim()) { flash("Pick a team and enter a new name."); return; }
    const res = await fetch(`/api/pool/${slug}/round`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId: me, action: "rename", from, to: to.trim() }),
    });
    const data = await res.json();
    if (!res.ok) { flash(data.error || "Rename failed."); return; }
    flash(`Renamed to ${to.trim()}`); setFrom(""); setTo(""); reload();
  }
  return (
    <div className="card">
      <h2 className="sec">Rename a team</h2>
      <label className="fld">Team</label>
      <select className="txt" value={from} onChange={(e) => setFrom(e.target.value)}>
        <option value="">Select…</option>
        {ALL_TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <label className="fld">New name</label>
      <input className="txt" value={to} onChange={(e) => setTo(e.target.value)} />
      <button className="btn ghost" onClick={rename}>Rename</button>
    </div>
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
      <p className="sub">Pick winners each round. Every wrong pick costs a life — lose all three and you're out. Last team standing wins (and breakfast).</p>
      <div className="card">
        <div className="seg" style={{ marginBottom: 6 }}>
          <button className={mode === "new" ? "on" : ""} onClick={() => { setMode("new"); setErr(""); }}>I'm new</button>
          <button className={mode === "back" ? "on" : ""} onClick={() => { setMode("back"); setErr(""); }}>I'm returning</button>
        </div>
        {mode === "new" ? (
          <>
            <label className="fld">Your name</label>
            <input className="txt" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Eve" />
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
