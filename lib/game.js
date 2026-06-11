// Pure game logic: slot resolution, lives, elimination, duos. No I/O.

// Resolve a bracket slot to a real team name (or null if not yet known).
export function resolveSlot(slot, config, results) {
  if (!slot) return null;
  const assigned = config.slots?.[slot];
  if (assigned) return assigned;
  if (slot[0] === "W") {
    const m = Number(slot.slice(1));
    for (const r of config.rounds) {
      if (r.type !== "ko") continue;
      const f = r.fixtures.find((x) => x.match === m);
      if (!f) continue;
      const h = resolveSlot(f.homeSlot, config, results);
      const a = resolveSlot(f.awaySlot, config, results);
      const res = results?.[r.id] || {};
      if (h && res[h] === "W") return h;
      if (a && res[a] === "W") return a;
      return null;
    }
  }
  return null;
}

// Resolved {home, away} names for any fixture (group fixtures already have names).
export function fixtureTeams(f, config, results) {
  if (f.home) return { home: f.home, away: f.away };
  return {
    home: resolveSlot(f.homeSlot, config, results),
    away: resolveSlot(f.awaySlot, config, results),
  };
}

// Lives-based status.
// Each wrong pick (loss, or draw when drawSurvives is off, or missed pick in a
// resolved round/match) costs a life. Eliminated when wrong > config.lives.
export function computeStatus(config, players, picks, results) {
  const lives = config.lives ?? 2;
  const out = {};
  for (const pid of Object.keys(players)) {
    let wrong = 0;
    let alive = true;
    const entries = [];
    for (const r of config.rounds) {
      const res = results?.[r.id] || {};
      if (r.mode === "one") {
        const pick = picks?.[r.id]?.[pid];
        const pickName = typeof pick === "string" ? pick : null;
        const resolved = Object.keys(res).length > 0;
        if (!resolved) { if (pickName && alive) entries.push({ label:r.name, team:pickName, ok:null }); continue; }
        if (!alive) continue;
        if (!pickName) { wrong++; entries.push({ label:r.name, team:null, ok:false }); }
        else {
          const o = res[pickName];
          const ok = o === "W" || (o === "D" && config.drawSurvives);
          if (!ok) wrong++;
          entries.push({ label:r.name, team:pickName, ok });
        }
      } else {
        // pick-every-game round
        const map = (picks?.[r.id]?.[pid] && typeof picks[r.id][pid] === "object") ? picks[r.id][pid] : {};
        for (const f of r.fixtures) {
          const { home, away } = fixtureTeams(f, config, results);
          const matchResolved = (home && res[home] !== undefined) || (away && res[away] !== undefined);
          const t = map[f.match] || map[String(f.match)];
          if (!matchResolved) { if (t && alive) entries.push({ label:`M${f.match}`, team:t, ok:null }); continue; }
          if (!alive) continue;
          if (!t) { wrong++; entries.push({ label:`M${f.match}`, team:null, ok:false }); }
          else {
            const ok = res[t] === "W";
            if (!ok) wrong++;
            entries.push({ label:`M${f.match}`, team:t, ok });
          }
        }
      }
      if (wrong > lives) { alive = false; }
    }
    out[pid] = { alive: wrong <= lives, livesLeft: Math.max(0, lives - wrong), wrong, entries };
  }
  return out;
}

// Teams already used in OTHER **group** rounds (no-reuse applies to groups only).
export function usedTeams(config, picks, pid, exceptRoundId) {
  const used = new Set();
  for (const r of config.rounds) {
    if (r.type !== "group" || r.id === exceptRoundId) continue;
    const t = picks?.[r.id]?.[pid];
    if (typeof t === "string") used.add(t);
  }
  return used;
}

// Duo status: a duo is alive while any member is alive.
export function duoStatus(config, status) {
  const duos = config.duos || [];
  return duos.map((d) => ({
    ...d,
    alive: d.members.some((pid) => status[pid]?.alive),
  }));
}
