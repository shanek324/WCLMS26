// Pure functions for game logic — no I/O. Used on client for display.

export function computeStatus(config, players, picks, results) {
  // returns { [pid]: { alive, history: [{roundId, team, outcome}] } }
  const out = {};
  const rounds = config.rounds;
  for (const pid of Object.keys(players)) {
    let alive = true;
    const history = [];
    for (const r of rounds) {
      const pick = picks?.[r.id]?.[pid];
      const res = results?.[r.id] || {};
      const resolved = Object.keys(res).length > 0;
      if (!resolved) {
        history.push({ roundId: r.id, team: pick || null, outcome: pick ? "pending" : "none" });
        continue;
      }
      if (!alive) {
        history.push({ roundId: r.id, team: pick || null, outcome: "dead" });
        continue;
      }
      if (!pick) {
        alive = false;
        history.push({ roundId: r.id, team: null, outcome: "miss" });
        continue;
      }
      if (res[pick] === "W") {
        history.push({ roundId: r.id, team: pick, outcome: "W" });
      } else {
        alive = false;
        history.push({ roundId: r.id, team: pick, outcome: res[pick] || "L" });
      }
    }
    out[pid] = { alive, history };
  }
  return out;
}

// Teams a player has already used in OTHER rounds (no-repeat rule)
export function usedTeams(rounds, picks, pid, exceptRoundId) {
  const used = new Set();
  for (const r of rounds) {
    if (r.id === exceptRoundId) continue;
    const t = picks?.[r.id]?.[pid];
    if (t) used.add(t);
  }
  return used;
}
