// Speichert alle Daten im Browser (localStorage) auf diesem Gerät.
// Nichts wird ins Internet geschickt.

import {
  todayKey, isValidKey, daysBetween, addDays, isoWeekday, startOfWeek,
} from './dates.js';

const KEY = 'tagesplaner-v1'; // Name bleibt gleich, damit vorhandene Daten erhalten bleiben
const BEFORE_IMPORT_KEY = 'tagesplaner-v1-vor-import';
const BROKEN_KEY = 'tagesplaner-v1-defekt';

export const LIMITS = {
  taskText: 500,
  eventTitle: 200,
  notes: 100000,
  tasks: 20000,
  events: 10000,
  blocksPerDay: 60,
  listItems: 500,
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;
const ICON_RE = /^[a-z]{1,20}$/;
export const LIST_KINDS = ['daily', 'weekly', 'longterm'];
const WEEKDAYS = ['1', '2', '3', '4', '5', '6', '7'];

// Routine-Blöcke aus der Vorlage werden nach so vielen Tagen aufgeräumt.
const KEEP_TEMPLATE_DAYS = 400;
// So weit zurück werden verpasste Tage noch aus der Vorlage befüllt.
const FILL_BACK_DAYS = 31;

function emptyTemplate() {
  const days = {};
  for (const wd of WEEKDAYS) days[wd] = [];
  return { from: null, days };
}

export function emptyData() {
  return {
    version: 2,
    tasks: [],
    events: [],
    notes: '',
    template: emptyTemplate(),
    filled: [],
    lists: { daily: [], weekly: [], longterm: [] },
    settings: { firstUsed: null, lastBackup: null, snoozeUntil: null },
  };
}

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function cleanText(value, max) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

const cleanTime = (v) => (typeof v === 'string' && TIME_RE.test(v) ? v : '');
const cleanIcon = (v) => (typeof v === 'string' && ICON_RE.test(v) ? v : '');
const dateOrNull = (v) => (isValidKey(v) ? v : null);

// Uhrzeit von–bis: „bis“ nur, wenn es nach „von“ liegt.
function cleanTimes(start, end) {
  const s = cleanTime(start);
  const e = cleanTime(end);
  return { start: s, end: s && e > s ? e : '' };
}

// Prüft Daten von außen (gespeicherter Stand oder Sicherungsdatei).
// Übernimmt nur bekannte Felder mit passendem Typ. Wirft einen Fehler,
// wenn die Daten nicht wie ein Tagesplaner aussehen.
// Versteht das alte Format (Version 1) und das neue (Version 2).
export function sanitize(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Keine Planer-Daten');
  }
  if (input.version !== 1 && input.version !== 2) throw new Error('Unbekannte Version');
  if (!Array.isArray(input.tasks) || !Array.isArray(input.events)) {
    throw new Error('Aufgaben oder Termine fehlen');
  }

  const usedIds = new Set();
  const uniqueId = (id) => {
    let value = typeof id === 'string' && ID_RE.test(id) ? id : newId();
    while (usedIds.has(value)) value = newId();
    usedIds.add(value);
    return value;
  };
  const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v);

  const tasks = [];
  for (const t of input.tasks.slice(-LIMITS.tasks)) {
    if (!isObject(t)) continue;
    const text = cleanText(t.text, LIMITS.taskText).trim();
    if (!text || !isValidKey(t.date)) continue;
    tasks.push({
      id: uniqueId(t.id),
      date: t.date,
      text,
      done: t.done === true,
      ...cleanTimes(t.start, t.end),
      icon: cleanIcon(t.icon),
      tpl: typeof t.tpl === 'string' && ID_RE.test(t.tpl) ? t.tpl : '',
    });
  }

  const events = [];
  for (const e of input.events.slice(0, LIMITS.events)) {
    if (!isObject(e)) continue;
    const title = cleanText(e.title, LIMITS.eventTitle).trim();
    if (!title || !isValidKey(e.date)) continue;
    events.push({ id: uniqueId(e.id), date: e.date, time: cleanTime(e.time), title });
  }

  const template = emptyTemplate();
  const inTemplate = isObject(input.template) ? input.template : {};
  const inDays = isObject(inTemplate.days) ? inTemplate.days : {};
  template.from = dateOrNull(inTemplate.from);
  for (const wd of WEEKDAYS) {
    const blocks = Array.isArray(inDays[wd]) ? inDays[wd] : [];
    for (const b of blocks.slice(0, LIMITS.blocksPerDay)) {
      if (!isObject(b)) continue;
      const text = cleanText(b.text, LIMITS.taskText).trim();
      if (!text) continue;
      template.days[wd].push({ id: uniqueId(b.id), text, ...cleanTimes(b.start, b.end), icon: cleanIcon(b.icon) });
    }
  }

  const filled = Array.isArray(input.filled)
    ? [...new Set(input.filled.filter(isValidKey))].slice(-400)
    : [];

  const inLists = isObject(input.lists) ? input.lists : {};
  const lists = { daily: [], weekly: [], longterm: [] };
  for (const kind of LIST_KINDS) {
    const items = Array.isArray(inLists[kind]) ? inLists[kind] : [];
    for (const item of items.slice(0, LIMITS.listItems)) {
      if (!isObject(item)) continue;
      const text = cleanText(item.text, LIMITS.taskText).trim();
      if (!text) continue;
      const clean = { id: uniqueId(item.id), text };
      if (kind === 'daily') clean.doneOn = dateOrNull(item.doneOn);
      if (kind === 'weekly') clean.doneWeek = dateOrNull(item.doneWeek);
      if (kind === 'longterm') clean.done = item.done === true;
      lists[kind].push(clean);
    }
  }

  const s = isObject(input.settings) ? input.settings : {};

  return {
    version: 2,
    tasks,
    events,
    notes: cleanText(input.notes, LIMITS.notes),
    template,
    filled,
    lists,
    settings: {
      firstUsed: dateOrNull(s.firstUsed),
      lastBackup: dateOrNull(s.lastBackup),
      snoozeUntil: dateOrNull(s.snoozeUntil),
    },
  };
}

// ----- Laden und Speichern -----

let onError = () => {};
export function onSaveError(handler) {
  onError = handler;
}

function load() {
  let raw = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return emptyData();
  }
  if (!raw) return emptyData();
  try {
    return sanitize(JSON.parse(raw));
  } catch {
    // Beschädigten Stand aufheben statt ihn still zu überschreiben.
    try { localStorage.setItem(BROKEN_KEY, raw); } catch { /* nichts zu tun */ }
    return emptyData();
  }
}

let data = load();
if (!data.settings.firstUsed) data.settings.firstUsed = todayKey();
save(); // speichert gleich im neuen Format

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    onError();
    return false;
  }
}

// ----- Hilfen -----

const byId = (list, id) => list.find((item) => item.id === id);
const copy = (item) => ({ ...item });

// Sortiert Einträge: zuerst mit Uhrzeit (nach Uhrzeit), dann ohne Uhrzeit (offene zuerst).
export function sortItems(items) {
  const timed = items.filter((i) => i.start).sort((a, b) => (a.start + a.end).localeCompare(b.start + b.end));
  const untimed = items.filter((i) => !i.start);
  return [...timed, ...untimed.filter((i) => !i.done), ...untimed.filter((i) => i.done)];
}

// Entfernt Einträge und merkt sich ihre Position, damit „Rückgängig“ möglich ist.
function removeFrom(list, ids) {
  const removed = [];
  for (let index = list.length - 1; index >= 0; index -= 1) {
    if (ids.includes(list[index].id)) removed.unshift({ item: list.splice(index, 1)[0], index });
  }
  save();
  return removed;
}

function putBack(list, removed) {
  for (const { item, index } of removed) list.splice(Math.min(index, list.length), 0, item);
  save();
}

// ----- Ein Tag: eigene Aufgaben + Blöcke aus der Wochenvorlage -----
//
// Solange an einem Tag noch nichts abgehakt oder geändert wurde, werden die Blöcke
// direkt aus der Vorlage angezeigt („virtuell“). Erst bei der ersten Änderung werden
// sie als Aufgaben in den Tag kopiert. So wirken Änderungen an der Vorlage auf alle
// Tage, die noch unberührt sind.

function templateBlocksFor(date) {
  return data.template.days[String(isoWeekday(date))] || [];
}

function usesTemplate(date) {
  const from = data.template.from;
  if (!from || date < from) return false;
  if (date < addDays(todayKey(), -FILL_BACK_DAYS)) return false;
  if (data.filled.includes(date)) return false;
  return templateBlocksFor(date).length > 0;
}

function fillDay(date) {
  if (!usesTemplate(date)) return;
  for (const b of templateBlocksFor(date)) {
    data.tasks.push({
      id: newId(), date, text: b.text, done: false, start: b.start, end: b.end, icon: b.icon, tpl: b.id,
    });
  }
  data.filled.push(date);
}

// Wandelt die Kennung eines Eintrags in die einer echten Aufgabe um.
function realTaskId(date, id) {
  if (!String(id).startsWith('tpl:')) return id;
  fillDay(date);
  const task = data.tasks.find((t) => t.date === date && t.tpl === id.slice(4));
  return task ? task.id : null;
}

export function dayItems(date) {
  const items = data.tasks.filter((t) => t.date === date).map(copy);
  if (usesTemplate(date)) {
    for (const b of templateBlocksFor(date)) {
      items.push({ ...b, id: `tpl:${b.id}`, date, done: false, tpl: b.id });
    }
  }
  return sortItems(items);
}

// Vergangene Tage einfrieren, damit spätere Änderungen an der Vorlage sie nicht verändern.
// Außerdem sehr alte Routine-Blöcke aufräumen, damit der Speicher nicht vollläuft.
export function freezePastDays() {
  const today = todayKey();
  let changed = false;
  if (data.template.from) {
    const earliest = addDays(today, -FILL_BACK_DAYS);
    for (let d = data.template.from > earliest ? data.template.from : earliest; d < today; d = addDays(d, 1)) {
      if (usesTemplate(d)) {
        fillDay(d);
        changed = true;
      }
    }
  }
  const keepFilled = addDays(today, -(FILL_BACK_DAYS + 10));
  const filled = data.filled.filter((d) => d >= keepFilled);
  const keepTasks = addDays(today, -KEEP_TEMPLATE_DAYS);
  const tasks = data.tasks.filter((t) => !t.tpl || t.date >= keepTasks);
  if (filled.length !== data.filled.length || tasks.length !== data.tasks.length) {
    data.filled = filled;
    data.tasks = tasks;
    changed = true;
  }
  if (changed) save();
}

export function addTask(date, text, start = '', end = '') {
  const clean = String(text).trim().slice(0, LIMITS.taskText);
  if (!clean || !isValidKey(date)) return null;
  const task = { id: newId(), date, text: clean, done: false, ...cleanTimes(start, end), icon: '', tpl: '' };
  data.tasks.push(task);
  save();
  return task;
}

export function setDone(date, id, done) {
  const task = byId(data.tasks, realTaskId(date, id));
  if (!task) return;
  task.done = Boolean(done);
  save();
}

// changes: { text, start, end, icon } – fehlende Felder bleiben unverändert.
function applyChanges(item, changes) {
  if ('text' in changes) {
    const clean = String(changes.text).trim().slice(0, LIMITS.taskText);
    if (clean) item.text = clean;
  }
  if ('start' in changes || 'end' in changes) {
    Object.assign(item, cleanTimes(changes.start ?? item.start, changes.end ?? item.end));
  }
  if ('icon' in changes) item.icon = cleanIcon(changes.icon);
}

export function updateItem(date, id, changes) {
  const task = byId(data.tasks, realTaskId(date, id));
  if (!task) return;
  applyChanges(task, changes);
  save();
}

export function deleteItem(date, id) {
  const realId = realTaskId(date, id);
  return realId ? removeFrom(data.tasks, [realId]) : [];
}

// Offene, selbst eingetragene Aufgaben von früheren Tagen.
// Routine-Blöcke aus der Vorlage zählen nicht dazu.
export function openTasksBefore(date) {
  return data.tasks.filter((t) => !t.done && !t.tpl && t.date < date);
}

export function moveTasks(ids, date) {
  if (!isValidKey(date)) return;
  for (const id of ids) {
    const task = byId(data.tasks, id);
    if (task) task.date = date;
  }
  save();
}

export const deleteTasks = (ids) => removeFrom(data.tasks, ids);
export const restoreTasks = (removed) => putBack(data.tasks, removed);

// ----- Wochenvorlage -----

export function hasTemplate() {
  return WEEKDAYS.some((wd) => data.template.days[wd].length > 0);
}

export function templateDay(wd) {
  return sortItems(data.template.days[String(wd)].map(copy));
}

export function addTemplateBlock(wd, text, start = '', end = '') {
  const list = data.template.days[String(wd)];
  const clean = String(text).trim().slice(0, LIMITS.taskText);
  if (!list || !clean || list.length >= LIMITS.blocksPerDay) return null;
  const block = { id: newId(), text: clean, ...cleanTimes(start, end), icon: '' };
  list.push(block);
  if (!data.template.from) data.template.from = todayKey();
  save();
  return block;
}

export function updateTemplateBlock(wd, id, changes) {
  const block = byId(data.template.days[String(wd)], id);
  if (!block) return;
  applyChanges(block, changes);
  save();
}

export function deleteTemplateBlock(wd, id) {
  return { wd: String(wd), removed: removeFrom(data.template.days[String(wd)], [id]) };
}

export function restoreTemplateBlock({ wd, removed }) {
  putBack(data.template.days[wd], removed);
}

// Kopiert alle Blöcke eines Tages auf andere Tage (ersetzt die Blöcke dort).
// Gibt den vorherigen Stand zurück, damit „Rückgängig“ möglich ist.
export function copyTemplateDay(fromWd, toWds) {
  const previous = {};
  const source = data.template.days[String(fromWd)];
  for (const wd of toWds.map(String)) {
    if (wd === String(fromWd) || !data.template.days[wd]) continue;
    previous[wd] = data.template.days[wd];
    data.template.days[wd] = source.map((b) => ({ ...b, id: newId() }));
  }
  if (!data.template.from && source.length) data.template.from = todayKey();
  save();
  return previous;
}

export function restoreTemplateDays(previous) {
  Object.assign(data.template.days, previous);
  save();
}

// ----- Listen: täglich, wöchentlich, langfristig -----

function isListDone(kind, item) {
  if (kind === 'daily') return item.doneOn === todayKey();
  if (kind === 'weekly') return item.doneWeek === startOfWeek(todayKey());
  return item.done === true;
}

export function listItems(kind) {
  return data.lists[kind].map((item) => ({ id: item.id, text: item.text, done: isListDone(kind, item) }));
}

export function addListItem(kind, text) {
  const list = data.lists[kind];
  const clean = String(text).trim().slice(0, LIMITS.taskText);
  if (!list || !clean || list.length >= LIMITS.listItems) return null;
  const item = { id: newId(), text: clean };
  if (kind === 'daily') item.doneOn = null;
  if (kind === 'weekly') item.doneWeek = null;
  if (kind === 'longterm') item.done = false;
  list.push(item);
  save();
  return item;
}

export function toggleListItem(kind, id) {
  const item = byId(data.lists[kind], id);
  if (!item) return;
  const done = !isListDone(kind, item);
  if (kind === 'daily') item.doneOn = done ? todayKey() : null;
  if (kind === 'weekly') item.doneWeek = done ? startOfWeek(todayKey()) : null;
  if (kind === 'longterm') item.done = done;
  save();
}

export function updateListItem(kind, id, text) {
  const item = byId(data.lists[kind], id);
  const clean = String(text).trim().slice(0, LIMITS.taskText);
  if (!item || !clean) return;
  item.text = clean;
  save();
}

export function deleteListItem(kind, id) {
  return { kind, removed: removeFrom(data.lists[kind], [id]) };
}

export function restoreListItem({ kind, removed }) {
  putBack(data.lists[kind], removed);
}

// ----- Termine -----

export function eventsOn(date) {
  return data.events
    .filter((e) => e.date === date)
    .sort((a, b) => a.time.localeCompare(b.time));
}

export function allEvents() {
  return data.events;
}

export function addEvent(date, title, time) {
  const clean = String(title).trim().slice(0, LIMITS.eventTitle);
  if (!clean || !isValidKey(date)) return null;
  const event = { id: newId(), date, time: cleanTime(time), title: clean };
  data.events.push(event);
  save();
  return event;
}

export const deleteEvents = (ids) => removeFrom(data.events, ids);
export const restoreEvents = (removed) => putBack(data.events, removed);

// ----- Notizen -----

export function getNotes() {
  return data.notes;
}

export function setNotes(text) {
  data.notes = String(text).slice(0, LIMITS.notes);
  return save();
}

// ----- Sicherung -----

export function hasContent() {
  return data.tasks.length > 0
    || data.events.length > 0
    || data.notes.trim() !== ''
    || hasTemplate()
    || LIST_KINDS.some((kind) => data.lists[kind].length > 0);
}

// Kurze Zusammenfassung für die Vorschau beim Wiederherstellen.
export function summarize(d) {
  return {
    tasks: d.tasks.filter((t) => !t.tpl).length,
    events: d.events.length,
    templateBlocks: WEEKDAYS.reduce((sum, wd) => sum + d.template.days[wd].length, 0),
    listItems: LIST_KINDS.reduce((sum, kind) => sum + d.lists[kind].length, 0),
    hasNotes: d.notes.trim() !== '',
  };
}

export function lastBackup() {
  return data.settings.lastBackup;
}

export function markBackup() {
  data.settings.lastBackup = todayKey();
  data.settings.snoozeUntil = null;
  save();
}

export function snoozeReminder(days) {
  data.settings.snoozeUntil = addDays(todayKey(), days);
  save();
}

export function backupDue() {
  const { lastBackup: last, firstUsed, snoozeUntil } = data.settings;
  const today = todayKey();
  if (!hasContent()) return false;
  if (snoozeUntil && today < snoozeUntil) return false;
  const since = last || firstUsed;
  return Boolean(since) && daysBetween(since, today) >= 14;
}

export function exportJson() {
  return JSON.stringify({ ...data, exportedAt: todayKey() }, null, 2);
}

// Ersetzt alle Daten durch eine geprüfte Sicherung.
// Der bisherige Stand wird vorher aufgehoben, damit man zurück kann.
export function replaceAll(newData) {
  try {
    localStorage.setItem(BEFORE_IMPORT_KEY, JSON.stringify(data));
  } catch {
    onError();
    return false;
  }
  data = newData;
  if (!data.settings.firstUsed) data.settings.firstUsed = todayKey();
  return save();
}

export function hasStateBeforeImport() {
  try {
    return Boolean(localStorage.getItem(BEFORE_IMPORT_KEY));
  } catch {
    return false;
  }
}

export function undoImport() {
  try {
    const raw = localStorage.getItem(BEFORE_IMPORT_KEY);
    if (!raw) return false;
    data = sanitize(JSON.parse(raw));
    if (!save()) return false;
    localStorage.removeItem(BEFORE_IMPORT_KEY);
    return true;
  } catch {
    return false;
  }
}
