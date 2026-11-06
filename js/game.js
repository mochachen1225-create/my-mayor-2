// 畫面：我推的市長：上任篇
const C = CAREER_MAYOR_OFFICE;
const $ = s => document.querySelector(s);
const app = $('#app');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SERIES_KEY = 'mymayor.series';
let G = null, BOSS = null, tab = 'drawer', actionsLeft = 0, lastOpened = [];

// ---------- 老闆：讀 Part 1（選戰篇）的紀錄，沒有就隨機 ----------
const BOSS_NAMES = ['Ethan', 'Diana', 'Frank', 'Grace', 'Andrew', 'Bella'];
function pickBoss() {
  try {
    const R = JSON.parse(localStorage.getItem('mymayor.records') || 'null');
    const won = R && R.runs && R.runs.slice().reverse().find(r => r.win);
    if (won) return { name: won.boss, label: won.label, type: won.type, fromP1: true };
  } catch (e) { /* 讀不到就隨機 */ }
  return { name: BOSS_NAMES[Math.floor(Math.random() * BOSS_NAMES.length)], type: 'ABCDEF'[Math.floor(Math.random() * 6)], fromP1: false };
}

// ---------- 小工具 ----------
function show(html) { app.innerHTML = html; window.scrollTo(0, 0); }
function fxHtml(fx) {
  const parts = Object.entries(fx || {}).filter(([k, v]) => v && C.stats.find(s => s.id === k)).map(([k, v]) => {
    const s = C.stats.find(x => x.id === k);
    return `<span class="${v > 0 ? 'up' : 'down'}">${s.emoji}${v > 0 ? '+' : ''}${v}</span>`;
  });
  return parts.length ? `<div class="fx">${parts.join('')}</div>` : '';
}
function hud() {
  const late = ruleShift(C, G);
  return `<div class="hud">
    <div class="row"><span>${T('上任第 {0} 天', G.turn * 10)}</span><span>${T('第 {0}／{1} 回合', G.turn, G.turns)}</span></div>
    <div class="stats">${C.stats.map(s => { const v = G.stats[s.id], warn = v <= s.low + 8 || v >= s.high - 8; return `<div class="stat ${warn ? 'warn' : ''}">${s.emoji} ${v}<div class="bar"><div style="width:${v}%"></div></div><div>${s.name}</div></div>`; }).join('')}</div>
    ${late ? `<div class="shift">${T('📰 百日倒數：媒體開始算帳，現在甩鍋給前任會被罵')}</div>` : ''}
  </div>`;
}

// ---------- 標題 ----------
function titleScreen() {
  show(`
    <div class="title-hero">
      <div class="drawer-art">🗄️</div>
      <h1>${T('我推的市長')}</h1>
      <div class="sub">${T('上任篇')}・${C.subtitle}</div>
      <p class="tagline">${C.tagline}</p>
      <p class="muted">${T('《我推的市長》系列 Part 2。你是新市長的市長室主任，上任一百天，收拾前任留下的爛攤子，同時把政見做出來。')}</p>
    </div>
    <button class="btn" id="go">${T('上任去 →')}</button>
    <p class="muted center">${T('一局約 7 分鐘・人物、政黨、城市全部虛構')}</p>
    <p class="muted center">${T('摩卡與貓貓小隊')}</p>`);
  $('#go').onclick = victoryNight;
}

// ---------- 勝選夜：只能高興一天 ----------
function victoryNight() {
  BOSS = pickBoss();
  G = newRun(C, { seed: Date.now() % 1e9, bossType: BOSS.type, carry: BOSS.fromP1 ? { boss: BOSS.name, type: BOSS.type } : null });
  const force = new URLSearchParams(location.search).get('trait'); // 測試用：?trait=corrupt
  if (force && C.traits[force]) G.trait = force;
  show(`
    <div class="night">
      <div class="muted" style="color:#aaa">${T('11 月 28 日・晚上 10 點')}</div>
      <div class="big">🎉 ${T('{0} 凍蒜！', esc(BOSS.name))}</div>
      <p>${BOSS.fromP1 ? T('你在選戰篇幫 {0} 打贏的那場選戰，結果出來了。', esc(BOSS.name)) : T('{0} 當選 N City 新市長。', esc(BOSS.name))}</p>
      <p>${T('彩帶、香檳、競選總部裡大家抱在一起哭。')}</p>
      <p>${T('{0} 握著你的手：「從明天開始，你就是我的市長室主任。」', esc(BOSS.name))}</p>
      <p style="color:#ffd166">${T('……明天早上 8 點，市長室開會。')}</p>
    </div>
    <button class="btn" id="go">${T('隔天早上 8 點 →')}</button>`);
  $('#go').onclick = cabinetScreen;
}

// ---------- 組閣 ----------
function cabinetScreen() {
  const offer = cabinetOffer(C, G), picked = {};
  const render = () => {
    show(`
      <h2>${T('🗂️ 組閣：找人')}</h2>
      <p class="muted">${T('就職前要湊齊團隊。前任的人走了一半，剩下的不一定站你這邊。每個位子挑一位：')}</p>
      <details class="card legend"><summary>${T('📖 人選來源各有什麼取捨？')}</summary>${Object.values(C.cabinetTypes).map(t => `<p><b>${t.emoji} ${t.name}</b>：${t.desc}</p>`).join('')}</details>
      ${C.cabinet.map(s => `<div class="slot"><h3>${s.name}</h3><div class="picks">${offer[s.id].map(c => { const t = C.cabinetTypes[c.src]; return `<button class="pick ${picked[s.id] === c.id ? 'on' : ''}" data-s="${s.id}" data-c="${c.id}"><b>${t.emoji} ${c.name} <span class="tag">${t.name}</span></b><small>${c.line}</small></button>`; }).join('')}</div></div>`).join('')}
      <div class="card"><b>${T('🔒 這幾位你換不掉')}</b><div class="locked">${C.lockedSlots.map(n => `<div>🔒 ${n}</div>`).join('')}</div><p class="muted" style="margin:8px 0 0">${T('依法不由市長任免。資深公務員也一樣：他們不會跟著前任走，也不會跟著你走。')}</p></div>
      <button class="btn" id="go" ${Object.keys(picked).length < C.cabinet.length ? 'disabled' : ''}>${Object.keys(picked).length < C.cabinet.length ? T('還有 {0} 個位子沒人', C.cabinet.length - Object.keys(picked).length) : T('就職，上工 →')}</button>`);
    app.querySelectorAll('.pick').forEach(b => b.onclick = () => { picked[b.dataset.s] = b.dataset.c; const y = window.scrollY; render(); window.scrollTo(0, y); });
    $('#go').onclick = () => { for (const s of C.cabinet) appoint(C, G, s.id, offer[s.id].find(c => c.id === picked[s.id])); turnStart(); };
  };
  render();
}

// ---------- 回合：事件 ----------
function turnStart() {
  const ev = drawEvent(C, G);
  show(`${hud()}
    <div class="card ev">
      ${ev.boom ? `<span class="tag red">${T('💥 擱置太久')}</span>` : ''}${ev.id.startsWith('tr_') && !ev.id.endsWith('_hint') ? `<span class="tag red">${T('😳 你開始懷疑老闆')}</span>` : ''}${ev.final ? `<span class="tag blue">${T('🎤 終局')}</span>` : ''}
      <h2>${ev.title}</h2><p>${ev.text}</p>
      ${ev.opts.map((o, i) => `<button class="opt" data-i="${i}">${o.t}</button>`).join('')}
    </div>`);
  app.querySelectorAll('.opt').forEach(b => b.onclick = () => {
    const r = chooseEvent(C, G, ev, +b.dataset.i);
    show(`${hud()}<div class="card ev"><h2>${ev.title}</h2><div class="res">${r.text}${fxHtml(r.fx)}</div>
      <button class="btn" id="go">${ev.final || G.flags.quit ? T('看結局 →') : T('開始今天的工作 →')}</button></div>`);
    $('#go').onclick = (ev.final || G.flags.quit) ? endingScreen : () => { actionsLeft = C.actionsPerTurn; workScreen(); };
  });
}

// ---------- 回合：做事（抽屜或政見） ----------
const SIZE = n => '📄'.repeat(Math.max(1, Math.min(5, n)));
const ACT = { do: T('🛠️ 處理'), look: T('🔍 調查'), shelve: T('📥 擱置'), blame: T('🫵 甩鍋給前任') };
function workScreen(msg = '') {
  const open = G.drawer.filter(d => d.open && !d.done);
  const done = G.drawer.filter(d => d.done);
  const half = actionsLeft === C.actionsPerTurn ? T('上午') : T('下午');
  const folders = open.map(d => {
    const def = C.drawer.find(x => x.id === d.id);
    const cost = drawerCost(C, G, d);
    return `<div class="folder ${lastOpened.includes(d.id) ? 'new' : ''}" data-id="${d.id}">
      <span class="size" title="${T('大小')}">${SIZE(d.size)}${d.known ? '' : '？'}</span>
      <div class="t">${def.title}</div>
      <div>${lastOpened.includes(d.id) ? `<span class="tag red">${T('新挖出來的')}</span>` : ''}${d.blocked ? `<span class="tag">${T('這回合不能處理')}</span>` : ''}${d.costMul > 1 ? `<span class="tag">${T('預算被搶走了')}</span>` : ''}${d.shelved >= 2 ? `<span class="tag red">${T('擱置 {0} 回合，越來越大', d.shelved)}</span>` : ''}</div>
      <p>${def.text}</p>
      <div class="acts" hidden>
        <button data-a="do" ${d.blocked ? 'disabled' : ''}>${ACT.do}<small>${T('預算 −{0}', cost)}</small></button>
        <button data-a="look">${ACT.look}<small>${d.known ? T('已經知道真實大小') : T('看清楚真正有多大')}</small></button>
        <button data-a="shelve">${ACT.shelve}<small>${T('先放著，會變大')}</small></button>
        <button data-a="blame">${ACT.blame}<small>${ruleShift(C, G) ? T('現在會被罵') : T('民意 +，事情還在')}</small></button>
      </div></div>`;
  }).join('') || `<p class="muted">${T('抽屜暫時清空了！')}</p>`;
  const pledges = G.pledges.map(p => {
    const def = C.pledges.find(x => x.id === p.id);
    const chk = p.done ? null : pledgeCheck(C, G, p);
    return `<div class="pledge"><b>${def.emoji} ${def.name}</b>
      <div class="steps">${C.pledgeSteps.map((s, i) => `<div class="${i < p.step || p.done ? 'ok' : i === p.step ? 'cur' : ''}">${s.name}</div>`).join('')}</div>
      ${p.done ? `<span class="tag blue">${T('✂️ 已兌現')}</span>` : `${chk.block ? `<p class="muted" style="margin:4px 0">${T('⛔ 被「{0}」卡住了', C.drawer.find(x => x.id === chk.block).title)}</p>` : ''}
      <button class="btn ghost" data-p="${p.id}" style="margin:4px 0;padding:10px">${T('推動「{0}」', chk.step.name)}${chk.cost ? T('（預算 −{0}）', chk.cost) : ''}</button>`}</div>`;
  }).join('');
  show(`${hud()}
    ${msg ? `<div class="res">${msg}</div>` : ''}
    <h2>${T('🕗 {0}：做一件事', half)}</h2>
    <div class="tabs"><button class="tab ${tab === 'drawer' ? 'on' : ''}" data-t="drawer">${T('🗄️ 前任的抽屜（{0}）', open.length)}</button><button class="tab ${tab === 'pledge' ? 'on' : ''}" data-t="pledge">${T('📣 政見（{0}/{1}）', G.pledges.filter(p => p.done).length, G.pledges.length)}</button></div>
    ${tab === 'drawer' ? folders + (done.length ? `<p class="done-folders">${T('已處理：{0}', done.map(d => C.drawer.find(x => x.id === d.id).title).join('、'))}</p>` : '') : pledges}
    <button class="btn ghost" id="skip">${T('這段時間先開會（跳過）')}</button>`);
  app.querySelectorAll('.tab').forEach(b => b.onclick = () => { tab = b.dataset.t; workScreen(msg); });
  app.querySelectorAll('.folder').forEach(f => f.onclick = e => {
    if (e.target.closest('button')) return;
    app.querySelectorAll('.acts').forEach(a => a.hidden = true);
    f.querySelector('.acts').hidden = false;
  });
  app.querySelectorAll('.folder .acts button').forEach(b => b.onclick = () => {
    const id = b.closest('.folder').dataset.id, def = C.drawer.find(x => x.id === id);
    const r = useDrawer(C, G, id, b.dataset.a);
    lastOpened = r.opened;
    let m = `<b>${ACT[b.dataset.a]}：${def.title}</b>`;
    if (b.dataset.a === 'do') m += `<br>${T('處理好了。')}${r.note === 'oops' ? T('（自己人第一次出手，流程走錯，被記者抓到。）') : ''}`;
    if (b.dataset.a === 'look') m += `<br>${T('真實大小是 {0}。', SIZE(G.drawer.find(x => x.id === id).real))}`;
    if (b.dataset.a === 'shelve') m += `<br>${T('先放回抽屜。它好像又變厚了一點。')}`;
    if (b.dataset.a === 'blame') m += `<br>${ruleShift(C, G) ? T('「都上任三個月了還怪前任？」脆上一片罵聲。') : T('「這是前任留下來的。」大家點頭。')}`;
    if (r.opened.length) m += `<br>🗄️ ${T('抽屜裡又掉出來：{0}', r.opened.map(x => '「' + C.drawer.find(d => d.id === x).title + '」').join('、'))}`;
    afterAction(m + fxHtml(r.fx));
  });
  app.querySelectorAll('[data-p]').forEach(b => b.onclick = () => {
    const def = C.pledges.find(x => x.id === b.dataset.p);
    const r = pushPledge(C, G, b.dataset.p);
    let m = `<b>${def.emoji} ${def.name}：${r.step.name}</b><br>`;
    if (r.ok) m += G.pledges.find(p => p.id === def.id).done ? T('✂️ 完工剪綵！政見兌現。') : T('過關了，往下一步。');
    else if (r.why === 'fail') m += r.step.id === 'tender' ? T('流標了，沒有廠商來投標。') : r.step.id === 'budget' ? T('議會把預算刪了，要你「再研議」。') : T('剪綵當天下大雨，延期。');
    else m += T('主計處長：「「{0}」沒處理之前，這筆預算依法不能編。」', C.drawer.find(x => x.id === r.why.split(':')[1]).title);
    afterAction(m + fxHtml(r.fx));
  });
  $('#skip').onclick = () => afterAction(T('開了一整個上午的會，結論是「再開一次會」。'));
}
function afterAction(msg) {
  actionsLeft--;
  if (actionsLeft > 0) return workScreen(msg);
  const over = endTurn(C, G);
  lastOpened = [];
  show(`${hud()}<div class="res">${msg}</div>
    <div class="card"><b>${T('🌙 這回合結束')}</b><p class="muted">${T('擱置的公文又變厚了一點。每月稅收入帳：預算 +6。')}</p></div>
    <button class="btn" id="go">${T('下一回合 →')}</button>`);
  $('#go').onclick = over ? endingScreen : turnStart;
}

// ---------- 結局 ----------
function endingScreen() {
  const e = ending(C, G), t = tally(G), ti = runTitle(C, G), tr = C.traits[G.trait];
  const save = seriesSave(C, G, e);
  try { const S = JSON.parse(localStorage.getItem(SERIES_KEY) || '{}'); S.p2 = save; localStorage.setItem(SERIES_KEY, JSON.stringify(S)); } catch (err) { /* 無痕模式就算了 */ }
  show(`<div class="ending">
      <div class="emoji">${e.emoji}</div>
      <h2>${e.title}</h2>
      <p>${e.text}</p>
      <div class="card" style="text-align:left">
        <div>🏅 ${T('本局稱號：{0} {1}', ti.emoji, ti.name)}</div>
        <div>${tr.emoji} ${T('老闆的真面目：{0}', tr.name)}</div>
        <div>🗄️ ${T('抽屜清掉：{0}／{1} 份', t.drawer, t.total)}</div>
        <div>📣 ${T('政見兌現：{0}／{1} 張', t.pledges, G.pledges.length)}</div>
        <div>🫵 ${T('甩鍋給前任：{0} 次', G.blamed)}</div>
      </div>
      <div class="card" style="text-align:left"><b>${T('🔗 系列存檔碼')}</b><p class="muted">${T('之後的篇章可以貼上這串碼，接續你的老闆和你做過的事。')}</p><div class="code">${encodeSave(save)}</div></div>
      <button class="btn" id="again">${T('🔁 再當一次市長室主任')}</button>
    </div>`);
  $('#again').onclick = victoryNight;
}

titleScreen();
