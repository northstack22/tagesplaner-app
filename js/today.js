// Ansicht „Heute“ (oder ein anderer Tag, wenn er aus der Woche geöffnet wird):
// Zeitplan mit Symbolen zum Abhaken, Termine, offene Aufgaben von gestern
// und unten die täglichen Routinen.

import * as store from './storage.js';
import {
  todayKey, addDays, formatLong, formatShort, formatDayMonth, weekdayName, nowTime,
} from './dates.js';
import { el, toast, blockRow, blockAddForm, plural } from './ui.js';
import { renderChecklistCard } from './lists.js';

let ctx;
let viewDate = todayKey();
let lastToday = todayKey();
const parts = {};

export function init(section, context) {
  ctx = context;
  parts.section = section;
  parts.toToday = el('button', {
    type: 'button',
    class: 'button',
    text: 'Zu heute',
    onclick: () => {
      reset();
      render();
    },
  });
  parts.extra = el('div');
  parts.carry = el('div');
  parts.events = el('div');
  parts.list = el('ul', { class: 'block-list' });
  parts.status = el('p', { class: 'status-line' });
  parts.daily = el('div');
  parts.add = blockAddForm({
    id: 'day-new',
    placeholder: 'Neue Aufgabe für heute',
    label: 'Neue Aufgabe für heute',
    onAdd: (text, start, end) => {
      store.addTask(viewDate, text, start, end);
      renderList();
    },
  });

  parts.pager = el('div', { class: 'pager day-pager' },
      el('button', { type: 'button', class: 'icon-button pager-button', 'aria-label': 'Vorheriger Tag', text: '‹', onclick: () => go(-1) }),
      el('div', { class: 'pager-middle' }, parts.toToday),
      el('button', { type: 'button', class: 'icon-button pager-button', 'aria-label': 'Nächster Tag', text: '›', onclick: () => go(1) }));

  section.append(
    parts.pager,
    parts.extra,
    parts.carry,
    parts.events,
    el('div', { class: 'card list-card' }, parts.list, parts.status),
    el('div', { class: 'card add-card' }, parts.add),
    parts.daily,
  );

  // Einmal pro Minute „Jetzt“ aktualisieren (nicht, während etwas bearbeitet wird).
  setInterval(() => {
    if (document.visibilityState !== 'visible' || section.hidden) return;
    if (section.querySelector('.edit-form')) return;
    render();
  }, 60000);
}

export function reset() {
  viewDate = todayKey();
}

// Einen bestimmten Tag anzeigen (z. B. aus der Wochenansicht).
export function showDate(date) {
  viewDate = date;
}

export function currentDate() {
  return viewDate;
}

function go(days) {
  viewDate = addDays(viewDate, days);
  render();
  window.scrollTo(0, 0);
}

function subtitleFor(date, today) {
  if (date === today) return formatLong(date);
  if (date === addDays(today, 1)) return `${formatDayMonth(date)} · morgen`;
  if (date === addDays(today, -1)) return `${formatDayMonth(date)} · gestern`;
  return formatDayMonth(date);
}

export function render() {
  const today = todayKey();
  // Über Mitternacht offen gelassen? Dann zum neuen Tag springen.
  if (lastToday !== today) {
    if (viewDate === lastToday) viewDate = today;
    lastToday = today;
  }
  const isToday = viewDate === today;
  ctx.setTitle(isToday ? 'Heute' : weekdayName(viewDate));
  ctx.setSubtitle(subtitleFor(viewDate, today));
  // Blättern nur, wenn ein anderer Tag offen ist – „Heute“ bleibt ruhig.
  parts.pager.hidden = isToday;

  const label = isToday ? 'Neue Aufgabe für heute' : `Neue Aufgabe für ${weekdayName(viewDate)}`;
  const input = parts.add.querySelector('input[type=text]');
  input.placeholder = label;
  input.setAttribute('aria-label', label);

  if (isToday) ctx.renderExtra?.(parts.extra);
  else parts.extra.replaceChildren();
  renderCarry(isToday);
  renderEvents();
  renderList();
  if (isToday) renderChecklistCard(parts.daily, 'daily');
  else parts.daily.replaceChildren();
}

function renderEvents() {
  const events = store.eventsOn(viewDate);
  if (events.length === 0) {
    parts.events.replaceChildren();
    return;
  }
  parts.events.replaceChildren(el('div', { class: 'card' },
    el('h2', { class: 'section-title', text: 'Termine' }),
    el('ul', { class: 'event-list' }, events.map((e) => el('li', { class: 'event' },
      el('span', { class: 'event-time', text: e.time || 'ganztags' }),
      el('span', { class: 'event-title', text: e.title }))))));
}

// ----- Von gestern noch offen (nur selbst eingetragene Aufgaben) -----

function renderCarry(isToday) {
  const today = todayKey();
  const open = isToday ? store.openTasksBefore(today) : [];
  if (open.length === 0) {
    parts.carry.replaceChildren();
    return;
  }
  const yesterday = addDays(today, -1);
  const onlyYesterday = open.every((t) => t.date === yesterday);

  const items = open.map((task) => el('li', { class: 'carry-item' },
    el('p', { class: 'carry-text', text: task.text }),
    task.date !== yesterday ? el('p', { class: 'carry-date', text: formatShort(task.date) }) : null,
    el('div', { class: 'button-row' },
      el('button', { type: 'button', class: 'button primary', text: 'Heute machen', onclick: () => takeOver([task.id]) }),
      el('button', { type: 'button', class: 'button', text: 'Weglassen', onclick: () => leaveOut([task.id]) }))));

  const ids = open.map((t) => t.id);
  parts.carry.replaceChildren(el('div', { class: 'card card-soft' },
    el('h2', { class: 'section-title', text: onlyYesterday ? 'Von gestern noch offen' : 'Noch offen von vorher' }),
    el('p', { class: 'hint', text: 'Kein Problem. Möchtest du das heute machen?' }),
    el('ul', { class: 'carry-list' }, items),
    open.length > 1 ? el('div', { class: 'button-row' },
      el('button', { type: 'button', class: 'button', text: 'Alle für heute', onclick: () => takeOver(ids) }),
      el('button', { type: 'button', class: 'button quiet', text: 'Alle weglassen', onclick: () => leaveOut(ids) })) : null));
}

function takeOver(ids) {
  store.moveTasks(ids, todayKey());
  renderCarry(true);
  renderList();
}

function leaveOut(ids) {
  const removed = store.deleteTasks(ids);
  renderCarry(true);
  toast(ids.length === 1 ? 'Weggelassen.' : `${plural(ids.length, 'Aufgabe', 'Aufgaben')} weggelassen.`, {
    label: 'Rückgängig',
    run: () => {
      store.restoreTasks(removed);
      render();
    },
  });
}

// ----- Zeitplan -----

const minutes = (time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

// Welcher Block ist gerade dran? (nur heute)
function currentItemId(items) {
  const now = minutes(nowTime());
  const hit = items.find((i) => {
    if (!i.start) return false;
    const start = minutes(i.start);
    const end = i.end ? minutes(i.end) : start + 30;
    return now >= start && now < end;
  });
  return hit ? hit.id : null;
}

function renderList() {
  const isToday = viewDate === todayKey();
  const items = store.dayItems(viewDate);
  const nowId = isToday ? currentItemId(items) : null;

  parts.list.replaceChildren(...items.map((item) => blockRow(item, {
    isNow: item.id === nowId,
    onToggle: () => {
      store.setDone(viewDate, item.id, !item.done);
      renderList();
    },
    onSave: (_, changes) => {
      store.updateItem(viewDate, item.id, changes);
      renderList();
    },
    onDelete: () => {
      const removed = store.deleteItem(viewDate, item.id);
      renderList();
      toast('Gelöscht.', {
        label: 'Rückgängig',
        run: () => {
          store.restoreTasks(removed);
          renderList();
        },
      });
    },
  })));

  const done = items.filter((i) => i.done).length;
  if (items.length === 0) {
    parts.status.textContent = isToday
      ? 'Noch nichts geplant. Eine kleine Sache reicht für den Anfang.'
      : 'Für diesen Tag ist noch nichts geplant.';
  } else if (done === items.length) {
    parts.status.textContent = 'Alles erledigt. Schön!';
  } else {
    parts.status.textContent = `${done} von ${items.length} erledigt`;
  }
}
