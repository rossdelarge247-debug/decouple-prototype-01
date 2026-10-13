/* Decouple · Google Apps Script backend (docs/SITE-SPEC.md §6).
   Bound to the results spreadsheet. Deployed as a web app: Execute as me, Who has access: Anyone.
   Every call carries secret = APPS_SCRIPT_SECRET (a script property), checked first.
   The site talks to it through /api; nothing else does. The original Google Form stays untouched as a backup. */

var ANSWER_HEADERS = ['received_at', 'batch_key', 'sid', 'pid', 'test', 'step', 'price', 'landing', 'qid', 'qv', 'question', 'type', 'answer', 'device'];
var SIGNUP_HEADERS = ['received_at', 'email', 'stage', 'source', 'sid'];
var CODE_HEADERS = ['code', 'label', 'active', 'test', 'expires', 'created', 'uses', 'last_used'];
var QUESTION_HEADERS = ['id', 'section', 'type', 'label', 'helper', 'options', 'show_if', 'required', 'max', 'exclusive', 'placeholder', 'skip', 'version', 'active'];
var KNOWN_TESTS = ['M02 Guide', 'Prototype testing'];
var SIX_HOURS = 21600;

/* ── plumbing ── */
function secret_() {
  return PropertiesService.getScriptProperties().getProperty('APPS_SCRIPT_SECRET') || '';
}
function out_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
function refuse_(message) {
  return out_({ ok: false, error: message });
}
function allowed_(given) {
  var s = secret_();
  return !!(s && given && String(given) === s);
}
function tz_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone() || 'Europe/London';
}
function iso_(v) {
  if (v instanceof Date) return isNaN(v.getTime()) ? '' : v.toISOString();
  return v == null ? '' : String(v);
}
function day_(v) {
  if (v instanceof Date) return isNaN(v.getTime()) ? '' : Utilities.formatDate(v, tz_(), 'yyyy-MM-dd');
  var s = v == null ? '' : String(v).trim();
  var m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? m[1] + '-' + m[2] + '-' + m[3] : s;
}
function bool_(v) {
  if (typeof v === 'boolean') return v;
  var s = String(v == null ? '' : v).trim().toLowerCase();
  return s === 'true' || s === 'yes' || s === '1' || s === 'y';
}
/* A tab, created with its header row if it is missing */
function tab_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (sh.getLastRow() === 0 && headers) {
    sh.appendRow(headers);
    sh.setFrozenRows(1);
  }
  return sh;
}
/* Every data row of a tab as an object keyed by the header row */
function rows_(sh) {
  var last = sh.getLastRow(), cols = sh.getLastColumn();
  if (last < 2 || cols < 1) return [];
  var values = sh.getRange(1, 1, last, cols).getValues();
  var head = values[0].map(function (h) { return String(h).trim(); });
  var out = [];
  for (var i = 1; i < values.length; i++) {
    var row = {}, empty = true;
    for (var j = 0; j < head.length; j++) {
      if (!head[j]) continue;
      var v = values[i][j];
      if (v !== '' && v != null) empty = false;
      row[head[j]] = v;
    }
    if (!empty) out.push(row);
  }
  return out;
}
function appendRows_(sh, rows) {
  if (!rows.length) return;
  sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
}

/* ── GET ── */
function doGet(e) {
  var p = (e && e.parameter) || {};
  if (!allowed_(p.secret)) return refuse_('Forbidden');
  try {
    if (p.action === 'codes') return out_({ ok: true, codes: codes_() });
    if (p.action === 'questions') return out_({ ok: true, questions: questions_() });
    if (p.action === 'results') return out_(results_(p.test, p.since));
    return refuse_('Unknown action');
  } catch (err) {
    return refuse_(String(err && err.message ? err.message : err));
  }
}

/* ── POST ── */
function doPost(e) {
  var body;
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return refuse_('Expected JSON');
  }
  if (!body || !allowed_(body.secret)) return refuse_('Forbidden');
  try {
    if (body.kind === 'answers') return out_(answers_(body));
    if (body.kind === 'signup') return out_(signup_(body));
    if (body.kind === 'codes') return out_({ ok: true, codes: codesOp_(body) });
    if (body.kind === 'code_used') return out_({ ok: true, codes: codeUsed_(body.code) });
    return refuse_('Unknown kind');
  } catch (err) {
    return refuse_(String(err && err.message ? err.message : err));
  }
}

/* kind: "answers". One row per answer, in the tab named after the test. A batch_key seen in the
   last 6 hours is dropped, so a retried send never doubles up. */
function answers_(b) {
  var key = 'batch:' + String(b.batchKey || '').slice(0, 200);
  if (!b.batchKey) throw new Error('batchKey is required');
  var test = String(b.test || '').trim();
  if (!test) throw new Error('test is required');
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var cache = CacheService.getScriptCache();
    if (cache.get(key)) return { ok: true, duplicate: true };
    var sh = tab_(test, ANSWER_HEADERS);
    var now = new Date();
    var rows = (b.rows || []).map(function (r) {
      return [now, b.batchKey, b.sid || '', b.pid || '', test, b.step || '', b.price || '', b.landing || '', r.qid || '', r.qv || 1, r.q || '', r.type || '', r.a || '', b.device || ''];
    });
    appendRows_(sh, rows);
    cache.put(key, '1', SIX_HOURS);
    return { ok: true, rows: rows.length };
  } finally {
    lock.releaseLock();
  }
}

/* kind: "signup" */
function signup_(b) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = tab_('Signups', SIGNUP_HEADERS);
    appendRows_(sh, [[new Date(), b.email || '', b.stage || '', b.source || '', b.sid || '']]);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

/* The Codes tab as the site expects it */
function codes_() {
  var sh = tab_('Codes', CODE_HEADERS);
  return rows_(sh).map(function (r) {
    return {
      code: String(r.code || '').trim().toUpperCase(),
      label: String(r.label || ''),
      active: bool_(r.active),
      test: bool_(r.test),
      expires: day_(r.expires),
      created: iso_(r.created),
      uses: Number(r.uses) || 0,
      last_used: iso_(r.last_used)
    };
  }).filter(function (r) { return r.code; });
}
function codeRow_(sh, code) {
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var col = sh.getRange(2, 1, last - 1, 1).getValues();
  for (var i = 0; i < col.length; i++) if (String(col[i][0]).trim().toUpperCase() === code) return i + 2;
  return 0;
}

/* kind: "codes", op: create | update | delete. Returns the full list. */
function codesOp_(b) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = tab_('Codes', CODE_HEADERS);
    if (b.op === 'create') {
      var existing = {};
      codes_().forEach(function (r) { existing[r.code] = true; });
      var rows = [];
      (b.codes || []).forEach(function (c) {
        var code = String(c.code || '').trim().toUpperCase();
        if (!code) throw new Error('A code is empty');
        if (existing[code]) throw new Error(code + ' already exists');
        existing[code] = true;
        rows.push([code, String(c.label || ''), true, !!c.test, c.expires ? String(c.expires) : '', new Date(), 0, '']);
      });
      appendRows_(sh, rows);
      if (rows.length) sh.getRange(sh.getLastRow() - rows.length + 1, 5, rows.length, 1).setNumberFormat('@');
    } else if (b.op === 'update') {
      var code = String(b.code || '').trim().toUpperCase();
      var at = codeRow_(sh, code);
      if (!at) throw new Error(code + ' was not found');
      if ('active' in b) sh.getRange(at, 3).setValue(!!b.active);
      if ('test' in b) sh.getRange(at, 4).setValue(!!b.test);
      if ('label' in b) sh.getRange(at, 2).setValue(String(b.label || ''));
      if ('expires' in b) { sh.getRange(at, 5).setNumberFormat('@'); sh.getRange(at, 5).setValue(b.expires ? String(b.expires) : ''); }
    } else if (b.op === 'delete') {
      var del = String(b.code || '').trim().toUpperCase();
      var row = codeRow_(sh, del);
      if (row) sh.deleteRow(row);
    } else {
      throw new Error('Unknown op');
    }
    return codes_();
  } finally {
    lock.releaseLock();
  }
}

/* kind: "code_used": uses + 1, last_used = now */
function codeUsed_(code) {
  var c = String(code || '').trim().toUpperCase();
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sh = tab_('Codes', CODE_HEADERS);
    var at = codeRow_(sh, c);
    if (at) {
      var uses = Number(sh.getRange(at, 7).getValue()) || 0;
      sh.getRange(at, 7).setValue(uses + 1);
      sh.getRange(at, 8).setValue(new Date());
    }
    return codes_();
  } finally {
    lock.releaseLock();
  }
}

/* The M02 Questions tab, every cell as text */
function questions_() {
  var sh = tab_('M02 Questions', QUESTION_HEADERS);
  return rows_(sh).map(function (r) {
    var o = {};
    Object.keys(r).forEach(function (k) { o[k] = r[k] instanceof Date ? iso_(r[k]) : String(r[k] == null ? '' : r[k]); });
    return o;
  });
}

/* action=results&test=…&since=ISO: the answer rows plus a sign-up summary. Email addresses are never returned. */
function results_(test, since) {
  var from = since ? new Date(since) : null;
  if (from && isNaN(from.getTime())) from = null;
  var rows = [];
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var names = test ? [String(test)] : ss.getSheets().map(function (s) { return s.getName(); }).filter(function (n) { return n !== 'Signups' && n !== 'Codes' && n !== 'M02 Questions'; });
  names.forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (!sh) return;
    rows_(sh).forEach(function (r) {
      if (!('qid' in r) || !('batch_key' in r)) return;
      var at = r.received_at instanceof Date ? r.received_at : new Date(r.received_at);
      if (from && at < from) return;
      rows.push({ sid: iso_(r.sid), pid: iso_(r.pid), test: iso_(r.test) || name, step: iso_(r.step), price: iso_(r.price), landing: iso_(r.landing), qid: iso_(r.qid), qv: Number(r.qv) || 1, q: iso_(r.question), type: iso_(r.type), a: iso_(r.answer), at: iso_(at), device: iso_(r.device) });
    });
  });
  /* byDay: one count per day for the last 28 days, oldest first, today last, as the Results page charts it */
  var DAYS = 28, tz = tz_(), today = new Date();
  var dayKeys = [], byDayIndex = {};
  for (var d = DAYS - 1; d >= 0; d--) {
    var k = Utilities.formatDate(new Date(today.getTime() - d * 86400000), tz, 'yyyy-MM-dd');
    byDayIndex[k] = dayKeys.length;
    dayKeys.push(k);
  }
  var signups = { count: 0, byStage: {}, byDay: dayKeys.map(function () { return 0; }) };
  var su = ss.getSheetByName('Signups');
  if (su) {
    rows_(su).forEach(function (r) {
      var at = r.received_at instanceof Date ? r.received_at : new Date(r.received_at);
      if (from && at < from) return;
      signups.count += 1;
      String(r.stage || '').split(';').map(function (s) { return s.trim(); }).filter(String).forEach(function (s) { signups.byStage[s] = (signups.byStage[s] || 0) + 1; });
      if (!isNaN(at.getTime())) {
        var key = Utilities.formatDate(at, tz, 'yyyy-MM-dd');
        if (key in byDayIndex) signups.byDay[byDayIndex[key]] += 1;
      }
    });
  }
  return { ok: true, rows: rows, signups: signups };
}
