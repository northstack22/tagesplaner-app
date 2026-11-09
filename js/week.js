// Ansicht „Woche“: sieben kompakte Tageskarten, Tipp auf einen Tag öffnet ihn.
// Oben die wöchentlichen Aufgaben, unten der Weg zur Wochenvorlage.
// Außerdem die Spaltenansicht für das Querformat (nur zum Anschauen).

import * as store from './storage.js';
import {
  todayKey, addDays, startOfWeek, weekNumber, fromKey, formatDayMonth, weekdayName, WEEKDAYS_SHORT,
} from './dates.js';
import { el, progressText } from './ui.js';
import { svgIcon, iconFor } from './icons.js';
import { renderChecklistCard } from './lists.js';

let ctx;
let weekStart = startOfWeek(todayKey());
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
  parts.weekly = el('div');
  parts.days = el('div');

  section.append(
    el('div', { class: 'pager' },
      el('button', { type: 'button', class: 'icon-button pager-button', 'aria-label': 'Vorige Woche', text: '‹', onclick: () => go(-7) }),
      parts.label,
      el('button', { type: 'button', class: 'icon-button pager-button', 'aria-label': 'Nächste Woche', text: '›', onclick: () => go(7) })),
    el('div', { class: 'pager-extra' }, parts.back),
    parts.weekly,
    parts.days,
    el('div', { class: 'template-link' },
      el('button', { type: 'button', class: 'button', text: 'Wochenvorlage bearbeiten', onclick: () => ctx.goTo('template') }),
      el('p', { class: 'hint', text: 'Aus der Vorlage werden die Tage automatisch befüllt.' })),
  );
}

export function reset() {
  weekStart = startOfWeek(todayKey());
}

export function currentWeekStart() {
  return weekStart;
}

function go(days) {
  weekStart = addDays(weekStart, days);
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
  const isThisWeek = weekStart === startOfWeek(today);
  parts.label.textContent = `KW ${weekNumber(weekStart)}`;
  ctx.setSubtitle(rangeText(weekStart));
  parts.back.hidden = isThisWeek;

  if (isThisWeek) renderChecklistCard(parts.weekly, 'weekly');
  else parts.weekly.replaceChildren();

  const cards = [];
  for (let i = 0; i < 7; i += 1) cards.push(dayCard(addDays(weekStart, i), today, i));
  parts.days.replaceChildren(...cards);
}

const shortTime = (item) => item.start || '';
const MAX_ROWS = 6;

function dayCard(date, today, index) {
  const events = store.eventsOn(date);
  const items = store.dayItems(date);
  const open = () => ctx.openDay(date);

  let classes = `day-card ${index % 2 ? 'tone-b' : 'tone-a'}`;
  if (date === today) classes += ' is-today';
  if (date < today) classes += ' is-past';

  const rows = [
    ...events.map((e) => el('li', { class: 'mini is-event' },
      el('span', { class: 'mini-time', text: e.time }),
      el('span', { class: 'mini-icon', text: '◆', 'aria-hidden': 'true' }),
      el('span', { class: 'mini-text', text: e.title }))),
    ...items.map((item) => el('li', { class: item.done ? 'mini done' : 'mini' },
      el('span', { class: 'mini-time', text: shortTime(item) }),
      el('span', { class: 'mini-icon' }, svgIcon(iconFor(item), 16)),
      el('span', { class: 'mini-text', text: item.text }),
      item.done ? el('span', { class: 'mini-check', text: '✓', 'aria-label': 'erledigt' }) : null)),
  ];

  // Damit die Woche ein Überblick bleibt: höchstens ein paar Zeilen pro Tag.
  if (rows.length > MAX_ROWS) {
    const more = rows.length - (MAX_ROWS - 1);
    rows.splice(MAX_ROWS - 1, rows.length, el('li', { class: 'mini more', text: `+ ${more} weitere` }));
  }

  const progress = items.length ? progressText(items) : '';
  return el('article', { class: classes, onclick: open },
    el('button', {
      type: 'button',
      class: 'day-head',
      'aria-label': `${weekdayName(date)}, ${formatDayMonth(date)} öffnen${progress ? `, ${progress} erledigt` : ''}`,
    },
    el('span', { class: 'day-name', text: weekdayName(date) }),
    el('span', { class: 'day-date', text: formatDayMonth(date) }),
    date === today ? el('span', { class: 'badge', text: 'Heute' }) : null,
    el('span', { class: 'day-progress', text: progress }),
    el('span', { class: 'chevron', text: '›', 'aria-hidden': 'true' })),
    rows.length
      ? el('ul', { class: 'mini-list', 'aria-hidden': 'true' }, rows)
      : el('p', { class: 'day-free', text: 'Frei' }));
}

// ----- Querformat: Wochentage als Spalten (nur zum Anschauen) -----

export function renderLandscape(container, anchorDate) {
  const start = startOfWeek(anchorDate);
  const today = todayKey();
  const columns = [];
  for (let i = 0; i < 7; i += 1) {
    const date = addDays(start, i);
    const items = store.dayItems(date);
    const events = store.eventsOn(date);
    // Samstag und Sonntag nur, wenn dort etwas geplant ist.
    if (i >= 5 && items.length === 0 && events.length === 0) continue;

    let classes = `column ${i % 2 ? 'tone-b' : 'tone-a'}`;
    if (date === today) classes += ' is-today';
    columns.push(el('section', { class: classes, 'aria-label': `${weekdayName(date)}, ${formatDayMonth(date)}` },
      el('h2', { class: 'column-head' },
        el('span', { text: WEEKDAYS_SHORT[i] }),
        ` ${fromKey(date).getDate()}.${fromKey(date).getMonth() + 1}.`),
      el('ul', { class: 'col-list' },
        events.map((e) => el('li', { class: 'col-item is-event' },
          el('span', { class: 'col-icon', text: '◆', 'aria-hidden': 'true' }),
          el('span', { class: 'col-time', text: e.time || 'Termin' }),
          el('span', { class: 'col-text', text: e.title }))),
        items.map((item) => el('li', { class: item.done ? 'col-item done' : 'col-item' },
          el('span', { class: 'col-icon' }, svgIcon(iconFor(item), 15)),
          el('span', { class: 'col-time', text: item.start ? (item.end ? `${item.start}–${item.end}` : item.start) : '' }),
          el('span', { class: 'col-text', text: item.done ? `✓ ${item.text}` : item.text }))))));
  }

  container.replaceChildren(
    el('div', { class: 'landscape-head' },
      el('h1', { text: `Wochenplan · KW ${weekNumber(start)}` }),
      el('p', { class: 'hint', text: 'Zum Bearbeiten das iPhone hochkant halten.' })),
    el('div', { class: 'columns' }, columns),
  );
}
