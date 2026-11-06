// 「我推的XX」系列共用骨架：回合、數值、事件牌組、組閣、抽屜（前人留下的爛攤子）、政見、結局、系列存檔
// 只有邏輯，不碰畫面；職業包（careers/*/data.js）提供數值、事件、組閣、抽屜、政見、結局。
// 在 Node 可以直接 require，用來跑平衡模擬。

function makeRng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ---------- 開局 ----------
// opts.seed：固定種子；opts.carry：前作存檔；opts.pledges：指定政見 id
function newRun(career, opts = {}) {
  const rng = makeRng(opts.seed || Date.now());
  const g = {
    career: career.id, turn: 1, turns: career.turns, rng,
    stats: {}, flags: {}, log: [], overflow: 0, blamed: 0, cabinet: {},
    drawer: [], staffers: {}, trait: null,
    deck: career.events.filter(e => !e.final && !e.special).map(e => e.id), used: [], pledges: []
  };
  for (const s of career.stats) g.stats[s.id] = s.start;
  if (opts.carry) g.flags.carry = opts.carry;
  g.bossType = opts.bossType || null;
  // 每局只出現部分抽屜公文（連鎖關係照舊）
  const ids = career.drawerSubset ? career.drawerSubset(rng) : career.drawer.map(d => d.id);
  g.drawer = career.drawer.filter(d => ids.includes(d.id)).map(d => ({ id: d.id, size: d.look, real: d.real, open: !!d.start, known: false, done: false, shelved: 0, blocked: 0 }));
  // 老闆的真面目：開局抽一張隱藏特質
  if (career.traits) g.trait = weighted(rng, Object.entries(career.traits).map(([k, t]) => [k, t.weight]));
  // 政見依老闆類型
  const pool = (career.pledgesFor ? career.pledgesFor(g.bossType) : career.pledges).slice();
  const pick = opts.pledges || [];
  while (pick.length < career.pledgeCount && pool.length) { const p = pool.splice(Math.floor(rng() * pool.length), 1)[0]; if (!pick.includes(p.id)) pick.push(p.id); }
  g.pledges = pick.map(id => ({ id, step: 0, fails: 0 }));
  return g;
}
function weighted(rng, list) { const tot = list.reduce((a, [, w]) => a + w, 0); let x = rng() * tot; for (const [k, w] of list) { x -= w; if (x < 0) return k; } return list[list.length - 1][0]; }

// ---------- 組閣 ----------
// 每個職位從候選類型挑一個（loyal 自己人／pro 專業／holdover 前朝留任／acting 先代理）
// 每個職位從人才池抽 3 位候選人（來源不重複）
function cabinetOffer(career, g, n = 3) {
  const offer = {}, used = new Set();
  for (const s of career.cabinet) {
    const pool = career.candidates.filter(c => (!c.slots || c.slots.includes(s.id)) && !used.has(c.id));
    const bySrc = {};
    for (const c of pool) (bySrc[c.src] = bySrc[c.src] || []).push(c);
    const srcs = Object.keys(bySrc).sort(() => g.rng() - 0.5).slice(0, n);
    offer[s.id] = srcs.map(k => bySrc[k][Math.floor(g.rng() * bySrc[k].length)]);
    offer[s.id].forEach(c => used.add(c.id)); // 同一個人不會同時出現在兩個職位
  }
  return offer;
}
// cand 可以是候選人物件，或直接給來源 id（模擬用）
function appoint(career, g, slot, cand) {
  if (typeof cand === 'string') cand = { id: cand, src: cand };
  g.cabinet[slot] = cand.src; g.staffers[slot] = cand.id;
  const t = career.cabinetTypes[cand.src];
  applyFx(career, g, Object.assign({}, t.fx || {}));
  if (cand.fx) applyFx(career, g, cand.fx);
  for (const ev of t.events || []) if (!g.deck.includes(ev)) g.deck.push(ev);
  g.log.push({ turn: 0, kind: 'cabinet', slot, src: cand.src, id: cand.id });
}
// 某份公文／某個政見步驟歸哪個職位管
const slotOf = (career, key) => (career.cabinet.find(s => s.domain.includes(key)) || {}).id;
function costMulFor(career, g, key) {
  const slot = slotOf(career, key); if (!slot) return 1;
  const t = career.cabinetTypes[g.cabinet[slot]] || {};
  return t.costMul || 1;
}

// ---------- 數值 ----------
function applyFx(career, g, fx = {}) {
  const hits = [];
  for (const [k, v] of Object.entries(fx)) if (k in g.stats) g.stats[k] = clamp(g.stats[k] + v, 0, 100);
  for (const s of career.stats) {
    const v = g.stats[s.id];
    if (v <= s.low && !g.flags['low_' + s.id]) { g.flags['low_' + s.id] = 1; g.overflow++; hits.push({ stat: s.id, kind: 'low' }); }
    if (v >= s.high && !g.flags['high_' + s.id]) { g.flags['high_' + s.id] = 1; g.overflow++; hits.push({ stat: s.id, kind: 'high' }); }
    if (v > s.low && v < s.high) { delete g.flags['low_' + s.id]; delete g.flags['high_' + s.id]; }
  }
  return hits;
}
const ruleShift = (career, g) => g.turn >= career.shiftTurn;

// ---------- 事件 ----------
function drawEvent(career, g) {
  if (g.turn >= g.turns) return career.events.find(e => e.final);
  // 固定回合的劇場／里程碑事件（例如百日記者會、颱風季）
  const round = career.rounds && career.rounds[g.turn - 1];
  if (round && round.event) { const ev = career.events.find(e => e.id === round.event); if (ev && !g.used.includes(ev.id)) { g.used.push(ev.id); return ev; } }
  // 觸發型事件（例如出包後的「找人揹鍋」）
  if (career.triggered) { const id = career.triggered(g); if (id) return career.events.find(e => e.id === id); }
  // 老闆的真面目：中段用事件慢慢露出來
  const tr = g.trait && career.traits[g.trait];
  if (tr && tr.events) { const due = tr.events.find(([t]) => t === g.turn); if (due) return career.events.find(e => e.id === due[1]); }
  const boom = g.drawer.find(d => d.open && !d.done && d.real >= 5 && d.shelved >= 3);
  if (boom) { boom.done = true; boom.exploded = true; g.flags.mess = (g.flags.mess || 0) + 1; return career.boom(boom, g); }
  let pool = g.deck.filter(id => !g.used.includes(id));
  if (!pool.length) { g.used = []; pool = g.deck.slice(); }
  const id = pool[Math.floor(g.rng() * pool.length)];
  g.used.push(id);
  return career.events.find(e => e.id === id);
}
function chooseEvent(career, g, ev, i) {
  const op = ev.opts[i];
  const fx = typeof op.fx === 'function' ? op.fx(g, ruleShift(career, g)) : op.fx;
  const hits = applyFx(career, g, fx);
  g.log.push({ turn: g.turn, kind: 'event', id: ev.id, opt: i, fx });
  return { fx, hits, text: typeof op.r === 'function' ? op.r(g) : op.r };
}

// ---------- 抽屜 ----------
function drawerCost(career, g, d) { return Math.round(d.real * career.costPer * (d.costMul || 1) * costMulFor(career, g, d.id)); }
function openChain(career, g, d) {
  const def = career.drawer.find(x => x.id === d.id), opened = [];
  for (const nid of def.chain || []) { const n = g.drawer.find(x => x.id === nid); if (n && !n.open) { n.open = true; opened.push(nid); } }
  return opened;
}
function useDrawer(career, g, id, act) {
  const d = g.drawer.find(x => x.id === id), def = career.drawer.find(x => x.id === id);
  let fx = {}, opened = [], note = '';
  if (act === 'do') {
    fx = Object.assign({ budget: -drawerCost(career, g, d), staff: -2 }, def.fx);
    // 自己人第一次處理自己領域的公文會出包
    const slot = slotOf(career, d.id);
    if (slot && g.cabinet[slot] === 'loyal' && !g.flags['oops_' + slot]) { g.flags['oops_' + slot] = 1; fx.pop = (fx.pop || 0) - 4; note = 'oops'; }
    d.done = true; d.known = true; opened = openChain(career, g, d);
    for (const cid of def.conflict || []) { const c = g.drawer.find(x => x.id === cid); if (c && !c.done) { if (def.conflictKind === 'block') c.blocked = 2; else c.costMul = 1.5; } }
  } else if (act === 'look') {
    d.known = true; d.size = d.real; opened = openChain(career, g, d);
  } else if (act === 'blame') {
    if (d.own) return { fx: {}, hits: [], opened: [], note: 'own' };
    g.blamed++;
    fx = ruleShift(career, g) ? career.blameLate : career.blameEarly;
  }
  const hits = applyFx(career, g, fx);
  g.log.push({ turn: g.turn, kind: 'drawer', id, act, fx });
  return { fx, hits, opened, note };
}

// ---------- 政見 ----------
// 每張政見依序走 career.pledgeSteps；每一步可能被抽屜卡住或失敗
function pledgeCheck(career, g, p) {
  const step = career.pledgeSteps[p.step];
  const block = (step.blockedBy || []).find(id => { const d = g.drawer.find(x => x.id === id); return d && d.open && !d.done; }); // 挖出來之後才會卡
  const slot = slotOf(career, step.id), src = slot && career.cabinetTypes[g.cabinet[slot]];
  let fail = step.failRate(g) + ((src && src.failAdj && src.failAdj[step.id]) || 0) + (career.failMod ? career.failMod(g, step) : 0);
  fail = Math.max(0.03, Math.min(0.9, fail));
  return { step, block, fail, cost: Math.round(step.cost * costMulFor(career, g, step.id) * (step.doubleIf && g.drawer.some(d => step.doubleIf.includes(d.id) && !d.done) ? 2 : 1)) };
}
function pushPledge(career, g, pid, forced) {
  const p = g.pledges.find(x => x.id === pid), def = career.pledges.find(x => x.id === pid);
  const { step, block, cost, fail } = pledgeCheck(career, g, p);
  let fx = { budget: -cost }, ok = true, why = '';
  if (block) { ok = false; why = 'blocked:' + block; fx = Object.assign({}, step.failFx); }
  else if (forced === false || (forced === undefined && g.rng() < fail)) { ok = false; why = 'fail'; fx = Object.assign({ budget: -Math.round(cost / 2) }, step.failFx); }
  if (ok) { p.step++; if (p.step >= career.pledgeSteps.length) { p.done = true; Object.assign(fx, def.fx); } }
  else { p.fails++; g.flags.mess = (g.flags.mess || 0) + 1; }
  const hits = applyFx(career, g, fx);
  g.log.push({ turn: g.turn, kind: 'pledge', id: pid, step: step.id, ok, why, fx });
  return { ok, why, step, fx, hits };
}

// ---------- 回合結束 ----------
function endTurn(career, g) {
  // 任期後段，你們自己長出來的爛攤子
  for (const d of career.drawer.filter(x => x.appearAt === g.turn + 1)) if (!g.drawer.some(x => x.id === d.id)) g.drawer.push({ id: d.id, size: d.look, real: d.real, open: true, known: false, done: false, shelved: 0, blocked: 0, own: true, fresh: true });
  for (const d of g.drawer) {
    if (!d.open || d.done) continue;
    if (d.blocked) d.blocked--;
    d.shelved++;
    if (d.shelved % 2 === 0) { d.real = Math.min(5, d.real + 1); if (d.known) d.size = d.real; }
  }
  if (career.onTurnEnd) applyFx(career, g, career.onTurnEnd(g) || {});
  g.turn++;
  return g.turn > g.turns || !!g.flags.quit;
}

// ---------- 結局與存檔 ----------
const tally = g => ({ drawer: g.drawer.filter(d => d.done && !d.exploded).length, total: g.drawer.length, open: g.drawer.filter(d => d.open && !d.done).length, pledges: g.pledges.filter(p => p.done).length });
function ending(career, g) { return career.endings.find(e => e.when(g, tally(g))) || career.endings[career.endings.length - 1]; }
function runTitle(career, g) { const t = tally(g); return (career.titles || []).find(x => x.when(g, t)) || null; }
function seriesSave(career, g, end) {
  return { part: career.part, career: career.id, ending: end.id, trait: g.trait, boss: g.flags.carry || null, cabinet: Object.assign({}, g.cabinet), staffers: Object.assign({}, g.staffers), drawer: g.drawer.filter(d => d.done && !d.exploded).map(d => d.id), pledges: g.pledges.filter(p => p.done).map(p => p.id), blamed: g.blamed, stats: Object.assign({}, g.stats) };
}
const encodeSave = o => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const decodeSave = s => { try { return JSON.parse(decodeURIComponent(escape(atob(s.trim())))); } catch (e) { return null; } };

if (typeof module !== 'undefined') module.exports = { makeRng, newRun, cabinetOffer, appoint, runTitle, applyFx, drawEvent, chooseEvent, drawerCost, useDrawer, pledgeCheck, pushPledge, endTurn, tally, ending, ruleShift, seriesSave, encodeSave, decodeSave };
