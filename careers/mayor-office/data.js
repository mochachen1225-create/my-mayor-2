// 職業包：Part 2 市長室主任（前任的抽屜）
// 文字一律用 T() 包；Node 模擬時用下面的備用 T
var T = typeof T === 'function' ? T : (s, ...a) => s.replace(/\{(\d)\}/g, (_, i) => a[i]);

const CAREER_MAYOR_OFFICE = {
  id: 'mayor-office', part: 2, turns: 12, shiftTurn: 5, costPer: 4, actionsPerTurn: 2,
  title: T('我推的市長：上任篇'),
  subtitle: T('前任的抽屜'),
  tagline: T('你以為選上就萬歲了？不，是大坑的開始。'),
  role: T('市長室主任'),
  // ===== 四年任期切成 12 回合：前百日按月，之後一回合跳幾個月 =====
  rounds: [
    { label: T('第 1 年・1 月'), note: T('就職、交接') },
    { label: T('第 1 年・2 月'), note: T('春節'), event: 'lunarny' },
    { label: T('第 1 年・3 月') },
    { label: T('第 1 年・4 月'), note: T('上任百日'), event: 'presser' },
    { label: T('第 1 年・夏'), note: T('颱風季'), event: 'typhoon' },
    { label: T('第 1 年・秋'), note: T('預算季'), event: 'budgetseason' },
    { label: T('第 1 年・12 月'), note: T('跨年＋就職一週年'), event: 'anniversary' },
    { label: T('第 2 年・上半'), note: T('董事改選'), event: 'patronage' },
    { label: T('第 2 年・下半'), note: T('颱風、預算') },
    { label: T('第 3 年'), note: T('期中考'), event: 'midterm' },
    { label: T('第 4 年・上半'), note: T('選前半年'), event: 'preelect' },
    { label: T('第 4 年・連任前夕'), note: T('終局') }
  ],
  stats: [
    { id: 'pop', emoji: '😊', name: T('民意'), start: 45, low: 10, high: 90 },
    { id: 'council', emoji: '🏛️', name: T('議會'), start: 50, low: 10, high: 90 },
    { id: 'budget', emoji: '💰', name: T('預算'), start: 60, low: 10, high: 90 },
    { id: 'staff', emoji: '💪', name: T('市府士氣'), start: 50, low: 10, high: 90 },
    { id: 'trust', emoji: '🤝', name: T('老闆信任'), start: 60, low: 10, high: 101 }
  ],
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
    { id: 'vice', name: T('副市長'), why: T('老闆不在時替他扛'), hits: T('影響：交接清冊、會展中心'), domain: ['A', 'C', 'D'] },
    { id: 'finance', name: T('財政局長'), why: T('前任的帳要有人算清楚'), hits: T('影響：敬老加碼、營養午餐、潛藏負債、政見審預算'), domain: ['F', 'G', 'H', 'budget'] },
    { id: 'works', name: T('工務局長'), why: T('蓋一半的工程等著收拾'), hits: T('影響：天空步道、路燈合約、政見發包'), domain: ['B', 'E', 'tender'] },
    { id: 'transport', name: T('交通局長'), why: T('捷運延期、塞車，市民天天在罵'), hits: T('影響：捷運延伸線、政見剪綵'), domain: ['ribbon', 'Y1'] }
  ],
  lockedSlots: [T('主計處長'), T('人事處長'), T('警察局長'), T('政風處長')],
  // 人選來源：每種都有取捨；events 是選了之後才會加進牌組的事件
  cabinetTypes: {
    loyal: { emoji: '🤝', name: T('自己人'), desc: T('選戰團隊的老戰友。老闆很放心，但沒行政經驗，第一次處理公文會出包'), fx: { trust: 5 } },
    party: { emoji: '🎗️', name: T('政黨推薦'), desc: T('議會比較好過，但要還人情，黨部之後會來「關心」'), fx: { council: 6 }, failAdj: { budget: -0.15 }, events: ['partycall'] },
    scholar: { emoji: '🎓', name: T('知名學者'), desc: T('民意加分、處理成本 −25%；但講話太直，可能哪天就「回學校了」'), fx: { pop: 4, trust: -2 }, costMul: 0.75, events: ['scholarquit'] },
    holdover: { emoji: '🗂️', name: T('前朝留任'), desc: T('熟門熟路、知道附件在哪；但會跟前任「順便報告」'), fx: { staff: 6 }, costMul: 0.9, events: ['holdoverleak'] },
    business: { emoji: '💼', name: T('企業家'), desc: T('效率高、採購比較快；但媒體會盯利益衝突'), fx: { budget: 3 }, failAdj: { tender: -0.15 }, costMul: 0.85, events: ['conflictnews'] },
    acting: { emoji: '🪑', name: T('先找人代理'), desc: T('不用花時間找人；但成本 +30%，代理局長不敢簽'), costMul: 1.3, failAdj: { budget: 0.05, tender: 0.05 }, events: ['actingsign'] }
  },
  // 人才池：同一來源也有個性差異（fx 是個人加減）
  candidates: [
    { id: 'kai', src: 'loyal', name: T('阿凱'), line: T('跟了老闆十年，掃街最拚的那個'), fx: { staff: 2 } },
    { id: 'meiling', src: 'loyal', name: T('美玲姐'), line: T('競選總部的大總管，什麼都記在小本子上'), fx: { council: 2 } },
    { id: 'zhewei', src: 'loyal', name: T('哲維'), line: T('老闆的大學同學，臉書很會寫'), fx: { pop: 2 } },
    { id: 'councilor', src: 'party', name: T('前議員老周'), line: T('連任三屆議員，議會裡誰欠誰都知道'), fx: { council: 3 } },
    { id: 'youth', src: 'party', name: T('黨部青年部長'), line: T('很想做事，也很想被看見'), fx: { pop: 2 } },
    { id: 'veteran', src: 'party', name: T('黨部大老推薦的林先生'), line: T('沒人知道他做過什麼，但大家都說「他很穩」'), fx: { staff: 2 } },
    { id: 'prof', src: 'scholar', name: T('陳教授'), line: T('上過很多政論節目，學生很崇拜他'), fx: { pop: 3 } },
    { id: 'engineer', src: 'scholar', name: T('黃博士'), line: T('研究了二十年的都市規劃，第一次當官'), fx: { staff: 1 } },
    { id: 'economist', src: 'scholar', name: T('吳教授'), line: T('財政專家，看到預算書會直接嘆氣'), fx: { council: -2, budget: 2 } },
    { id: 'chief', src: 'holdover', name: T('老科長升任'), line: T('前任時期的主任秘書，什麼都知道，什麼都不說'), fx: { staff: 2 } },
    { id: 'deputy', src: 'holdover', name: T('前任的副局長'), line: T('上一任的計畫都是他寫的'), fx: { council: 2 } },
    { id: 'ceo', src: 'business', name: T('科技公司前執行長'), line: T('開會一律 15 分鐘，超過就走人'), fx: { staff: -2, budget: 2 } },
    { id: 'builder', src: 'business', name: T('營造業第二代'), line: T('很懂工地，但家裡的公司還在接案'), fx: { council: -2 } },
    { id: 'startup', src: 'business', name: T('新創老闆'), line: T('什麼都想做成 App'), fx: { pop: 2 } },
    { id: 'xiaoyu', src: 'loyal', name: T('小羽'), line: T('競選網路組長，24 小時都在線上'), fx: { pop: 1 } },
    { id: 'rep', src: 'party', name: T('黨部政策部主任'), line: T('寫過很多政策白皮書，沒執行過'), fx: { council: 2 } },
    { id: 'lawprof', src: 'scholar', name: T('林教授'), line: T('行政法專家，每份公文都要看三遍'), fx: { staff: -1, council: 1 } },
    { id: 'clerk', src: 'holdover', name: T('資深專門委員'), line: T('在市府 25 年，換過 4 個市長'), fx: { staff: 3 } },
    { id: 'banker', src: 'business', name: T('銀行退休副總'), line: T('看數字很快，看人比較慢'), fx: { budget: 2 } },
    { id: 'acting1', src: 'acting', name: T('暫代的主任秘書'), line: T('「我只是暫代，這個我不敢簽。」') },
    { id: 'acting2', src: 'acting', name: T('暫代的副局長'), line: T('每份公文都要「再請示」') }
  ],
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
  // 每局只出現 6 份公文：交接清冊一定有；另外從可拿掉的公文隨機拿掉 2 份（被拿掉的連鎖下游也不出現）
  drawerSubset: rng => {
    const all = ['A', 'C', 'B', 'D', 'E', 'F', 'G', 'H'];
    const removable = ['B', 'D', 'E', 'G', 'H'];
    const drop = removable.sort(() => rng() - 0.5).slice(0, 2);
    return all.filter(x => !drop.includes(x));
  },
  drawer: [
    { id: 'A', start: 1, look: 1, real: 2, chain: ['C'], fx: { staff: 4 }, title: T('交接清冊第 287 頁'), text: T('移交清冊 300 頁，第 287 頁寫著「詳見附件」，附件不見了。系統密碼只有原承辦知道，他上個月退休了。') },
    { id: 'C', look: 1, real: 3, chain: ['B'], fx: { council: 3 }, title: T('附件找到了'), text: T('附件在地下室的一箱合約裡，最上面那份寫著「期滿自動續約」。') },
    { id: 'B', look: 1, real: 5, fx: { pop: 3 }, title: T('20 年路燈節能合約'), text: T('前任簽了 20 年的路燈節能合約：廠商出錢換 LED、用省下的電費回收。條款寫得很妙：換色溫要另外付費、燈壞了要等廠商、提前解約要賠一大筆。') },
    { id: 'D', start: 1, look: 3, real: 3, conflict: ['E'], conflictKind: 'cost', fx: { pop: 2 }, title: T('多功能藝文體育會展中心'), text: T('蓋好三年沒人用，每年電費比辦活動還貴。') },
    { id: 'E', start: 1, look: 2, real: 4, conflict: ['D'], conflictKind: 'cost', fx: { pop: 2, council: 3 }, title: T('蓋一半的市民天空步道'), text: T('廠商跑了，重新發包流標兩次。') },
    { id: 'F', start: 1, look: 2, real: 3, chain: ['G'], conflict: ['H'], conflictKind: 'block', fx: { pop: 3 }, title: T('敬老加碼政見'), text: T('前任答應敬老金每月加碼，但預算書上只編了半年。') },
    { id: 'G', look: 1, real: 5, fx: { council: 8 }, title: T('不在預算書上的那一筆'), text: T('會計科長小聲說：「有一筆不在預算書上……」前任先用明年的錢付了今年的帳，包商工程款也欠著。') },
    { id: 'Y1', own: 1, appearAt: 7, look: 2, real: 4, fx: { pop: 3, council: 2 }, title: T('你們的捷運延伸線延宕'), text: T('就職時宣布的延伸線，地質報告出來了：要多挖兩年。這次沒有前任可以怪了。') },
    { id: 'Y2', own: 1, appearAt: 9, look: 1, real: 3, fx: { council: 4 }, title: T('一週年晚會超支'), text: T('一週年晚會請了很多藝人，帳單比預算多一倍。議員要你「說清楚」。') },
    { id: 'H', start: 1, look: 3, real: 4, conflict: ['F'], conflictKind: 'block', fx: { pop: 2, staff: 4 }, title: T('免費營養午餐'), text: T('前任宣布國中小營養午餐全面免費，下學期開始，經費「再想辦法」。') }
  ],

  events: [
    { id: 'typhoon', special: 1, title: T('颱風假'), text: T('晚上 10 點，雨不大，隔壁縣市已經宣布放假。'), opts: [
      { t: T('🌀 放！'), fx: { pop: 6, council: -2 }, r: T('隔天出大太陽，脆上一片「謝謝市長」。') },
      { t: T('☀️ 不放'), fx: { council: 3, pop: -8 }, r: T('隔天中午突然暴雨。') },
      { t: T('📞 先打給氣象專家'), fx: { staff: -2, pop: -2 }, r: T('決定晚了一小時，兩邊都有人罵。') }] },
    { id: 'interpellation', title: T('議會總質詢'), text: T('反對黨議員拿著前任的預算書，要你「解釋清楚」。'), opts: [
      { t: T('📚 熬夜讀完預算書，逐條回答'), fx: { council: 6, staff: -4 }, r: T('議員翻了三頁就放棄了。') },
      { t: T('🙇 「這是前任的事，我們會檢討」'), fx: (g, late) => late ? { council: -6 } : { pop: 2 }, r: T('議員冷笑：「又是前任？」') },
      { t: T('🎤 反問議員當年有沒有投贊成票'), fx: { council: -8, pop: 6 }, r: T('影片在脆上爆紅。') }] },
    { id: 'plant', title: T('發財樹之謎'), text: T('市長室角落有一盆前任留下的巨大發財樹，秘書長說：「不能搬，會倒楣。」'), opts: [
      { t: T('🌳 留著'), fx: { staff: 3 }, r: T('大家鬆了一口氣。') },
      { t: T('🚚 搬走'), fx: { staff: -5, budget: -3 }, r: T('隔天影印機壞了，大家都說是發財樹的關係。') },
      { t: T('🎁 送給議長'), fx: { council: 4 }, r: T('議長很開心。隔週他的車被拖吊了。') }] },
    { id: 'mascots', title: T('吉祥物大軍'), text: T('前任讓每個局處各做了一隻吉祥物，總共 14 隻，活動結束後全部塞在倉庫，布偶裝開始發霉。'), opts: [
      { t: T('🗳️ 辦網路票選，只留一隻當市府代表'), fx: { pop: 5, staff: -1 }, r: T('落選的局處很不爽，說它們的吉祥物比較可愛。') },
      { t: T('🧸 全部捐給幼兒園'), fx: { pop: 3, budget: 2 }, r: T('小朋友很開心，倉庫也空了。') },
      { t: T('🐣 再做第 15 隻代表新市府'), fx: { budget: -6, pop: -3 }, r: T('脆上嘲笑了一整週。') }] },
    { id: 'metro', title: T('捷運開通日'), text: T('新線一延再延，但開通日已經印在 10 萬張紀念票卡上。'), opts: [
      { t: T('🎫 照原日期「試營運」'), fx: { pop: -2 }, r: T('第一天停駛兩次。') },
      { t: T('📅 公開延期，重印票卡'), fx: { budget: -5, council: 3 }, r: T('議會稱讚你誠實。') },
      { t: T('🖨️ 改成「紀念延期票卡」限量賣'), fx: { budget: 4 }, r: T('脆上意外很喜歡，一天賣完。') }] },
    { id: 'stamps', title: T('公文踢皮球'), text: T('人行道上有一根廢棄的電線桿要拆。工務說歸交通、交通說歸電力公司、民政說要先問里長、環保說它不是垃圾。公文在 6 個局處之間跑了兩個月。'), opts: [
      { t: T('🏃 召集 6 個局處當面喬'), fx: { staff: -4, pop: 3, trust: -2 }, r: T('開了兩小時的會，終於決定由工務局「主辦」，其他「協辦」。') },
      { t: T('📋 訂規定：會辦超過 7 天要說明'), fx: { staff: -6, pop: 4 }, r: T('秘書長說：「上一個這樣做的人……」然後沒說完。') },
      { t: T('📎 放著，讓它繼續跑'), fx: { pop: -3 }, r: T('里長在臉書上幫電線桿慶生。') }] },
    { id: 'ribbon', title: T('里長要剪綵'), text: T('里長打來：「新的路燈裝好了，市長一定要來剪綵！」只有一支路燈。'), opts: [
      { t: T('✂️ 安排老闆去剪'), fx: { pop: 3, trust: -2 }, r: T('剪綵比路燈還亮。') },
      { t: T('🙅 婉拒，改寄賀卡'), fx: { pop: -3 }, r: T('里長在地方群組抱怨了三天。') },
      { t: T('🎤 你自己去代打'), fx: { pop: 1, staff: -2 }, r: T('里長：「你是誰？」') }] },
    { id: 'prevcall', title: T('前任來電'), text: T('前任市長打電話來「關心」：「那個會展中心，其實當初是有規劃的啦。」'), opts: [
      { t: T('📞 客氣聽完，請教當初的規劃'), fx: { council: 3, trust: -2 }, r: T('聽了 47 分鐘，規劃是一張餐巾紙。') },
      { t: T('📵 轉給秘書長'), fx: { staff: -2 }, r: T('秘書長跟前任聊得比你還開心。') },
      { t: T('📣 公開說「謝謝前任留下的驚喜」'), fx: (g, late) => late ? { pop: -4, council: -2 } : { pop: 4, council: -4 }, r: T('脆上分成兩派吵了一整天。') }] },
    { id: 'social', title: T('小編出包'), text: T('市府小編把「市長視察」打成「市長失察」，已經被截圖了。'), opts: [
      { t: T('🙇 立刻道歉更正'), fx: { pop: -1, staff: -2 }, r: T('道歉文的讚比原文還多。') },
      { t: T('😎 自嘲：「這次真的有去看」'), fx: { pop: 5, trust: -2 }, r: T('老闆覺得不好笑，網友覺得很好笑。') },
      { t: T('🗑️ 刪文裝沒事'), fx: { pop: -6 }, r: T('截圖傳得更快了。') }] },
    { id: 'bigidea', title: T('老闆的大夢'), text: T('老闆開完會突然說：「我們來蓋全國最高的摩天輪！」'), opts: [
      { t: T('📊 拿出抽屜清單給他看'), fx: { trust: -4, budget: 3 }, r: T('老闆沉默了很久，說：「那先蓋小一點的。」') },
      { t: T('🎡 好，先做可行性評估'), fx: { budget: -6, pop: 2 }, r: T('評估報告寫了 300 頁，結論是「需要再評估」。') },
      { t: T('🫡 「市長說得對！」'), fx: { trust: 5, council: -5 }, r: T('議會已經在準備質詢稿了。') }] },
    // ===== 人選來源帶進來的事件（選了才會出現）=====
    { id: 'partycall', special: 1, title: T('黨部來「關心」'), text: T('黨部打電話來：「下個月那個標案，我們有個朋友的公司很不錯，你們參考一下。」'), opts: [
      { t: T('🙂 「好，我們會依法辦理」'), fx: { council: 2, staff: -2 }, r: T('黨部聽懂了，有點不開心。') },
      { t: T('📋 把電話內容寫進公文紀錄'), fx: { council: -6, staff: 4 }, r: T('政風處長點頭。黨部說你「不懂事」。') },
      { t: T('🤐 含糊帶過'), fx: { council: 4, trust: -3 }, r: T('三天後，那家公司真的來投標了。') }] },
    { id: 'scholarquit', special: 1, title: T('局長「回學校了」'), text: T('學者局長在議會被罵了一個下午，晚上傳訊息給你：「我覺得我還是比較適合教書。」'), opts: [
      { t: T('☕ 約他吃飯，好好慰留'), fx: { staff: 2, trust: -2 }, r: T('他答應再撐三個月，但開會時一直看手錶。') },
      { t: T('👋 尊重他，找人代理'), fx: g => { const k = Object.keys(g.cabinet).find(x => g.cabinet[x] === 'scholar'); if (k) g.cabinet[k] = 'acting'; return { pop: -4 }; }, r: T('記者寫：「新市府首位閣員請辭」。') },
      { t: T('🎤 請老闆公開挺他'), fx: { pop: 3, council: -4 }, r: T('議員說老闆「護短」。') }] },
    { id: 'holdoverleak', special: 1, title: T('順便報告'), text: T('你發現前朝留任的局長，每週都跟前任吃一次飯，「順便報告」市府的事。'), opts: [
      { t: T('🗣️ 私下跟他談清楚'), fx: { staff: -2, trust: 2 }, r: T('他說：「我只是去關心老長官。」之後吃飯改成兩週一次。') },
      { t: T('🔁 把他調去比較不重要的位子'), fx: { staff: -6, council: -2 }, r: T('局處裡開始流傳「新市府在清算」。') },
      { t: T('😶 算了，他做事還是很好用'), fx: { pop: -3 }, r: T('隔週前任在臉書上，精準評論了你們還沒公布的計畫。') }] },
    { id: 'conflictnews', special: 1, title: T('利益衝突？'), text: T('記者發現，企業家局長以前的公司，正在投標市府的案子。'), opts: [
      { t: T('📄 要求他公開迴避'), fx: { pop: 3, staff: -2 }, r: T('他迴避了，標案延後兩週。') },
      { t: T('🙅 「這是合法的」'), fx: { pop: -6, council: -3 }, r: T('合法，但脆上不買單。') },
      { t: T('🧾 主動公開所有往來紀錄'), fx: { pop: 4, budget: -2 }, r: T('攤開來之後，反而沒什麼好吵的。') }] },
    { id: 'actingsign', special: 1, title: T('代理的不敢簽'), text: T('代理局長把三份公文放回你桌上：「這個我只是代理，不敢簽，要不要等正式的局長？」'), opts: [
      { t: T('✍️ 你親自盯著他簽'), fx: { staff: -3, trust: -1 }, r: T('他簽了，但每一頁都寫「奉主任指示」。') },
      { t: T('🔎 趕快找正式人選'), fx: { budget: -3 }, r: T('獵人頭找了三週，終於找到人。') },
      { t: T('📦 先放著'), fx: { pop: -3 }, r: T('公文開始旅行。') }] },

    // ===== 老闆的真面目（隱藏特質，中段才露出來）=====
    { id: 'tr_showoff_hint', special: 1, title: T('白板上的塔'), text: T('開完會，老闆在白板上畫了一座塔，旁邊寫「N 城之眼」。'), opts: [
      { t: T('📸 幫他拍下來'), fx: { trust: 2 }, r: T('老闆很開心：「你也覺得很棒對吧？」') },
      { t: T('🧽 默默擦掉'), fx: { trust: -2 }, r: T('隔天白板上又出現了，這次還有尺寸。') }] },
    { id: 'tr_showoff', special: 1, title: T('老闆的真面目：好大喜功'), text: T('老闆宣布要用預備金蓋「N 城之眼」地標，記者會已經訂好了。抽屜裡的爛攤子還沒收完。'), opts: [
      { t: T('💰 幫他找錢'), fx: { budget: -15, pop: 4, trust: 5 }, r: T('地標的模型很漂亮，預算表很難看。') },
      { t: T('🗣️ 勸他先把政見做完'), fx: { trust: -6, council: 3 }, r: T('老闆沉默很久：「好，那先做小一點的。」') },
      { t: T('😶 裝沒看到'), fx: { budget: -8, council: -6 }, r: T('議會發現預備金少了一大塊。') }] },
    { id: 'tr_face_hint', special: 1, title: T('數字講錯了'), text: T('老闆在記者會把一個數字講錯了，幕僚小聲提醒，他揮揮手。'), opts: [
      { t: T('📝 會後幫他準備更正稿'), fx: { staff: -1 }, r: T('更正稿放在他桌上，沒有被打開。') },
      { t: T('🤷 小事，算了'), fx: {}, r: T('應該是小事吧。') }] },
    { id: 'tr_face', special: 1, title: T('老闆的真面目：愛面子不認錯'), text: T('記者查證老闆講錯的數字，問市府要不要更正。老闆說：「我沒有錯，是他們看錯。」'), opts: [
      { t: T('🛡️ 幫他圓'), fx: { pop: -4, council: -3, trust: 4 }, r: T('越圓越大，脆上做成迷因。') },
      { t: T('🗣️ 勸他公開更正'), fx: { trust: -5, pop: 4 }, r: T('他更正了，臉很臭，但脆上說「至少有認錯」。') },
      { t: T('😶 裝沒看到'), fx: { pop: -8 }, r: T('這件事吵了一整週。') }] },
    { id: 'tr_ambition_hint', special: 1, title: T('全國行程'), text: T('老闆這週去了三個外縣市，說是「交流」。'), opts: [
      { t: T('🗓️ 幫他排好行程'), fx: { trust: 2, staff: -2 }, r: T('市政會議改由副市長主持。') },
      { t: T('❓ 問他在忙什麼'), fx: { trust: -1 }, r: T('「格局要大一點。」他說。') }] },
    { id: 'tr_ambition', special: 1, title: T('老闆的真面目：一心想選更大的位子'), text: T('老闆開始上全國性的政論節目，市政會議連續三次請假。局處首長來問你：「市長到底還管不管市政？」'), opts: [
      { t: T('🧳 幫他打理全國行程'), fx: { trust: 6, staff: -6 }, r: T('老闆的聲量越來越大，市府越來越安靜。') },
      { t: T('🗣️ 勸他先把城市顧好'), fx: { trust: -6, staff: 5 }, r: T('他回來開會了，但一直在看手機。') },
      { t: T('😶 裝沒看到'), fx: g => { g.flags.absent = 1; return { staff: -4 }; }, r: T('之後很多公文都要等老闆「回國」。') }] },
    { id: 'tr_ear_hint', special: 1, title: T('顧問的電話'), text: T('一位你沒見過的「老闆的顧問」打電話給工務局長，要他「先停一下」。'), opts: [
      { t: T('📞 問老闆這是誰'), fx: { trust: -1 }, r: T('「喔，他是我的好朋友，很有想法。」') },
      { t: T('🤐 先觀察'), fx: {}, r: T('隔週，顧問又打給了財政局長。') }] },
    { id: 'tr_ear', special: 1, title: T('老闆的真面目：耳根軟'), text: T('那位顧問現在直接指揮局長了。老闆說：「他講的也有道理啊。」'), opts: [
      { t: T('🛡️ 幫老闆把顧問擋在外面'), fx: { trust: -4, staff: 6 }, r: T('局長們鬆了一口氣，顧問在臉書上酸你。') },
      { t: T('🗣️ 勸老闆收回授權'), fx: { trust: -3, council: 2 }, r: T('老闆想了一晚，答應了。') },
      { t: T('😶 裝沒看到'), fx: { staff: -8, council: -3 }, r: T('局處開始不知道該聽誰的。') }] },
    { id: 'tr_image_hint', special: 1, title: T('百萬觀看'), text: T('老闆的短影音破百萬觀看，到處送溫暖、跟長輩跳舞。他桌上的公文堆了三疊。'), opts: [
      { t: T('📈 幫他再拍一支'), fx: { pop: 3, staff: -2 }, r: T('第二支也破百萬了。公文變成四疊。') },
      { t: T('📂 把最急的三份放在最上面'), fx: { staff: 1 }, r: T('他把它們移到旁邊，拍了一支「深夜批公文」的影片。') }] },
    { id: 'tr_image', special: 1, title: T('老闆的真面目：網路聲量王'), text: T('局處首長一個一個私下來找你：「市長都不批，主任可不可以幫忙簽？」老闆正在錄下一支影片。'), opts: [
      { t: T('✍️ 幫他簽（代批）'), fx: g => { g.flags.proxy = 1; return { staff: 6, trust: -4 }; }, r: T('事情終於動了。但你知道，這些公文上面不是你的名字該在的地方。') },
      { t: T('🗣️ 勸他每天撥一小時批公文'), fx: g => { g.flags.imageFixed = 1; return { trust: -6, staff: 3 }; }, r: T('他答應了，第一天就批了 40 份，還拍成影片。') },
      { t: T('😶 裝沒看到'), fx: { pop: 4, staff: -6 }, r: T('民調很高，公文很多。') },
      { t: T('🚪 遞辭呈'), fx: g => { g.flags.quit = 1; return {}; }, r: T('你把識別證放在他桌上，壓在公文最上面。') }] },
    { id: 'tr_corrupt_hint', special: 1, title: T('一盒高級茶葉'), text: T('市長室多了一盒高級茶葉，卡片上寫著某家工程公司的名字。'), opts: [
      { t: T('📦 照規定登錄、退回'), fx: { trust: -2 }, r: T('老闆說：「這麼小的事也要登錄？」') },
      { t: T('🫖 先放著'), fx: g => { g.flags.tea = 1; return {}; }, r: T('茶葉被拆開了。') }] },
    { id: 'tr_corrupt', special: 1, title: T('老闆的真面目：跟廠商走太近'), text: T('你發現老闆私下跟正在投標市府工程的廠商吃飯，還收了禮。他拍拍你的肩：「這是交朋友，你懂的。」'), opts: [
      { t: T('🛡️ 幫忙擋下來'), fx: g => { g.flags.complicit = 1; return { trust: 8 }; }, r: T('你把餐敘從行程表上刪掉了。你知道這不是小事。') },
      { t: T('🗣️ 勸他收手、把禮退回'), fx: g => { if (g.rng() < 0.6) g.flags.reformed = 1; else g.flags.blind = 1; return { trust: -8 }; }, r: g => g.flags.reformed ? T('他沉默很久，把禮退回去了。') : T('他說「好好好」，但你不確定他有沒有聽進去。') },
      { t: T('😶 裝沒看到'), fx: g => { g.flags.blind = 1; return {}; }, r: T('你告訴自己：這不是我的事。') },
      { t: T('🚪 遞辭呈'), fx: g => { g.flags.quit = 1; return {}; }, r: T('你收拾好抽屜，第一次覺得前任也許也有說不出口的事。') },
      { t: T('📮 交給政風處'), fx: g => { g.flags.whistle = 1; return { trust: -40, council: 6, staff: 4 }; }, r: T('政風處長收下資料，看了你一眼：「你確定？」你確定。') }] },
    { id: 'lunarny', special: 1, title: T('春節發紅包'), text: T('過年了，老闆要去市場發紅包，每個局處都要派人陪同。抽屜裡的公文還在等。'), opts: [
      { t: T('🧧 全員出動陪發紅包'), fx: { pop: 5, staff: -4 }, r: T('排隊排到巷口，公文排到明年。') },
      { t: T('🗂️ 留一半人在辦公室'), fx: { pop: 2, staff: 2 }, r: T('值班的同事收到老闆的紅包，很感動。') },
      { t: T('🍊 只發橘子不發紅包'), fx: { pop: -2, budget: 3 }, r: T('脆上：「新市長很節省？」') }] },
    { id: 'budgetseason', special: 1, title: T('預算季：議會審總預算'), text: T('議會開始審明年的總預算，每個議員都有想要的東西。'), opts: [
      { t: T('🤝 逐一拜會議員'), fx: { council: 8, staff: -3, trust: -2 }, r: T('你喝了 27 杯茶，記住了 27 個路燈的位置。') },
      { t: T('📊 公開預算，讓市民一起看'), fx: { pop: 5, council: -4 }, r: T('議員很不高興，但市民很高興。') },
      { t: T('✂️ 主動先刪自己的預算'), fx: { council: 4, budget: -6 }, r: T('議會刪不到東西，有點錯愕。') }] },
    { id: 'anniversary', special: 1, title: T('跨年＋就職一週年'), text: T('跨年晚會要辦嗎？老闆想順便慶祝就職一週年。'), opts: [
      { t: T('🎆 辦大的'), fx: { pop: 6, budget: -10 }, r: T('煙火很美，帳單很長。') },
      { t: T('🕯️ 低調辦，錢拿去做政見'), fx: { pop: -2, budget: 4 }, r: T('脆上：「今年跨年怎麼這麼安靜？」') },
      { t: T('📺 跟電視台合辦'), fx: { pop: 3, council: -2 }, r: T('主持人把市長名字唸錯了兩次。') }] },
    { id: 'midterm', special: 1, title: T('第三年：期中考'), text: T('議員選舉到了，同黨議員都要市長站台；媒體開始公布市長施政滿意度。'), opts: [
      { t: T('📣 全力幫同黨站台'), fx: { council: 6, staff: -4, pop: -2 }, r: T('站了 32 場台，市政會議改成視訊。') },
      { t: T('🏛️ 專心市政，不站台'), fx: { council: -6, pop: 3, staff: 3 }, r: T('同黨議員說你們「不挺自己人」。') },
      { t: T('📋 用政績當文宣'), fx: g => ({ pop: g.pledges.filter(p => p.done).length * 3 - 2 }), r: T('成績單有多厚，文宣就有多厚。') }] },
    { id: 'preelect', special: 1, title: T('選前半年'), text: T('離連任選舉剩半年，老闆問你：「我們還有什麼可以剪綵的？」'), opts: [
      { t: T('✂️ 趕工，什麼都先剪再說'), fx: { pop: 5, staff: -6 }, r: T('剪綵剪到一半，工地還在施工。') },
      { t: T('🧹 先把抽屜收乾淨'), fx: { council: 4, trust: -3 }, r: T('老闆覺得你太保守，但沒說不行。') },
      { t: T('📺 開始拍連任影片'), fx: { pop: 3, budget: -4 }, r: T('影片很感人，留言問「那個捷運呢？」') }] },
    { id: 'scapegoat', special: 1, title: T('出包了，誰來揹？'), text: g => g.trait === 'central' ? T('事情出包上了新聞。老闆說：「這明明是中央的問題。不然……你找個人處理一下。」') : T('事情出包上了新聞，老闆把你叫進辦公室：「要有人出來負責。」'), opts: [
      { t: T('🧑‍💻 推給承辦科長'), fx: { staff: -10, pop: 2 }, r: T('科長被記過。隔天匿名爆料信寄到了議會。') },
      { t: T('👔 推給局長'), fx: g => { const k = Object.keys(g.cabinet).find(x => g.cabinet[x] !== 'acting'); if (k) g.cabinet[k] = 'acting'; return { pop: 3, staff: -3 }; }, r: T('局長請辭了。那個位子現在是代理。') },
      { t: T('🗄️ 推給前任'), fx: (g, late) => late ? { pop: -8 } : { pop: 4 }, r: (g) => g.turn >= 5 ? T('「都幾年了還怪前任？」') : T('大家點頭：「又是前任。」') },
      { t: T('🏛️ 推給中央'), fx: { council: -4, pop: 2 }, r: T('中央回覆：已讀。') },
      { t: T('🙋 你自己扛'), fx: { trust: 6, pop: -5 }, r: T('你在記者會上鞠躬。老闆在後台拍拍你的肩。') }] },
    { id: 'tr_central_hint', special: 1, title: T('「這是中央的責任」'), text: T('記者問捷運為什麼延宕，老闆回答：「這是中央的責任。」記者問營養午餐，老闆也這樣回答。'), opts: [
      { t: T('📝 準備市府自己的說法'), fx: { staff: -1 }, r: T('老闆說：「不用，中央的就是中央的。」') },
      { t: T('🤷 先觀察'), fx: {}, r: T('第三題，老闆還是這樣回答。') }] },
    { id: 'tr_central', special: 1, title: T('老闆的真面目：什麼都是中央的錯'), text: T('老闆發新聞稿要「請中央出來負責」，但那件事其實是市府自己的權責。他也不打算更正。'), opts: [
      { t: T('🛡️ 幫他把新聞稿寫好'), fx: { pop: 4, council: -6, trust: 4 }, r: T('支持者很爽，中央和議會都不爽。') },
      { t: T('🗣️ 勸他承認是市府的事'), fx: { trust: -6, council: 5 }, r: T('他臉很臭地說：「好啦，這次我們處理。」') },
      { t: T('😶 裝沒看到'), fx: g => { g.flags.centralBlind = 1; return { pop: 2 }; }, r: T('之後每件事都是中央的錯。') }] },
    { id: 'tr_portrait_hint', special: 1, title: T('新海報又是市長的臉'), text: T('市府小編傳來新的防災宣導海報，市長的大頭照佔了半張。'), opts: [
      { t: T('✅ 照做'), fx: { pop: 1, staff: -2 }, r: T('小編默默嘆氣。') },
      { t: T('🔍 把臉縮小一點'), fx: { trust: -2 }, r: T('老闆發現了：「怎麼變小了？」') },
      { t: T('🐣 偷偷換成吉祥物'), fx: { trust: -4, pop: 3 }, r: T('脆上說吉祥物比較可愛。') }] },
    { id: 'tr_portrait', special: 1, title: T('老闆的真面目：哪裡都要有我的臉'), text: T('垃圾車貼紙、公車站牌、路燈旗幟，全部換上市長的大頭照。宣傳預算越編越多，議員質詢：「這是市政宣導還是個人宣傳？」'), opts: [
      { t: T('🛡️ 幫他辯護'), fx: { council: -6, budget: -6, trust: 4 }, r: T('脆上梗圖洗版：「打開冰箱也看到市長」。') },
      { t: T('🗣️ 勸他把錢拿去做政見'), fx: g => { g.flags.portraitFixed = 1; return { trust: -6, budget: 6 }; }, r: T('他答應了，但要求政見完工時要有他的臉。') },
      { t: T('😶 裝沒看到'), fx: { budget: -8, pop: -3 }, r: T('連防災手冊封面都是他。') }] },
    { id: 'patronage', special: 1, title: T('酬庸位子：董事改選'), text: g => T('「N 城果菜運銷公司」和「N 城捷運開發公司」的董事長、總經理要改選。黨部、選戰團隊、議員都來要人。{0}', g.trait === 'showoff' || g.trait === 'ear' ? T('老闆說：「這些位子要給自己人，大家辛苦了。」') : ''), opts: [
      { t: T('🎗️ 給黨部推薦的人'), fx: g => ({ council: Math.round(6 * ((CAREER_MAYOR_OFFICE.councils[g.council] || {}).partyMul || 1)), pop: -3 }), r: T('議會這季特別好說話。脆上：「又是酬庸。」') },
      { t: T('🤝 給選戰的自己人'), fx: { trust: 6, pop: -6 }, r: T('老戰友們很感動。記者把每個人的經歷都查出來了。') },
      { t: T('🎓 找專業經理人'), fx: { budget: 5, council: -4, trust: -2 }, r: T('公司營運變好了，但大家說你「不懂人情」。') },
      { t: T('📢 公開徵才'), fx: { pop: 4, council: -2, staff: -2 }, r: T('徵才跑了三個月，被說「不懂政治」，但履歷很漂亮。') }] },
    { id: 'presser', special: 1, title: T('上任百日記者會'), text: T('記者把這一百天做過的事，一件一件拿出來問。從今天起，再說「這是前任留下的」，大家就不買單了。'), opts: [
      { t: T('📋 老實報告抽屜清單'), fx: g => ({ pop: g.drawer.filter(d => d.done).length * 2 - 4 }), r: T('記者寫：「至少很誠實。」') },
      { t: T('🎉 只講做好的'), fx: { pop: 3, council: -3 }, r: T('隔天報紙把沒講的列成一張表。') }] },
    { id: 'eve', final: true, title: T('連任前夕'), text: T('四年過去了。明天就是連任選舉，老闆在辦公室問你：「主任，我們這四年，做得怎麼樣？」'), opts: [
      { t: T('📋 拿出抽屜和政見清單'), fx: {}, r: T('老闆看了很久。') },
      { t: T('🙂 「我們盡力了」'), fx: {}, r: T('老闆笑了：「那就好。」') }] }
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
    const fx = { budget: 6 }; // 每個月的稅收
    if (g.trait === 'image') fx.pop = 2; // 網路聲量王：民意一直漲
    if (g.trait === 'portrait' && !g.flags.portraitFixed) fx.budget -= 2; // 大頭照文宣派：宣傳預算一直吃
    if (g.turn === 11 && g.trait === 'corrupt' && g.flags.blind && !g.flags.whistle) g.flags.caught = g.rng() < 0.6 ? 1 : 0; // 裝沒看到的，不一定躲得掉
    if ((g.drawer.find(d => d.id === 'D') || {}).done) fx.budget += 2;
    if (g.turn === 8 && g.drawer.some(d => d.id === 'G' && !d.done)) { fx.budget = (fx.budget || 0) - 15; g.flags.gBoom = 1; }
    return fx;
  },

  endings: [
    { id: 'questioned', emoji: '🚔', title: T('你也被約談了'), text: T('連任選舉前三個月，調查單位來到市長室。你幫忙擋下的那些餐敘，每一筆都有紀錄。做壞事一定會被抓，幫忙的也一樣。'), when: g => g.trait === 'corrupt' && (g.flags.complicit || g.flags.caught) },
    { id: 'whistle', emoji: '📮', title: T('吹哨者'), text: T('政風處接手調查，老闆的記者會改成道歉記者會。你被調離市長室，但走廊上有幾個公務員偷偷跟你點頭。'), when: g => g.flags.whistle },
    { id: 'walkaway', emoji: '🚪', title: T('全身而退'), text: T('你在連任選舉之前就離開了。新聞只寫了一行：「市長室主任請辭，原因不明。」你知道原因。'), when: g => g.flags.quit },
    { id: 'clean', emoji: '🧹', title: T('清空抽屜的人'), text: T('前任的爛攤子全部挖出來處理完，政見也做到了，一次都沒有甩鍋。秘書長說：「我在這裡 30 年，第一次看到抽屜是空的。」'), when: (g, t) => t.drawer === t.total && g.blamed === 0 && t.pledges >= 2 },
    { id: 'chaos', emoji: '🔥', title: T('府會大亂'), text: T('數值一路暴衝，議會、市府、脆上同時著火。連任前夕的記者會變成道歉記者會。'), when: g => g.overflow >= 4 || Object.values(g.stats).some(v => v <= 0) },
    { id: 'imageking', emoji: '📱', title: T('聲量第一，公文第一多'), text: T('老闆的短影音紅遍全國，民調全國第一。連任辯論上，對手只問了一題：「這四年，市府做了什麼？」全場安靜。'), when: (g, t) => g.trait === 'image' && !g.flags.proxy && !g.flags.imageFixed && t.pledges <= 1 },
    { id: 'reelect', emoji: '🌤️', title: T('連任有望'), text: T('抽屜清了大半，政見也看得到成果。老闆在連任前夕的晚上說：「明天，我們再拚一次。」\n\n……八年後，他坐上了更大的位子。'), when: (g, t) => t.drawer >= t.total - 3 && t.pledges >= 2 },
    { id: 'unseen', emoji: '🫥', title: T('做了很多但沒人看見'), text: T('爛攤子收了一大半，可是政見只兌現了一個以下。脆上：「新市長到底在忙什麼？」'), when: (g, t) => t.drawer >= t.total - 3 && t.pledges <= 1 },
    { id: 'becomeprev', emoji: '🪞', title: T('你也變成前任了'), text: T('政見剪綵剪得很開心，抽屜卻越塞越滿。四年後，下一任市長打開抽屜，翻到你們留下的公文，上面寫著：「另案辦理」。'), when: (g, t) => t.open >= 4 || (t.pledges >= 2 && t.drawer <= t.total - 5) },
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
    { id: 'normal', emoji: '🧑‍💼', name: T('認真的市長室主任'), when: () => true }
  ]
};
if (typeof module !== 'undefined') module.exports = CAREER_MAYOR_OFFICE;
