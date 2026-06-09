// World Cup 2026 group stage — full, corrected data (all 48 teams confirmed).
// Rounds = 4 games = two groups paired (A+B, C+D, ...), repeated each matchday.
// Kickoffs given in US Eastern; ET() converts to a real UTC ISO timestamp so the
// app displays each lock time in every user's own local timezone.

const ET = (m, d, h, min = 0) =>
  new Date(Date.UTC(2026, m - 1, d, h + 4, min)).toISOString(); // EDT = UTC-4 in June

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

// Each match: [home, away, kickoffISO]
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

export function buildRounds() {
  const rounds = [];
  let n = 1;
  for (let md = 1; md <= 3; md++) {
    for (const [g1, g2] of PAIRS) {
      const games = [...G[g1][md], ...G[g2][md]];
      const fixtures = games.map(([home, away, ko]) => ({ home, away, ko }));
      const lockTime = fixtures.reduce((min, f) => (f.ko < min ? f.ko : min), fixtures[0].ko);
      rounds.push({
        id: `r${n}`,
        name: `Round ${n}`,
        sub: `Groups ${g1} & ${g2} · Matchday ${md}`,
        lockTime,
        fixtures,
      });
      n++;
    }
  }
  return rounds;
}

export const ALL_TEAMS = Array.from(
  new Set(Object.values(G).flatMap((md) => Object.values(md).flat().flatMap(([h, a]) => [h, a])))
).sort();
