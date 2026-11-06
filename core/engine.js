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
    stats: {}, flags: {}, log: [], overflow: 0, blamed: 0, cabinet: {}, later: [], news: [],
    drawer: [], staffers: {}, trait: null,
    deck: career.events.filter(e => !e.final && !e.special).map(e => e.id), used: [], pledges: []
  };
  for (const s of career.stats) g.stats[s.id] = s.start;
  if (opts.carry) g.flags.carry = opts.carry;
  g.bossType = opts.bossType || null;
  // 你的背景與分管領域（開場選）
  g.background = opts.background || null; g.portfolio = opts.portfolio || null;
  if (career.backgrounds && g.background) applyFx(career, g, career.backgrounds[g.background].fx || {});
  // 每局只出現部分抽屜公文（連鎖關係照舊）
  const ids = career.drawerSubset ? career.drawerSubset(rng, g) : career.drawer.map(d => d.id);
  g.drawer = career.drawer.filter(d => ids.includes(d.id)).map(d => ({ id: d.id, size: d.look, real: d.real, open: !!d.start, known: false, done: false, shelved: 0, blocked: 0 }));
  // 開局隨機的議會生態
  if (career.councils) { const ks = Object.keys(career.councils); g.council = ks[Math.floor(rng() * ks.length)]; applyFx(career, g, career.councils[g.council].fx || {}); }
  if (career.speakers) g.speaker = Math.floor(rng() * career.speakers.length);
  // 老闆的真面目：開局抽一張隱藏特質
  if (career.traits) g.trait = weighted(rng, Object.entries(career.traits).map(([k, t]) => [k, t.weight]));
  // 政見依老闆類型
  const pool = (career.pledgesFor ? career.pledgesFor(g.bossType) : career.pledges).slice();
  const pick = opts.pledges || [];
  while (pick.length < career.pledgeCount && pool.length) { const p = pool.splice(Math.floor(rng() * pool.length), 1)[0]; if (!pick.includes(p.id)) pick.push(p.id); }
  // 至少一張政見落在你分管的領域
  const mineP = g.portfolio && career.portfolios ? career.portfolios[g.portfolio].pledges : null;
  if (mineP && !pick.some(id => mineP.includes(id))) pick[pick.length - 1] = mineP[Math.floor(rng() * mineP.length)];
  g.pledges = pick.map(id => ({ id, step: 0, fails: 0, mine: !!(mineP && mineP.includes(id)) }));
  return g;
}
function weighted(rng, list) { const tot = list.reduce((a, [, w]) => a + w, 0); let x = rng() * tot; for (const [k, w] of list) { x -= w; if (x < 0) return k; } return list[list.length - 1][0]; }

// ---------- 組閣 ----------
// 每個職位從候選類型挑一個（loyal 自己人／pro 專業／holdover 前朝留任／acting 先代理）
// 每個職位從人才池抽 3 位候選人（來源不重複）
function cabinetOffer(career, g, n = 3) {
  const offer = {}, used = new Set(), srcCount = {};
  const slots = g.portfolio && career.portfolios ? career.cabinet.filter(s => career.portfolios[g.portfolio].slots.includes(s.id)) : career.cabinet;
  for (const s of slots) {
    const pool = career.candidates.filter(c => (!c.fit || c.fit.includes(s.id) || c.src === 'acting') && !used.has(c.id)); // 只出現在對得上的位子
    const bySrc = {};
    for (const c of pool) (bySrc[c.src] = bySrc[c.src] || []).push(c);
    // 三位來自不同來源，另外固定有「先找人代理」
    const srcs = Object.keys(bySrc).filter(k => k !== 'acting' && (!career.maxPerSrc || !career.maxPerSrc[k] || (srcCount[k] || 0) < career.maxPerSrc[k])).sort(() => g.rng() - 0.5).slice(0, n);
    srcs.forEach(k => { srcCount[k] = (srcCount[k] || 0) + 1; });
    offer[s.id] = srcs.map(k => bySrc[k][Math.floor(g.rng() * bySrc[k].length)]);
    const act = career.candidates.find(c => c.src === 'acting' && !c.dream);
    if (act) offer[s.id].push(Object.assign({}, act, { id: act.id + '_' + s.id }));
    offer[s.id].forEach(c => { if (c.src !== 'acting') used.add(c.id); }); // 同一個人不會同時出現在兩個職位
  }
  // 每局至少一位「夢幻人選但有條件」
  const dreams = career.candidates.filter(c => c.dream && c.fit.some(f => offer[f]));
  if (dreams.length && !Object.values(offer).flat().some(c => c.dream)) {
    const d = dreams[Math.floor(g.rng() * dreams.length)], slot = d.fit[0], list = offer[slot];
    const k = list.findIndex(c => c.src === d.src && c.src !== 'acting'); const at = k >= 0 ? k : 0;
    list[at] = d;
  }
  return offer;
}
// cand 可以是候選人物件，或直接給來源 id（模擬用）
function appoint(career, g, slot, cand) {
  if (typeof cand === 'string') cand = { id: cand, src: cand };
  g.cabinet[slot] = cand.src; g.staffers[slot] = cand.id;
  g.fit = g.fit || {}; g.fit[slot] = !!(cand.fit && cand.fit.includes(slot));
  g.recommended = g.recommended || {}; g.recommended[slot] = cand.byYou !== false;
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
  return (t.costMul || 1) * (g.fit && g.fit[slot] ? 0.9 : 1); // 放對位子的人更有效率
}
// 你推薦的人做得好壞，算在你頭上
function credit(career, g, key, good) {
  const slot = slotOf(career, key);
  if (slot && g.recommended && g.recommended[slot] && g.cabinet[slot] !== 'acting') applyFx(career, g, { trust: good ? 2 : -2 });
}

// ---------- 數值 ----------
function applyFx(career, g, fx = {}) {
  const hits = [];
  for (const [k, v] of Object.entries(fx)) if (k in g.stats) g.stats[k] = clamp(g.stats[k] + v, 0, 100);
  for (const s of career.stats) {
    const v = g.stats[s.id];
    if (v <= s.low && !g.flags['low_' + s.id]) { g.flags['low_' + s.id] = 1; if (s.group !== 'me') g.overflow++; hits.push({ stat: s.id, kind: 'low' }); }
    if (v >= s.high && !g.flags['high_' + s.id]) { g.flags['high_' + s.id] = 1; if (s.group !== 'me') g.overflow++; hits.push({ stat: s.id, kind: 'high' }); }
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
  const boom = g.drawer.find(d => d.open && !d.done && d.real >= 5 && d.shelved >= 3);
  if (boom) { boom.done = true; boom.exploded = true; g.flags.mess = (g.flags.mess || 0) + 1; return career.boom(boom, g); }
  let pool = g.deck.filter(id => !g.used.includes(id));
  if (!pool.length) { g.used = []; pool = g.deck.slice(); }
  const id = pool[Math.floor(g.rng() * pool.length)];
  g.used.push(id);
  return career.events.find(e => e.id === id);
}
// 延後出現的代價（灰色選項短期有用，代價晚一點才來）
function schedule(g, later) { if (later) g.later.push({ at: g.turn + (later.in || 2), fx: later.fx || {}, text: later.text || '' }); }
// 老闆的真面目：在該回合的事件之後，多一段小劇場
function traitEvent(career, g) {
  const tr = g.trait && career.traits[g.trait];
  if (!tr || !tr.events) return null;
  const due = tr.events.find(([t]) => t === g.turn);
  if (!due || g.used.includes(due[1])) return null;
  g.used.push(due[1]);
  return career.events.find(e => e.id === due[1]);
}
// 「建議市長」：市長看信任和真面目決定 yes（照做）／half（打折做）／no（照他自己的意思）
function advise(career, g) {
  const p = career.adviseChance ? career.adviseChance(g) : 0.7;
  const x = g.rng();
  return x < p ? 'yes' : x < p + 0.15 ? 'half' : 'no';
}
const runFx = (career, g, op) => (typeof op.fx === 'function' ? op.fx(g, ruleShift(career, g)) : op.fx) || {};
function chooseEvent(career, g, ev, i) {
  let op = ev.opts[i], verdict = null, alt = null;
  if (op.k === 'a') {
    verdict = advise(career, g);
    if (verdict === 'no') {
      // 市長沒聽你的，照他自己的意思做（換成另一個「建議市長」的選項）
      const others = ev.opts.filter((o, j) => j !== i && o.k === 'a');
      alt = others.length ? others[Math.floor(g.rng() * others.length)] : null;
    }
  }
  const use = alt || op;
  let fx = Object.assign({}, runFx(career, g, use));
  if (verdict === 'half') for (const k in fx) fx[k] = Math.round(fx[k] / 2);
  if (verdict === 'no') fx.trust = (fx.trust || 0) - 2;
  if (verdict === 'yes') fx.trust = (fx.trust || 0) + 1;
  schedule(g, typeof use.later === 'function' ? use.later(g) : use.later);
  const hits = applyFx(career, g, fx);
  g.log.push({ turn: g.turn, kind: 'event', id: ev.id, opt: i, fx, verdict });
  return { fx, hits, text: typeof use.r === 'function' ? use.r(g) : use.r, verdict, alt: alt && alt.t };
}

// ---------- 抽屜 ----------
function drawerCost(career, g, d) { return Math.round(d.real * career.costPer * (d.costMul || 1) * costMulFor(career, g, d.id)); }
function openChain(career, g, d) {
  const def = career.drawer.find(x => x.id === d.id), opened = [];
  for (const nid of def.chain || []) { const n = g.drawer.find(x => x.id === nid); if (n && !n.open) { n.open = true; opened.push(nid); } }
  return opened;
}
// 「處理掉」和「說是前任的」要市長拍板（建議市長）；調查、走後門是你自己做
const ADVISE_ACTS = ['do', 'blame'];
// 你分管的爛攤子：可以直接督導局處，不用建議市長
const isMine = (career, g, id) => !!(g.portfolio && career.portfolios && career.portfolios[g.portfolio].drawer.includes(id)) || !!((g.drawer.find(d => d.id === id) || {}).own && g.portfolio === 'works' && id === 'Y1');
function useDrawer(career, g, id, act) {
  const d = g.drawer.find(x => x.id === id), def = career.drawer.find(x => x.id === id);
  let fx = {}, opened = [], note = '';
  let verdict = null;
  if (act === 'coord') {
    // 不是你分管的：找負責的副市長協調；成了，功勞多半算他的
    const ok = g.rng() < 0.4 + (g.stats.network || 0) / 200;
    if (!ok) { const f = { stress: 3 }; applyFx(career, g, f); g.log.push({ turn: g.turn, kind: 'drawer', id, act, ok }); return { fx: f, hits: [], opened: [], note: 'coordfail' }; }
    act = 'do'; g.flags.coordDone = (g.flags.coordDone || 0) + 1; var coord = true;
  }
  if (ADVISE_ACTS.includes(act) && career.adviseChance && !(act === 'do' && (isMine(career, g, id) || coord))) {
    verdict = advise(career, g);
    if (verdict === 'no') { const f = { trust: -1, stress: 2 }; applyFx(career, g, f); g.log.push({ turn: g.turn, kind: 'drawer', id, act, verdict }); return { fx: f, hits: [], opened: [], note: 'no', verdict }; }
  }
  if (act === 'do') {
    fx = Object.assign({ budget: -Math.round(drawerCost(career, g, d) * (verdict === 'half' ? 1.3 : 1)), staff: -2 }, def.fx);
    // 自己人第一次處理自己領域的公文會出包
    const slot = slotOf(career, d.id);
    if (slot && g.cabinet[slot] === 'loyal' && !g.flags['oops_' + slot]) { g.flags['oops_' + slot] = 1; fx.pop = (fx.pop || 0) - 4; note = 'oops'; }
    d.done = true; d.known = true; opened = openChain(career, g, d); credit(career, g, d.id, true);
    if ('succession' in g.stats) fx.succession = (fx.succession || 0) + (coord ? -1 : isMine(career, g, d.id) ? 3 : 1);
    if (coord) note = 'coord';
    for (const cid of def.conflict || []) { const c = g.drawer.find(x => x.id === cid); if (c && !c.done) { if (def.conflictKind === 'block') c.blocked = 2; else c.costMul = 1.5; } }
  } else if (act === 'shortcut') {
    // 走後門：成本減半、立刻解決；代價晚一點才來
    fx = Object.assign({ budget: -Math.round(drawerCost(career, g, d) / 2) }, def.fx, career.shortcut.fx);
    schedule(g, career.shortcut.later);
    d.done = true; d.known = true; opened = openChain(career, g, d);
  } else if (act === 'look') {
    d.known = true; d.size = d.real; opened = openChain(career, g, d);
  } else if (act === 'blame') {
    if (d.own) return { fx: {}, hits: [], opened: [], note: 'own' };
    g.blamed++;
    fx = ruleShift(career, g) ? career.blameLate : career.blameEarly;
  }
  const hits = applyFx(career, g, fx);
  g.log.push({ turn: g.turn, kind: 'drawer', id, act, fx, verdict });
  return { fx, hits, opened, note, verdict };
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
function pushPledge(career, g, pid, forced, viaAdvice) {
  const pmine = (g.pledges.find(x => x.id === pid) || {}).mine;
  if (viaAdvice && !pmine && career.adviseChance && advise(career, g) === 'no') {
    const p0 = g.pledges.find(x => x.id === pid), st = career.pledgeSteps[p0.step], f = { trust: -1 };
    applyFx(career, g, f);
    return { ok: false, why: 'mayor', step: st, fx: f, hits: [] };
  }
  const p = g.pledges.find(x => x.id === pid), def = career.pledges.find(x => x.id === pid);
  const { step, block, cost, fail } = pledgeCheck(career, g, p);
  let fx = { budget: -cost }, ok = true, why = '';
  if (block) { ok = false; why = 'blocked:' + block; fx = Object.assign({}, step.failFx); }
  else if (forced === false || (forced === undefined && g.rng() < fail)) { ok = false; why = 'fail'; fx = Object.assign({ budget: -Math.round(cost / 2) }, step.failFx); }
  if (ok) { p.step++; if (p.step >= career.pledgeSteps.length) { p.done = true; Object.assign(fx, def.fx); if ('succession' in g.stats) fx.succession = (fx.succession || 0) + (p.mine ? 5 : 2); } }
  else { p.fails++; g.flags.mess = (g.flags.mess || 0) + 1; credit(career, g, step.id, false); }
  const hits = applyFx(career, g, fx);
  g.log.push({ turn: g.turn, kind: 'pledge', id: pid, step: step.id, ok, why, fx });
  return { ok, why, step, fx, hits };
}

// 政見走後門：這一步一定過，但清白掉、代價晚點來
function pushPledgeGray(career, g, pid) {
  const p = g.pledges.find(x => x.id === pid);
  const step = career.pledgeSteps[p.step], gray = career.pledgeGray[step.id];
  const r = pushPledge(career, g, pid, true);
  applyFx(career, g, gray.fx); schedule(g, gray.later);
  g.log.push({ turn: g.turn, kind: 'pledge', id: pid, step: step.id, gray: true });
  return Object.assign(r, { fx: Object.assign({}, r.fx, gray.fx) });
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
  // 到期的延後代價
  g.news = [];
  for (const l of g.later.filter(x => x.at === g.turn)) { applyFx(career, g, l.fx); g.news.push(l); }
  g.later = g.later.filter(x => x.at > g.turn);
  return g.turn > g.turns || !!g.flags.quit;
}

// ---------- 結局與存檔 ----------
const tally = g => ({ drawer: g.drawer.filter(d => d.done && !d.exploded).length, total: g.drawer.length, open: g.drawer.filter(d => d.open && !d.done).length, pledges: g.pledges.filter(p => p.done).length });
function ending(career, g) { return career.endings.find(e => e.when(g, tally(g))) || career.endings[career.endings.length - 1]; }
function runTitle(career, g) { const t = tally(g); return (career.titles || []).find(x => x.when(g, t)) || null; }
function seriesSave(career, g, end) {
  return { part: career.part, career: career.id, ending: end.id, trait: g.trait, council: g.council, title: (runTitle(career, g) || {}).id, boss: g.flags.carry || null, cabinet: Object.assign({}, g.cabinet), staffers: Object.assign({}, g.staffers), drawer: g.drawer.filter(d => d.done && !d.exploded).map(d => d.id), pledges: g.pledges.filter(p => p.done).map(p => p.id), blamed: g.blamed, stats: Object.assign({}, g.stats) };
}
const encodeSave = o => btoa(unescape(encodeURIComponent(JSON.stringify(o))));
const decodeSave = s => { try { return JSON.parse(decodeURIComponent(escape(atob(s.trim())))); } catch (e) { return null; } };

if (typeof module !== 'undefined') module.exports = { isMine, traitEvent, advise, pushPledgeGray, schedule, makeRng, newRun, cabinetOffer, appoint, runTitle, applyFx, drawEvent, chooseEvent, drawerCost, useDrawer, pledgeCheck, pushPledge, endTurn, tally, ending, ruleShift, seriesSave, encodeSave, decodeSave };
