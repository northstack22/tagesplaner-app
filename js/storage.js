// Speichert alle Daten im Browser (localStorage) auf diesem Gerät.
// Nichts wird ins Internet geschickt.

import { todayKey, isValidKey, daysBetween, addDays } from './dates.js';

const KEY = 'tagesplaner-v1';
const BEFORE_IMPORT_KEY = 'tagesplaner-v1-vor-import';
const BROKEN_KEY = 'tagesplaner-v1-defekt';

export const LIMITS = {
  taskText: 500,
  eventTitle: 200,
  notes: 100000,
  tasks: 20000,
  events: 10000,
};

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;

export function emptyData() {
  return {
    version: 1,
    tasks: [],
    events: [],
    notes: '',
    settings: { firstUsed: null, lastBackup: null, snoozeUntil: null },
  };
}

export function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function cleanText(value, max) {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

// Prüft Daten von außen (gespeicherter Stand oder Sicherungsdatei).
// Übernimmt nur bekannte Felder mit passendem Typ. Wirft einen Fehler,
// wenn die Daten nicht wie ein Tagesplaner aussehen.
export function sanitize(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Keine Planer-Daten');
  }
  if (input.version !== 1) throw new Error('Unbekannte Version');
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

  const tasks = [];
  for (const t of input.tasks.slice(0, LIMITS.tasks)) {
    if (!t || typeof t !== 'object') continue;
    const text = cleanText(t.text, LIMITS.taskText).trim();
    if (!text || !isValidKey(t.date)) continue;
    tasks.push({ id: uniqueId(t.id), date: t.date, text, done: t.done === true });
  }

  const events = [];
  for (const e of input.events.slice(0, LIMITS.events)) {
    if (!e || typeof e !== 'object') continue;
    const title = cleanText(e.title, LIMITS.eventTitle).trim();
    if (!title || !isValidKey(e.date)) continue;
    const time = typeof e.time === 'string' && TIME_RE.test(e.time) ? e.time : '';
    events.push({ id: uniqueId(e.id), date: e.date, time, title });
  }

  const s = input.settings && typeof input.settings === 'object' ? input.settings : {};
  const dateOrNull = (v) => (isValidKey(v) ? v : null);

  return {
    version: 1,
    tasks,
    events,
    notes: cleanText(input.notes, LIMITS.notes),
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
if (!data.settings.firstUsed) {
  data.settings.firstUsed = todayKey();
  save();
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    return true;
  } catch {
    onError();
    return false;
  }
}

// ----- Aufgaben -----

const byId = (list, id) => list.find((item) => item.id === id);

export function tasksOn(date) {
  return data.tasks.filter((t) => t.date === date);
}

export function openTasksBefore(date) {
  return data.tasks.filter((t) => !t.done && t.date < date);
}

export function addTask(date, text) {
  const clean = String(text).trim().slice(0, LIMITS.taskText);
  if (!clean || !isValidKey(date)) return null;
  const task = { id: newId(), date, text: clean, done: false };
  data.tasks.push(task);
  save();
  return task;
}

export function setTaskDone(id, done) {
  const task = byId(data.tasks, id);
  if (!task) return;
  task.done = Boolean(done);
  save();
}

export function setTaskText(id, text) {
  const task = byId(data.tasks, id);
  const clean = String(text).trim().slice(0, LIMITS.taskText);
  if (!task || !clean) return;
  task.text = clean;
  save();
}

export function moveTasks(ids, date) {
  if (!isValidKey(date)) return;
  for (const id of ids) {
    const task = byId(data.tasks, id);
    if (task) task.date = date;
  }
  save();
}

// Entfernt Einträge und gibt sie samt Position zurück, damit „Rückgängig“ möglich ist.
function removeFrom(listName, ids) {
  const removed = [];
  data[listName] = data[listName].filter((item, index) => {
    if (!ids.includes(item.id)) return true;
    removed.push({ item, index });
    return false;
  });
  save();
  return removed;
}

function putBack(listName, removed) {
  for (const { item, index } of removed) {
    data[listName].splice(Math.min(index, data[listName].length), 0, item);
  }
  save();
}

export const deleteTasks = (ids) => removeFrom('tasks', ids);
export const restoreTasks = (removed) => putBack('tasks', removed);

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
  const event = { id: newId(), date, time: TIME_RE.test(time) ? time : '', title: clean };
  data.events.push(event);
  save();
  return event;
}

export const deleteEvents = (ids) => removeFrom('events', ids);
export const restoreEvents = (removed) => putBack('events', removed);

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
  return data.tasks.length > 0 || data.events.length > 0 || data.notes.trim() !== '';
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
