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

// ---------- GoatCounter 匿名計數（只記次數，不記個人資料）----------
function track(path) { try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path, title: path, event: true }); } catch (e) { /* 沒差 */ } }

// ---------- 分享截圖 ----------
function shareImage(e, ti, tr, t) {
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), font = n => `700 ${n}px -apple-system, "PingFang TC", "Noto Sans TC", sans-serif`;
  x.fillStyle = '#2b2f36'; x.fillRect(0, 0, W, H);
  x.fillStyle = '#f6efe0'; x.fillRect(40, 40, W - 80, H - 80);
  x.textAlign = 'center'; x.fillStyle = '#c0392b'; x.font = font(40); x.fillText(T('我推的市長：上任篇'), W / 2, 130);
  x.font = font(150); x.fillText(e.emoji, W / 2, 330);
  x.fillStyle = '#2b2f36'; x.font = font(72); x.fillText(e.title, W / 2, 450);
  const wrap = (s, y, size, maxW) => { x.font = font(size); let line = '', yy = y; for (const ch of s) { if (x.measureText(line + ch).width > maxW) { x.fillText(line, W / 2, yy); line = ''; yy += size * 1.5; } line += ch; } x.fillText(line, W / 2, yy); return yy; };
  x.fillStyle = '#4b4740'; let y = wrap(txt(e.text).replace(/\n/g, ''), 540, 36, W - 220);
  y += 90; x.fillStyle = '#2b2f36'; x.font = font(42);
  [`🏅 ${ti.name}`, `${tr.emoji} ${T('老闆的真面目：{0}', tr.name)}`, `🗄️ ${T('爛攤子 {0}／{1}', t.drawer, t.total)}　📣 ${T('政見 {0}／{1}', t.pledges, G.pledges.length)}`].forEach((l, i) => x.fillText(l, W / 2, y + i * 70));
  x.fillStyle = '#e0a526'; x.font = font(34); x.fillText(T('你以為選上就萬歲了？不，是大坑的開始。'), W / 2, H - 110);
  c.toBlob(async blob => {
    const file = new File([blob], 'my-mayor-2.png', { type: 'image/png' });
    const text = T('我在《我推的市長：上任篇》當副市長，結局是「{0}」，稱號「{1}」。老闆的真面目是……「{2}」！👉 https://mochachen1225-create.github.io/my-mayor-2/', e.title, ti.name, tr.name);
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text }); return; } } catch (err) { /* 取消分享就算了 */ }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'my-mayor-2.png'; a.click();
  }, 'image/png');
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
// 指標顏色代表狀態：綠＝安全、黃＝注意、紅＝危險
// 一般指標：低紅高綠；壓力反過來；「太高也會出事」的指標：中間安全區綠、兩端轉黃再轉紅（條上畫出安全區）
const kindOf = s => s.id === 'stress' ? 'inv' : (s.high <= 100 ? 'band' : 'up');
function stateOf(s, v) {
  const k = kindOf(s);
  if (k === 'inv') return v >= 75 ? 'red' : v >= 50 ? 'yel' : 'grn';
  if (k === 'band') return (v <= s.low + 5 || v >= s.high - 5) ? 'red' : (v < 25 || v > 75) ? 'yel' : 'grn';
  return v < 30 ? 'red' : v < 55 ? 'yel' : 'grn';
}
let LASTSTATS = null;
function statCell(s) {
  const v = G.stats[s.id], prev = LASTSTATS && LASTSTATS[s.id], d = prev == null ? 0 : v - prev;
  const band = kindOf(s) === 'band' ? '<i class="safe"></i>' : '';
  return `<div class="stat ${stateOf(s, v)} ${s.id === 'trust' ? 'key' : ''}">${s.emoji} ${v}${d ? `<span class="dl ${d > 0 ? 'up' : 'down'}">${d > 0 ? '+' : ''}${d}</span>` : ''}<div class="bar">${band}<div style="width:${v}%"></div></div><div>${s.name}</div></div>`;
}
// 頂部固定提示：現在在第幾回合、還能做幾件事、要按哪裡
function guide(step) {
  const r = C.rounds[G.turn - 1] || {};
  setTimeout(() => { LASTSTATS = Object.assign({}, G.stats); }, 0);
  return `<div class="hud">
    <div class="guide"><b>${r.label || ''}</b>${r.note ? `<span class="tag">${r.note}</span>` : ''}<span class="right">${T('第 {0}／{1} 回合', G.turn, G.turns)}</span></div>
    <div class="step">👉 ${step}</div>
    ${['city', 'me'].map(grp => `<div class="statrow ${grp}"><span class="glabel">${grp === 'city' ? T('市府') : T('你')}</span><div class="stats">${C.stats.filter(s => s.group === grp).map(statCell).join('')}</div></div>`).join('')}
    ${ruleShift(C, G) ? `<div class="shift">${T('📰 百日已過：再說「這是前任留下的」會被罵')}</div>` : ''}
  </div>`;
}

// ---------- 脆上的反應（只是氣氛）----------
const USERS = ['三寶媽在線上', '捷運通勤的阿凱', '機車族日常', '在地老店第三代', '退休國文老師', '熬夜寫論文的研究生', '里長的頭號粉絲', '議員辦公室小編（私帳）', '貓奴工程師', '外送員小陳', '早餐店阿姨', '公車司機老張', '剛搬來的新住民', '社工系學生', '房仲小林', '夜市攤販阿明', '國中家長會長', '長照家屬', '自行車通勤族', '路過的觀光客', '退休公務員', '設計系畢業生', '健身房常客', '計程車運將', '市場賣菜的大姊', '科技業加班狗', '高中熱舞社', '五金行老闆', '狗狗公園常客', '咖啡店店長', '社區管委會主委', '鄰市來的上班族'];
const CRISP = {
  up: [T('欸這次做得不錯欸'), T('第一次覺得市府有在做事'), T('先給個讚，看後續'), T('我阿嬤說這個副市長不錯'), T('終於！'), T('這個我挺'), T('有比前任好一點點')],
  down: [T('市府到底在幹嘛'), T('我就知道'), T('四年很快就過了喔'), T('笑死，又來'), T('稅金是這樣花的？'), T('記者會開完然後呢'), T('不意外')],
  mixed: [T('方向對啦，但也太慢'), T('先不要高興太早'), T('做是有做，但誰要付錢？'), T('里長說好就好嗎'), T('好壞參半，再觀察')],
  blame: [T('又是前任'), T('前任：我人在家裡也中槍'), T('你們上任幾天了？'), T('前任這個梗要用幾年')],
  reveal: [T('抽屜裡到底還有多少東西'), T('這個市府是俄羅斯娃娃嗎'), T('前任留下的不是抽屜，是寶箱'), T('明天又會挖出什麼')],
  pledge: [T('政見跳票倒數中'), T('真的做了？我去看看'), T('剪綵剪很快，蓋很慢'), T('這個政見我記得，有做喔')]
};
let REGULAR = null; // 每局有一位常客，跨回合會回來
function crisp(kind, n = 2) {
  const pool = CRISP[kind] || CRISP.up, users = USERS.slice().sort(() => Math.random() - 0.5), out = [];
  if (!REGULAR) REGULAR = users[0];
  for (let i = 0; i < n; i++) {
    // 每則反應：一則照心情、一則混一點反方或中立（有正有反）
    const p = i === 0 ? pool : (Math.random() < 0.5 ? CRISP.mixed : (kind === 'down' ? CRISP.up : CRISP.down));
    let u = users[i + 1];
    if (i === n - 1 && Math.random() < 0.25) u = REGULAR + T('（又來了）');
    out.push(`<div class="post"><b>${u}</b><span>${p[Math.floor(Math.random() * p.length)]}</span><small>♡ ${(Math.floor(Math.random() * 3000) + 12).toLocaleString('en-US')}</small></div>`);
  }
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
      <p class="tagline">${C.tagline}<br>${C.taglineMore.join('<br>')}</p>
    </div>
    <button class="btn" id="go">${T('開始 →')}</button>
    <button class="btn ghost" id="gal">${T('📚 圖鑑')}</button>
    <p class="muted center">${T('《我推的市長》系列 Part 2・一局約 8 分鐘<br>人物、政黨、城市全部虛構')}</p>
    <p class="muted center">${T('摩卡與貓貓小隊')}・v0.7.0</p>`);
  $('#go').onclick = setupScreen;
  $('#gal').onclick = () => galleryScreen(titleScreen);
}

// ---------- 開場：自訂市長 ----------
function setupScreen() {
  const w = lastWin();
  let gender = w && w.gender ? w.gender : '', bg = '', pf = '';
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
      <h2>${T('🧑‍💼 你是誰？')}</h2>
      <p class="muted">${T('市長要任命你當副市長。你原本是：')}</p>
      <div class="picks">${Object.entries(C.backgrounds).map(([k, b]) => `<button class="pick ${bg === k ? 'on' : ''}" data-bg="${k}"><b>${b.emoji} ${b.name}</b><small>${b.desc}</small></button>`).join('')}</div>
      <h2>${T('📂 你分管哪一塊？')}</h2>
      <p class="muted">${T('三位副市長各管幾個局處。你分管的爛攤子，可以直接督導局處處理。')}</p>
      <div class="picks">${Object.entries(C.portfolios).map(([k, b]) => `<button class="pick ${pf === k ? 'on' : ''}" data-pf="${k}"><b>${b.emoji} ${b.name}</b><small>${b.desc}</small></button>`).join('')}</div>
      <p class="muted center">${T('沒選的會隨機')}</p>
      <button class="btn" id="go">${T('下一步 →')}</button>`);
    const keep = f => b => b.onclick = () => { const v = $('#nm').value, y = window.scrollY; f(b); render(); $('#nm').value = v; window.scrollTo(0, y); };
    app.querySelectorAll('[data-g]').forEach(keep(b => { gender = b.dataset.g; }));
    app.querySelectorAll('[data-bg]').forEach(keep(b => { bg = b.dataset.bg; }));
    app.querySelectorAll('[data-pf]').forEach(keep(b => { pf = b.dataset.pf; }));
    $('#go').onclick = () => {
      const g = gender || (Math.random() < 0.5 ? 'm' : 'f');
      const name = $('#nm').value.trim() || NAMES[g][Math.floor(Math.random() * 6)];
      const type = w && w.boss === name && w.type ? w.type : 'ABCDEF'[Math.floor(Math.random() * 6)];
      BOSS = { name, gender: g, type, fromP1: !!(w && w.boss === name) };
      const pick = o => Object.keys(o)[Math.floor(Math.random() * Object.keys(o).length)];
      G = newRun(C, { seed: Date.now() % 1e9, bossType: BOSS.type, background: bg || pick(C.backgrounds), portfolio: pf || pick(C.portfolios), carry: BOSS.fromP1 ? { boss: BOSS.name, type: BOSS.type } : null });
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
      <p>👔 ${T('你是 {0} 任命的<b>副市長</b>，背景：{1}。你分管<b>{2}</b>的局處，這些事你可以直接督導。', esc(BOSS.name), C.backgrounds[G.background].name, C.portfolios[G.portfolio].name)}</p>
      <p>🗄️ ${T('前任做了八年，留下一整個<b>抽屜的爛攤子</b>。有些看起來很小，打開才知道很大；有些會連鎖。')}</p>
      <p>📣 ${T('市長選前開了很多<b>政見</b>，每一個都要過議會、要發包、要剪綵。爛攤子會卡住政見。')}</p>
      <p>🤝 ${T('另外還有兩位副市長，是同事，也是對手：{0}（{1}）和{2}（{3}）。', C.rivals[0].name, C.rivals[0].desc, C.rivals[1].name, C.rivals[1].desc)}</p>
      <p>⏳ ${T('任期四年，切成 12 回合。每回合先處理一件突發事件，再<b>做 2 件事</b>。')}</p>
      <p>🏆 ${T('<b>怎麼算贏</b>：連任前夕，爛攤子收得差不多、政見至少兌現 2 個、數值沒有爆掉，市長還信任你。')}</p>
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
      <p>${T('{0} 當選 N City 新市長。', esc(BOSS.name))}${BOSS.fromP1 ? T('（選戰那年，你們在一場座談會上見過一次。）') : ''}</p>
      <p>${T('彩帶、香檳、競選總部裡大家抱在一起哭。你不在現場，在家看電視。')}</p>
      <p>${T('晚上 11 點，你的手機響了。{0}：「我想請你來當副市長，幫我管{1}。」', esc(BOSS.name), C.portfolios[G.portfolio].name)}</p>
      <p style="color:#ffd166">${T('……明天早上 8 點，市政會議。')}</p>
    </div>
    <button class="btn" id="go">${T('隔天早上 8 點 →')}</button>`);
  $('#go').onclick = cabinetScreen;
}

// ---------- 組閣：市長請你推薦人選，市長決定 ----------
const MYSLOTS = () => C.cabinet.filter(s => C.portfolios[G.portfolio].slots.includes(s.id));
function cabinetScreen() {
  const offer = cabinetOffer(C, G);
  const CAB = MYSLOTS();
  let k = 0;
  const intro = () => {
    show(`<div class="hud"><div class="step">👉 ${T('看完按下面，開始推薦人選')}</div></div>
      <h2>${T('🗂️ 市長請你推薦人選')}</h2>
      <div class="card intro"><p>${T('全市 30 多個局處，市長沒時間一個一個面試。你分管的局處，他請你整理名單、先篩一輪，每個位子推薦一位給他決定；其他局處由市長和另外兩位副市長處理。主計、人事、警察、政風四位，依法不是市長自己換的。')}</p>
      ${MYSLOTS().map(s => `<p><b>${s.name}</b>：${s.why}</p>`).join('')}
</div>
      <details class="card legend"><summary>${T('📖 各種人選來源的取捨')}</summary>${Object.values(C.cabinetTypes).map(t => `<p><b>${t.emoji} ${t.name}</b>：${t.desc}</p>`).join('')}</details>
      <button class="btn" id="go">${T('開始推薦 →')}</button>`);
    $('#go').onclick = () => slotScreen();
  };
  const slotScreen = () => {
    const s = CAB[k], list = offer[s.id];
    let sel = null;
    const render = () => {
      show(`<div class="hud"><div class="step">👉 ${sel ? T('按最下面「推薦給市長」') : T('點一位你想推薦的人（{0}／{1}）', k + 1, CAB.length)}</div></div>
        <div class="card ev"><span class="tag">${T('第 {0}／{1} 個位子', k + 1, CAB.length)}</span><h2>${s.name}</h2>
        <p>💬 ${esc(BOSS.name)}：「${s.name}，${s.why}。你幫我找幾個人選。」</p><p class="hits">${s.hits}</p></div>
        <p class="muted">${T('人才庫裡願意接這個燙手山芋的：')}</p>
        <div class="picks">${list.map(c => { const t = C.cabinetTypes[c.src]; const fit = c.fit && c.fit.includes(s.id); return `<button class="pick ${sel === c.id ? 'on' : ''} ${c.dream ? 'dream' : ''}" data-c="${c.id}"><b>${t.emoji} ${c.name}</b><span class="tag">${t.name}</span>${c.dream ? `<span class="tag red">${T('✨ 夢幻人選')}</span>` : ''}${fit ? `<span class="tag blue">${T('👍 適合這個位子')}</span>` : ''}${c.pro ? `<small class="pro">✅ ${c.pro}</small><small class="con">⚠️ ${c.con}</small>` : `<small>${c.line || ''}</small>`}</button>`; }).join('')}</div>
        <button class="btn" id="go" ${sel ? '' : 'disabled'}>${T('推薦給市長 →')}</button>`);
      app.querySelectorAll('.pick').forEach(b => b.onclick = () => { sel = b.dataset.c; const y = window.scrollY; render(); window.scrollTo(0, y); });
      $('#go').onclick = () => decide(list.find(c => c.id === sel));
    };
    const decide = cand => {
      const res = C.recommend(G, s.id, cand, list);
      const next = () => { k++; k < CAB.length ? slotScreen() : turnStart(); };
      if (res.ok) {
        appoint(C, G, s.id, cand);
        show(`<div class="hud"><div class="step">👉 ${T('按下面繼續')}</div></div><div class="card ev"><h2>${s.name}</h2><div class="res">💬 ${esc(BOSS.name)}：${res.line}<br>✅ ${T('{0} 上任。他做得好壞，會算在你頭上。', cand.name)}</div></div><button class="btn" id="go">${k + 1 < CAB.length ? T('下一個位子 →') : T('就職，上工 →')}</button>`);
        $('#go').onclick = next;
      } else {
        const pick = res.pick, pt = C.cabinetTypes[pick.src];
        show(`<div class="hud"><div class="step">👉 ${T('接受，或硬著頭皮再勸一次')}</div></div><div class="card ev"><h2>${s.name}</h2><div class="res">💬 ${esc(BOSS.name)}：${res.line}<br>${T('老闆想用：{0} {1}（{2}）', pt.emoji, pick.name, pt.name)}${pick.pro ? `<br><small>✅ ${pick.pro}　⚠️ ${pick.con}</small>` : ''}</div>
          <button class="opt" id="ok">${T('🙂 好，就聽市長的')}<small>${T('之後出包，要不要收拾由你決定')}</small></button>
          <button class="opt" id="push">${T('😤 硬著頭皮再勸一次')}<small>${T('可能成功；失敗的話老闆會不太高興')}</small></button></div>`);
        $('#ok').onclick = () => { appoint(C, G, s.id, Object.assign({}, pick, { byYou: false })); next(); };
        $('#push').onclick = () => {
          const win = G.rng() < 0.3 + G.stats.trust * 0.004;
          applyFx(C, G, { trust: win ? -3 : -6, stress: 3 });
          appoint(C, G, s.id, win ? cand : Object.assign({}, pick, { byYou: false }));
          show(`<div class="hud"><div class="step">👉 ${T('按下面繼續')}</div></div><div class="card ev"><h2>${s.name}</h2><div class="res">${win ? T('老闆嘆了口氣：「好啦，聽你的。但出事你要負責。」') : T('老闆臉色一沉：「我說了，就他。」')}${fxHtml({ trust: win ? -3 : -6, stress: 3 })}</div></div><button class="btn" id="go">${k + 1 < CAB.length ? T('下一個位子 →') : T('就職，上工 →')}</button>`);
          $('#go').onclick = next;
        };
      }
    };
    render();
  };
  intro();
}

// ---------- 回合開始：事件（第 3 回合是蓋章小遊戲）----------
// 每回合開頭「你的行程表」：事件從其中一格跳出來（同一回合只排一次）
function agendaCard(ev) {
  if (ev.final) return '';
  if (G.agendaTurn !== G.turn) {
    const a = C.agenda.slice().sort(() => Math.random() - 0.5).slice(0, 5).sort((x, y) => x[0] < y[0] ? -1 : 1);
    G.agendaTurn = G.turn; G.agenda = a; G.agendaHit = Math.floor(Math.random() * a.length);
  }
  return `<div class="agenda"><div class="ah">📅 ${T('你今天的行程')}</div>${G.agenda.map((x, i) => `<div class="${i === G.agendaHit ? 'hit' : ''}"><span>${x[0]}</span>${i === G.agendaHit ? `${x[1]} → ⚠️ ${ev.title}` : x[1]}</div>`).join('')}</div>`;
}
const KIND = { a: T('💬 建議市長'), s: T('✋ 你自己處理') };
const VERDICT = { yes: T('市長照你的建議做了。'), half: T('市長聽了，但打了折扣。'), no: T('市長沒聽你的，照他自己的意思做：') };
function turnStart() {
  if (G.turn === G.turns && !G.flags.pressDone) { G.flags.pressDone = 1; return pressGame(turnStart); }
  if (G.turn === 3 && !G.flags.memoDone) { G.flags.memoDone = 1; return memoGame(afterEvents); }
  showEvent(drawEvent(C, G), afterEvents);
}
// 這回合的事件處理完：如果老闆的真面目到了該露出來的時候，多一段小劇場
function afterEvents() {
  const tev = traitEvent(C, G);
  if (tev) return showEvent(tev, afterEvents);
  if (G.turn === 7 && !G.flags.allocDone) { G.flags.allocDone = 1; return budgetGame(afterEvents); }
  actionsLeft = C.actionsPerTurn; workScreen();
}
function showEvent(ev, then) {
  const tag = ev.boom ? `<span class="tag red">${T('💥 擱置太久')}</span>` : ev.final ? `<span class="tag blue">${T('🗳️ 終局')}</span>` : (ev.id.startsWith('tr_') && !ev.id.endsWith('_hint')) ? `<span class="tag red">${T('😳 老闆的真面目')}</span>` : ev.id.endsWith('_hint') ? `<span class="tag">${T('🤔 有點怪')}</span>` : '';
  show(`${guide(T('點一個選項。💬 是建議市長（他不一定聽）；✋ 是你自己能做的'))}
    ${agendaCard(ev)}
    <div class="card ev">${tag}<h2>${ev.title}</h2><p>${txt(ev.text)}</p>
      ${ev.opts.map((o, i) => `<button class="opt" data-i="${i}"><span class="kind ${o.k === 'a' ? 'ka' : 'ks'}">${KIND[o.k || 's']}</span>${o.t}</button>`).join('')}
    </div>`);
  app.querySelectorAll('.opt').forEach(b => b.onclick = () => {
    const r = chooseEvent(C, G, ev, +b.dataset.i);
    const end = ev.final || G.flags.quit;
    const v = r.verdict ? `<div class="verdict ${r.verdict}">💬 ${VERDICT[r.verdict]}${r.verdict === 'no' && r.alt ? `<b>${r.alt}</b>` : ''}</div>` : '';
    show(`${guide(end ? T('按下面看結局') : T('看完按下面繼續'))}
      <div class="card ev"><h2>${ev.title}</h2>${v}<div class="res">${txt(r.text)}${fxHtml(r.fx)}</div></div>
      ${end ? '' : crisp(moodOf(r.fx))}
      <button class="btn" id="go">${end ? T('看結局 →') : T('繼續 →')}</button>`);
    $('#go').onclick = end ? endingScreen : then;
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
      ${open.map(d => { const def = C.drawer.find(x => x.id === d.id), mine = isMine(C, G, d.id); return `<button class="topic ${d.fresh ? 'new' : ''} ${d.own ? 'own' : ''} ${mine ? 'mine' : ''}" data-d="${d.id}"><span class="ic">${d.own ? '🧾' : '🗄️'}</span><b>${def.title}</b><small>${mine ? T('✋ 你分管') : T('別人分管')}・${SIZE(d.size)}${d.known ? '' : '？'}${d.shelved >= 2 ? ' ⚠️' : ''}</small></button>`; }).join('')}
      ${pls.map(p => { const def = C.pledges.find(x => x.id === p.id); return `<button class="topic pl" data-p="${p.id}"><span class="ic">${def.emoji}</span><b>${def.name}</b><small>${p.mine ? T('✋ 你分管・') : ''}${T('政見 {0}／{1}', p.step, C.pledgeSteps.length)}</small></button>`; }).join('')}
      <button class="topic rest" id="rest"><span class="ic">🛌</span><b>${T('請假一天')}</b><small>${T('壓力 −20、老闆信任 −2')}</small></button>
    </div>
    <p class="muted center">${T('🗄️ 前任的爛攤子　🧾 你們自己的　📣 政見')}</p>
    <button class="btn ghost" id="skip">${T('這次先開會（跳過）')}</button>`);
  app.querySelectorAll('[data-d]').forEach(b => b.onclick = () => drawerSheet(b.dataset.d));
  app.querySelectorAll('[data-p]').forEach(b => b.onclick = () => pledgeSheet(b.dataset.p));
  $('#rest').onclick = () => { const fx = { stress: -20, trust: -2 }; applyFx(C, G, fx); afterAction(T('你關掉手機睡了一整天。醒來有 46 則未讀，但你覺得自己又是個人了。') + fxHtml(fx), fx, 'up'); };
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
  const late = ruleShift(C, G), mine = isMine(C, G, id);
  const head = `${d.own ? `<span class="tag">${T('🧾 你們自己的')}</span>` : `<span class="tag">${T('🗄️ 前任留下的')}</span>`}${mine ? `<span class="tag blue">${T('✋ 你分管')}</span>` : `<span class="tag">${T('別人分管：要市長拍板或找負責的副市長')}</span>`}${d.shelved >= 2 ? `<span class="tag red">${T('放了 {0} 回合，越來越大', d.shelved)}</span>` : ''}<h2>${def.title}</h2>`;
  const act = (a, choice) => () => {
    const r = useDrawer(C, G, id, a, choice);
    const c = choice != null ? def.choices[choice] : null;
    let m = `<b>${def.title}</b><br>`;
    if (r.note === 'coordfail') m += T('🤝 對方副市長說：「這件事我們局處另有規劃。」這次喬不動。');
    else if (r.note === 'coord') m += T('🤝 協調成功，事情處理好了。記者會上，是另一位副市長在講。');
    else if (r.verdict === 'no') m += T('💬 市長看了你的建議：「再等等。」這件事這次沒動。');
    else if (c) {
      m += (c.k === 's' ? T('✋ 你打了幾通電話。') : mine ? T('✋ 你召集局處開會，決定：') : r.verdict === 'half' ? T('💬 市長同意了，但打了折扣：') : T('💬 市長拍板：')) + `<b>${c.t}</b>`;
      if (c.r) m += '<br>' + txt(c.r);
      if (r.note === 'oops') m += T('（自己人第一次出手，流程走錯，被記者抓到。）');
    }
    if (a === 'blame' && r.verdict !== 'no') m += late ? T('「都上任多久了還怪前任？」') : T('「這是前任留下來的。」大家點頭。');
    afterAction(m + fxHtml(r.fx), r.fx, a === 'blame' ? 'blame' : moodOf(r.fx), r.opened);
  };
  const tag = c => c.k === 's' ? `<span class="kind ks">${T('✋ 你私下做')}</span>` : mine ? `<span class="kind ks">${KIND.s}</span>` : `<span class="kind ka">${KIND.a}</span>`;
  sheet(head, `<span class="scene">${def.scene || def.text}</span>`, [
    ...def.choices.map((c, i) => ({ t: tag(c) + c.t, d: d.blocked && c.k !== 's' ? T('另一件事剛用掉這筆錢，下回合再說') : c.d, off: !!(d.blocked && c.k !== 's'), go: act('do', i) })),
    ...(mine ? [] : [{ t: `<span class="kind kc">${T('🤝 找負責的副市長')}</span>` + T('請他處理'), d: T('不用市長拍板；成了，功勞多半算他的；可能喬不動'), go: act('coord') }]),
    ...(d.own ? [] : [{ t: `<span class="kind ka">${KIND.a}</span>` + T('建議市長對外說「這是前任留下的」'), d: late ? T('百日過了，現在說會被罵') : T('民意 +，但事情還在'), go: act('blame') }])
  ]);
}
function pledgeSheet(pid) {
  const p = G.pledges.find(x => x.id === pid), def = C.pledges.find(x => x.id === pid);
  const chk = pledgeCheck(C, G, p);
  const steps = `<div class="steps">${C.pledgeSteps.map((s, i) => `<div class="${i < p.step ? 'ok' : i === p.step ? 'cur' : ''}">${s.name}</div>`).join('')}</div>`;
  const ribbon = chk.step.id === 'ribbon';
  sheet(`<span class="tag blue">${T('📣 政見')}</span><h2>${def.emoji} ${def.name}</h2>${steps}`,
    chk.block ? T('⛔ 主計處長：「{0}」沒處理之前，這筆預算依法不能編。', C.drawer.find(x => x.id === chk.block).title) : ribbon ? T('完工了！里長們都到了，就等剪綵。') : T('下一步：{0}。', chk.step.name),
    [{ t: ribbon ? `<span class="kind ka">${KIND.a}</span>` + T('安排剪綵、排站位（小遊戲）') : p.mine ? `<span class="kind ks">${KIND.s}</span>` + T('你直接督導推動「{0}」', chk.step.name) : `<span class="kind ka">${KIND.a}</span>` + T('建議市長推動「{0}」', chk.step.name), d: chk.block ? T('會被退回') : (chk.cost ? T('預算 −{0}・', chk.cost) : '') + T('可能失敗（約 {0}%）', Math.round(chk.fail * 100)), go: () => {
      if (ribbon) return ribbonGame((ok, roast) => { const r = pushPledge(C, G, pid, ok); afterAction(`<b>${def.emoji} ${def.name}</b><br>${ok ? T('✂️ 站位完美，照片很漂亮。政見兌現！') : T('剪下去了，但照片出事了，下次要重辦：')}${(roast || []).map(x => `<br>📸 ${x}`).join('')}` + fxHtml(r.fx), r.fx, ok ? 'pledge' : 'down'); });
      const r = pushPledge(C, G, pid, undefined, true);
      let m = `<b>${def.emoji} ${def.name}：${r.step.name}</b><br>`;
      if (r.why === 'mayor') m += T('💬 市長說：「這個先放一下。」');
      else if (r.ok) m += T('過關了！');
      else if (r.why === 'fail') m += r.step.id === 'tender' ? T('流標了，沒有廠商來投標。') : T('議會把預算刪了，要你「再研議」。');
      else m += T('被退回：要先處理「{0}」。', C.drawer.find(x => x.id === r.why.split(':')[1]).title);
      afterAction(m + fxHtml(r.fx), r.fx, r.ok ? 'pledge' : 'down');
    } }, { t: `<span class="kind ks">${KIND.s}</span>` + C.pledgeGray[chk.step.id].name.replace(/^\S+ /, ''), d: chk.block ? T('主計卡著，喬也沒用') : T('這一步一定過；清白會掉，代價晚點來'), off: !!chk.block, go: () => {
      const r = pushPledgeGray(C, G, pid);
      afterAction(`<b>${def.emoji} ${def.name}：${r.step.name}</b><br>${T('事情突然變得很順利。')}` + fxHtml(r.fx), r.fx, 'up');
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
      <p class="muted">${T('沒碰的公文又放厚了一點。稅收入帳：財政 +5。')}</p>
      ${G.news.length ? `<div class="news">📰 <b>${T('晚一點才來的代價')}</b>${G.news.map(n => `<div>${n.text}${fxHtml(n.fx)}</div>`).join('')}</div>` : ''}
      ${fresh.length ? `<p>🧾 ${T('新的麻煩，這次是你們自己的：')}${fresh.map(d => `<b>「${C.drawer.find(x => x.id === d.id).title}」</b>`).join('')}</p>` : ''}
    </div>
    <button class="btn" id="go">${over ? T('看結局 →') : T('下一回合：{0} →', (C.rounds[G.turn - 1] || {}).label || '')}</button>`);
  $('#go').onclick = over ? endingScreen : turnStart;
}

// ---------- 小遊戲：公文快速批（看內容判斷，蓋「核可」或「退回」）----------
function memoGame(done) {
  show(`${guide(T('小遊戲：看內容，蓋「核可」或「退回」'))}
    <div class="card ev"><h2>${T('🖋️ 公文快速批')}</h2>
    <p>${T('局處送來一疊公文，10 秒內一份一份蓋章。看清楚內容再蓋：有些是陷阱（親戚公司、附件不見、金額多一個 0、關說條子），也有颱風前的急件不能退。')}</p>
    <button class="btn" id="go">${T('開始批公文！')}</button></div>`);
  $('#go').onclick = () => {
    const pile = C.memos.slice().sort(() => Math.random() - 0.5);
    const t0 = Date.now(), log = [];
    let k = 0, over = false;
    const render = (flash = '') => {
      const m = pile[k % pile.length];
      show(`<div class="hud"><div class="step" id="clock">⏱ ${Math.max(0, 10 - (Date.now() - t0) / 1000).toFixed(1)}s　📄 ${T('已批 {0} 份', log.length)}</div></div>
        <div class="doc memo ${flash}"><div class="lvl">${T('公文')} #${k + 1}</div><div class="mt">${m.t}</div></div>
        <div class="stamps two"><button data-k="yes">✅ ${T('核可')}</button><button data-k="no">↩️ ${T('退回')}</button></div>`);
      app.querySelectorAll('.stamps button').forEach(b => b.onclick = () => { if (over) return; const right = b.dataset.k === m.ok; log.push({ m, k: b.dataset.k, right }); if (typeof sfxStamp === 'function') sfxStamp(); k++; render(right ? 'good' : 'bad'); });
    };
    render();
    const timer = setInterval(() => {
      const c = $('#clock'); if (c) c.textContent = `⏱ ${Math.max(0, 10 - (Date.now() - t0) / 1000).toFixed(1)}s　📄 ${T('已批 {0} 份', log.length)}`;
      if (Date.now() - t0 < 10000) return;
      clearInterval(timer); over = true;
      const right = log.filter(x => x.right).length, trapsWrong = log.filter(x => !x.right && x.m.trap);
      const fx = { staff: right >= 4 ? 5 : right >= 2 ? 1 : -3 };
      for (const w of trapsWrong) { if (w.m.ok === 'no') { fx.integrity = (fx.integrity || 0) - 4; } else { fx.pop = (fx.pop || 0) - 4; } }
      applyFx(C, G, fx);
      show(`${guide(T('看完按下面'))}<div class="card ev"><h2>${T('🖋️ 你今天蓋了什麼')}</h2>
        <div class="memolist">${log.map(x => `<div class="${x.right ? 'ok' : 'ng'}">${x.k === 'yes' ? '✅' : '↩️'} ${x.m.t}${!x.right && x.m.trap ? `<small>⚠️ ${x.m.trap}</small>` : ''}</div>`).join('') || `<div>${T('一份都沒蓋。')}</div>`}</div>
        <div class="res">${T('蓋對 {0} 份、蓋錯 {1} 份。', right, log.length - right)}${trapsWrong.length ? T('有陷阱公文沒看出來，之後會有人來問。') : ''}${fxHtml(fx)}</div></div>
        ${crisp(right >= log.length - right ? 'up' : 'down', 1)}
        <button class="btn" id="go">${T('繼續 →')}</button>`);
      $('#go').onclick = done;
    }, 100);
  };
}

// ---------- 小遊戲：預算分配（預算季，把一筆錢分給你分管的局處）----------
function budgetGame(done) {
  const slots = MYSLOTS(), total = 30, val = slots.map(() => 10);
  const render = () => {
    const left = total - val.reduce((a, b) => a + b, 0);
    show(`${guide(T('小遊戲：用 ＋／− 把 30 億分給你分管的局處'))}
      <div class="card ev"><h2>${T('💰 預算分配')}</h2><p>${T('明年度預算，你分管的局處可以分 30 億。分少的局長下一回合會來抱怨；分多的會比較好做事。')}</p>
      ${slots.map((s, i) => `<div class="alloc"><b>${s.name}</b><button data-i="${i}" data-d="-2">−</button><span>${val[i]} ${T('億')}</span><button data-i="${i}" data-d="2">＋</button></div>`).join('')}
      <p class="muted">${T('還沒分：{0} 億', left)}</p>
      <button class="btn" id="go" ${left ? 'disabled' : ''}>${left ? T('還有 {0} 億沒分', left) : T('送出預算 →')}</button></div>`);
    app.querySelectorAll('.alloc button').forEach(b => b.onclick = () => { const i = +b.dataset.i, d = +b.dataset.d, left2 = total - val.reduce((a, c) => a + c, 0); if (d > 0 && left2 <= 0) return; val[i] = Math.max(0, val[i] + d); render(); });
    $('#go').onclick = () => {
      const lines = [];
      slots.forEach((s, i) => {
        if (val[i] <= 6) { G.later.push({ at: G.turn + 1, fx: { staff: -3, stress: 3 }, text: T('{0}來抱怨：「這點錢，我們什麼都做不了。」', s.name) }); lines.push(T('{0}：{1} 億（局長臉很臭）', s.name, val[i])); }
        else if (val[i] >= 14) { G.flags['rich_' + s.id] = 1; lines.push(T('{0}：{1} 億（局長很開心，事情會比較好推）', s.name, val[i])); }
        else lines.push(T('{0}：{1} 億', s.name, val[i]));
      });
      const fx = { staff: 2 };
      applyFx(C, G, fx);
      show(`${guide(T('看完按下面'))}<div class="card ev"><h2>${T('💰 預算送出去了')}</h2><div class="res">${lines.join('<br>')}${fxHtml(fx)}</div></div><button class="btn" id="go">${T('繼續 →')}</button>`);
      $('#go').onclick = done;
    };
  };
  render();
}

// ---------- 小遊戲：擋記者（連任前夕的記者會）----------
function pressGame(done) {
  show(`${guide(T('小遊戲：推開麥克風，只回答 🙋 的好問題'))}
    <div class="card ev"><h2>${T('🎤 連任前夕記者會')}</h2><p>${T('麥克風一支一支伸過來。點 🎤 把它推開；看到 🙋 好問題就點它回答。不要回答到 🔥 陷阱題！8 秒。')}</p>
    <button class="btn" id="go">${T('開始！')}</button></div>`);
  $('#go').onclick = () => {
    const t0 = Date.now(); let pushed = 0, good = 0, bad = 0;
    show(`<div class="hud"><div class="step" id="clock">⏱ 8.0s</div></div><div class="mics">${Array.from({ length: 9 }, (_, i) => `<button data-i="${i}"></button>`).join('')}</div>`);
    const cells = [...app.querySelectorAll('.mics button')];
    cells.forEach(b => b.onclick = () => { const k = b.dataset.k; if (!k) return; if (k === 'mic') pushed++; if (k === 'good') good++; if (k === 'trap') bad++; b.dataset.k = ''; b.textContent = k === 'trap' ? '💥' : '✨'; });
    const tick = setInterval(() => {
      const left = 8 - (Date.now() - t0) / 1000;
      const c = $('#clock'); if (c) c.textContent = `⏱ ${Math.max(0, left).toFixed(1)}s　🎤 ${pushed}　🙋 ${good}`;
      cells.forEach(b => { if (Math.random() < 0.08) { const r = Math.random(); b.dataset.k = r < 0.6 ? 'mic' : r < 0.82 ? 'good' : 'trap'; b.textContent = { mic: '🎤', good: '🙋', trap: '🔥' }[b.dataset.k]; } else if (Math.random() < 0.05) { b.dataset.k = ''; b.textContent = ''; } });
      if (left <= 0) {
        clearInterval(tick);
        const score = pushed + good * 3 - bad * 4;
        const fx = score >= 14 ? { pop: 6, stress: -5 } : score >= 6 ? { pop: 2 } : { pop: -5, stress: 6 };
        applyFx(C, G, fx);
        show(`${guide(T('看完按下面'))}<div class="card ev"><h2>${T('🎤 記者會結束')}</h2><div class="res">${score >= 14 ? T('你擋得滴水不漏，老闆的回答也剛剛好。') : score >= 6 ? T('有驚無險。') : T('陷阱題被老闆接住了，接得很爛。')}${fxHtml(fx)}</div></div><button class="btn" id="go">${T('連任前夕 →')}</button>`);
        $('#go').onclick = done;
      }
    }, 100);
  };
}

// ---------- 小遊戲：剪綵排站位（點人，再點位置）----------
const LINEUP_RULES = [
  { id: 'c', t: T('市長一定站 C 位（正中間）'), ok: L => L[3] === 'mayor' },
  { id: 'opp', t: T('對手黨議員不能站市長旁邊'), ok: L => L[2] !== 'councilor' && L[4] !== 'councilor' },
  { id: 'vendor', t: T('得標廠商不能入鏡（不要排進去）'), ok: L => !L.includes('vendor') },
  { id: 'chief', t: T('里長一定要被拍到'), ok: L => L.includes('chief') },
  { id: 'rival', t: T('周副市長想搶 C 位，不能讓他站市長旁邊'), ok: L => L[2] !== 'rival' && L[4] !== 'rival' }
];
function ribbonGame(done) {
  const rules = LINEUP_RULES.slice().sort(() => Math.random() - 0.5).slice(0, 3);
  if (!rules.some(r => r.id === 'c')) rules[0] = LINEUP_RULES[0];
  const L = Array(7).fill(null);
  let sel = null;
  const render = () => {
    const placed = L.filter(Boolean);
    show(`${guide(T('小遊戲：點一個人，再點下面的位置；排好按「剪！」'))}
      <div class="card ev"><h2>${T('✂️ 剪綵排站位')}</h2>
      <div class="rules">${rules.map(r => `<div>📌 ${r.t}</div>`).join('')}</div>
      <div class="people">${C.lineupPeople.filter(p => !placed.includes(p.id)).map(p => `<button class="${sel === p.id ? 'on' : ''}" data-p="${p.id}">${p.emoji}<small>${p.name}</small></button>`).join('')}</div>
      <div class="stage">${L.map((x, i) => { const p = C.lineupPeople.find(q => q.id === x); return `<button data-s="${i}" class="${i === 3 ? 'cpos' : ''}">${p ? p.emoji + '<small>' + p.name + '</small>' : (i === 3 ? 'C' : '·')}</button>`; }).join('')}</div>
      <p class="muted center">${T('點台上的人可以把他拿下來')}</p>
      <button class="btn" id="cut">${T('✂️ 剪！')}</button></div>`);
    app.querySelectorAll('.people button').forEach(b => b.onclick = () => { sel = b.dataset.p; render(); });
    app.querySelectorAll('.stage button').forEach(b => b.onclick = () => { const i = +b.dataset.s; if (L[i] && !sel) { L[i] = null; } else if (sel) { const j = L.indexOf(sel); if (j >= 0) L[j] = null; L[i] = sel; sel = null; } render(); });
    $('#cut').onclick = () => {
      const broken = rules.filter(r => !r.ok(L));
      const ok = broken.length === 0 && L.filter(Boolean).length >= 4;
      const roast = { c: T('截圖：市長被擠到旁邊，C 位是別人。脆上：「這是誰的剪綵？」'), opp: T('截圖：對手黨議員跟市長勾肩搭背，兩邊支持者都氣炸。'), vendor: T('截圖：得標廠商老闆站在正中間比讚。記者：「這是誰的工程？」'), chief: T('里長沒被拍到，在地方群組說市府「過河拆橋」。'), rival: T('截圖：周副市長擠到市長旁邊，脆上：「兩個人在搶 C 位？」') };
      done(ok, broken.map(r => roast[r.id]));
    };
  };
  render();
}

// ---------- 結局 ----------
let LAST_END = null;
function endingScreen() {
  if (!LAST_END || LAST_END.g !== G) {
    const e = ending(C, G), ti = runTitle(C, G);
    LAST_END = { g: G, e, ti, save: seriesSave(C, G, e) };
    try { const S = JSON.parse(localStorage.getItem(SERIES_KEY) || '{}'); S.p2 = LAST_END.save; localStorage.setItem(SERIES_KEY, JSON.stringify(S)); } catch (err) { /* 無痕模式就算了 */ }
    saveGallery('endings', e.id); saveGallery('titles', ti.id); saveGallery('traits', G.trait);
    track('end-' + e.id);
  }
  const { e, ti, save } = LAST_END, t = tally(G), tr = C.traits[G.trait];
  show(`<div class="ending">
      <div class="emoji">${e.emoji}</div>
      <h2>${e.title}</h2>
      <p>${txt(e.text)}</p>
      <div class="card" style="text-align:left">
        <div>🏅 ${T('本局稱號：{0} {1}', ti.emoji, ti.name)}</div>
        <div>${tr.emoji} ${T('老闆的真面目：{0}', tr.name)}</div>
        <div>🗄️ ${T('爛攤子收掉：{0}／{1} 份', t.drawer, t.total)}</div>
        <div>📣 ${T('政見兌現：{0}／{1} 張', t.pledges, G.pledges.length)}</div>
        <div>🫵 ${T('甩鍋給前任：{0} 次', G.blamed)}</div>
      </div>
      <button class="btn" id="share">${T('📤 分享結局截圖')}</button>
      <button class="btn ghost" id="code">${T('🔗 複製系列存檔碼（之後的篇章可以接續）')}</button>
      <button class="btn" id="again">${T('🔁 再當一次副市長')}</button>
      <button class="btn ghost" id="gal">${T('📚 圖鑑')}</button>
    </div>`);
  $('#code').onclick = () => { const c = encodeSave(save); (navigator.clipboard ? navigator.clipboard.writeText(c) : Promise.reject()).then(() => { $('#code').textContent = T('✅ 已複製'); }).catch(() => prompt(T('複製這串存檔碼：'), c)); };
  $('#again').onclick = () => { track('replay'); setupScreen(); };
  $('#gal').onclick = () => galleryScreen(endingScreen);
  $('#share').onclick = () => shareImage(e, ti, tr, t);
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
