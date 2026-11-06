// 職業包：Part 2 副市長（前任的抽屜）
// 文字一律用 T() 包；Node 模擬時用下面的備用 T
var T = typeof T === 'function' ? T : (s, ...a) => s.replace(/\{(\d)\}/g, (_, i) => a[i]);

const CAREER_MAYOR_OFFICE = {
  id: 'mayor-office', part: 2, turns: 12, shiftTurn: 5, costPer: 4, actionsPerTurn: 2,
  title: T('我推的市長：上任篇'),
  subtitle: T('前任的抽屜'),
  tagline: T('你以為選上就萬歲了？不，是大坑的開始。'),
  role: T('副市長'),
  // ===== 你的背景（開場選）：起始數值不同 =====
  backgrounds: {
    civil: { emoji: '🗂️', name: T('資深文官'), desc: T('在市府待了 25 年，局處都買你的帳'), fx: { staff: 8, council: 2, network: -5 } },
    scholar: { emoji: '🎓', name: T('學者'), desc: T('有名氣、有專業，市民信任你；議會覺得你不食人間煙火'), fx: { pop: 5, council: -5, network: -10, succession: 5 } },
    councilor: { emoji: '🏛️', name: T('前議員'), desc: T('議會裡誰欠誰你都知道；人脈廣，但包袱也多'), fx: { council: 10, network: 15, integrity: -8 } },
    manager: { emoji: '💼', name: T('企業經理人'), desc: T('效率高、懂預算；不懂為什麼一件事要開五次會'), fx: { budget: 8, staff: -4, stress: -5 } }
  },
  // ===== 你分管的領域（開場選）：分管的爛攤子你可以直接督導局處 =====
  portfolios: {
    works: { emoji: '🏗️', name: T('工務交通'), desc: T('路燈、場館、工程差額、捷運'), drawer: ['B', 'G', 'I', 'Y1'], slots: ['works', 'transport', 'metro'], pledges: ['bus', 'sidewalk', 'smartcity'] },
    social: { emoji: '🧓', name: T('財政社福'), desc: T('上市案、敬老金、營養午餐、分手費、社宅'), drawer: ['A', 'C', 'F', 'H', 'K', 'Y2'], slots: ['finance', 'socialw', 'edu'], pledges: ['housing', 'daycare', 'eldercare', 'opendata'] },
    culture: { emoji: '🎭', name: T('文化觀光'), desc: T('紀念館、天空步道、體育場'), drawer: ['D', 'E', 'J'], slots: ['culturec', 'tourism', 'sports'], pledges: ['park', 'expo', 'market', 'startupzone'] }
  },
  // ===== 另外兩位副市長：同事兼對手 =====
  rivals: [
    { id: 'zhou', name: T('周副市長'), desc: T('黨部推薦的老手，議會裡人頭很熟，很會搶功') },
    { id: 'lin', name: T('林副市長'), desc: T('學者型，講話很有道理，很會推責任') }
  ],
  // ===== 四年任期切成 12 回合：前百日按月，之後一回合跳幾個月 =====
  rounds: [
    { label: T('第 1 年・1 月'), note: T('就職、交接'), event: 'cabinetpuzzle' },
    { label: T('第 1 年・2 月'), note: T('春節'), event: 'lunarny' },
    { label: T('第 1 年・3 月') },
    { label: T('第 1 年・4 月'), note: T('上任百日'), event: 'presser' },
    { label: T('第 1 年・5～6 月'), note: T('議會定期會'), event: 'interpellation' },
    { label: T('第 1 年・夏'), note: T('颱風季'), event: 'typhoon' },
    { label: T('第 1 年・秋'), note: T('預算季'), event: 'budgetseason' },
    { label: T('第 1 年・12 月'), note: T('跨年＋就職一週年'), event: 'anniversary' },
    { label: T('第 2 年'), note: T('董事改選'), event: 'patronage' },
    { label: T('第 3 年'), note: T('期中考'), event: 'midterm' },
    { label: T('第 4 年・上半'), note: T('選前半年'), event: 'preelect' },
    { label: T('第 4 年・連任前夕'), note: T('終局') }
  ],
  stats: [
    // 第一條「市府」：施政相關；爆表會累積成「府會大亂」
    { id: 'pop', group: 'city', emoji: '😊', name: T('滿意度'), start: 45, low: 10, high: 90 },
    { id: 'council', group: 'city', emoji: '🏛️', name: T('議會'), start: 50, low: 10, high: 90 },
    { id: 'budget', group: 'city', emoji: '💰', name: T('財政'), start: 60, low: 10, high: 90 },
    { id: 'staff', group: 'city', emoji: '💪', name: T('士氣'), start: 50, low: 10, high: 90 },
    // 第二條「你」：副市長自己的
    { id: 'trust', group: 'me', emoji: '🤝', name: T('市長信任'), start: 60, low: 10, high: 101 },
    { id: 'succession', group: 'me', emoji: '🏁', name: T('接班聲望'), start: 30, low: -1, high: 101 },
    { id: 'integrity', group: 'me', emoji: '🧼', name: T('清白'), start: 85, low: 35, high: 101 },
    { id: 'stress', group: 'me', emoji: '😵', name: T('壓力'), start: 20, low: -1, high: 90 },
    { id: 'network', group: 'me', emoji: '📇', name: T('人脈'), start: 30, low: -1, high: 101 }
  ],
  // 走後門：成本減半、事情變快；代價晚一點來
  shortcut: { fx: { integrity: -13, network: 4, stress: -2 }, later: { in: 3, fx: { council: -8, pop: -6 }, text: T('議員爆料：「這件事是怎麼喬的？」') } },
  pledgeGray: {
    budget: { name: T('🤝 私下跟議員交換'), fx: { integrity: -6, network: 3 }, later: { in: 2, fx: { council: -4, budget: -8 }, text: T('答應議員的地方建設要兌現了。') } },
    tender: { name: T('📞 打給認識的廠商來投'), fx: { integrity: -10, network: 4 }, later: { in: 3, fx: { pop: -6, integrity: -5 }, text: T('記者發現：得標廠商跟市府高層很熟。') } },
    ribbon: { name: T('📸 先辦動土典禮再說'), fx: { pop: 3 }, later: { in: 2, fx: { pop: -5 }, text: T('動土典禮過了半年，工地還是空的。') } }
  },
  blameEarly: { pop: 5 },
  blameLate: { pop: -8, council: -3 },


  // ===== 開局隨機的議會生態（用虛構政黨）=====
  councils: {
    majority: { emoji: '🟢', name: T('本黨過半'), desc: T('議會友善，預算比較好過；但本黨議員會來要建設、要人事，被說「府會一家」。'), fx: { council: 12 }, budgetAdj: -0.12, partyMul: 0.5 },
    minority: { emoji: '🔴', name: T('朝小野大'), desc: T('本黨是少數，預算常被刪、總質詢火力全開，要靠協商和交換。政黨推薦的人選特別有用。'), fx: { council: -12 }, budgetAdj: 0.12, partyMul: 1.6 },
    split: { emoji: '⚖️', name: T('勢均力敵'), desc: T('兩邊差不多，關鍵在幾位無黨籍議員。每次表決前都要喬。'), fx: {}, budgetAdj: 0.04, partyMul: 1 }
  },
  speakers: [T('議長是本黨的老前輩'), T('議長是對手黨的，但很講程序'), T('議長是無黨籍，誰都不得罪')],

  // ===== 組閣：4 個職位，每個職位從人才池抽 3 位（來源不重複）=====
  // 主計、人事、警察、政風首長依法不由市長任免（畫面上灰色上鎖）
  cabinet: [
    { id: 'works', name: T('工務局長'), why: T('蓋一半的工程等著收拾'), hits: T('影響：路燈合約、巨型場館、工程差額、政見發包'), domain: ['B', 'G', 'I', 'tender'] },
    { id: 'transport', name: T('交通局長'), why: T('塞車、公車路線，市民天天在罵'), hits: T('影響：政見剪綵、公車政見'), domain: ['ribbon'] },
    { id: 'metro', name: T('捷運工程局長'), why: T('延伸線延宕，這次沒有前任可以怪'), hits: T('影響：捷運延伸線'), domain: ['Y1'] },
    { id: 'finance', name: T('財政局長'), why: T('前任的帳要有人算清楚'), hits: T('影響：上市案、分手費、政見審預算'), domain: ['A', 'C', 'K', 'budget'] },
    { id: 'socialw', name: T('社會局長'), why: T('敬老金只編半年，老人家等著領'), hits: T('影響：敬老金、社宅'), domain: ['F', 'Y2'] },
    { id: 'edu', name: T('教育局長'), why: T('免費營養午餐下學期就要開辦'), hits: T('影響：營養午餐'), domain: ['H'] },
    { id: 'culturec', name: T('文化局長'), why: T('只剩冷氣在上班的紀念館'), hits: T('影響：紀念館'), domain: ['D'] },
    { id: 'tourism', name: T('觀光傳播局長'), why: T('熱潮退了的天空步道要救'), hits: T('影響：天空步道'), domain: ['E'] },
    { id: 'sports', name: T('體育局長'), why: T('剛啟用就出事的體育場'), hits: T('影響：體育場'), domain: ['J'] }
  ],
  lockedSlots: [T('主計處長'), T('人事處長'), T('警察局長'), T('政風處長')],
  // 人選來源：每種都有取捨；events 是選了之後才會加進牌組的事件
  cabinetTypes: {
    loyal: { emoji: '🤝', name: T('自己人'), desc: T('老闆完全信任；但沒做過行政，第一份公文會出包'), fx: { trust: 5 } },
    party: { emoji: '🎗️', name: T('黨部推薦'), desc: T('議會預算關卡好過；黨部之後會來「關心」'), fx: { council: 6 }, failAdj: { budget: -0.15 }, events: ['partycall'] },
    central: { emoji: '🏛️', name: T('中央借將'), desc: T('懂預算、跟中央熟，補助好拿；兩年後要回中央'), fx: { budget: 6 }, failAdj: { budget: -0.1 }, },
    peer: { emoji: '🚇', name: T('鄰市前局長'), desc: T('做出過成績，工期抓得準；會帶自己的人進來'), fx: { staff: -4 }, failAdj: { tender: -0.2 }, costMul: 0.85 },
    ngo: { emoji: '📣', name: T('公民團體'), desc: T('民意大加分、媒體很愛；每件事都要公開討論，比較慢'), fx: { pop: 7 }, costMul: 1.1, failAdj: { tender: 0.05 } },
    excounty: { emoji: '🧓', name: T('前地方首長'), desc: T('跟議會、里長都熟，什麼都喬得動；喬的方式你不一定想知道'), fx: { council: 8, network: 3 }, events: ['fixer'] },
    scholar: { emoji: '🎓', name: T('學者'), desc: T('專業、有名氣，處理成本低；講話太直，可能哪天回學校'), fx: { pop: 4, trust: -2 }, costMul: 0.75, events: ['scholarquit'] },
    business: { emoji: '💼', name: T('業界經理人'), desc: T('效率高、採購快；媒體會盯利益衝突'), fx: { budget: 3 }, failAdj: { tender: -0.15 }, costMul: 0.85, events: ['conflictnews'] },
    soe: { emoji: '🏦', name: T('公股退休主管'), desc: T('看帳穩、不出錯；很保守，什麼都要「再評估」'), fx: { budget: 4, staff: -2 }, costMul: 0.9, failAdj: { ribbon: 0.05 } },
    holdover: { emoji: '🗂️', name: T('前朝留任'), desc: T('熟門熟路、知道東西放哪；會跟前任「順便報告」'), fx: { staff: 6 }, costMul: 0.9, events: ['holdoverleak'] },
    acting: { emoji: '🪑', name: T('先找人代理'), desc: T('不用花時間找人；但成本 +30%，代理的不敢簽'), costMul: 1.3, failAdj: { budget: 0.05, tender: 0.05 }, events: ['actingsign'] }
  },
  maxPerSrc: { loyal: 1, party: 1 }, // 一次名單裡自己人、黨部推薦最多各一位
  // 人才池：每位一個亮點（✅）＋一個代價（⚠️）；fit 是他最適合的位子（放對位子效果更好）
  // dream：夢幻人選但開條件（cond 會在就任後生效）
  candidates: [
    // 工務
    { id: 'siteboss', src: 'loyal', name: T('競選時的工程顧問阿凱'), pro: T('土木系畢業、跑過工地，市長很信任'), con: T('沒管過上千人的局處'), fit: ['works'] },
    { id: 'techsup', src: 'central', name: T('中央工程會借調的技監'), pro: T('採購法倒背如流，流標率低'), con: T('兩年後要回中央'), fit: ['works', 'metro'] },
    { id: 'peerworks', src: 'peer', name: T('鄰市做出成績的前工務局長'), pro: T('工期抓得準，延宕工程救得回來'), con: T('開口就要帶自己 5 個人進來'), fit: ['works'] },
    { id: 'civilprof', src: 'scholar', name: T('土木系的林教授'), pro: T('結構安全權威，記者會一站出來大家就放心'), con: T('什麼都要再做一次安全鑑定'), fit: ['works', 'sports'] },
    { id: 'builderpm', src: 'business', name: T('營造業的專案經理'), pro: T('看工地一眼就知道哪裡會出事'), con: T('前公司還在接市府的案子'), fit: ['works', 'metro'] },
    { id: 'powerco', src: 'soe', name: T('公營電力公司退休處長'), pro: T('管線、電力、路燈都懂'), con: T('講話像在念規章'), fit: ['works'] },
    { id: 'deputyworks', src: 'holdover', name: T('前朝的工務副局長'), pro: T('前任的工程都是他盯的，最清楚哪裡有坑'), con: T('他自己也是坑的一部分'), fit: ['works'] },
    // 交通、捷運
    { id: 'roadsi', src: 'central', name: T('中央借將的公路局副局長'), pro: T('跟中央交通單位很熟，補助審查快'), con: T('兩年後要回中央'), fit: ['transport'] },
    { id: 'metrochief', src: 'peer', name: T('鄰市做出捷運的前局長'), pro: T('捷運工期抓得準，流標機率低'), con: T('開口就要帶自己 5 個人進來'), fit: ['metro', 'transport'] },
    { id: 'profchen', src: 'scholar', name: T('交通工程的陳教授'), pro: T('上政論節目很會講，專業又有名氣'), con: T('講話太直，議員被他得罪光'), fit: ['transport'] },
    { id: 'partytrans', src: 'party', name: T('黨部推薦的交通委員會前議員'), pro: T('交通預算在議會一路綠燈'), con: T('黨部的地方建設要排第一'), fit: ['transport', 'metro'] },
    { id: 'mobility', src: 'business', name: T('共享運具公司前總經理'), pro: T('懂數據、懂市民怎麼通勤'), con: T('很想把所有東西都做成 App'), fit: ['transport'] },
    { id: 'ngotrans', src: 'ngo', name: T('步行權倡議團體的理事長'), pro: T('人行道和公車的專家，市民很信任'), con: T('跟計程車和停車場業者都處不好'), fit: ['transport'] },
    { id: 'metroold', src: 'holdover', name: T('前朝的捷運局主任秘書'), pro: T('每一個工區的進度都記得'), con: T('延宕的原因也記得，但不太想講'), fit: ['metro'] },
    // 財政
    { id: 'lisi', src: 'central', name: T('中央借將的預算司李司長'), pro: T('懂預算、中央關係好，補助比較好拿'), con: T('兩年後要回中央，一走就斷線'), fit: ['finance'] },
    { id: 'peerfin', src: 'peer', name: T('鄰市還清債務的前財政局長'), pro: T('債務整理是專長，議會也服氣'), con: T('只肯做兩年'), fit: ['finance'] },
    { id: 'profwu', src: 'scholar', name: T('財政學的吳教授'), pro: T('看預算書一眼就知道哪裡有洞'), con: T('看到洞會直接在記者會講出來'), fit: ['finance'] },
    { id: 'bankvp', src: 'soe', name: T('公股銀行退休副總'), pro: T('看帳又快又準，不會出錯'), con: T('很保守，什麼都要「再評估」'), fit: ['finance'] },
    { id: 'exrep', src: 'party', name: T('黨部推薦的前議員'), pro: T('議會預算關卡明顯好過'), con: T('黨部之後會來「關心」標案'), fit: ['finance', 'socialw'] },
    { id: 'depfin', src: 'holdover', name: T('前朝的財政副局長'), pro: T('知道每一筆錢藏在哪個基金'), con: T('有些錢就是他藏的'), fit: ['finance'] },
    // 社福、教育
    { id: 'swngo', src: 'ngo', name: T('長照聯盟的秘書長'), pro: T('第一線最懂長輩要什麼，團體都挺她'), con: T('跟預算單位天天吵'), fit: ['socialw'] },
    { id: 'swcivil', src: 'holdover', name: T('前朝的社會局副局長'), pro: T('每一筆補助的流程都熟'), con: T('前任的加碼政見就是他寫的'), fit: ['socialw'] },
    { id: 'swprof', src: 'scholar', name: T('社工系的黃教授'), pro: T('政策設計很漂亮，媒體很愛訪問'), con: T('沒管過上千人的局處'), fit: ['socialw', 'edu'] },
    { id: 'principal', src: 'excounty', name: T('退休的明星國中校長'), pro: T('校長們都是他的學生，學校都配合'), con: T('習慣用「校長的方式」管局處'), fit: ['edu'] },
    { id: 'edusi', src: 'central', name: T('中央教育部借將的司長'), pro: T('營養午餐補助的規定他最熟'), con: T('兩年後要回中央'), fit: ['edu'] },
    { id: 'foodceo', src: 'business', name: T('連鎖團膳公司前總經理'), pro: T('團膳流標的問題他一看就懂'), con: T('前公司就是投標廠商之一'), fit: ['edu'] },
    // 文化、觀光、體育
    { id: 'curator', src: 'scholar', name: T('美術館前館長'), pro: T('策展一流，閒置空間也救得活'), con: T('預算永遠不夠'), fit: ['culturec'] },
    { id: 'culturengo', src: 'ngo', name: T('藝文團體聯盟的召集人'), pro: T('藝文界都挺她，活動辦得起來'), con: T('什麼都要開公聽會'), fit: ['culturec', 'tourism'] },
    { id: 'cultureold', src: 'holdover', name: T('前朝的文化局主秘'), pro: T('紀念館每個角落都熟'), con: T('紀念館就是他規劃的'), fit: ['culturec'] },
    { id: 'tourceo', src: 'business', name: T('旅遊平台前行銷長'), pro: T('懂網路聲量，活動一辦就爆紅'), con: T('熱潮來得快去得快'), fit: ['tourism'] },
    { id: 'tourparty', src: 'party', name: T('黨部推薦的觀光委員會前議員'), pro: T('觀光預算議會一路綠燈'), con: T('每個活動都要找他的樁腳'), fit: ['tourism', 'sports'] },
    { id: 'peertour', src: 'peer', name: T('鄰市辦過國際活動的前局長'), pro: T('國際活動辦過三次，流程都在他腦子裡'), con: T('要求預算加倍'), fit: ['tourism'] },
    { id: 'athlete', src: 'loyal', name: T('站過台的退役國手'), pro: T('市民超喜歡他，體育界都給面子'), con: T('沒做過行政'), fit: ['sports'] },
    { id: 'sportsci', src: 'scholar', name: T('運動科學的許教授'), pro: T('場館安全和賽事規格都懂'), con: T('講話很學術，記者聽不懂'), fit: ['sports'] },
    { id: 'venueco', src: 'business', name: T('場館營運公司前總經理'), pro: T('知道怎麼讓場館賺錢'), con: T('前公司想標市府的場館'), fit: ['sports'] },
    // 夢幻人選：超強，但開條件
    { id: 'dream_fin', src: 'central', dream: 1, name: T('退休的前財政部次長'), pro: T('全國最懂地方財政的人，補助、債務都搞得定'), con: T('條件：要完全授權，預算的事你和市長都不能插手'), fit: ['finance'], fx: { budget: 10, trust: -6 } },
    { id: 'dream_works', src: 'peer', dream: 1, name: T('國際工程顧問公司的總監'), pro: T('蓋過三座國際機場，什麼工程都救得回來'), con: T('條件：只做兩年，而且要帶自己的團隊'), fit: ['works', 'metro'], fx: { staff: -6 } },
    { id: 'dream_culture', src: 'ngo', dream: 1, name: T('得過國際大獎的導演'), pro: T('名氣超大，辦什麼都有人來'), con: T('條件：只要他想做的計畫，其他都不管'), fit: ['culturec', 'tourism'], fx: { pop: 8, budget: -6 } },
    { id: 'acting1', src: 'acting', name: T('暫代的主任秘書'), pro: T('不用花時間找人'), con: T('「我只是暫代，這個我不敢簽。」') }
  ],


  // 「建議市長」的採納率：看老闆信任和真面目
  adviseChance: g => {
    let p = 0.2 + g.stats.trust * 0.008;
    if (g.trait === 'central' || g.trait === 'showoff') p -= 0.08;
    if (g.trait === 'ear') p -= 0.05;
    return Math.max(0.15, Math.min(0.9, p));
  },
  // ===== 推薦人選：你推薦，市長決定 =====
  // 回傳 { ok, line, pick }：pick 是市長自己想要的人（被你說服不了時用）
  recommend: (g, slot, cand, offer) => {
    const famous = ['scholar', 'ngo', 'central', 'peer'];
    const prefer = { ear: 'party', showoff: null, central: 'holdover', corrupt: 'business', portrait: 'ngo', image: 'ngo', ambition: 'party' }[g.trait] || 'loyal';
    let p = 0.2 + g.stats.trust * 0.008;
    if (g.trait === 'showoff') p += famous.includes(cand.src) || cand.dream ? 0.15 : -0.15;
    else if (cand.src === prefer) p += 0.2; else if (prefer && g.trait && g.trait !== 'good') p -= 0.15;
    const ok = g.rng() < Math.max(0.1, Math.min(0.95, p));
    const pool = offer.filter(c => c.id !== cand.id && c.src !== 'acting');
    // 市長想要的來源：先從這次的人選找，沒有就從人才池「空降」
    const used = Object.values(g.staffers || {});
    const fromPool = src => CAREER_MAYOR_OFFICE.candidates.find(c => c.src === src && !c.dream && !used.includes(c.id) && !offer.some(o => o.id === c.id));
    const pick = pool.find(c => c.src === prefer) || fromPool(prefer) || fromPool('loyal') || pool[0];
    const lines = ok ? [T('「好，就他。」'), T('「嗯……好，聽你的。」'), T('「我也這麼想。」')]
      : g.trait === 'ear' ? [T('「我再想想……其實黨部已經推了一個人，我答應了。」')]
      : g.trait === 'showoff' ? [T('「這個人沒什麼名氣耶，我想找個大家都認識的。」')]
      : g.trait === 'central' ? [T('「我要一個會替我擋子彈的人。」')]
      : [T('「我再想想……其實我已經有人選了。」'), T('「這個位子，我想放自己人。」')];
    return { ok, line: lines[Math.floor(g.rng() * lines.length)], pick };
  },

  // ===== 政見：每張走三步（議會審預算 → 採購發包 → 完工剪綵）；依老闆類型給 =====
  pledgeCount: 3,
  pledgeSteps: [
    { id: 'budget', name: T('議會審預算'), cost: 0, blockedBy: ['G'], failRate: g => Math.max(0.05, (60 - g.stats.council) / 100), failFx: { council: -2 } },
    { id: 'tender', name: T('採購發包'), cost: 8, doubleIf: ['E'], failRate: () => 0.25, failFx: { staff: -2 } },
    { id: 'ribbon', name: T('完工剪綵'), cost: 6, failRate: () => 0.05, failFx: { pop: -2 } }
  ],
  pledges: [
    { id: 'housing', emoji: '🏘️', name: T('社會住宅 3000 戶'), fx: { pop: 5 }, types: ['B', 'C', 'E', 'F'] },
    { id: 'park', emoji: '🌳', name: T('每區一座共融公園'), fx: { pop: 4, staff: 2 }, types: ['A', 'B', 'D'] },
    { id: 'bus', emoji: '🚌', name: T('公車路線大翻新'), fx: { pop: 4, council: 2 }, types: ['B', 'C', 'D', 'F'] },
    { id: 'daycare', emoji: '🧸', name: T('公共托嬰加倍'), fx: { pop: 4 }, types: ['A', 'E', 'F'] },
    { id: 'sidewalk', emoji: '🚶', name: T('人行道還給行人'), fx: { pop: 3, council: 3 }, types: ['B', 'F'] },
    { id: 'expo', emoji: '🎪', name: T('辦一場國際博覽會'), fx: { pop: 4, budget: 4 }, types: ['A', 'C', 'D'] },
    { id: 'startupzone', emoji: '🚀', name: T('打造新創園區'), fx: { pop: 2, budget: 6 }, types: ['C'] },
    { id: 'smartcity', emoji: '📱', name: T('一個 App 辦完所有市政'), fx: { pop: 3, staff: 3 }, types: ['C', 'B'] },
    { id: 'eldercare', emoji: '🧓', name: T('長照據點每里一處'), fx: { pop: 4 }, types: ['A', 'D', 'E'] },
    { id: 'market', emoji: '🥬', name: T('傳統市場大改造'), fx: { pop: 3, council: 2 }, types: ['E', 'F', 'A'] },
    { id: 'opendata', emoji: '🔎', name: T('預算全部上網公開'), fx: { pop: 2, council: 4 }, types: ['F', 'B'] }
  ],
  pledgesFor: type => { const own = CAREER_MAYOR_OFFICE.pledges.filter(p => !type || p.types.includes(type)); return own.length >= 3 ? own : CAREER_MAYOR_OFFICE.pledges; },
  // 每局出現 6～7 份公文：卸任前通過的案子必出；其他從池子抽（連鎖下游跟著上游）
  drawerSubset: (rng, g) => {
    // 你分管的爛攤子一定都在；另外從別人分管的抽 3 份（要靠協調或建議市長）
    const pf = g && g.portfolio ? CAREER_MAYOR_OFFICE.portfolios[g.portfolio].drawer.filter(x => !/^Y/.test(x)) : [];
    const others = ['A', 'B', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'].filter(x => !pf.includes(x)).sort(() => rng() - 0.5).slice(0, 3);
    const ids = [...new Set([...pf, ...others])];
    if (ids.includes('A') && !ids.includes('C')) ids.push('C');
    if (ids.includes('C') && !ids.includes('B') && pf.includes('B')) ids.push('B');
    return ids;
  },
  // 前任的抽屜（每份都對應台灣真實案例的類型；編號見 isekai-studio 的案例清單）
  drawer: [
    { id: 'A', start: 1, look: 1, real: 3, chain: ['C'], fx: { pop: 3, staff: 2 }, case: 'A10', title: T('卸任前一週通過的案子'), text: T('前任卸任前一週，拍板讓市府轉投資公司準備上市。你們上任第一天叫來報告，才發現程序已經跑了一半。') },
    { id: 'C', look: 1, real: 2, chain: ['B'], fx: { council: 3 }, case: '彩蛋', title: T('交接清冊第 287 頁'), text: T('上市案的關鍵文件，移交清冊寫著「詳見附件」。附件不見了。') },
    { id: 'B', look: 1, real: 5, fx: { pop: 3 }, case: 'A12', title: T('綁十年的 LED 路燈合約'), text: T('附件找到了：前任簽了十年的路燈採購加維護。合約寫「亮度不低於 30%」，議員問：「你有聽過跟手機廠商綁十年的嗎？」') },
    { id: 'D', start: 1, look: 3, real: 3, conflict: ['E'], conflictKind: 'cost', fx: { pop: 2 }, case: 'A8', title: T('只剩冷氣在上班的紀念館'), text: T('前任辦博覽會蓋的紀念館，展期結束後幾乎沒人來，每個月電費照付，大家說「只剩冷氣在上班」。') },
    { id: 'E', start: 1, look: 2, real: 4, conflict: ['D'], conflictKind: 'cost', fx: { pop: 3, council: 3 }, case: 'A19', title: T('熱潮退了的天空步道'), text: T('開幕時排隊兩小時，現在沒人來。維修封閉半年，議員拍到工地裡只有一台怪手在睡覺。') },
    { id: 'F', start: 1, look: 2, real: 3, chain: ['G'], conflict: ['H'], conflictKind: 'block', fx: { pop: 3 }, case: 'B17', title: T('選前加碼的敬老金'), text: T('前任選前宣布敬老金加碼，預算書上只編了半年，社福預算一年長了 24%。') },
    { id: 'G', look: 1, real: 5, fx: { council: 8 }, case: 'A13', title: T('改大的工程，差額自己出'), text: T('前任把鐵路高架改成地下化，中央只補原本高架的錢，差額要市府自籌，而且已經發包了。') },
    { id: 'H', start: 1, look: 3, real: 4, conflict: ['F'], conflictKind: 'block', fx: { pop: 3, staff: 4 }, case: 'B16', title: T('免費營養午餐'), text: T('前任宣布國中小午餐全面免費，經費寫「中央補助」。議員問：「中央沒來怎麼辦？」開辦後團膳又流標。') },
    { id: 'I', start: 1, look: 3, real: 5, fx: { pop: 4, council: 2 }, case: 'A2', title: T('蓋一半的巨型場館 BOT'), text: T('前任簽的 BOT 巨型場館蓋到一半停工。解約要賠，續蓋要幫廠商背書，監察院的來函已經在桌上。') },
    { id: 'J', start: 1, look: 2, real: 4, fx: { pop: 3, staff: 2 }, case: 'A7', title: T('趕在卸任前剪綵的體育場'), text: T('前任趕在卸任前剪綵的體育場，啟用第一場比賽就出狀況。關場重做被罵浪費，硬撐被罵不顧安全。') },
    { id: 'K', start: 1, look: 2, real: 5, fx: { budget: 6, pop: 2 }, case: 'A11', title: T('要付分手費的地上權'), text: T('一塊科技園區的地上權已經設給壽險公司。國際大廠想進駐，要先協商解約，分手費是天文數字，議會還沒點頭。') },
    // 任期後段，你們自己長出來的
    { id: 'Y1', own: 1, appearAt: 8, look: 2, real: 4, fx: { pop: 3, council: 2 }, case: 'A16', title: T('你們的捷運延伸線延宕'), text: T('就職時宣布的延伸線，通車前 5 天取消典禮，周邊商品已經在賣了。這次沒有前任可以怪。') },
    { id: 'Y2', own: 1, appearAt: 10, look: 1, real: 3, fx: { council: 4 }, case: 'A9', title: T('改過兩次的社宅數字'), text: T('你們競選時說的社宅戶數，任內改了兩次。記者做了一張對照表。') }
  ],

  // 事件卡：主角是幕僚。上台、受訪、拍板、簽核的是市長或局長；你做的是準備、協調、擬稿、喬、擋。
  // k: 'a' = 💬 建議市長（市長看信任和真面目決定聽不聽）；k: 's' = ✋ 你自己處理
  events: [
    // B1–B3：放了被罵晴天假、沒放被罵拿生命賭；宣布時間也是選項
    { id: 'typhoon', special: 1, title: T('颱風假'), text: T('颱風逼近，風雨還不大。隔壁市說「再觀望」，你打過去電話沒人接。市長在等你的建議。'), opts: [
      { k: 'a', t: T('建議晚上 8 點宣布放假'), fx: { pop: 3, council: -3 }, later: { in: 1, fx: { pop: -3 }, text: T('隔天出大太陽，脆上：「又一個晴天假。」') }, r: T('市長宣布放假，大家提早安排好了。') },
      { k: 'a', t: T('建議照常上班上課'), fx: { council: 3 }, later: { in: 1, fx: { pop: -8 }, text: T('中午風雨突然變大，議員翻出會議紀錄：「誰建議不放的？」') }, r: T('早上風平浪靜。') },
      { k: 'a', t: T('建議等隔壁市一起宣布'), fx: { pop: -4, stress: 4 }, r: T('等到晚上 10 點半，家長在脆上罵翻。') },
      { k: 's', t: T('先發「市長坐鎮」照片穩住'), fx: { pop: 5, stress: -2 }, later: { in: 1, fx: { pop: -7 }, text: T('有人發現「坐鎮」照片是去年拍的。') }, r: T('照片很有氣勢，脆上一片「辛苦了」。') }] },
    // 總質詢：上台的是市長和局長（議會定期會）
    { id: 'interpellation', special: 1, title: T('議會總質詢'), text: T('反對黨議員拿著前任的預算書，總質詢要市長「解釋清楚」。明天就上場了。'), opts: [
      { k: 's', t: T('叫局處熬夜整理備詢資料'), fx: { council: 6, staff: -5, stress: 3 }, r: T('市長逐條回答，議員翻了三頁就放棄了。') },
      { k: 'a', t: T('建議口徑：「這是前任的事，我們會檢討」'), fx: (g, late) => late ? { council: -6 } : { pop: 3 }, r: T('市長照你的稿念，議員愣了三秒：「又是前任？」') },
      { k: 's', t: T('會前先去找那位議員私下溝通'), fx: { network: 5, council: 3, integrity: -2 }, later: { in: 2, fx: { pop: -3 }, text: T('記者寫：「副市長質詢前密會議員。」') }, r: T('質詢時，議員的語氣溫和了很多。') },
      { k: 'a', t: T('建議讓局長上台擋，市長只講開場'), fx: { trust: 3, staff: -4 }, r: T('局長在台上被罵了一小時，下台後看了你一眼。') },
      { k: 's', t: T('你列席，替市長補充說明'), fx: g => g.flags.absent ? { council: 4, succession: 4, stress: 5 } : { council: 2, succession: 2, stress: 4 }, r: g => g.flags.absent ? T('市長請假，你代理答詢。議員：「代理的能回答預算嗎？」你答得很穩。') : T('市長點名讓你補充，議員記住了你的名字。') }] },
    // 發財樹：只當彩蛋
    { id: 'plant', special: 1, title: T('發財樹之謎'), text: T('市長室角落有一盆前任留下的巨大發財樹，秘書長說：「不能搬，會倒楣。」'), opts: [
      { k: 's', t: T('留著'), fx: { staff: 3 }, r: T('大家鬆了一口氣。') },
      { k: 's', t: T('搬走'), fx: { staff: -5 }, r: T('隔天影印機壞了，大家都說是發財樹的關係。') }] },
    // A17：一個局處 12 隻、全市 40 多隻，議員舉牌考市長
    { id: 'mascots', title: T('吉祥物大考驗'), text: T('全市各局處加起來有 40 多隻吉祥物，光一個局處就有 12 隻。議員在質詢台上舉起牌子：「市長，這隻叫什麼名字？」市長答不出來。'), opts: [
      { k: 'a', t: T('建議辦票選，只留一隻代表'), fx: { pop: 5, staff: -2 }, r: T('落選的局處很不爽，說它們的比較可愛。') },
      { k: 'a', t: T('建議退役的捐給幼兒園'), fx: { pop: 3, budget: 2 }, r: T('小朋友很開心，倉庫也空了。') },
      { k: 's', t: T('連夜做小抄讓市長背'), fx: { trust: 3, stress: 5, pop: 1 }, r: T('第二天議員又舉了一隻，是新做的。') },
      { k: 's', t: T('安排吉祥物見面會收門票'), fx: { budget: 6, pop: 2 }, later: { in: 2, fx: { pop: -5, council: -3 }, text: T('議員質詢：「吉祥物是市府財產，收的門票去哪了？」') }, r: T('來了好多小朋友，收入不錯。') }] },
    // A16：通車前 5 天取消典禮，周邊商品已在賣
    { id: 'metro', title: T('通車典禮要不要取消'), text: T('新線預定下週通車，紀念票卡、公仔都已經在賣了。工程單位私下跟你說：測試還沒過。'), opts: [
      { k: 'a', t: T('建議市長通車前宣布延期'), fx: { pop: -4, council: 3 }, r: T('紀念商品變成收藏品，價格反而漲了。') },
      { k: 'a', t: T('建議照原日期「試營運」'), fx: { pop: 3 }, later: { in: 1, fx: { pop: -8 }, text: T('試營運第一天停駛兩次。') }, r: T('剪綵很熱鬧。') },
      { k: 's', t: T('先不往上報，讓工程單位再拚'), fx: { stress: 4, integrity: -4 }, later: { in: 1, fx: { trust: -6, pop: -4 }, text: T('市長從新聞才知道測試沒過：「你為什麼沒跟我說？」') }, r: T('工程單位說會盡力。') }] },
    // B15：踢皮球的不只是市府局處
    { id: 'stamps', title: T('公文踢皮球'), text: T('人行道上一根廢棄的電線桿要拆。電力公司說不是他們的、電信公司說不是他們的、有線電視說要查、路燈科說要會辦、區公所說要先問里長。公文跑了兩個月，陳情信寄到市長室。'), opts: [
      { k: 's', t: T('把五個單位叫來當面喬'), fx: { staff: -4, pop: 3, stress: 4 }, r: T('開了兩小時會，查出來是一家早就倒閉的有線電視公司的。') },
      { k: 'a', t: T('建議市長下令：會辦超過 7 天要說明'), fx: { staff: -6, pop: 4 }, r: T('秘書長說：「上一個這樣做的人……」然後沒說完。') },
      { k: 's', t: T('打給工務局：先拆再說'), fx: { pop: 5, integrity: -3 }, later: { in: 2, fx: { budget: -6, council: -3 }, text: T('電信公司來函：那根桿子上其實還有一條在用的線。') }, r: T('一個下午就拆掉了，里長很開心。') },
      { k: 's', t: T('回信說「已轉相關單位」'), fx: { pop: -3 }, r: T('里長在臉書上幫電線桿慶生。') }] },
    { id: 'ribbon', title: T('里長要市長來剪綵'), text: T('里長打來：「新的路燈裝好了，市長一定要來剪綵！」只有一支路燈。市長沒空，問你怎麼辦。'), opts: [
      { k: 'a', t: T('建議市長抽空去'), fx: { pop: 3, stress: 2 }, r: T('剪綵比路燈還亮。') },
      { k: 's', t: T('婉拒，改寄賀卡'), fx: { pop: -3 }, r: T('里長在地方群組抱怨了三天。') },
      { k: 's', t: T('你代表市長去'), fx: { pop: 1, stress: 3, succession: 1 }, r: T('里長：「你是哪一位副市長？」') },
      { k: 's', t: T('找同黨議員一起剪、順便拉票'), fx: { council: 4, network: 3, integrity: -3 }, later: { in: 2, fx: { pop: -4 }, text: T('脆上：「一支路燈剪三次綵？」') }, r: T('剪綵變成小型造勢，議員很滿意。') }] },
    { id: 'prevcall', title: T('前任來電'), text: T('前任市長打給你「關心」：「那個紀念館，其實當初是有規劃的啦。」'), opts: [
      { k: 's', t: T('客氣聽完，請教當初的規劃'), fx: { council: 3, stress: 3 }, r: T('聽了 47 分鐘，規劃是一張餐巾紙。') },
      { k: 's', t: T('轉給秘書長'), fx: { staff: -2 }, r: T('秘書長跟前任聊得比你還開心。') },
      { k: 'a', t: T('建議市長公開說「謝謝前任留下的驚喜」'), fx: (g, late) => late ? { pop: -4, council: -2 } : { pop: 4, council: -4 }, r: T('脆上分成兩派吵了一整天。') },
      { k: 's', t: T('把通話內容透露給記者'), fx: { pop: 3, integrity: -5 }, later: { in: 2, fx: { council: -5, trust: -3 }, text: T('前任在臉書上說：「私人電話也拿出來講？」') }, r: T('新聞標題很好看。') }] },
    // B4：兩種颱風公告同時發出去
    { id: 'social', title: T('兩種公告同時發出去'), text: T('市府粉專同時發了「明天照常上班」和「明天停班停課」兩篇公告，已經被截圖了。小編在群組裡發抖。'), opts: [
      { k: 's', t: T('立刻刪錯的那篇、發道歉'), fx: { pop: -2, staff: -2 }, r: T('道歉文的讚比原文還多。') },
      { k: 'a', t: T('建議市長自嘲：「小編也想放假」'), fx: { pop: 4, trust: -2 }, r: T('網友覺得很好笑，市長覺得還好。') },
      { k: 's', t: T('對外說是外包廠商發錯的'), fx: { pop: 1, staff: -4 }, later: { in: 2, fx: { pop: -4 }, text: T('外包廠商在脆上貼出市府給的發文指示。') }, r: T('暫時沒事了。') }] },
    // A20：只有效果圖的競選支票
    { id: 'bigidea', title: T('只有效果圖的摩天輪'), text: T('市長想兌現選前跟著喊的「濱河摩天輪」。你查了才發現：土地不是市府的、沒有廠商提過計畫，全部只有一張效果圖。'), opts: [
      { k: 's', t: T('把查到的照實跟市長報告'), fx: { trust: -4, budget: 3 }, r: T('市長沉默了很久：「那先別提了。」') },
      { k: 'a', t: T('建議先編可行性評估'), fx: { budget: -6, pop: 2 }, r: T('評估報告寫了 300 頁，結論是「需要再評估」。') },
      { k: 's', t: T('「市長說得對！」再請人畫一張'), fx: { trust: 5, pop: 3 }, later: { in: 3, fx: { pop: -6, council: -4 }, text: T('記者問市長：「摩天輪的地在哪？」') }, r: T('新的效果圖比舊的還漂亮。') }] },
    // 人選來源帶進來的事件（選了才會出現）
    { id: 'partycall', special: 1, title: T('黨部來「關心」'), text: T('黨部打電話給你：「下個月那個標案，我們有個朋友的公司很不錯，你們參考一下。」'), opts: [
      { k: 's', t: T('「好，我們會依法辦理」'), fx: { council: 2, staff: -2 }, r: T('黨部聽懂了，有點不開心。') },
      { k: 's', t: T('把電話內容寫進公文紀錄'), fx: { council: -6, staff: 4, integrity: 3 }, r: T('政風處長點頭。黨部說你「不懂事」。') },
      { k: 's', t: T('含糊帶過'), fx: { council: 4, network: 3, integrity: -4 }, later: { in: 3, fx: { pop: -5 }, text: T('那家公司真的得標了，記者正在查。') }, r: T('三天後，那家公司真的來投標了。') }] },
    { id: 'scholarquit', special: 1, title: T('局長「回學校了」'), text: T('學者局長在議會被罵了一個下午，晚上傳訊息給你：「我覺得我還是比較適合教書。」'), opts: [
      { k: 's', t: T('約他吃飯，好好慰留'), fx: { staff: 2, stress: 3 }, r: T('他答應再撐三個月，但開會時一直看手錶。') },
      { k: 'a', t: T('建議市長尊重他，找人代理'), fx: g => { const k = Object.keys(g.cabinet).find(x => g.cabinet[x] === 'scholar'); if (k) g.cabinet[k] = 'acting'; return { pop: -4 }; }, r: T('記者寫：「新市府首位閣員請辭」。') },
      { k: 'a', t: T('建議市長公開挺他'), fx: { pop: 3, council: -4 }, r: T('議員說市長「護短」。') },
      { k: 's', t: T('放消息說他是被議會逼走的'), fx: { pop: 4, integrity: -4 }, later: { in: 2, fx: { council: -7 }, text: T('議員查到消息是市長室放的。') }, r: T('脆上同情學者局長，一起罵議會。') }] },
    { id: 'holdoverleak', special: 1, title: T('順便報告'), text: T('你發現前朝留任的局長，每週都跟前任吃一次飯，「順便報告」市府的事。'), opts: [
      { k: 's', t: T('私下跟他談清楚'), fx: { staff: -2, stress: 2 }, r: T('他說：「我只是去關心老長官。」之後吃飯改成兩週一次。') },
      { k: 'a', t: T('建議市長把他調離核心'), fx: { staff: -6, council: -2 }, r: T('局處裡開始流傳「新市府在清算」。') },
      { k: 's', t: T('算了，他做事還是很好用'), fx: { pop: -3 }, r: T('隔週前任在臉書上，精準評論了你們還沒公布的計畫。') },
      { k: 's', t: T('故意讓他帶假消息回去'), fx: { network: 3, integrity: -3 }, later: { in: 2, fx: { staff: -4 }, text: T('局長發現自己被利用了，局處開始互不信任。') }, r: T('前任在臉書上評論了一個不存在的計畫。') }] },
    { id: 'conflictnews', special: 1, title: T('利益衝突？'), text: T('記者發現，業界出身的局長以前的公司，正在投標市府的案子。記者打來市長室要回應。'), opts: [
      { k: 'a', t: T('建議市長要求他公開迴避'), fx: { pop: 3, staff: -2 }, r: T('他迴避了，標案延後兩週。') },
      { k: 's', t: T('回應記者：「這是合法的」'), fx: { pop: -6, council: -3 }, r: T('合法，但脆上不買單。') },
      { k: 's', t: T('主動公開所有往來紀錄'), fx: { pop: 4, budget: -2, stress: 3 }, r: T('攤開來之後，反而沒什麼好吵的。') }] },
    { id: 'actingsign', special: 1, title: T('代理的不敢簽'), text: T('代理局長把三份公文送回市長室：「這個我只是代理，不敢簽，要不要等正式的局長？」'), opts: [
      { k: 's', t: T('你盯著他，一頁一頁簽'), fx: { staff: -3, stress: 4 }, r: T('他簽了，但每一頁都寫「奉市長室指示」。') },
      { k: 'a', t: T('建議市長趕快找正式人選'), fx: { budget: -3 }, r: T('獵人頭找了三週，終於找到人。') },
      { k: 's', t: T('先放著'), fx: { pop: -3 }, r: T('公文開始旅行。') }] },

    // ===== 老闆的真面目（中段才露出來；你只能勸、擋、裝沒看到或離開）=====
    { id: 'tr_showoff_hint', special: 1, title: T('白板上的塔'), text: T('開完會，市長在白板上畫了一座塔，旁邊寫「N 城之眼」。'), opts: [
      { k: 's', t: T('幫他拍下來'), fx: { trust: 2 }, r: T('市長很開心：「你也覺得很棒對吧？」') },
      { k: 's', t: T('默默擦掉'), fx: { trust: -2 }, r: T('隔天白板上又出現了，這次還有尺寸。') }] },
    { id: 'tr_showoff', special: 1, title: T('老闆的真面目：好大喜功'), text: T('市長要用預備金蓋「N 城之眼」地標，記者會已經訂好了。抽屜裡的爛攤子還沒收完。'), opts: [
      { k: 's', t: T('幫他找錢、擬記者會稿'), fx: { budget: -15, pop: 4, trust: 5 }, r: T('地標的模型很漂亮，預算表很難看。') },
      { k: 's', t: T('勸他先把政見做完'), fx: { trust: -6, council: 3 }, r: T('市長沉默很久：「好，那先做小一點的。」') },
      { k: 's', t: T('裝沒看到'), fx: { budget: -8, council: -6 }, r: T('議會發現預備金少了一大塊。') }] },
    { id: 'tr_ambition_hint', special: 1, title: T('全國行程'), text: T('市長這週去了三個外縣市，說是「交流」。市政會議要你代為主持。'), opts: [
      { k: 's', t: T('幫他把市政會議主持好'), fx: { trust: 2, staff: -2, succession: 2 }, r: T('局長們開始先來問你。') },
      { k: 's', t: T('問他在忙什麼'), fx: { trust: -1 }, r: T('「格局要大一點。」他說。') }] },
    { id: 'tr_ambition', special: 1, title: T('老闆的真面目：一心想選更大的位子'), text: T('市長開始上全國性的政論節目，市政會議連續三次請假。局處首長來問你：「市長到底還管不管市政？」'), opts: [
      { k: 's', t: T('幫他打理全國行程'), fx: { trust: 6, staff: -6 }, r: T('市長的聲量越來越大，市府越來越安靜。') },
      { k: 's', t: T('勸他先把城市顧好'), fx: { trust: -6, staff: 5 }, r: T('他回來開會了，但一直在看手機。') },
      { k: 's', t: T('裝沒看到'), fx: g => { g.flags.absent = 1; return { staff: -4 }; }, r: T('之後很多公文都要等市長「回國」。') }] },
    { id: 'tr_ear_hint', special: 1, title: T('顧問的電話'), text: T('一位你沒見過的「市長的顧問」打電話給工務局長，要他「先停一下」。'), opts: [
      { k: 's', t: T('問市長這是誰'), fx: { trust: -1 }, r: T('「喔，他是我的好朋友，很有想法。」') },
      { k: 's', t: T('先觀察'), fx: {}, r: T('隔週，顧問又打給了財政局長。') }] },
    { id: 'tr_ear', special: 1, title: T('老闆的真面目：耳根軟'), text: T('那位顧問現在直接指揮局長了。市長說：「他講的也有道理啊。」'), opts: [
      { k: 's', t: T('替市長把顧問擋在門外'), fx: { trust: -4, staff: 6 }, r: T('局長們鬆了一口氣，顧問在臉書上酸你。') },
      { k: 's', t: T('勸市長收回授權'), fx: { trust: -3, council: 2 }, r: T('市長想了一晚，答應了。') },
      { k: 's', t: T('裝沒看到'), fx: { staff: -8, council: -3 }, r: T('局處開始不知道該聽誰的。') }] },
    { id: 'tr_image_hint', special: 1, title: T('百萬觀看'), text: T('市長的短影音破百萬觀看，到處送溫暖、跟長輩跳舞。他桌上的公文堆了三疊。'), opts: [
      { k: 's', t: T('幫他再企劃一支'), fx: { pop: 3, staff: -2 }, r: T('第二支也破百萬了。公文變成四疊。') },
      { k: 's', t: T('把最急的三份放最上面'), fx: { staff: 1 }, r: T('他把它們移到旁邊，拍了一支「深夜批公文」的影片。') }] },
    { id: 'tr_image', special: 1, title: T('老闆的真面目：網路聲量王'), text: T('局處首長一個一個私下來找你：「市長都不批，副市長可不可以幫忙簽？」市長正在錄下一支影片。'), opts: [
      { k: 's', t: T('幫他簽（代批）'), fx: g => { g.flags.proxy = 1; return { staff: 6, trust: -4, integrity: -6 }; }, r: T('事情終於動了。但你知道，這些公文上面不是你的名字該在的地方。') },
      { k: 's', t: T('勸他每天撥一小時批公文'), fx: g => { g.flags.imageFixed = 1; return { trust: -6, staff: 3 }; }, r: T('他答應了，第一天就批了 40 份，還拍成影片。') },
      { k: 's', t: T('裝沒看到'), fx: { pop: 4, staff: -6 }, r: T('民調很高，公文很多。') },
      { k: 's', t: T('遞辭呈'), fx: g => { g.flags.quit = 1; return {}; }, r: T('你把識別證放在他桌上，壓在公文最上面。') }] },
    { id: 'tr_corrupt_hint', special: 1, title: T('一盒高級茶葉'), text: T('市長辦公室多了一盒高級茶葉，卡片上寫著某家工程公司的名字。'), opts: [
      { k: 's', t: T('照規定登錄、退回'), fx: { trust: -2 }, r: T('市長說：「這麼小的事也要登錄？」') },
      { k: 's', t: T('先放著'), fx: g => { g.flags.tea = 1; return {}; }, r: T('茶葉被拆開了。') }] },
    { id: 'tr_corrupt', special: 1, title: T('老闆的真面目：跟廠商走太近'), text: T('你發現市長私下跟正在投標市府工程的廠商吃飯，還收了禮。他拍拍你的肩：「這是交朋友，你懂的。」'), opts: [
      { k: 's', t: T('幫忙擋下來'), fx: g => { g.flags.complicit = 1; return { trust: 8 }; }, r: T('你把餐敘從行程表上刪掉了。你知道這不是小事。') },
      { k: 's', t: T('勸他收手、把禮退回'), fx: g => { if (g.rng() < 0.6) g.flags.reformed = 1; else g.flags.blind = 1; return { trust: -8 }; }, r: g => g.flags.reformed ? T('他沉默很久，把禮退回去了。') : T('他說「好好好」，但你不確定他有沒有聽進去。') },
      { k: 's', t: T('裝沒看到'), fx: g => { g.flags.blind = 1; return {}; }, r: T('你告訴自己：這不是我的事。') },
      { k: 's', t: T('遞辭呈'), fx: g => { g.flags.quit = 1; return {}; }, r: T('你收拾好抽屜，第一次覺得前任也許也有說不出口的事。') },
      { k: 's', t: T('交給政風處'), fx: g => { g.flags.whistle = 1; return { trust: -40, council: 6, staff: 4 }; }, r: T('政風處長收下資料，看了你一眼：「你確定？」你確定。') }] },
    { id: 'tr_central_hint', special: 1, title: T('「這是中央的責任」'), text: T('記者問捷運為什麼延宕，市長回答：「這是中央的責任。」記者問營養午餐，市長也這樣回答。'), opts: [
      { k: 's', t: T('準備市府自己的說法給他'), fx: { stress: 2 }, r: T('市長說：「不用，中央的就是中央的。」') },
      { k: 's', t: T('先觀察'), fx: {}, r: T('第三題，市長還是這樣回答。') }] },
    { id: 'tr_central', special: 1, title: T('老闆的真面目：什麼都是中央的錯'), text: T('市長要你發新聞稿「請中央出來負責」，但那件事其實是市府自己的權責。他也不打算更正。'), opts: [
      { k: 's', t: T('照他的意思寫好新聞稿'), fx: { pop: 4, council: -6, trust: 4 }, r: T('支持者很爽，中央和議會都不爽。') },
      { k: 's', t: T('勸他承認是市府的事'), fx: { trust: -6, council: 5 }, r: T('他臉很臭地說：「好啦，這次我們處理。」') },
      { k: 's', t: T('裝沒看到'), fx: g => { g.flags.centralBlind = 1; return { pop: 2 }; }, r: T('之後每件事都是中央的錯。') }] },
    { id: 'tr_portrait_hint', special: 1, title: T('路燈旗又是市長的臉'), text: T('新的路燈旗又全是市長的大頭照。局長說：「請藝人代言要 200 萬，請市長不用錢。」'), opts: [
      { k: 's', t: T('照做'), fx: { pop: 1, staff: -2 }, r: T('小編默默嘆氣。') },
      { k: 's', t: T('請設計把臉縮小一點'), fx: { trust: -2 }, r: T('市長發現了：「怎麼變小了？」') },
      { k: 's', t: T('偷偷換成吉祥物'), fx: { trust: -4, pop: 3 }, r: T('脆上說吉祥物比較可愛。') }] },
    { id: 'tr_portrait', special: 1, title: T('老闆的真面目：哪裡都要有我的臉'), text: T('垃圾車貼紙、公車站牌、路燈旗，全部換上市長的大頭照。宣傳預算越編越多，議員質詢：「這是市政宣導還是個人宣傳？」'), opts: [
      { k: 's', t: T('幫他擬答詢稿辯護'), fx: { council: -6, budget: -6, trust: 4 }, r: T('脆上梗圖洗版：「打開冰箱也看到市長」。') },
      { k: 's', t: T('勸他把錢拿去做政見'), fx: g => { g.flags.portraitFixed = 1; return { trust: -6, budget: 6 }; }, r: T('他答應了，但要求政見完工時要有他的臉。') },
      { k: 's', t: T('裝沒看到'), fx: { budget: -8, pop: -3 }, r: T('連防災手冊封面都是他。') }] },

    // ===== 固定回合的季節事件 =====
    { id: 'lunarny', special: 1, title: T('春節發紅包'), text: T('過年了，市長要去市場發紅包，要你帶著分管的局處一起陪同。抽屜裡的公文還在等。'), opts: [
      { k: 's', t: T('排滿：全員陪同'), fx: { pop: 5, staff: -4, stress: 3 }, r: T('排隊排到巷口，公文排到明年。') },
      { k: 's', t: T('只排半天，局處留一半人'), fx: { pop: 2, staff: 2 }, r: T('值班的同事收到市長的紅包，很感動。') },
      { k: 'a', t: T('建議市長只發橘子不發紅包'), fx: { pop: -2, budget: 3 }, r: T('脆上：「新市長很節省？」') },
      { k: 's', t: T('排成拍完照就走'), fx: { pop: 4, stress: -3 }, later: { in: 2, fx: { pop: -5 }, text: T('攤商在電視上說：「市長拍完照就走了，紅包是秘書發的。」') }, r: T('照片很溫馨，十分鐘就收工。') }] },
    { id: 'budgetseason', special: 1, title: T('預算季：議會審總預算'), text: T('議會開始審明年的總預算，每個議員都有想要的東西。財政局長問你：「市長那邊怎麼說？」'), opts: [
      { k: 's', t: T('你逐一拜會議員'), fx: { council: 8, stress: 5, network: 3 }, r: T('你喝了 27 杯茶，記住了 27 個路燈的位置。') },
      { k: 'a', t: T('建議市長公開預算、讓市民一起看'), fx: { pop: 5, council: -4 }, r: T('議員很不高興，但市民很高興。') },
      { k: 'a', t: T('建議市長主動先刪自己的預算'), fx: { council: 4, budget: -6 }, r: T('議會刪不到東西，有點錯愕。') },
      { k: 's', t: T('私下答應議員的地方建設'), fx: { council: 12, network: 4, integrity: -4 }, later: { in: 2, fx: { budget: -12, pop: -2 }, text: T('答應議員的 27 個地方建設，帳單一起來了。') }, r: T('預算一刀未刪，全數通過。') }] },
    { id: 'anniversary', special: 1, title: T('跨年＋就職一週年'), text: T('跨年晚會要辦嗎？市長想順便慶祝就職一週年，要你拿出企劃。'), opts: [
      { k: 'a', t: T('建議辦大的'), fx: { pop: 6, budget: -10 }, r: T('煙火很美，帳單很長。') },
      { k: 'a', t: T('建議低調辦，錢拿去做政見'), fx: { pop: -2, budget: 4 }, r: T('脆上：「今年跨年怎麼這麼安靜？」') },
      { k: 's', t: T('找電視台合辦，換曝光'), fx: { pop: 3, council: -2 }, r: T('主持人把市長名字唸錯了兩次。') }] },
    { id: 'midterm', special: 1, title: T('第三年：期中考'), text: T('議員選舉到了，同黨議員都要市長站台，也希望副市長們一起去；媒體開始公布施政滿意度。'), opts: [
      { k: 's', t: T('你也跑遍站台'), fx: { council: 6, staff: -4, pop: -2, stress: 6, succession: 3 }, r: T('站了 32 場台，市政會議改成視訊。') },
      { k: 'a', t: T('建議市長專心市政，不站台'), fx: { council: -6, pop: 3, staff: 3 }, r: T('同黨議員說市府「不挺自己人」。') },
      { k: 's', t: T('把政績整理成文宣'), fx: g => ({ pop: g.pledges.filter(p => p.done).length * 3 - 2 }), r: T('成績單有多厚，文宣就有多厚。') },
      { k: 's', t: T('用市府活動幫同黨議員曝光'), fx: { council: 8, integrity: -5 }, later: { in: 1, fx: { pop: -5 }, text: T('記者質疑市府活動「行政不中立」。') }, r: T('議員們很滿意。') }] },
    { id: 'preelect', special: 1, title: T('選前半年'), text: T('離連任選舉剩半年，市長問你：「我們還有什麼可以剪綵的？」'), opts: [
      { k: 's', t: T('叫局處趕工，先剪再說'), fx: { pop: 5, staff: -6 }, r: T('剪綵剪到一半，工地還在施工。') },
      { k: 'a', t: T('建議先把抽屜收乾淨'), fx: { council: 4, trust: -3 }, r: T('市長覺得你太保守，但沒說不行。') },
      { k: 'a', t: T('建議開始拍連任影片'), fx: { pop: 3, budget: -4 }, r: T('影片很感人，留言問「那個捷運呢？」') }] },
    { id: 'scapegoat', special: 1, title: T('出包了，誰來揹？'), text: g => g.trait === 'central' ? T('事情出包上了新聞。市長說：「這明明是中央的問題。不然……你找個人處理一下。」') : T('事情出包上了新聞，市長把你叫進辦公室：「要有人出來負責。」'), opts: [
      { k: 's', t: T('推給承辦科長'), fx: { staff: -10, pop: 2, integrity: -3 }, r: T('科長被記過。隔天匿名爆料信寄到了議會。') },
      { k: 'a', t: T('建議讓局長請辭'), fx: g => { const k = Object.keys(g.cabinet).find(x => g.cabinet[x] !== 'acting'); if (k) g.cabinet[k] = 'acting'; return { pop: 3, staff: -3 }; }, r: T('局長請辭了。那個位子現在是代理。') },
      { k: 's', t: T('口徑寫成「前任留下的」'), fx: (g, late) => late ? { pop: -8 } : { pop: 4 }, r: g => g.turn >= 5 ? T('「都幾年了還怪前任？」') : T('大家點頭：「又是前任。」') },
      { k: 's', t: T('口徑寫成「中央的責任」'), fx: { council: -4, pop: 2 }, r: T('中央回覆：已讀。') },
      { k: 's', t: T('你自己扛'), fx: { trust: 6, pop: -5, stress: 5 }, r: T('你替市長出面說明。市長在後台拍拍你的肩。') }] },
    // ===== 另外兩位副市長：同事兼對手 =====
    { id: 'rival_credit', title: T('功勞是誰的？'), text: g => T('{0}在記者會上，把你督導完成的案子講成他的成果，市長在旁邊點頭。', CAREER_MAYOR_OFFICE.rivals[0].name), opts: [
      { k: 's', t: T('私下跟他講清楚'), fx: { stress: 3, succession: 1 }, r: T('他笑笑：「大家都是一個團隊嘛。」') },
      { k: 'a', t: T('建議市長在會議上點名感謝你的局處'), fx: { succession: 4, trust: -2 }, r: T('市長照做了，但看了你一眼：「你很在意這個喔？」') },
      { k: 's', t: T('算了，功勞給他'), fx: { trust: 3, succession: -4 }, r: T('市長私下說：「我知道是你做的。」') },
      { k: 's', t: T('放消息給記者，說是你推動的'), fx: { succession: 6, integrity: -3 }, later: { in: 2, fx: { trust: -5 }, text: T('市長看到新聞：「副市長之間不要在媒體上搶。」') }, r: T('隔天報紙的標題寫了你的名字。') }] },
    { id: 'rival_blame', title: T('責任是誰的？'), text: g => T('一件跨局處的案子出包了。{0}在市政會議上說：「這是分工的問題，我建議由負責的副市長說明。」大家都看向你。', CAREER_MAYOR_OFFICE.rivals[1].name), opts: [
      { k: 's', t: T('拿出會議紀錄，說清楚分工'), fx: { stress: 4, succession: 2 }, r: T('會議紀錄寫得很清楚，林副市長沒再說話。') },
      { k: 's', t: T('你扛下來'), fx: { trust: 4, succession: -3, stress: 3 }, r: T('市長會後拍拍你的肩。') },
      { k: 'a', t: T('建議市長成立專案小組，誰都不追究'), fx: { staff: -3, pop: -2 }, r: T('專案小組開了三次會，結論是「加強橫向聯繫」。') }] },
    { id: 'neighborinvite', title: T('黨部邀你去鄰市參選'), text: T('黨部派人來找你：鄰市明年選市長，黨內缺人，你的聲望剛好。「現在辭職去準備，還來得及。」'), opts: [
      { k: 's', t: T('婉拒，留下來把事做完'), fx: { trust: 5, network: -3 }, r: T('市長知道之後，對你多了一份信任。') },
      { k: 's', t: T('說要考慮一下'), fx: { network: 4, trust: -3 }, r: T('消息傳出去了，市長問你：「你要走嗎？」') },
      { k: 's', t: T('答應，辭職去鄰市參選'), fx: g => { g.flags.neighbor = 1; g.flags.quit = 1; return {}; }, r: T('你交出副市長的印信，坐上往鄰市的高鐵。') }] },
    // B12：市府 App 發券 3 秒當機
    { id: 'app', title: T('發券 App 當機了'), text: T('市府 App 開放領消費券，開放 3 秒就當機，脆上一片罵聲。資訊局長在線上等你的指示。'), opts: [
      { k: 'a', t: T('建議延長領取期、改成抽籤'), fx: { pop: 2, staff: -3, budget: -3 }, r: T('慢，但公平。') },
      { k: 'a', t: T('建議市長親自道歉'), fx: { pop: 3, trust: -2 }, r: T('道歉影片的觀看數比 App 下載數還高。') },
      { k: 's', t: T('發新聞稿說是駭客攻擊'), fx: { pop: 2 }, later: { in: 2, fx: { pop: -6, integrity: -4 }, text: T('資安專家在脆上說：「那不是攻擊，是流量。」') }, r: T('脆上開始同情市府。') }] },
    // B13：陳情專線什麼都要結案
    { id: 'petition', title: T('陳情專線的結案率'), text: T('陳情專線的結案率 99%，但市民說：「打去說路燈壞了，他們回『已轉相關單位』就結案了。」報表在你桌上。'), opts: [
      { k: 'a', t: T('建議改成真的修好才算結案'), fx: { pop: 4, staff: -6 }, r: T('結案率掉到 60%，但路燈真的亮了。') },
      { k: 's', t: T('結案率照報，先不動'), fx: { staff: 3 }, later: { in: 2, fx: { pop: -5 }, text: T('記者實測打了 10 通陳情，只有 2 件真的有處理。') }, r: T('數字很漂亮。') },
      { k: 's', t: T('挑幾件敏感陳情，你親自追'), fx: { pop: 2, stress: 5, network: 2 }, r: T('里長們開始直接打你的手機。') }] },
    // B22：免費借場地辦演唱會
    { id: 'concert', title: T('場租 0 元的演唱會'), text: T('有人申請免費借市府場地辦演唱會，說是「公益性質」。門票一張 3800。主辦單位先來拜訪你。'), opts: [
      { k: 's', t: T('照前例放行'), fx: { network: 4, council: -2 }, later: { in: 2, fx: { pop: -5 }, text: T('記者算出這場演唱會的場租應該是多少。') }, r: T('主辦單位很感謝。') },
      { k: 's', t: T('請局處照規定收場租'), fx: { budget: 4, network: -4 }, r: T('主辦單位說市府「不支持藝文」。') },
      { k: 'a', t: T('建議要求撥一成門票給弱勢學生'), fx: { pop: 4, network: -2, stress: 2 }, r: T('談了三週，談成了。') }] },
    // B10、B11：議會拒審、刪預算、要不要覆議
    { id: 'budgetcut', title: T('議會刪了 30 億'), text: T('市府一封公文用字惹毛議會，議會散會、拒審總預算，最後刪了 30 億。'), opts: [
      { k: 'a', t: T('建議市長提覆議'), fx: g => ({ council: g.council === 'minority' ? -6 : 3, stress: 5 }), r: g => g.council === 'minority' ? T('朝小野大，覆議沒過，議會更火了。') : T('覆議過了，砍掉的預算回來一半。') },
      { k: 'a', t: T('建議市長道歉、重新協商'), fx: { council: 5, budget: -8, trust: -2 }, r: T('議長收下道歉，預算回來一部分。') },
      { k: 's', t: T('幫市長擬「議會杯葛」記者會稿'), fx: { pop: 4, council: -10 }, r: T('支持者很爽，議會更火。') },
      { k: 's', t: T('私下答應幾位議員的地方建設'), fx: { council: 10, integrity: -6, network: 3 }, later: { in: 2, fx: { budget: -10 }, text: T('答應的地方建設帳單來了。') }, r: T('預算神奇地回來了。') }] },
    // C3：小內閣名單分批公布，媒體做派系拼圖
    { id: 'cabinetpuzzle', special: 1, title: T('內閣派系拼圖'), text: T('小內閣名單分批公布，每公布一批，媒體就做一次派系拼圖：誰是黨部的、誰是市長的、誰是前朝的。'), opts: [
      { k: 's', t: T('整理每個人的專業經歷發給媒體'), fx: { pop: 3, stress: 2 }, r: T('拼圖變成履歷表，熱度下降了。') },
      { k: 'a', t: T('建議市長不回應'), fx: { pop: -2 }, r: T('拼圖被轉貼了 3 萬次。') },
      { k: 's', t: T('放消息說是對手抹黑'), fx: { pop: 2, integrity: -3 }, later: { in: 2, fx: { council: -4 }, text: T('記者查到消息來源是市長室。') }, r: T('焦點轉走了。') }] },
    // B23：副市長突然去鄰市參選
    { id: 'viceleave', title: T('周副市長要去鄰市參選'), text: T('周副市長突然宣布要去鄰市參選，他分管的局處要有人接，市長一個晚上沒睡。'), opts: [
      { k: 's', t: T('主動接下他分管的局處'), fx: { succession: 6, stress: 8, trust: 3 }, r: T('你的行事曆滿到明年。') },
      { k: 'a', t: T('建議市長找新的副市長'), fx: { staff: -2 }, r: T('新的副市長下週到任。') },
      { k: 'a', t: T('建議讓黨部推薦'), fx: { council: 5, integrity: -2 }, r: T('黨部很滿意，記者說是「酬庸」。') }] },
    { id: 'fixer', special: 1, title: T('前地方首長幫你喬好了'), text: T('前地方首長出身的局長說：「那件事我跟幾位議員喝了茶，已經喬好了。」你沒問怎麼喬的。'), opts: [
      { k: 's', t: T('謝謝他'), fx: { council: 6, integrity: -5 }, later: { in: 3, fx: { pop: -5 }, text: T('記者拍到那幾位議員跟局長在同一間餐廳。') }, r: T('事情很順。') },
      { k: 's', t: T('問清楚怎麼喬的'), fx: { council: -2, stress: 3 }, r: T('他笑笑：「副市長，有些事不知道比較好。」') },
      { k: 's', t: T('請他之後都留下紀錄'), fx: { integrity: 3, network: -3 }, r: T('他說你「太認真」。') }] },

    // ===== 副市長自己的誘惑（收了短期有用，清白會掉）=====
    { id: 'tm_dinner', title: T('廠商請吃飯'), text: T('一家常跟市府合作的廠商約你吃飯：「副市長辛苦了，只是交個朋友。」'), opts: [
      { k: 's', t: T('去吃，順便收下伴手禮'), fx: { network: 8, integrity: -10, stress: -4 }, r: T('飯很好吃，伴手禮很重。') },
      { k: 's', t: T('婉拒'), fx: { network: -3, stress: 2 }, r: T('廠商說：「副市長很有原則喔。」語氣有點冷。') },
      { k: 's', t: T('照規定登錄，約在辦公室談'), fx: { integrity: 3, network: -5, stress: 2 }, r: T('政風處給你按了一個讚。') }] },
    { id: 'tm_relative', title: T('親戚想標案'), text: T('你表哥開了一家小工程行，打電話來：「市府那個人行道的案子，你幫我問一下嘛。」'), opts: [
      { k: 's', t: T('幫他打聲招呼'), fx: { network: 6, integrity: -15 }, later: { in: 3, fx: { pop: -8, integrity: -5 }, text: T('記者查到：得標的工程行老闆，是副市長的表哥。') }, r: T('承辦說：「好的，副市長，我了解。」') },
      { k: 's', t: T('請他照程序投標'), fx: { network: -3 }, r: T('表哥說你「當官了就不認親戚」。') },
      { k: 's', t: T('主動登錄利益迴避'), fx: { integrity: 5, stress: 3, network: -4 }, r: T('過年時，你被分到離表哥最遠的那一桌。') }] },
    { id: 'tm_envelope', title: T('一個信封'), text: T('有人把一個信封放在你桌上：「我們的案子卡很久了，麻煩副市長幫忙『加速』一下。」'), opts: [
      { k: 's', t: T('收下，幫他催'), fx: { network: 6, integrity: -20, staff: 3 }, later: { in: 3, fx: { integrity: -10 }, text: T('那個案子的承辦被問：「是誰叫你先辦的？」') }, r: T('案子三天就跑完了。') },
      { k: 's', t: T('原封退回'), fx: { stress: 2 }, r: T('對方說：「副市長誤會了，那是點心券。」') },
      { k: 's', t: T('退回，並通報政風'), fx: { integrity: 5, network: -6, stress: 3 }, r: T('局處之間開始傳：「副市長不好惹。」') }] },
    { id: 'probe', special: 1, title: T('政風處來找你'), text: T('政風處長敲你辦公室的門：「副市長，有幾件事想請你說明一下。」'), opts: [
      { k: 's', t: T('全部說清楚'), fx: g => { g.flags.confessed = 1; return { integrity: 15, trust: -10, network: -10, stress: 8 }; }, r: T('說完之後，你覺得輕鬆了一點。') },
      { k: 's', t: T('請市長幫忙擋'), fx: g => { g.flags.covered = 1; return { trust: g.trait === 'corrupt' ? 6 : -10, stress: -4 }; }, r: g => g.trait === 'corrupt' ? T('市長說：「放心，我來處理。」你知道這不是好消息。') : T('市長看著你：「你要我擋什麼？」') },
      { k: 's', t: T('否認，說是誤會'), fx: g => { g.flags.denied = 1; return { stress: 10 }; }, r: T('政風處長點點頭，在本子上寫了一行字。') }] },
    { id: 'burnout', special: 1, title: T('你在辦公室昏倒了'), text: T('連續加班好幾個月，你在市政會議上眼前一黑。醒來時在醫院，手機有 87 通未接來電。'), opts: [
      { k: 's', t: T('請假兩週，好好休息'), fx: { stress: -45, trust: -6, staff: -3 }, r: T('兩週後回來，抽屜又滿了一點，但你好多了。') },
      { k: 's', t: T('在病床上繼續回訊息'), fx: g => { g.flags.burnouts = (g.flags.burnouts || 0) + 1; return { stress: -15, trust: 4 }; }, r: T('護理師沒收了你的手機。') }] },
    // B9：公股公司董事名單被批酬庸
    { id: 'patronage', special: 1, title: T('酬庸位子：董事改選'), text: g => T('「N 城果菜運銷公司」和「N 城捷運開發公司」的董事長、總經理要改選。黨部、選戰團隊、議員都來找你要人。{0}', g.trait === 'showoff' || g.trait === 'ear' ? T('市長說：「這些位子要給自己人，大家辛苦了。」') : ''), opts: [
      { k: 'a', t: T('建議給黨部推薦的人'), fx: g => ({ council: Math.round(6 * ((CAREER_MAYOR_OFFICE.councils[g.council] || {}).partyMul || 1)), pop: -3 }), r: T('議會這季特別好說話。脆上：「又是酬庸。」') },
      { k: 'a', t: T('建議給選戰的自己人'), fx: { trust: 6, pop: -6 }, r: T('老戰友們很感動。記者把每個人的經歷都查出來了。') },
      { k: 'a', t: T('建議找專業經理人'), fx: { budget: 5, council: -4, trust: -2 }, r: T('公司營運變好了，但大家說市府「不懂人情」。') },
      { k: 'a', t: T('建議公開徵才'), fx: { pop: 4, council: -2, staff: -2 }, r: T('徵才跑了三個月，被說「不懂政治」，但履歷很漂亮。') },
      { k: 's', t: T('留一個董事給自己當退路'), fx: { network: 10, integrity: -12, trust: 2 }, later: { in: 2, fx: { pop: -6 }, text: T('記者列出市府轉投資公司的董事名單，你的名字在上面。') }, r: T('卸任之後，你有地方去了。') }] },
    // C1：百日民調「無意見」最多
    { id: 'presser', special: 1, title: T('上任百日記者會'), text: T('百日民調出來了，最多人選的是「無意見」。明天市長要開百日記者會，講稿是你寫的。從今天起，再說「這是前任留下的」，大家就不買單了。'), opts: [
      { k: 's', t: T('講稿老實列出抽屜清單'), fx: g => ({ pop: g.drawer.filter(d => d.done).length * 2 - 4 }), r: T('記者寫：「至少很誠實。」') },
      { k: 's', t: T('講稿只講做好的'), fx: { pop: 3, council: -3 }, r: T('隔天報紙把沒講的列成一張表。') }] },
    { id: 'eve', final: true, title: T('連任前夕'), text: T('四年過去了。明天就是連任選舉，市長在辦公室問你：「副市長，我們這四年，做得怎麼樣？」'), opts: [
      { k: 's', t: T('拿出抽屜和政見清單'), fx: {}, r: T('市長看了很久。') },
      { k: 's', t: T('「我們盡力了」'), fx: {}, r: T('市長笑了：「那就好。」') },
      { k: 's', t: T('遞辭呈：這次我不跟了'), fx: g => { g.flags.leave = 1; return {}; }, r: T('市長愣了一下，然後點點頭。') }] }
  ],

  // ===== 老闆的真面目：每局抽一張隱藏特質 =====
  // events：[回合, 事件 id]；大部分是好人或小毛病，嚴重的機率低
  traits: {
    good: { weight: 30, name: T('真的是好人'), emoji: '😇' },
    showoff: { weight: 11, name: T('好大喜功'), emoji: '🗼', events: [[3, 'tr_showoff_hint'], [6, 'tr_showoff']] },
    central: { weight: 11, name: T('甩鍋中央派'), emoji: '🏛️', events: [[3, 'tr_central_hint'], [6, 'tr_central']] },
    portrait: { weight: 9, name: T('大頭照文宣派'), emoji: '🖼️', events: [[3, 'tr_portrait_hint'], [8, 'tr_portrait']] },
    ambition: { weight: 10, name: T('一心想選更大的位子'), emoji: '🧳', events: [[8, 'tr_ambition_hint'], [10, 'tr_ambition']] },
    ear: { weight: 10, name: T('耳根軟'), emoji: '👂', events: [[3, 'tr_ear_hint'], [6, 'tr_ear']] },
    image: { weight: 10, name: T('網路聲量王'), emoji: '📱', events: [[3, 'tr_image_hint'], [6, 'tr_image']] },
    corrupt: { weight: 7, name: T('跟廠商走太近'), emoji: '🎁', events: [[6, 'tr_corrupt_hint'], [9, 'tr_corrupt']] }
  },
  // 特質對政見的影響
  // 出包之後，有機會觸發「找人揹鍋」（甩鍋中央派的老闆更常叫你做）
  triggered: g => {
    if (g.stats.stress >= 90 && !g.flags.burnNow) { g.flags.burnNow = 1; return 'burnout'; }
    if (g.stats.stress < 70) g.flags.burnNow = 0;
    if (g.stats.integrity <= 45 && !g.flags.probed) { g.flags.probed = 1; return 'probe'; }
    if (!g.flags.mess || (g.flags.scapes || 0) >= 2) return null;
    const p = g.trait === 'central' ? 0.9 : 0.45;
    g.flags.mess = 0;
    if (g.rng() < p) { g.flags.scapes = (g.flags.scapes || 0) + 1; return 'scapegoat'; }
    return null;
  },
  failMod: (g, step) => {
    const cc = CAREER_MAYOR_OFFICE.councils[g.council] || {};
    let m = step.id === 'budget' ? (cc.budgetAdj || 0) : 0;
    // 政黨推薦的人選：朝小野大時更有用、本黨過半時沒那麼需要
    if (step.id === 'budget' && Object.values(g.cabinet).includes('party')) m -= 0.1 * ((cc.partyMul || 1) - 1);
    if (g.trait === 'central' && step.id === 'budget') return m + 0.1;
    if (g.trait === 'image' && !g.flags.proxy && !g.flags.imageFixed) return 0.2;
    if (g.trait === 'ambition' && g.flags.absent) return 0.12;
    return 0;
  },

  // 擱置太久的公文爆開
  boom: (d, g) => ({ id: 'boom_' + d.id, boom: true, title: T('爆開了：{0}', CAREER_MAYOR_OFFICE.drawer.find(x => x.id === d.id).title), text: T('擱置太久，事情變大了，記者已經在門口。'), opts: [
    { t: T('🧯 緊急處理'), fx: { budget: -18, staff: -5 }, r: T('花了比原本多三倍的錢。') },
    { t: T('🫣 繼續裝沒看到'), fx: { pop: -12, council: -6 }, r: T('脆上開始倒數你們的任期。') }] }),

  onTurnEnd: g => {
    const fx = { budget: 9, stress: 5 }; // 每個月的稅收；壓力慢慢累積
    // 中央借將、只做兩年的人：第 2 年走人
    if (g.turn === 9) for (const k of Object.keys(g.cabinet)) if (g.cabinet[k] === 'central' || g.staffers[k] === 'dream_works' || g.staffers[k] === 'peerfin') { g.cabinet[k] = 'acting'; g.staffers[k] = 'acting'; g.later.push({ at: g.turn + 1, fx: { staff: -3 }, text: T('說好只做兩年的局長，交接完就走了。那個位子現在是代理。') }); }
    // 公民記者副市長的條件：百日前要查清楚卸任前通過的案子
    // 你分管的爛攤子處理掉，接班聲望 +；另兩位副市長也在累積
    if (g.turn % 3 === 0) g.flags.rivalRep = (g.flags.rivalRep || 40) + 6;
    if (g.trait === 'image') fx.pop = 2; // 網路聲量王：民意一直漲
    if (g.trait === 'portrait' && !g.flags.portraitFixed) fx.budget -= 2; // 大頭照文宣派：宣傳預算一直吃
    if (g.turn === 11 && g.trait === 'corrupt' && g.flags.blind && !g.flags.whistle) g.flags.caught = g.rng() < 0.6 ? 1 : 0; // 裝沒看到的，不一定躲得掉
    if ((g.drawer.find(d => d.id === 'D') || {}).done) fx.budget += 2;
    if (g.turn === 8 && g.drawer.some(d => d.id === 'G' && !d.done)) { fx.budget = (fx.budget || 0) - 15; g.flags.gBoom = 1; }
    return fx;
  },

  endings: [
    { id: 'bothcaught', emoji: '🚔', title: T('一起被約談'), text: T('調查單位同一天約談了市長和副市長。記者在走廊上問你：「你們是一起的嗎？」你答不出來。做壞事一定會被抓。'), when: g => g.trait === 'corrupt' && g.stats.integrity <= 40 && !g.flags.whistle },
    { id: 'youarethe', emoji: '🗄️', title: T('你就是那個前任'), text: T('卸任交接那天，新的副市長打開你的抽屜。最上面那一疊，是你收過的伴手禮清單和沒登錄的餐敘。做壞事一定會被抓，只是晚一點。'), when: g => g.stats.integrity <= 35 && !g.flags.confessed },
    { id: 'burnoutend', emoji: '🚑', title: T('副市長先倒下了'), text: T('你在病床上回完最後一則訊息，終於承認：這四年，你把自己也當成了抽屜裡的公文。'), when: g => (g.flags.burnouts || 0) >= 2 },
    { id: 'questioned', emoji: '🚔', title: T('你也被約談了'), text: T('連任選舉前三個月，調查單位來到市長室。你幫忙擋下的那些餐敘，每一筆都有紀錄。做壞事一定會被抓，幫忙的也一樣。'), when: g => g.trait === 'corrupt' && (g.flags.complicit || g.flags.caught) },
    { id: 'whistle', emoji: '📮', title: T('吹哨者'), text: T('政風處接手調查，老闆的記者會改成道歉記者會。你被調離市長室，但走廊上有幾個公務員偷偷跟你點頭。'), when: g => g.flags.whistle },
    { id: 'walkaway', emoji: '🚪', title: T('全身而退'), text: T('你在連任選舉之前就離開了。新聞只寫了一行：「副市長請辭，原因不明。」你知道原因。'), when: g => g.flags.quit && !g.flags.neighbor },
    { id: 'neighbor', emoji: '🚄', title: T('去鄰市參選'), text: T('你辭去副市長，到鄰市參選市長。N 城的爛攤子留給了下一位副市長；鄰市的爛攤子，在等你。'), when: g => g.flags.neighbor },
    { id: 'leave', emoji: '🛶', title: T('跳船'), text: g => g.stats.trust >= 60 ? T('連任選戰正熱，你遞出辭呈。市長很信任你，不懂你為什麼要走；你只是覺得，這四年夠了。') : T('連任選戰正熱，你遞出辭呈。記者寫：「副市長跳船。」你知道市長其實也在想要不要換人，這次是你先開口的。'), when: g => g.flags.leave },
    { id: 'replaced', emoji: '📋', title: T('總幹事是另一位副市長'), text: T('連任競選總部成立了，總幹事是另一位副市長。市長說：「選舉需要不一樣的人。」你知道，是因為你知道得太多，或者，他不再那麼相信你了。'), when: g => g.stats.trust <= 30 || ((g.stats.succession || 0) < (g.flags.rivalRep || 40) - 20 && g.stats.trust < 50) },
    { id: 'successor', emoji: '🏁', title: T('接班人'), text: T('連任成功的那晚，市長在台上第一個感謝的人是你。八年後，他坐上了更大的位子；黨內說，下一屆 N 城市長，大家心裡都有答案了。'), when: (g, t) => g.stats.trust >= 65 && (g.stats.succession || 0) >= 58 && t.pledges >= 2 && t.drawer >= t.total - 4 },
    { id: 'clean', emoji: '🧹', title: T('清空抽屜的人'), text: T('前任的爛攤子全部挖出來處理完，政見也做到了，一次都沒有甩鍋。秘書長說：「我在這裡 30 年，第一次看到抽屜是空的。」'), when: (g, t) => t.drawer === t.total && g.blamed === 0 && t.pledges >= 2 && g.stats.integrity >= 70 },
    { id: 'chaos', emoji: '🔥', title: T('府會大亂'), text: T('數值一路暴衝，議會、市府、脆上同時著火。連任前夕的記者會變成道歉記者會。'), when: g => g.overflow >= 4 || Object.values(g.stats).some(v => v <= 0) },
    { id: 'imageking', emoji: '📱', title: T('聲量第一，公文第一多'), text: T('老闆的短影音紅遍全國，民調全國第一。連任辯論上，對手只問了一題：「這四年，市府做了什麼？」全場安靜。'), when: (g, t) => g.trait === 'image' && !g.flags.proxy && !g.flags.imageFixed && t.pledges <= 1 },
    { id: 'reelect', emoji: '🌤️', title: T('連任有望'), text: T('抽屜清了大半，政見也看得到成果。老闆在連任前夕的晚上說：「明天，我們再拚一次。」\n\n……八年後，他坐上了更大的位子。'), when: (g, t) => t.drawer >= t.total - 4 && t.pledges >= 2 },
    { id: 'unseen', emoji: '🫥', title: T('做了很多但沒人看見'), text: T('爛攤子收了一大半，可是政見只兌現了一個以下。脆上：「新市長到底在忙什麼？」'), when: (g, t) => t.drawer >= t.total - 4 && t.pledges <= 1 },
    { id: 'becomeprev', emoji: '🪞', title: T('你也變成前任了'), text: T('政見剪綵剪得很開心，抽屜卻越塞越滿。四年後，下一任市長打開抽屜，翻到你們留下的公文，上面寫著：「另案辦理」。'), when: (g, t) => t.open >= 5 || (t.pledges >= 2 && t.drawer <= t.total - 5) },
    { id: 'meh', emoji: '📎', title: T('平安下莊，抽屜還很滿'), text: T('四年過去了，沒出大事，也沒做成什麼大事。秘書長：「很正常，大家都這樣。」'), when: () => true }
  ],
  // ===== 找附件小遊戲：找到之後的結果（都是公部門真的會遇到的）=====
  attachments: [
    T('附件是一片光碟。全辦公室已經沒有一台電腦有光碟機。'),
    T('附件存在舊系統裡。舊系統去年下線了，要調閱得跑公文，大約三週。'),
    T('附件寫著「另案辦理」。另案的公文寫著「詳見前案」。'),
    T('附件已經歸檔到檔案室。填了申請單、等了三天，送來的是另一年的同名檔案。')
  ],
  // ===== 本局稱號（只是好玩，依序取第一個符合的）=====
  titles: [
    { id: 'whistle', emoji: '📮', name: T('最後的良心'), when: g => g.flags.whistle },
    { id: 'blamer', emoji: '🫵', name: T('甩鍋大師'), when: g => g.blamed >= 4 },
    { id: 'saint', emoji: '🧼', name: T('一塵不染'), when: g => g.stats.integrity >= 90 },
    { id: 'networker', emoji: '📇', name: T('人脈王'), when: g => g.stats.network >= 75 },
    { id: 'backdoor', emoji: '🚪', name: T('後門專家'), when: g => g.log.filter(l => l.act === 'shortcut' || l.gray).length >= 3 },
    { id: 'digger', emoji: '⛏️', name: T('考古學家'), when: (g, t) => t.drawer === t.total },
    { id: 'ribbon', emoji: '✂️', name: T('剪綵達人'), when: (g, t) => t.pledges === 3 },
    { id: 'shelver', emoji: '📥', name: T('公文旅行社社長'), when: g => g.drawer.some(d => d.shelved >= 6) },
    { id: 'proxy', emoji: '✍️', name: T('影子市長'), when: g => g.flags.proxy },
    { id: 'tea', emoji: '🫖', name: T('茶葉保管員'), when: g => g.flags.tea && !g.flags.whistle },
    { id: 'budget', emoji: '🐷', name: T('精打細算'), when: g => g.stats.budget >= 60 },
    { id: 'morale', emoji: '💪', name: T('公務員的好朋友'), when: g => g.stats.staff >= 70 },
    { id: 'trusted', emoji: '🤝', name: T('老闆的左右手'), when: g => g.stats.trust >= 80 },
    { id: 'council', emoji: '🏛️', name: T('議會之友'), when: g => g.stats.council >= 75 },
    { id: 'plant', emoji: '🌳', name: T('發財樹守護者'), when: g => g.log.some(l => l.id === 'plant' && l.opt === 0) },
    { id: 'normal', emoji: '🧑‍💼', name: T('認真的副市長'), when: () => true }
  ]
};
if (typeof module !== 'undefined') module.exports = CAREER_MAYOR_OFFICE;
