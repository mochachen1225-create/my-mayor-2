// 翻譯：目前只有中文；英文字典之後放 js/i18n.en.js（key 是中文原文，參數用 {0}）
var LANG = 'zh';
var I18N = {};
function T(s, ...a) {
  const d = I18N[LANG];
  const t = (d && d[s]) || s;
  return t.replace(/\{(\d)\}/g, (_, i) => a[i] !== undefined ? a[i] : '');
}
