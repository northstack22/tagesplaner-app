// Ansicht „Monat“: Kalender mit wichtigen Terminen.
// Tipp auf einen Tag zeigt darunter dessen Termine und ein Feld für neue.

import * as store from './storage.js';
import { todayKey, toKey, fromKey, formatLong, monthTitle, WEEKDAYS_SHORT } from './dates.js';
import { el, toast, plural } from './ui.js';

let year;
let month; // 0 = Januar
let selected;
const parts = {};

export function init(section) {
  parts.title = el('p', { class: 'pager-title' });
  parts.back = el('button', {
    type: 'button',
    class: 'button',
    text: 'Zu heute',
    onclick: () => {
      reset();
      render();
    },
  });
  parts.grid = el('div', { class: 'month-grid' });
  parts.detailTitle = el('h2', { class: 'section-title' });
  parts.events = el('ul', { class: 'event-list' });
  parts.empty = el('p', { class: 'hint', text: 'Keine Termine an diesem Tag.' });

  const title = el('input', {
    type: 'text',
    class: 'text-input',
    placeholder: 'Neuer Termin',
    'aria-label': 'Neuer Termin',
    maxlength: store.LIMITS.eventTitle,
    autocomplete: 'off',
    enterkeyhint: 'done',
  });
  const time = el('input', { type: 'time', class: 'text-input time-input', 'aria-label': 'Uhrzeit (freiwillig)' });
  const form = el('form', {
    class: 'event-form',
    onsubmit: (event) => {
      event.preventDefault();
      if (!store.addEvent(selected, title.value, time.value)) return;
      title.value = '';
      time.value = '';
      render();
    },
  },
  title,
  el('div', { class: 'event-form-row' },
    el('label', { class: 'time-label' }, el('span', { text: 'Uhrzeit (freiwillig)' }), time),
    el('button', { type: 'submit', class: 'button primary', text: 'Eintragen' })));

  section.append(
    el('div', { class: 'pager' },
      el('button', { type: 'button', class: 'icon-button pager-button', 'aria-label': 'Voriger Monat', text: '‹', onclick: () => go(-1) }),
      parts.title,
      el('button', { type: 'button', class: 'icon-button pager-button', 'aria-label': 'Nächster Monat', text: '›', onclick: () => go(1) })),
    el('div', { class: 'pager-extra' }, parts.back),
    el('div', { class: 'card month-card' },
      el('div', { class: 'weekday-row', 'aria-hidden': 'true' }, WEEKDAYS_SHORT.map((d) => el('span', { text: d }))),
      parts.grid),
    el('div', { class: 'card' }, parts.detailTitle, parts.events, parts.empty, form),
  );
}

export function reset() {
  const now = new Date();
  year = now.getFullYear();
  month = now.getMonth();
  selected = todayKey();
}
reset();

function go(step) {
  const d = new Date(year, month + step, 1);
  year = d.getFullYear();
  month = d.getMonth();
  const today = todayKey();
  const t = fromKey(today);
  selected = t.getFullYear() === year && t.getMonth() === month ? today : toKey(d);
  render();
}

export function render() {
  const today = todayKey();
  parts.title.textContent = monthTitle(year, month);
  const t = fromKey(today);
  parts.back.hidden = t.getFullYear() === year && t.getMonth() === month && selected === today;
  renderGrid(today);
  renderDetail();
}

function renderGrid(today) {
  const counts = new Map();
  for (const e of store.allEvents()) counts.set(e.date, (counts.get(e.date) || 0) + 1);

  const first = new Date(year, month, 1);
  const offset = (first.getDay() + 6) % 7; // Montag = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < offset; i += 1) cells.push(el('span', { class: 'day-blank' }));
  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = toKey(new Date(year, month, day));
    const n = counts.get(key) || 0;
    let classes = 'day';
    if (key === today) classes += ' is-today';
    cells.push(el('button', {
      type: 'button',
      class: classes,
      'aria-pressed': String(key === selected),
      'aria-label': `${formatLong(key)}${n ? `, ${plural(n, 'Termin', 'Termine')}` : ''}`,
      onclick: () => {
        selected = key;
        render();
      },
    }, el('span', { text: String(day) }), n ? el('span', { class: 'dot', 'aria-hidden': 'true' }) : null));
  }
  parts.grid.replaceChildren(...cells);
}

function renderDetail() {
  parts.detailTitle.textContent = selected === todayKey() ? `Heute, ${formatLong(selected)}` : formatLong(selected);
  const events = store.eventsOn(selected);
  parts.empty.hidden = events.length > 0;
  parts.events.replaceChildren(...events.map((e) => el('li', { class: 'event' },
    el('span', { class: 'event-time', text: e.time || 'ganztags' }),
    el('span', { class: 'event-title', text: e.title }),
    el('button', {
      type: 'button',
      class: 'icon-button delete-button',
      'aria-label': `Termin „${e.title}“ löschen`,
      text: '×',
      onclick: () => {
        const removed = store.deleteEvents([e.id]);
        render();
        toast('Termin gelöscht.', {
          label: 'Rückgängig',
          run: () => {
            store.restoreEvents(removed);
            render();
          },
        });
      },
    }))));
}
