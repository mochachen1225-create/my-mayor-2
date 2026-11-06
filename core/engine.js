// 「我推的XX」系列共用骨架：回合、數值、事件牌組、抽屜（前人留下的待辦）、結局
// 只有邏輯，不碰畫面；職業包（careers/*/data.js）提供數值定義、事件、抽屜公文、結局。
// 在 Node 可以直接 require，用來跑平衡模擬。

function makeRng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// 建立一局。career = 職業包，opts.seed 給固定種子
function newRun(career, opts = {}) {
  const g = {
    career: career.id, turn: 1, turns: career.turns, rng: makeRng(opts.seed || Date.now()),
    stats: {}, flags: {}, log: [], overflow: 0, blamed: 0,
    drawer: career.drawer.map(d => ({ id: d.id, size: d.look, real: d.real, open: !!d.start, known: false, done: false, shelved: 0, blocked: 0 })),
    deck: career.events.filter(e => !e.final).map(e => e.id), used: []
  };
  for (const s of career.stats) g.stats[s.id] = s.start;
  if (opts.carry) g.flags.carry = opts.carry; // 前作存檔帶過來的資料
  return g;
}

// 套用效果，順便檢查「太低、太高都會出事」
function applyFx(career, g, fx = {}) {
  const hits = [];
  for (const [k, v] of Object.entries(fx)) {
    if (!(k in g.stats)) continue;
    g.stats[k] = clamp(g.stats[k] + v, 0, 100);
  }
  for (const s of career.stats) {
    const v = g.stats[s.id];
    if (v <= s.low && !g.flags['low_' + s.id]) { g.flags['low_' + s.id] = 1; g.overflow++; hits.push({ stat: s.id, kind: 'low' }); }
    if (v >= s.high && !g.flags['high_' + s.id]) { g.flags['high_' + s.id] = 1; g.overflow++; hits.push({ stat: s.id, kind: 'high' }); }
    if (v > s.low && v < s.high) { delete g.flags['low_' + s.id]; delete g.flags['high_' + s.id]; }
  }
  return hits;
}

const ruleShift = (career, g) => g.turn >= career.shiftTurn;

// 抽出這回合的突發事件
function drawEvent(career, g) {
  if (g.turn >= g.turns) return career.events.find(e => e.final);
  // 先看有沒有爆開的公文
  const boom = g.drawer.find(d => d.open && !d.done && d.real >= 5 && d.shelved >= 2);
  if (boom) { boom.done = true; boom.exploded = true; return career.boom(boom, g); }
  let pool = g.deck.filter(id => !g.used.includes(id));
  if (!pool.length) { g.used = []; pool = g.deck.slice(); }
  const id = pool[Math.floor(g.rng() * pool.length)];
  g.used.push(id);
  return career.events.find(e => e.id === id);
}

// 選了事件的選項
function chooseEvent(career, g, ev, i) {
  const op = ev.opts[i];
  const fx = typeof op.fx === 'function' ? op.fx(g, ruleShift(career, g)) : op.fx;
  const hits = applyFx(career, g, fx);
  g.log.push({ turn: g.turn, kind: 'event', id: ev.id, opt: i, fx });
  return { fx, hits, text: op.r };
}

// 抽屜：處理 do／調查 look／擱置 shelve／甩鍋 blame
function drawerActions(career, g, d) {
  const def = career.drawer.find(x => x.id === d.id);
  const acts = ['look', 'shelve', 'blame'];
  if (!d.blocked) acts.unshift('do');
  return acts.map(a => ({ act: a, cost: a === 'do' ? Math.round(d.real * career.costPer * (d.costMul || 1)) : 0, def }));
}

function openChain(career, g, d) {
  const def = career.drawer.find(x => x.id === d.id);
  for (const nid of def.chain || []) { const n = g.drawer.find(x => x.id === nid); if (n && !n.open) { n.open = true; n.revealedAt = g.turn; } }
}

function useDrawer(career, g, id, act) {
  const d = g.drawer.find(x => x.id === id), def = career.drawer.find(x => x.id === id);
  let fx = {};
  if (act === 'do') {
    fx = Object.assign({ budget: -Math.round(d.real * career.costPer * (d.costMul || 1)), staff: -2 }, def.fx);
    d.done = true; d.known = true; openChain(career, g, d);
    for (const cid of def.conflict || []) { const c = g.drawer.find(x => x.id === cid); if (c && !c.done) { if (def.conflictKind === 'block') c.blocked = 2; else c.costMul = 1.5; } }
  } else if (act === 'look') {
    d.known = true; d.size = d.real; openChain(career, g, d);
  } else if (act === 'blame') {
    g.blamed++;
    fx = ruleShift(career, g) ? career.blameLate : career.blameEarly;
  }
  if (act !== 'do') d.shelvedThis = true;
  const hits = applyFx(career, g, fx);
  g.log.push({ turn: g.turn, kind: 'drawer', id, act, fx });
  return { fx, hits };
}

// 回合結束：擱置的公文長大、被擋住的倒數、職業包的每回合效果
function endTurn(career, g) {
  for (const d of g.drawer) {
    if (!d.open || d.done) continue;
    if (d.blocked) d.blocked--;
    d.shelved = (d.shelved || 0) + 1;
    if (d.shelved % 2 === 0) { d.real = Math.min(5, d.real + 1); if (d.known) d.size = d.real; }
    d.shelvedThis = false;
  }
  if (career.onTurnEnd) applyFx(career, g, career.onTurnEnd(g) || {});
  g.turn++;
  return g.turn > g.turns;
}

function ending(career, g) {
  return career.endings.find(e => e.when(g)) || career.endings[career.endings.length - 1];
}

// 系列存檔：給下一部讀
function seriesSave(career, g, end) {
  return { part: career.part, career: career.id, ending: end.id, done: g.drawer.filter(d => d.done && !d.exploded).map(d => d.id), blamed: g.blamed, stats: Object.assign({}, g.stats) };
}
const encodeSave = o => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const decodeSave = s => { try { return JSON.parse(decodeURIComponent(escape(atob(s.trim())))); } catch (e) { return null; } };

if (typeof module !== 'undefined') module.exports = { makeRng, newRun, applyFx, drawEvent, chooseEvent, drawerActions, useDrawer, endTurn, ending, ruleShift, seriesSave, encodeSave, decodeSave };
