// Ansicht „Woche“: sieben Tage mit Terminen und Aufgaben.
// Aufgaben lassen sich hier direkt für einen bestimmten Tag eintragen.

import * as store from './storage.js';
import {
  todayKey, addDays, startOfWeek, weekNumber, fromKey,
  formatDayMonth, weekdayName,
} from './dates.js';
import { el, addForm, taskRow, taskHandlers, sortTasks } from './ui.js';

let ctx;
let weekStart = startOfWeek(todayKey());
let addingFor = null; // Tag, an dem gerade das Eingabefeld offen ist
const parts = {};

export function init(section, context) {
  ctx = context;
  parts.label = el('p', { class: 'pager-title' });
  parts.back = el('button', {
    type: 'button',
    class: 'button',
    text: 'Zu dieser Woche',
    onclick: () => {
      reset();
      render();
    },
  });
  parts.days = el('div');

  section.append(
    el('div', { class: 'pager' },
      el('button', { type: 'button', class: 'icon-button pager-button', 'aria-label': 'Vorige Woche', text: '‹', onclick: () => go(-7) }),
      parts.label,
      el('button', { type: 'button', class: 'icon-button pager-button', 'aria-label': 'Nächste Woche', text: '›', onclick: () => go(7) })),
    el('div', { class: 'pager-extra' }, parts.back),
    parts.days,
  );
}

export function reset() {
  weekStart = startOfWeek(todayKey());
  addingFor = null;
}

function go(days) {
  weekStart = addDays(weekStart, days);
  addingFor = null;
  render();
}

function rangeText(start) {
  const end = addDays(start, 6);
  const sameMonth = fromKey(start).getMonth() === fromKey(end).getMonth();
  return sameMonth
    ? `${fromKey(start).getDate()}.–${formatDayMonth(end)}`
    : `${formatDayMonth(start)} – ${formatDayMonth(end)}`;
}

export function render() {
  const today = todayKey();
  parts.label.textContent = `KW ${weekNumber(weekStart)}`;
  ctx.setSubtitle(rangeText(weekStart));
  parts.back.hidden = weekStart === startOfWeek(today);

  const cards = [];
  for (let i = 0; i < 7; i += 1) cards.push(dayCard(addDays(weekStart, i), today));
  parts.days.replaceChildren(...cards);

  if (addingFor) document.getElementById(`week-add-${addingFor}`)?.focus();
}

function dayCard(date, today) {
  const events = store.eventsOn(date);
  const tasks = sortTasks(store.tasksOn(date));
  const handlers = taskHandlers(render);

  let classes = 'day-card';
  if (date === today) classes += ' is-today';
  if (date < today) classes += ' is-past';

  const add = addingFor === date
    ? el('div', { class: 'day-add' },
      addForm({
        id: `week-add-${date}`,
        placeholder: `Aufgabe für ${weekdayName(date)}`,
        label: `Neue Aufgabe für ${weekdayName(date)}, ${formatDayMonth(date)}`,
        onAdd: (text) => {
          store.addTask(date, text);
          render();
        },
      }),
      el('button', {
        type: 'button',
        class: 'button quiet',
        text: 'Fertig',
        onclick: () => {
          addingFor = null;
          render();
        },
      }))
    : el('button', {
      type: 'button',
      class: 'add-link',
      text: '+ Aufgabe',
      'aria-label': `Aufgabe für ${weekdayName(date)} hinzufügen`,
      onclick: () => {
        addingFor = date;
        render();
      },
    });

  return el('article', { class: classes },
    el('h2', { class: 'day-title' },
      el('span', { text: weekdayName(date) }),
      el('span', { class: 'day-date', text: formatDayMonth(date) }),
      date === today ? el('span', { class: 'badge', text: 'Heute' }) : null),
    events.length ? el('ul', { class: 'event-list compact' }, events.map((e) => el('li', { class: 'event' },
      el('span', { class: 'event-time', text: e.time || 'ganztags' }),
      el('span', { class: 'event-title', text: e.title })))) : null,
    tasks.length ? el('ul', { class: 'task-list' }, tasks.map((t) => taskRow(t, handlers))) : null,
    !events.length && !tasks.length && addingFor !== date ? el('p', { class: 'day-empty', text: 'Frei' }) : null,
    add);
}
