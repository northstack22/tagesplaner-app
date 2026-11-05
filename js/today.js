// Ansicht „Heute“: Termine des Tages, offene Aufgaben von gestern, Aufgaben zum Abhaken.

import * as store from './storage.js';
import { todayKey, addDays, formatLong, formatShort } from './dates.js';
import { el, toast, addForm, taskRow, taskHandlers, sortTasks, plural } from './ui.js';

let ctx;
const parts = {};

export function init(section, context) {
  ctx = context;
  parts.extra = el('div');
  parts.events = el('div');
  parts.carry = el('div');
  parts.list = el('ul', { class: 'task-list' });
  parts.status = el('p', { class: 'status-line' });

  const form = addForm({
    id: 'today-new',
    placeholder: 'Neue Aufgabe für heute',
    label: 'Neue Aufgabe für heute',
    onAdd: (text) => {
      store.addTask(todayKey(), text);
      renderList();
    },
  });

  section.append(
    parts.extra,
    parts.events,
    parts.carry,
    form,
    el('div', { class: 'card list-card' }, parts.list, parts.status),
  );
}

export function render() {
  ctx.setSubtitle(formatLong(todayKey()));
  ctx.renderExtra?.(parts.extra);
  renderEvents();
  renderCarry();
  renderList();
}

function renderEvents() {
  const events = store.eventsOn(todayKey());
  if (events.length === 0) {
    parts.events.replaceChildren();
    return;
  }
  parts.events.replaceChildren(el('div', { class: 'card' },
    el('h2', { class: 'section-title', text: 'Termine heute' }),
    el('ul', { class: 'event-list' }, events.map((e) => el('li', { class: 'event' },
      el('span', { class: 'event-time', text: e.time || 'ganztags' }),
      el('span', { class: 'event-title', text: e.title }))))));
}

function renderCarry() {
  const today = todayKey();
  const open = store.openTasksBefore(today);
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
  renderCarry();
  renderList();
}

function leaveOut(ids) {
  const removed = store.deleteTasks(ids);
  renderCarry();
  toast(ids.length === 1 ? 'Weggelassen.' : `${plural(ids.length, 'Aufgabe', 'Aufgaben')} weggelassen.`, {
    label: 'Rückgängig',
    run: () => {
      store.restoreTasks(removed);
      render();
    },
  });
}

function renderList() {
  const tasks = store.tasksOn(todayKey());
  const handlers = taskHandlers(renderList);
  parts.list.replaceChildren(...sortTasks(tasks).map((t) => taskRow(t, handlers)));

  const done = tasks.filter((t) => t.done).length;
  if (tasks.length === 0) {
    parts.status.textContent = 'Noch nichts geplant. Eine kleine Sache reicht für den Anfang.';
  } else if (done === tasks.length) {
    parts.status.textContent = 'Alles erledigt. Schön!';
  } else {
    parts.status.textContent = `${done} von ${tasks.length} erledigt`;
  }
}
