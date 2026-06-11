// World Cup 2026 — group stage + full knockout bracket.
// Group rounds: 4 games (two groups paired), one pick, no team reuse.
// KO chunks (Ro32/Ro16): 4 games, one pick, reuse allowed.
// QF/SF/Final: pick EVERY game.

const ET = (m, d, h, min = 0) =>
  new Date(Date.UTC(2026, m - 1, d, h + 4, min)).toISOString(); // EDT = UTC-4

export const FLAGS = {
  Mexico: "🇲🇽", "South Africa": "🇿🇦", "South Korea": "🇰🇷", Czechia: "🇨🇿",
  Canada: "🇨🇦", Switzerland: "🇨🇭", Qatar: "🇶🇦", "Bosnia and Herzegovina": "🇧🇦",
  Brazil: "🇧🇷", Morocco: "🇲🇦", Scotland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", Haiti: "🇭🇹",
  USA: "🇺🇸", Paraguay: "🇵🇾", Australia: "🇦🇺", "Türkiye": "🇹🇷",
  Germany: "🇩🇪", "Curaçao": "🇨🇼", "Ivory Coast": "🇨🇮", Ecuador: "🇪🇨",
  Netherlands: "🇳🇱", Japan: "🇯🇵", Tunisia: "🇹🇳", Sweden: "🇸🇪",
  Belgium: "🇧🇪", Egypt: "🇪🇬", Iran: "🇮🇷", "New Zealand": "🇳🇿",
  Spain: "🇪🇸", "Cape Verde": "🇨🇻", "Saudi Arabia": "🇸🇦", Uruguay: "🇺🇾",
  France: "🇫🇷", Senegal: "🇸🇳", Norway: "🇳🇴", Iraq: "🇮🇶",
  Argentina: "🇦🇷", Algeria: "🇩🇿", Austria: "🇦🇹", Jordan: "🇯🇴",
  Portugal: "🇵🇹", Uzbekistan: "🇺🇿", Colombia: "🇨🇴", "DR Congo": "🇨🇩",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Croatia: "🇭🇷", Ghana: "🇬🇭", Panama: "🇵🇦",
};
export const flag = (t) => FLAGS[t] || "🏳️";

const G = {
  A: { 1: [["Mexico", "South Africa", ET(6,11,15)], ["South Korea", "Czechia", ET(6,11,22)]],
       2: [["Czechia", "South Africa", ET(6,18,12)], ["Mexico", "South Korea", ET(6,18,21)]],
       3: [["Czechia", "Mexico", ET(6,24,21)], ["South Africa", "South Korea", ET(6,24,21)]] },
  B: { 1: [["Canada", "Bosnia and Herzegovina", ET(6,12,15)], ["Qatar", "Switzerland", ET(6,13,15)]],
       2: [["Switzerland", "Bosnia and Herzegovina", ET(6,18,15)], ["Canada", "Qatar", ET(6,18,18)]],
       3: [["Switzerland", "Canada", ET(6,24,15)], ["Bosnia and Herzegovina", "Qatar", ET(6,24,15)]] },
  C: { 1: [["Brazil", "Morocco", ET(6,13,18)], ["Haiti", "Scotland", ET(6,13,21)]],
       2: [["Scotland", "Morocco", ET(6,19,18)], ["Brazil", "Haiti", ET(6,19,21)]],
       3: [["Scotland", "Brazil", ET(6,24,18)], ["Morocco", "Haiti", ET(6,24,18)]] },
  D: { 1: [["USA", "Paraguay", ET(6,12,21)], ["Australia", "Türkiye", ET(6,13,24)]],
       2: [["Türkiye", "Paraguay", ET(6,19,24)], ["USA", "Australia", ET(6,19,15)]],
       3: [["Türkiye", "USA", ET(6,25,22)], ["Paraguay", "Australia", ET(6,25,22)]] },
  E: { 1: [["Germany", "Curaçao", ET(6,14,13)], ["Ivory Coast", "Ecuador", ET(6,14,19)]],
       2: [["Germany", "Ivory Coast", ET(6,20,16)], ["Ecuador", "Curaçao", ET(6,20,20)]],
       3: [["Ecuador", "Germany", ET(6,25,16)], ["Curaçao", "Ivory Coast", ET(6,25,16)]] },
  F: { 1: [["Netherlands", "Japan", ET(6,14,16)], ["Sweden", "Tunisia", ET(6,14,22)]],
       2: [["Netherlands", "Sweden", ET(6,20,13)], ["Tunisia", "Japan", ET(6,20,24)]],
       3: [["Japan", "Sweden", ET(6,25,19)], ["Tunisia", "Netherlands", ET(6,25,19)]] },
  G: { 1: [["Belgium", "Egypt", ET(6,15,15)], ["Iran", "New Zealand", ET(6,15,21)]],
       2: [["Belgium", "Iran", ET(6,21,15)], ["New Zealand", "Egypt", ET(6,21,21)]],
       3: [["Egypt", "Iran", ET(6,26,23)], ["New Zealand", "Belgium", ET(6,26,23)]] },
  H: { 1: [["Spain", "Cape Verde", ET(6,15,12)], ["Saudi Arabia", "Uruguay", ET(6,15,18)]],
       2: [["Spain", "Saudi Arabia", ET(6,21,12)], ["Uruguay", "Cape Verde", ET(6,21,18)]],
       3: [["Cape Verde", "Saudi Arabia", ET(6,26,20)], ["Uruguay", "Spain", ET(6,26,20)]] },
  I: { 1: [["France", "Senegal", ET(6,16,15)], ["Iraq", "Norway", ET(6,16,18)]],
       2: [["France", "Iraq", ET(6,22,17)], ["Norway", "Senegal", ET(6,22,20)]],
       3: [["Norway", "France", ET(6,26,15)], ["Senegal", "Iraq", ET(6,26,15)]] },
  J: { 1: [["Argentina", "Algeria", ET(6,16,21)], ["Austria", "Jordan", ET(6,17,24)]],
       2: [["Argentina", "Austria", ET(6,22,13)], ["Jordan", "Algeria", ET(6,22,23)]],
       3: [["Jordan", "Argentina", ET(6,27,22)], ["Algeria", "Austria", ET(6,27,22)]] },
  K: { 1: [["Portugal", "DR Congo", ET(6,17,13)], ["Uzbekistan", "Colombia", ET(6,17,22)]],
       2: [["Portugal", "Uzbekistan", ET(6,23,13)], ["Colombia", "DR Congo", ET(6,23,22)]],
       3: [["Colombia", "Portugal", ET(6,27,19,30)], ["DR Congo", "Uzbekistan", ET(6,27,19,30)]] },
  L: { 1: [["England", "Croatia", ET(6,17,16)], ["Ghana", "Panama", ET(6,17,19)]],
       2: [["England", "Ghana", ET(6,23,16)], ["Panama", "Croatia", ET(6,23,19)]],
       3: [["Panama", "England", ET(6,27,17)], ["Croatia", "Ghana", ET(6,27,17)]] },
};

const PAIRS = [["A","B"], ["C","D"], ["E","F"], ["G","H"], ["I","J"], ["K","L"]];

// Knockout: official FIFA match numbers, bracket slots, kickoffs (ET).
// Slots: "1A"=Group A winner, "2A"=runner-up, "3-ABCDF"=best 3rd from those groups, "W73"=winner of match 73.
const KO = [
  { m:73, h:"2A", a:"2B",      ko:ET(6,28,15) },
  { m:76, h:"1C", a:"2F",      ko:ET(6,29,13) },
  { m:74, h:"1E", a:"3-ABCDF", ko:ET(6,29,16,30) },
  { m:75, h:"1F", a:"2C",      ko:ET(6,29,21) },
  { m:78, h:"2E", a:"2I",      ko:ET(6,30,13) },
  { m:77, h:"1I", a:"3-CDFGH", ko:ET(6,30,17) },
  { m:79, h:"1A", a:"3-CEFHI", ko:ET(6,30,21) },
  { m:80, h:"1L", a:"3-EHIJK", ko:ET(7,1,12) },
  { m:82, h:"1G", a:"3-AEHIJ", ko:ET(7,1,16) },
  { m:81, h:"1D", a:"3-BEFIJ", ko:ET(7,1,20) },
  { m:84, h:"1H", a:"2J",      ko:ET(7,2,15) },
  { m:83, h:"2K", a:"2L",      ko:ET(7,2,19) },
  { m:85, h:"1B", a:"3-EFGIJ", ko:ET(7,2,23) },
  { m:88, h:"2D", a:"2G",      ko:ET(7,3,14) },
  { m:86, h:"1J", a:"2H",      ko:ET(7,3,18) },
  { m:87, h:"1K", a:"3-DEIJL", ko:ET(7,3,21,30) },
  { m:90, h:"W73", a:"W75",  ko:ET(7,4,13) },
  { m:89, h:"W74", a:"W77",  ko:ET(7,4,17) },
  { m:91, h:"W76", a:"W78",  ko:ET(7,5,16) },
  { m:92, h:"W79", a:"W80",  ko:ET(7,5,20) },
  { m:93, h:"W83", a:"W84",  ko:ET(7,6,15) },
  { m:94, h:"W81", a:"W82",  ko:ET(7,6,20) },
  { m:95, h:"W86", a:"W88",  ko:ET(7,7,12) },
  { m:96, h:"W85", a:"W87",  ko:ET(7,7,16) },
  { m:97,  h:"W89", a:"W90",  ko:ET(7,9,16) },
  { m:98,  h:"W93", a:"W94",  ko:ET(7,10,15) },
  { m:99,  h:"W91", a:"W92",  ko:ET(7,11,17) },
  { m:100, h:"W95", a:"W96",  ko:ET(7,11,21) },
  { m:101, h:"W97", a:"W98",  ko:ET(7,14,15) },
  { m:102, h:"W99", a:"W100", ko:ET(7,15,15) },
  { m:104, h:"W101", a:"W102", ko:ET(7,19,15) },
];
const koFix = (m) => {
  const f = KO.find((x) => x.m === m);
  return { match: f.m, homeSlot: f.h, awaySlot: f.a, ko: f.ko };
};

const KO_ROUNDS = [
  { id:"ko32-1", name:"Ro32 · 1", sub:"Round of 32 — pick one team from these 4 games", mode:"one", ms:[73,76,74,75] },
  { id:"ko32-2", name:"Ro32 · 2", sub:"Round of 32 — pick one team from these 4 games", mode:"one", ms:[78,77,79,80] },
  { id:"ko32-3", name:"Ro32 · 3", sub:"Round of 32 — pick one team from these 4 games", mode:"one", ms:[82,81,84,83] },
  { id:"ko32-4", name:"Ro32 · 4", sub:"Round of 32 — pick one team from these 4 games", mode:"one", ms:[85,88,86,87] },
  { id:"ko16-1", name:"Ro16 · 1", sub:"Round of 16 — pick one team from these 4 games", mode:"one", ms:[90,89,91,92] },
  { id:"ko16-2", name:"Ro16 · 2", sub:"Round of 16 — pick one team from these 4 games", mode:"one", ms:[93,94,95,96] },
  { id:"qf", name:"Quarters", sub:"Quarter-finals — pick a winner in EVERY game", mode:"all", ms:[97,98,99,100] },
  { id:"sf", name:"Semis", sub:"Semi-finals — pick a winner in EVERY game", mode:"all", ms:[101,102] },
  { id:"final", name:"Final", sub:"The big one — pick the World Cup winner", mode:"all", ms:[104] },
];

export function buildRounds() {
  const rounds = [];
  let n = 1;
  for (let md = 1; md <= 3; md++) {
    for (const [g1, g2] of PAIRS) {
      const games = [...G[g1][md], ...G[g2][md]];
      const fixtures = games.map(([home, away, ko]) => ({ home, away, ko }));
      const lockTime = fixtures.reduce((min, f) => (f.ko < min ? f.ko : min), fixtures[0].ko);
      rounds.push({ id:`r${n}`, name:`Round ${n}`, sub:`Groups ${g1} & ${g2} · Matchday ${md}`,
        type:"group", mode:"one", lockTime, fixtures });
      n++;
    }
  }
  for (const k of KO_ROUNDS) {
    const fixtures = k.ms.map(koFix);
    const lockTime = fixtures.reduce((min, f) => (f.ko < min ? f.ko : min), fixtures[0].ko);
    rounds.push({ id:k.id, name:k.name, sub:k.sub, type:"ko", mode:k.mode, lockTime, fixtures });
  }
  return rounds;
}

export const ALL_TEAMS = Array.from(
  new Set(Object.values(G).flatMap((md) => Object.values(md).flat().flatMap(([h, a]) => [h, a])))
).sort();

// All bracket slots the admin assigns after the group stage
export const ASSIGNABLE_SLOTS = (() => {
  const slots = [];
  for (const f of KO) {
    for (const s of [f.h, f.a]) if (s[0] !== "W" && !slots.includes(s)) slots.push(s);
  }
  return slots.sort();
})();

export function prettySlot(s) {
  if (!s) return "TBD";
  if (s[0] === "1") return `Winner Grp ${s[1]}`;
  if (s[0] === "2") return `Runner-up ${s[1]}`;
  if (s.startsWith("3-")) return `3rd of ${s.slice(2).split("").join("/")}`;
  if (s[0] === "W") return `Winner M${s.slice(1)}`;
  return s;
}
