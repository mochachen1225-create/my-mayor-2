// 畫面：我推的市長：上任篇
const C = CAREER_MAYOR_OFFICE;
const $ = s => document.querySelector(s);
const app = $('#app');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SERIES_KEY = 'mymayor.series', GALLERY_KEY = 'mymayor2.gallery';
let G = null, BOSS = null, actionsLeft = 0;
const txt = (v, ...a) => typeof v === 'function' ? v(G, ...a) : v;

// ---------- 老闆：讀選戰篇的紀錄，沒有就隨機 ----------
const NAMES = { m: ['Ethan', 'Frank', 'Andrew', 'Ben', 'Dylan', 'Charles'], f: ['Diana', 'Grace', 'Bella', 'Fiona', 'Emma', 'Clara'] };
function lastWin() {
  try { const R = JSON.parse(localStorage.getItem('mymayor.records') || 'null'); return R && R.runs && R.runs.slice().reverse().find(r => r.win); } catch (e) { return null; }
}

// ---------- 圖鑑 ----------
function loadGallery() { try { return JSON.parse(localStorage.getItem(GALLERY_KEY) || '{}'); } catch (e) { return {}; } }
function saveGallery(kind, id) { const g = loadGallery(); g[kind] = g[kind] || {}; g[kind][id] = (g[kind][id] || 0) + 1; try { localStorage.setItem(GALLERY_KEY, JSON.stringify(g)); } catch (e) { /* 無痕模式就算了 */ } }

// ---------- 小工具 ----------
function show(html) { app.innerHTML = html; window.scrollTo(0, 0); }
const statOf = k => C.stats.find(s => s.id === k);
function fxHtml(fx) {
  const parts = Object.entries(fx || {}).filter(([k, v]) => v && statOf(k)).map(([k, v]) => `<span class="${v > 0 ? 'up' : 'down'}">${statOf(k).emoji}${statOf(k).name}${v > 0 ? '+' : ''}${v}</span>`);
  return parts.length ? `<div class="fx">${parts.join('')}</div>` : '';
}
// 頂部固定提示：現在在第幾回合、還能做幾件事、要按哪裡
function guide(step) {
  const r = C.rounds[G.turn - 1] || {};
  return `<div class="hud">
    <div class="guide"><b>${r.label || ''}</b>${r.note ? `<span class="tag">${r.note}</span>` : ''}<span class="right">${T('第 {0}／{1} 回合', G.turn, G.turns)}</span></div>
    <div class="step">👉 ${step}</div>
    <div class="stats">${C.stats.map(s => { const v = G.stats[s.id], warn = v <= s.low + 8 || v >= s.high - 8; return `<div class="stat ${warn ? 'warn' : ''}">${s.emoji} ${v}<div class="bar"><div style="width:${v}%"></div></div><div>${s.name}</div></div>`; }).join('')}</div>
    ${ruleShift(C, G) ? `<div class="shift">${T('📰 百日已過：再說「這是前任留下的」會被罵')}</div>` : ''}
  </div>`;
}

// ---------- 脆上的反應（只是氣氛）----------
const USERS = ['路過的市民', '每天塞車的上班族', '里長伯的孫子', '在地美食控', '退休公務員', '熬夜的大學生', '三寶媽', '公車通勤族'];
const CRISP = {
  up: [T('欸這次做得不錯欸'), T('第一次覺得市府有在做事'), T('先給個讚，看後續'), T('我阿嬤說這個市長不錯'), T('終於！')],
  down: [T('市府到底在幹嘛'), T('我就知道'), T('四年很快就過了喔'), T('笑死，又來'), T('稅金是這樣花的？')],
  blame: [T('又是前任'), T('前任：我人在家裡也中槍'), T('你們上任幾天了？')],
  reveal: [T('抽屜裡到底還有多少東西'), T('這個市府是俄羅斯娃娃嗎'), T('前任留下的不是抽屜，是寶箱')],
  pledge: [T('政見跳票倒數中'), T('真的做了？我去看看'), T('剪綵剪很快，蓋很慢')]
};
function crisp(kind, n = 2) {
  const pool = CRISP[kind] || CRISP.up, out = [];
  for (let i = 0; i < n; i++) out.push(`<div class="post"><b>${T(USERS[Math.floor(Math.random() * USERS.length)])}</b><span>${pool[Math.floor(Math.random() * pool.length)]}</span><small>♡ ${Math.floor(Math.random() * 3000) + 12}</small></div>`);
  return `<div class="crisp"><div class="crisp-h">🧵 ${T('脆上的反應')}</div>${out.join('')}</div>`;
}
const moodOf = fx => { const sum = Object.entries(fx || {}).filter(([k]) => k === 'pop' || k === 'council').reduce((a, [, v]) => a + v, 0); return sum >= 0 ? 'up' : 'down'; };

// ---------- 標題 ----------
function titleScreen() {
  show(`
    <div class="title-hero">
      <div class="drawer-art">🗄️</div>
      <h1>${T('我推的市長')}</h1>
      <div class="sub">${T('上任篇')}・${C.subtitle}</div>
      <p class="tagline">${C.tagline}</p>
    </div>
    <button class="btn" id="go">${T('開始 →')}</button>
    <button class="btn ghost" id="gal">${T('📚 圖鑑')}</button>
    <p class="muted center">${T('《我推的市長》系列 Part 2・一局約 8 分鐘<br>人物、政黨、城市全部虛構')}</p>
    <p class="muted center">${T('摩卡與貓貓小隊')}</p>`);
  $('#go').onclick = setupScreen;
  $('#gal').onclick = () => galleryScreen(titleScreen);
}

// ---------- 開場：自訂市長 ----------
function setupScreen() {
  const w = lastWin();
  let gender = w && w.gender ? w.gender : '';
  const render = () => {
    show(`
      <h2>${T('🎉 誰當選了？')}</h2>
      <p class="muted">${w ? T('讀到你在選戰篇打贏的紀錄，已經幫你填好。也可以改。') : T('不填就隨機。市長的個性，要上任之後才知道。')}</p>
      <div class="card">
        <label class="lab">${T('市長的名字')}</label>
        <input id="nm" class="inp" maxlength="12" placeholder="${T('不填就隨機')}" value="${w ? esc(w.boss) : ''}">
        <label class="lab">${T('性別')}</label>
        <div class="seg">${[['m', T('男')], ['f', T('女')], ['', T('隨機')]].map(([k, n]) => `<button class="${gender === k ? 'on' : ''}" data-g="${k}">${n}</button>`).join('')}</div>
      </div>
      <button class="btn" id="go">${T('下一步 →')}</button>`);
    app.querySelectorAll('[data-g]').forEach(b => b.onclick = () => { const v = $('#nm').value; gender = b.dataset.g; render(); $('#nm').value = v; });
    $('#go').onclick = () => {
      const g = gender || (Math.random() < 0.5 ? 'm' : 'f');
      const name = $('#nm').value.trim() || NAMES[g][Math.floor(Math.random() * 6)];
      const type = w && w.boss === name && w.type ? w.type : 'ABCDEF'[Math.floor(Math.random() * 6)];
      BOSS = { name, gender: g, type, fromP1: !!(w && w.boss === name) };
      G = newRun(C, { seed: Date.now() % 1e9, bossType: BOSS.type, carry: BOSS.fromP1 ? { boss: BOSS.name, type: BOSS.type } : null });
      const force = new URLSearchParams(location.search).get('trait'); // 測試用：?trait=corrupt
      if (force && C.traits[force]) G.trait = force;
      introScreen();
    };
  };
  render();
}

// ---------- 你是誰（可跳過）----------
function introScreen() {
  show(`
    <h2>${T('📋 你是誰')}</h2>
    <div class="card intro">
      <p>🧑‍💼 ${T('你是 {0} 的<b>市長室主任</b>：行程、會議、公文、局處、記者，最後都會落到你身上。', esc(BOSS.name))}</p>
      <p>🗄️ ${T('前任做了八年，留下一整個<b>抽屜的爛攤子</b>。有些看起來很小，打開才知道很大；有些會連鎖，修了這個才發現那個。')}</p>
      <p>📣 ${T('老闆選前開了很多<b>政見</b>，每一個都要過議會、要發包、要剪綵。爛攤子會卡住政見。')}</p>
      <p>⏳ ${T('任期四年，切成 12 回合。每回合先處理一件突發事件，再<b>做 2 件事</b>：收爛攤子，或推政見。')}</p>
      <p>🏆 ${T('<b>怎麼算贏</b>：連任前夕，爛攤子收得差不多、政見至少兌現 2 個、數值沒有爆掉。數值太低、太高都會出事。')}</p>
      <p>😳 ${T('還有一件事：老闆是什麼樣的人，你上任之後才會知道。')}</p>
    </div>
    <div class="card intro"><b>${T('🏛️ 這一屆的議會')}：${C.councils[G.council].emoji} ${C.councils[G.council].name}</b>
      <p>${C.councils[G.council].desc}</p><p class="muted">${C.speakers[G.speaker]}</p></div>
    <button class="btn" id="go">${T('懂了，去勝選晚會 →')}</button>`);
  $('#go').onclick = victoryNight;
}

// ---------- 勝選夜：只能高興一天 ----------
function victoryNight() {
  show(`
    <div class="night">
      <div class="muted" style="color:#aaa">${T('選舉當晚・10 點')}</div>
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
    const left = C.cabinet.length - Object.keys(picked).length;
    show(`
      <div class="hud"><div class="step">👉 ${left ? T('每個位子點一位人選（還有 {0} 個位子）', left) : T('都選好了，按最下面「就職」')}</div></div>
      <h2>${T('🗂️ 組閣：找人')}</h2>
      <p class="muted">${T('全市 30 多個局處，你沒時間一個一個挑。先補最急的四個；主計、人事、警察、政風四位，依法不是市長自己換的。')}</p>
      <details class="card legend"><summary>${T('📖 人選來源各有什麼取捨？')}</summary>${Object.values(C.cabinetTypes).map(t => `<p><b>${t.emoji} ${t.name}</b>：${t.desc}</p>`).join('')}</details>
      ${C.cabinet.map(s => `<div class="slot"><h3>${s.name}${picked[s.id] ? ' ✅' : ''}<small class="why">${s.why}</small></h3><p class="hits">${s.hits}<br>${T('人才庫裡願意接這個燙手山芋的：{0}各推了一位，或先找人代理。', offer[s.id].filter(c => c.src !== 'acting').map(c => C.cabinetTypes[c.src].name).join('、'))}</p><div class="picks">${offer[s.id].map(c => { const t = C.cabinetTypes[c.src]; return `<button class="pick ${picked[s.id] === c.id ? 'on' : ''}" data-s="${s.id}" data-c="${c.id}"><b>${t.emoji} ${c.name} <span class="tag">${t.name}</span></b><small>${c.line}</small></button>`; }).join('')}</div></div>`).join('')}
      <div class="card"><b>${T('🔒 這幾位你換不掉')}</b><div class="locked">${C.lockedSlots.map(n => `<div>🔒 ${n}</div>`).join('')}</div><p class="muted" style="margin:8px 0 0">${T('依法不由市長任免。資深公務員也一樣：他們不會跟著前任走，也不會跟著你走。')}</p></div>
      <button class="btn" id="go" ${left ? 'disabled' : ''}>${left ? T('還有 {0} 個位子沒人', left) : T('就職，上工 →')}</button>`);
    app.querySelectorAll('.pick').forEach(b => b.onclick = () => { picked[b.dataset.s] = b.dataset.c; const y = window.scrollY; render(); window.scrollTo(0, y); });
    $('#go').onclick = () => { for (const s of C.cabinet) appoint(C, G, s.id, offer[s.id].find(c => c.id === picked[s.id])); turnStart(); };
  };
  render();
}

// ---------- 回合開始：事件（第 3 回合是蓋章小遊戲）----------
function turnStart() {
  if (G.turn === 3 && !G.flags.stampDone) { G.flags.stampDone = 1; return stampGame(() => { actionsLeft = C.actionsPerTurn; workScreen(); }); }
  const ev = drawEvent(C, G);
  const tag = ev.boom ? `<span class="tag red">${T('💥 擱置太久')}</span>` : ev.final ? `<span class="tag blue">${T('🗳️ 終局')}</span>` : (ev.id.startsWith('tr_') && !ev.id.endsWith('_hint')) ? `<span class="tag red">${T('😳 老闆的真面目')}</span>` : ev.id.endsWith('_hint') ? `<span class="tag">${T('🤔 有點怪')}</span>` : '';
  show(`${guide(T('先處理這件事：點一個選項'))}
    <div class="card ev">${tag}<h2>${ev.title}</h2><p>${txt(ev.text)}</p>
      ${ev.opts.map((o, i) => `<button class="opt" data-i="${i}">${o.t}</button>`).join('')}
    </div>`);
  app.querySelectorAll('.opt').forEach(b => b.onclick = () => {
    const r = chooseEvent(C, G, ev, +b.dataset.i);
    const end = ev.final || G.flags.quit;
    show(`${guide(end ? T('按下面看結局') : T('看完按下面，開始做事'))}
      <div class="card ev"><h2>${ev.title}</h2><div class="res">${txt(r.text)}${fxHtml(r.fx)}</div></div>
      ${end ? '' : crisp(moodOf(r.fx))}
      <button class="btn" id="go">${end ? T('看結局 →') : T('開始做事（2 件）→')}</button>`);
    $('#go').onclick = end ? endingScreen : () => { actionsLeft = C.actionsPerTurn; workScreen(); };
  });
}

// ---------- 做事：第一層選主題卡片，第二層選怎麼做 ----------
const SIZE = n => '📄'.repeat(Math.max(1, Math.min(5, n)));
function workScreen() {
  const open = G.drawer.filter(d => d.open && !d.done);
  const pls = G.pledges.filter(p => !p.done);
  const nth = C.actionsPerTurn - actionsLeft + 1;
  show(`${guide(T('第 {0} 件事（還剩 {1} 件）：點一張卡片', nth, actionsLeft))}
    <div class="grid">
      ${open.map(d => { const def = C.drawer.find(x => x.id === d.id); return `<button class="topic ${d.fresh ? 'new' : ''} ${d.own ? 'own' : ''}" data-d="${d.id}"><span class="ic">${d.own ? '🧾' : '🗄️'}</span><b>${def.title}</b><small>${SIZE(d.size)}${d.known ? '' : '？'}${d.shelved >= 2 ? ' ⚠️' : ''}</small></button>`; }).join('')}
      ${pls.map(p => { const def = C.pledges.find(x => x.id === p.id); return `<button class="topic pl" data-p="${p.id}"><span class="ic">${def.emoji}</span><b>${def.name}</b><small>${T('政見 {0}／{1}', p.step, C.pledgeSteps.length)}</small></button>`; }).join('')}
    </div>
    <p class="muted center">${T('🗄️ 前任的爛攤子　🧾 你們自己的　📣 政見')}</p>
    <button class="btn ghost" id="skip">${T('這次先開會（跳過）')}</button>`);
  app.querySelectorAll('[data-d]').forEach(b => b.onclick = () => drawerSheet(b.dataset.d));
  app.querySelectorAll('[data-p]').forEach(b => b.onclick = () => pledgeSheet(b.dataset.p));
  $('#skip').onclick = () => afterAction(T('開了一整個上午的會，結論是「再開一次會」。'), {}, 'down');
}
function sheet(head, body, opts) {
  show(`${guide(T('選一個做法，或按「返回」換一張卡片'))}
    <div class="card ev">${head}<p>${body}</p>
      ${opts.map((o, i) => `<button class="opt" data-i="${i}" ${o.off ? 'disabled' : ''}>${o.t}<small>${o.d || ''}</small></button>`).join('')}
      <button class="btn ghost" id="back">${T('← 返回')}</button></div>`);
  app.querySelectorAll('.opt').forEach(b => b.onclick = () => opts[+b.dataset.i].go());
  $('#back').onclick = workScreen;
}
function drawerSheet(id) {
  const d = G.drawer.find(x => x.id === id), def = C.drawer.find(x => x.id === id);
  d.fresh = false;
  const late = ruleShift(C, G);
  const head = `${d.own ? `<span class="tag">${T('🧾 你們自己的')}</span>` : `<span class="tag">${T('🗄️ 前任留下的')}</span>`}${d.shelved >= 2 ? `<span class="tag red">${T('放了 {0} 回合，越來越大', d.shelved)}</span>` : ''}<h2>${def.title}</h2>`;
  const act = a => () => {
    if (id === 'A' && a !== 'blame' && !G.flags.attachDone) { G.flags.attachDone = 1; return attachGame(found => { const extra = found ? { staff: 3 } : { staff: -2 }; applyFx(C, G, extra); const r = useDrawer(C, G, id, a); const res = C.attachments[Math.floor(Math.random() * C.attachments.length)]; afterAction(`<b>${def.title}</b><br>${found ? T('找到附件了！') : T('時間到，最後是工讀生找到的。')}<br>📎 ${res}` + fxHtml(Object.assign({}, r.fx, extra)), r.fx, 'reveal', r.opened); }); }
    const r = useDrawer(C, G, id, a);
    let m = `<b>${def.title}</b><br>`;
    if (a === 'do') m += T('處理好了。') + (r.note === 'oops' ? T('（自己人第一次出手，流程走錯，被記者抓到。）') : '');
    if (a === 'look') m += T('調查完了，真正的大小是 {0}。', SIZE(d.real));
    if (a === 'blame') m += late ? T('「都上任多久了還怪前任？」') : T('「這是前任留下來的。」大家點頭。');
    afterAction(m + fxHtml(r.fx), r.fx, a === 'blame' ? 'blame' : moodOf(r.fx), r.opened);
  };
  sheet(head, def.text, [
    { t: T('🛠️ 處理掉'), d: d.blocked ? T('另一件事剛用掉這筆錢，下回合再說') : T('預算 −{0}{1}', drawerCost(C, G, d), d.costMul > 1 ? T('（預算被搶走一部分，變貴了）') : ''), off: !!d.blocked, go: act('do') },
    { t: T('🔍 先調查'), d: d.known ? T('已經知道真正多大了') : T('不花錢，看清楚真正有多大'), go: act('look') },
    { t: T('🫵 甩鍋給前任'), d: d.own ? T('這是你們自己的，沒辦法甩') : late ? T('百日過了，現在甩會被罵') : T('民意 +，但事情還在'), off: !!d.own, go: act('blame') }
  ]);
}
function pledgeSheet(pid) {
  const p = G.pledges.find(x => x.id === pid), def = C.pledges.find(x => x.id === pid);
  const chk = pledgeCheck(C, G, p);
  const steps = `<div class="steps">${C.pledgeSteps.map((s, i) => `<div class="${i < p.step ? 'ok' : i === p.step ? 'cur' : ''}">${s.name}</div>`).join('')}</div>`;
  const ribbon = chk.step.id === 'ribbon';
  sheet(`<span class="tag blue">${T('📣 政見')}</span><h2>${def.emoji} ${def.name}</h2>${steps}`,
    chk.block ? T('⛔ 主計處長：「{0}」沒處理之前，這筆預算依法不能編。', C.drawer.find(x => x.id === chk.block).title) : ribbon ? T('完工了！里長們都到了，就等剪綵。') : T('下一步：{0}。', chk.step.name),
    [{ t: ribbon ? T('✂️ 去剪綵（小遊戲）') : T('📣 推動「{0}」', chk.step.name), d: chk.block ? T('會被退回') : (chk.cost ? T('預算 −{0}・', chk.cost) : '') + T('可能失敗（約 {0}%）', Math.round(chk.fail * 100)), go: () => {
      if (ribbon) return ribbonGame(ok => { const r = pushPledge(C, G, pid, ok); afterAction(`<b>${def.emoji} ${def.name}</b><br>${ok ? T('✂️ 剪得漂亮！政見兌現。') : T('剪歪了，里長們笑成一團。下次再剪。')}` + fxHtml(r.fx), r.fx, ok ? 'pledge' : 'down'); });
      const r = pushPledge(C, G, pid);
      let m = `<b>${def.emoji} ${def.name}：${r.step.name}</b><br>`;
      if (r.ok) m += T('過關了！');
      else if (r.why === 'fail') m += r.step.id === 'tender' ? T('流標了，沒有廠商來投標。') : T('議會把預算刪了，要你「再研議」。');
      else m += T('被退回：要先處理「{0}」。', C.drawer.find(x => x.id === r.why.split(':')[1]).title);
      afterAction(m + fxHtml(r.fx), r.fx, r.ok ? 'pledge' : 'down');
    } }]);
}

// 做完一件事：顯示結果＋脆反應；挖出新東西時有抽屜演出
function afterAction(msg, fx, mood, opened = []) {
  actionsLeft--;
  const more = actionsLeft > 0;
  const reveal = opened.length ? `<div class="reveal">🗄️💥<b>${T('抽屜裡又掉出東西了！')}</b>${opened.map(x => `<div>「${C.drawer.find(d => d.id === x).title}」</div>`).join('')}</div>` : '';
  opened.forEach(x => { const d = G.drawer.find(y => y.id === x); if (d) d.fresh = true; });
  show(`${guide(more ? T('看完按下面，做第 {0} 件事', C.actionsPerTurn - actionsLeft + 1) : T('這回合的事做完了，按下面'))}
    <div class="res">${msg}</div>${reveal}
    ${crisp(opened.length ? 'reveal' : mood, opened.length ? 1 : 2)}
    <button class="btn" id="go">${more ? T('做下一件事 →') : T('結束這回合 →')}</button>`);
  $('#go').onclick = more ? workScreen : nightScreen;
}
function nightScreen() {
  const over = endTurn(C, G);
  const fresh = G.drawer.filter(d => d.fresh && d.own);
  show(`${guide(T('回合結束，按下面'))}
    <div class="card"><b>🌙 ${T('這段時間過去了')}</b>
      <p class="muted">${T('沒碰的公文又放厚了一點。稅收入帳：預算 +6。')}</p>
      ${fresh.length ? `<p>🧾 ${T('新的麻煩，這次是你們自己的：')}${fresh.map(d => `<b>「${C.drawer.find(x => x.id === d.id).title}」</b>`).join('')}</p>` : ''}
    </div>
    <button class="btn" id="go">${over ? T('看結局 →') : T('下一回合：{0} →', (C.rounds[G.turn - 1] || {}).label || '')}</button>`);
  $('#go').onclick = over ? endingScreen : turnStart;
}

// ---------- 小遊戲：蓋章（分層負責）----------
const LEVELS = [T('承辦'), T('科長'), T('局長'), T('市長')];
function stampGame(done) {
  show(`${guide(T('小遊戲：照順序往上蓋章'))}
    <div class="card ev"><h2>${T('🖋️ 蓋章大作戰')}</h2>
    <p>${T('一份公文要照<b>分層負責</b>由下往上蓋：承辦 → 科長 → 局長 → 市長。蓋到右上角寫的「決行層級」就改蓋<b>決行</b>章。標了「會辦政風」的，決行前要先蓋政風。蓋錯就退回重跑。10 秒，能蓋完幾份？')}</p>
    <button class="btn" id="go">${T('開始蓋章！')}</button></div>`);
  $('#go').onclick = () => {
    let doneN = 0, doc, pos;
    const t0 = Date.now();
    const newDoc = () => { const top = 1 + Math.floor(Math.random() * 3); doc = { top, ethics: Math.random() < 0.3, eDone: false }; pos = 0; };
    newDoc();
    const render = (flash = '') => {
      const left = Math.max(0, 10 - (Date.now() - t0) / 1000);
      show(`<div class="hud"><div class="step" id="clock">⏱ ${left.toFixed(1)}s　✅ ${T('已決行 {0} 份', doneN)}</div></div>
        <div class="doc ${flash}"><div class="lvl">${T('決行層級：{0}', LEVELS[doc.top])}${doc.ethics ? `<span class="tag red">${T('會辦政風')}</span>` : ''}</div>
          <div class="trail">${LEVELS.slice(0, doc.top + 1).map((l, i) => `<span class="${i < pos ? 'ok' : ''}">${l}</span>`).join(' → ')} → <span class="${doc.eDone ? 'ok' : ''}">${doc.ethics ? T('政風') + ' → ' : ''}</span><span>${T('決行')}</span></div></div>
        <div class="stamps">${[...LEVELS.map((l, i) => [i, l]), ['e', T('政風')], ['x', T('決行')]].map(([k, l]) => `<button data-k="${k}">${l}</button>`).join('')}</div>`);
      app.querySelectorAll('.stamps button').forEach(b => b.onclick = () => tap(b.dataset.k));
    };
    const tap = k => {
      let ok = false;
      if (k === 'e') { ok = doc.ethics && !doc.eDone && pos === doc.top + 1; if (ok) doc.eDone = true; }
      else if (k === 'x') { ok = pos === doc.top + 1 && (!doc.ethics || doc.eDone); if (ok) { doneN++; newDoc(); return render('good'); } }
      else { ok = +k === pos && pos <= doc.top; if (ok) pos++; }
      if (!ok) { pos = 0; doc.eDone = false; return render('bad'); }
      render();
    };
    render();
    const timer = setInterval(() => {
      if (Date.now() - t0 >= 10000) {
        clearInterval(timer);
        const fx = doneN >= 4 ? { staff: 6, pop: 2 } : doneN >= 2 ? { staff: 2 } : { staff: -4, pop: -2 };
        applyFx(C, G, fx);
        show(`${guide(T('看完按下面，開始做事'))}<div class="card ev"><h2>${T('🖋️ 蓋章結果：決行 {0} 份', doneN)}</h2>
          <div class="res">${doneN >= 4 ? T('公文不旅行了！局處都說新市府效率很好。') : doneN >= 2 ? T('還可以，至少公文有在動。') : T('公文繼續旅行，下一站：不知道。')}${fxHtml(fx)}</div></div>
          ${crisp(doneN >= 2 ? 'up' : 'down')}
          <button class="btn" id="go">${T('開始做事（2 件）→')}</button>`);
        $('#go').onclick = done;
      } else { const c = $('#clock'); if (c) c.textContent = `⏱ ${(10 - (Date.now() - t0) / 1000).toFixed(1)}s　✅ ${T('已決行 {0} 份', doneN)}`; }
    }, 100);
  };
}

// ---------- 小遊戲：找附件（翻檔案夾）----------
function attachGame(done) {
  const N = 12, hit = Math.floor(Math.random() * N), t0 = Date.now();
  const labels = [T('第 12 頁'), T('第 45 頁'), T('第 99 頁'), T('第 150 頁'), T('第 201 頁'), T('第 233 頁'), T('第 256 頁'), T('第 270 頁'), T('第 281 頁'), T('第 293 頁'), T('第 298 頁'), T('第 300 頁')];
  show(`${guide(T('小遊戲：8 秒內翻到「附件」'))}
    <div class="card ev"><h2>${T('📂 找附件')}</h2><p>${T('交接清冊第 287 頁寫著「詳見附件」。附件夾在某一頁裡，翻翻看！')}</p>
    <div class="files">${labels.map((l, i) => `<button data-i="${i}">📁<small>${l}</small></button>`).join('')}</div>
    <p class="muted center" id="clock">⏱ 8.0s</p></div>`);
  let over = false;
  const finish = ok => { if (over) return; over = true; clearInterval(tm); setTimeout(() => done(ok), ok ? 500 : 200); };
  app.querySelectorAll('.files button').forEach(b => b.onclick = () => { if (over) return; if (+b.dataset.i === hit) { b.innerHTML = '📎<small>' + T('附件！') + '</small>'; b.classList.add('ok'); finish(true); } else { b.innerHTML = '🗒️<small>' + T('不是') + '</small>'; b.disabled = true; } });
  const tm = setInterval(() => { const left = 8 - (Date.now() - t0) / 1000; const c = $('#clock'); if (c) c.textContent = `⏱ ${Math.max(0, left).toFixed(1)}s`; if (left <= 0) finish(false); }, 100);
}

// ---------- 小遊戲：剪綵（抓時機）----------
function ribbonGame(done) {
  show(`${guide(T('小遊戲：指針到綠色區域時按「剪！」'))}
    <div class="card ev"><h2>${T('✂️ 剪綵')}</h2><p>${T('十幾位里長拿著剪刀排成一排，要一起剪下去。指針在綠色區域時按「剪！」')}</p>
    <div class="meter"><div class="zone"></div><div class="needle" id="nd"></div></div>
    <button class="btn" id="cut">${T('✂️ 剪！')}</button></div>`);
  let x = 0, dir = 1, raf;
  const zoneL = 38, zoneR = 62;
  const step = () => { x += dir * 1.6; if (x >= 100 || x <= 0) dir *= -1; const n = $('#nd'); if (n) n.style.left = x + '%'; raf = requestAnimationFrame(step); };
  raf = requestAnimationFrame(step);
  $('#cut').onclick = () => { cancelAnimationFrame(raf); done(x >= zoneL && x <= zoneR); };
}

// ---------- 結局 ----------
let LAST_END = null;
function endingScreen() {
  if (!LAST_END || LAST_END.g !== G) {
    const e = ending(C, G), ti = runTitle(C, G);
    LAST_END = { g: G, e, ti, save: seriesSave(C, G, e) };
    try { const S = JSON.parse(localStorage.getItem(SERIES_KEY) || '{}'); S.p2 = LAST_END.save; localStorage.setItem(SERIES_KEY, JSON.stringify(S)); } catch (err) { /* 無痕模式就算了 */ }
    saveGallery('endings', e.id); saveGallery('titles', ti.id); saveGallery('traits', G.trait);
  }
  const { e, ti, save } = LAST_END, t = tally(G), tr = C.traits[G.trait];
  show(`<div class="ending">
      <div class="emoji">${e.emoji}</div>
      <h2>${e.title}</h2>
      <p>${e.text}</p>
      <div class="card" style="text-align:left">
        <div>🏅 ${T('本局稱號：{0} {1}', ti.emoji, ti.name)}</div>
        <div>${tr.emoji} ${T('老闆的真面目：{0}', tr.name)}</div>
        <div>🗄️ ${T('爛攤子收掉：{0}／{1} 份', t.drawer, t.total)}</div>
        <div>📣 ${T('政見兌現：{0}／{1} 張', t.pledges, G.pledges.length)}</div>
        <div>🫵 ${T('甩鍋給前任：{0} 次', G.blamed)}</div>
      </div>
      <button class="btn ghost" id="code">${T('🔗 複製系列存檔碼（之後的篇章可以接續）')}</button>
      <button class="btn" id="again">${T('🔁 再當一次市長室主任')}</button>
      <button class="btn ghost" id="gal">${T('📚 圖鑑')}</button>
    </div>`);
  $('#code').onclick = () => { const c = encodeSave(save); (navigator.clipboard ? navigator.clipboard.writeText(c) : Promise.reject()).then(() => { $('#code').textContent = T('✅ 已複製'); }).catch(() => prompt(T('複製這串存檔碼：'), c)); };
  $('#again').onclick = setupScreen;
  $('#gal').onclick = () => galleryScreen(endingScreen);
}

// ---------- 圖鑑 ----------
function galleryScreen(back) {
  const g = loadGallery();
  const sec = (title, list, kind, key = 'title') => `<h3>${title}（${list.filter(x => (g[kind] || {})[x.id]).length}／${list.length}）</h3><div class="gal">${list.map(x => (g[kind] || {})[x.id] ? `<div class="gc">${x.emoji}<b>${x[key]}</b><small>×${g[kind][x.id]}</small></div>` : `<div class="gc lock">🔒<b>？？？</b></div>`).join('')}</div>`;
  show(`<h2>${T('📚 圖鑑')}</h2>
    ${sec(T('結局'), C.endings, 'endings')}
    ${sec(T('老闆的真面目'), Object.entries(C.traits).map(([id, t]) => ({ id, emoji: t.emoji, name: t.name })), 'traits', 'name')}
    ${sec(T('本局稱號'), C.titles, 'titles', 'name')}
    <button class="btn" id="back">${T('返回')}</button>`);
  $('#back').onclick = back;
}

titleScreen();
