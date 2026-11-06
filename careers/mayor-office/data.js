// 職業包：Part 2 市長室主任（前任的抽屜）
// 文字一律用 T() 包；Node 模擬時用下面的備用 T
var T = typeof T === 'function' ? T : (s, ...a) => s.replace(/\{(\d)\}/g, (_, i) => a[i]);

const CAREER_MAYOR_OFFICE = {
  id: 'mayor-office', part: 2, turns: 10, shiftTurn: 6, costPer: 3, actionsPerTurn: 2,
  title: T('我推的市長：上任篇'),
  subtitle: T('前任的抽屜'),
  tagline: T('你以為選上就萬歲了？不，是大坑的開始。'),
  role: T('市長室主任'),
  stats: [
    { id: 'pop', emoji: '😊', name: T('民意'), start: 50, low: 10, high: 90 },
    { id: 'council', emoji: '🏛️', name: T('議會'), start: 50, low: 10, high: 90 },
    { id: 'budget', emoji: '💰', name: T('預算'), start: 60, low: 10, high: 90 },
    { id: 'staff', emoji: '💪', name: T('市府士氣'), start: 50, low: 10, high: 90 },
    { id: 'trust', emoji: '🤝', name: T('老闆信任'), start: 60, low: 10, high: 101 }
  ],
  blameEarly: { pop: 5 },
  blameLate: { pop: -8, council: -3 },


  // 組閣：只選 3 個職位；主計、人事、警察、政風依法不由市長任免（畫面上灰色上鎖）
  cabinet: [
    { id: 'vice', name: T('副市長'), domain: ['A', 'C', 'D'] },
    { id: 'finance', name: T('財政局長'), domain: ['F', 'G', 'H', 'budget'] },
    { id: 'works', name: T('工務局長'), domain: ['B', 'E', 'tender'] }
  ],
  lockedSlots: [T('主計處長'), T('人事處長'), T('警察局長'), T('政風處長')],
  cabinetTypes: {
    loyal: { emoji: '🤝', name: T('自己人'), desc: T('忠誠，老闆很放心；但第一次處理公文會出包'), fx: { trust: 4 } },
    pro: { emoji: '🎓', name: T('專業人士'), desc: T('該領域處理成本 −30%；但常跟老闆吵'), fx: { trust: -3 }, costMul: 0.7 },
    holdover: { emoji: '🗂️', name: T('前朝留任'), desc: T('熟門熟路，士氣 +；但心向前任'), fx: { staff: 5, council: 2 } },
    acting: { emoji: '🪑', name: T('先找人代理'), desc: T('不用花時間找人；但該領域成本 +30%'), costMul: 1.3 }
  },
  // 政見：每張走三步（議會審預算 → 採購發包 → 完工剪綵）
  pledgeCount: 3,
  pledgeSteps: [
    { id: 'budget', name: T('議會審預算'), cost: 0, blockedBy: ['G'], failRate: g => Math.max(0.05, (60 - g.stats.council) / 100), failFx: { council: -2 } },
    { id: 'tender', name: T('採購發包'), cost: 8, doubleIf: ['E'], failRate: () => 0.25, failFx: { staff: -2 } },
    { id: 'ribbon', name: T('完工剪綵'), cost: 6, failRate: () => 0.05, failFx: { pop: -2 } }
  ],
  pledges: [
    { id: 'housing', emoji: '🏘️', name: T('社會住宅 3000 戶'), fx: { pop: 7 } },
    { id: 'park', emoji: '🌳', name: T('每區一座共融公園'), fx: { pop: 6, staff: 2 } },
    { id: 'bus', emoji: '🚌', name: T('公車路線大翻新'), fx: { pop: 6, council: 2 } },
    { id: 'daycare', emoji: '🧸', name: T('公共托嬰加倍'), fx: { pop: 6 } },
    { id: 'sidewalk', emoji: '🚶', name: T('人行道還給行人'), fx: { pop: 5, council: 3 } }
  ],
  drawer: [
    { id: 'A', start: 1, look: 1, real: 2, chain: ['C'], fx: { staff: 4 }, title: T('交接清冊第 287 頁'), text: T('移交清冊 300 頁，第 287 頁寫著「詳見附件」，附件不見了。系統密碼只有原承辦知道，他上個月退休了。') },
    { id: 'C', look: 1, real: 3, chain: ['B'], fx: { council: 3 }, title: T('附件找到了'), text: T('附件在地下室的一箱合約裡，最上面那份寫著「期滿自動續約」。') },
    { id: 'B', look: 1, real: 5, fx: { pop: 6 }, title: T('20 年路燈節能合約'), text: T('前任簽了 20 年的路燈節能合約：廠商出錢換 LED、用省下的電費回收。條款寫得很妙：換色溫要另外付費、燈壞了要等廠商、提前解約要賠一大筆。') },
    { id: 'D', start: 1, look: 3, real: 3, conflict: ['E'], conflictKind: 'cost', fx: { pop: 4 }, title: T('多功能藝文體育會展中心'), text: T('蓋好三年沒人用，每年電費比辦活動還貴。') },
    { id: 'E', start: 1, look: 2, real: 4, conflict: ['D'], conflictKind: 'cost', fx: { pop: 5, council: 3 }, title: T('蓋一半的市民天空步道'), text: T('廠商跑了，重新發包流標兩次。') },
    { id: 'F', start: 1, look: 2, real: 3, chain: ['G'], conflict: ['H'], conflictKind: 'block', fx: { pop: 6 }, title: T('敬老加碼政見'), text: T('前任答應敬老金每月加碼，但預算書上只編了半年。') },
    { id: 'G', look: 1, real: 5, fx: { council: 8 }, title: T('不在預算書上的那一筆'), text: T('會計科長小聲說：「有一筆不在預算書上……」前任先用明年的錢付了今年的帳，包商工程款也欠著。') },
    { id: 'H', start: 1, look: 3, real: 4, conflict: ['F'], conflictKind: 'block', fx: { pop: 5, staff: 4 }, title: T('免費營養午餐'), text: T('前任宣布國中小營養午餐全面免費，下學期開始，經費「再想辦法」。') }
  ],

  events: [
    { id: 'typhoon', title: T('颱風假'), text: T('晚上 10 點，雨不大，隔壁縣市已經宣布放假。'), opts: [
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
    { id: 'stamps', title: T('公文旅行'), text: T('一份「辦公室換燈泡」的公文已經蓋了 37 個章，還在第 4 個科室。'), opts: [
      { t: T('🏃 親自拿著公文一間一間跑'), fx: { staff: 4, trust: -3 }, r: T('一個下午跑完 12 個章，老闆找不到你。') },
      { t: T('✂️ 宣布簡化流程，章減一半'), fx: { staff: -6, pop: 4 }, r: T('秘書長說：「上一個這樣做的人……」然後沒說完。') },
      { t: T('📎 放著，讓它自然旅行'), fx: { pop: -2 }, r: T('燈泡到月底還是壞的。') }] },
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
    { id: 'presser', final: true, title: T('上任百日記者會'), text: T('記者把這一百天做過的事，一件一件拿出來問。'), opts: [
      { t: T('📋 老實報告抽屜清單'), fx: g => ({ pop: g.drawer.filter(d => d.done).length * 2 - 4 }), r: T('記者寫：「至少很誠實。」') },
      { t: T('🎉 只講做好的'), fx: { pop: 3, council: -3 }, r: T('隔天報紙把沒講的列成一張表。') }] }
  ],

  // 擱置太久的公文爆開
  boom: (d, g) => ({ id: 'boom_' + d.id, boom: true, title: T('爆開了：{0}', CAREER_MAYOR_OFFICE.drawer.find(x => x.id === d.id).title), text: T('擱置太久，事情變大了，記者已經在門口。'), opts: [
    { t: T('🧯 緊急處理'), fx: { budget: -18, staff: -5 }, r: T('花了比原本多三倍的錢。') },
    { t: T('🫣 繼續裝沒看到'), fx: { pop: -12, council: -6 }, r: T('脆上開始倒數你們的任期。') }] }),

  onTurnEnd: g => {
    const fx = { budget: 6 }; // 每個月的稅收
    if (g.drawer.find(d => d.id === 'D').done) fx.budget += 2;
    if (g.turn === 9 && !g.drawer.find(d => d.id === 'G').done) { fx.budget = (fx.budget || 0) - 15; g.flags.gBoom = 1; }
    return fx;
  },

  endings: [
    { id: 'clean', emoji: '🧹', title: T('清空抽屜的人'), text: T('前任的 8 份爛攤子全部挖出來處理完，一次都沒有甩鍋。秘書長說：「我在這裡 30 年，第一次看到抽屜是空的。」'), when: (g, t) => t.drawer === 8 && g.blamed === 0 },
    { id: 'chaos', emoji: '🔥', title: T('府會大亂'), text: T('數值一路暴衝，議會、市府、脆上同時著火。百日記者會變成道歉記者會。'), when: g => g.overflow >= 3 || Object.values(g.stats).some(v => v <= 0) },
    { id: 'reelect', emoji: '🌤️', title: T('連任有望'), text: T('抽屜清了大半，政見也看得到成果。老闆在記者會最後說：「四年後，我們再拚一次。」'), when: (g, t) => t.drawer >= 5 && t.pledges >= 2 },
    { id: 'unseen', emoji: '🫥', title: T('做了很多但沒人看見'), text: T('前任的爛攤子收了一大半，可是政見一個都沒兌現。脆上：「新市長到底在忙什麼？」'), when: (g, t) => t.drawer >= 5 && t.pledges <= 1 },
    { id: 'becomeprev', emoji: '🪞', title: T('你也變成前任了'), text: T('政見剪綵剪得很開心，抽屜卻越塞越滿。四年後，下一任市長打開抽屜，看到你寫的便利貼：「詳見附件」。'), when: (g, t) => t.open >= 4 || (t.pledges >= 2 && t.drawer <= 3) },
    { id: 'meh', emoji: '📎', title: T('平安下莊，抽屜還很滿'), text: T('一百天過去了，沒出大事，也沒做成什麼大事。秘書長：「很正常，大家都這樣。」'), when: () => true }
  ]
};
if (typeof module !== 'undefined') module.exports = CAREER_MAYOR_OFFICE;
