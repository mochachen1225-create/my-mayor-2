// 平衡模擬：node part2/sim.js
const E = require('./core/engine.js'), C = require('./careers/mayor-office/data.js');
function play(seed, strat) {
  const g = E.newRun(C, { seed }); const r = E.makeRng(seed * 7 + 1);
  while (true) {
    const ev = E.drawEvent(C, g);
    E.chooseEvent(C, g, ev, Math.floor(r() * ev.opts.length));
    if (g.turn >= g.turns) break;
    const open = g.drawer.filter(d => d.open && !d.done);
    if (open.length) {
      let d = open[Math.floor(r() * open.length)], act;
      if (strat === 'random') act = ['do', 'look', 'shelve', 'blame'][Math.floor(r() * 4)];
      else if (strat === 'blamer') act = E.ruleShift(C, g) ? 'do' : 'blame';
      else { // careful: 先調查看不清楚的，錢夠就處理，最大的先做
        d = open.slice().sort((a, b) => (a.known - b.known) || (b.real - a.real))[0];
        act = !d.known && r() < 0.6 ? 'look' : (g.stats.budget > d.real * C.costPer + 10 ? 'do' : 'shelve');
      }
      if (act === 'do' && d.blocked) act = 'shelve';
      E.useDrawer(C, g, d.id, act);
    }
    if (E.endTurn(C, g)) break;
  }
  return E.ending(C, g).id;
}
for (const s of ['random', 'blamer', 'careful']) {
  const c = {}; for (let i = 1; i <= 2000; i++) { const e = play(i, s); c[e] = (c[e] || 0) + 1; }
  console.log(s.padEnd(8), Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(v / 20).toFixed(1)}%`).join('  '));
}
