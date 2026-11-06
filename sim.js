// 平衡模擬：node sim.js
const E = require('./core/engine.js'), C = require('./careers/mayor-office/data.js');
const TYPES = Object.keys(C.cabinetTypes);
function play(seed, strat) {
  const g = E.newRun(C, { seed }); const r = E.makeRng(seed * 7 + 1);
  for (const s of C.cabinet) E.appoint(C, g, s.id, strat === 'random' ? TYPES[Math.floor(r() * 4)] : (s.id === 'vice' ? 'holdover' : 'pro'));
  while (true) {
    const ev = E.drawEvent(C, g);
    E.chooseEvent(C, g, ev, Math.floor(r() * ev.opts.length));
    if (g.turn >= g.turns) break;
    for (let a = 0; a < C.actionsPerTurn; a++) {
      const open = g.drawer.filter(d => d.open && !d.done), pl = g.pledges.filter(p => !p.done);
      const doPledge = strat === 'random' ? r() < 0.5 : strat === 'pledger' ? pl.length > 0 : strat === 'drawer' ? !open.length : (open.length === 0 || (g.turn >= 4 && r() < 0.5));
      if (doPledge && pl.length) {
        const p = strat === 'random' ? pl[Math.floor(r() * pl.length)] : pl.slice().sort((x, y) => y.step - x.step).find(x => !E.pledgeCheck(C, g, x).block) || pl[0];
        E.pushPledge(C, g, p.id); continue;
      }
      if (!open.length) continue;
      let d = open[Math.floor(r() * open.length)], act;
      if (strat === 'random') act = ['do', 'look', 'shelve', 'blame'][Math.floor(r() * 4)];
      else { d = open.slice().sort((x, y) => (x.known - y.known) || (y.real - x.real))[0]; act = !d.known && r() < 0.5 ? 'look' : (g.stats.budget > E.drawerCost(C, g, d) + 8 ? 'do' : (E.ruleShift(C, g) ? 'shelve' : 'blame')); }
      if (act === 'do' && d.blocked) act = 'look';
      E.useDrawer(C, g, d.id, act);
    }
    if (E.endTurn(C, g)) break;
  }
  return g;
}
const N = 2000;
for (const s of ['random', 'pledger', 'drawer', 'balanced']) {
  const c = {}, avg = { drawer: 0, pledges: 0, overflow: 0 }, st = {}, low = {}, high = {};
  for (let i = 1; i <= N; i++) {
    const g = play(i, s), e = E.ending(C, g).id, t = E.tally(g);
    c[e] = (c[e] || 0) + 1; avg.drawer += t.drawer / N; avg.pledges += t.pledges / N; avg.overflow += g.overflow / N;
    for (const x of C.stats) { st[x.id] = (st[x.id] || 0) + g.stats[x.id] / N; if (g.log.some(() => 0)) 0; }
    for (const k in g.flags) { const m = k.match(/^(low|high)_(.*)/); if (m) (m[1] === 'low' ? low : high)[m[2]] = ((m[1] === 'low' ? low : high)[m[2]] || 0) + 1; }
  }
  console.log(s.padEnd(9), Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(v / N * 100).toFixed(1)}%`).join('  '));
  if (process.argv[2] === '-v') console.log('   抽屜', avg.drawer.toFixed(1), '政見', avg.pledges.toFixed(1), '爆表', avg.overflow.toFixed(1), '｜', Object.entries(st).map(([k, v]) => `${k} ${v.toFixed(0)}`).join(' '), '｜低', JSON.stringify(low), '高', JSON.stringify(high));
}
