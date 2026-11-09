// Startpunkt der App: verbindet die Reiter unten mit den Ansichten.

import * as store from './storage.js';
import { toast } from './ui.js';
import { forestTop, forestFloor } from './forest.js';
import * as today from './today.js';
import * as week from './week.js';
import * as month from './month.js';
import * as lists from './lists.js';
import * as notes from './notes.js';
import * as backup from './backup.js';
import * as template from './template.js';

// tab: welcher Reiter unten hervorgehoben wird
const VIEWS = {
  today: { title: 'Heute', module: today, tab: 'today' },
  week: { title: 'Woche', module: week, tab: 'week' },
  month: { title: 'Monat', module: month, tab: 'month' },
  lists: { title: 'Listen', module: lists, tab: 'lists' },
  notes: { title: 'Notizen', module: notes, tab: 'notes' },
  backup: { title: 'Datensicherung', module: backup, tab: null },
  template: { title: 'Wochenvorlage', module: template, tab: 'week' },
};

let current = 'today';
const title = document.getElementById('view-title');
const subtitle = document.getElementById('view-subtitle');
const landscape = document.getElementById('landscape');

const ctx = {
  goTo: (name) => show(name),
  // Einen bestimmten Tag groß öffnen (aus der Wochenansicht).
  openDay: (date) => {
    today.showDate(date);
    show('today', { keepState: true });
  },
  setTitle: (text) => {
    title.textContent = text;
  },
  setSubtitle: (text) => {
    subtitle.textContent = text;
  },
  // Erinnerung an die Sicherung oben in „Heute“.
  renderExtra: (container) => backup.renderReminder(container, () => today.render()),
};

store.freezePastDays();

document.querySelector('main').prepend(forestTop());
document.querySelector('main').append(forestFloor());

for (const [name, view] of Object.entries(VIEWS)) {
  view.module.init(document.getElementById(`view-${name}`), ctx);
}

function show(name, { keepState = false } = {}) {
  if (!VIEWS[name]) return;
  current = name;
  for (const section of document.querySelectorAll('.view')) {
    section.hidden = section.id !== `view-${name}`;
  }
  for (const tab of document.querySelectorAll('.tab')) {
    if (tab.dataset.view === VIEWS[name].tab) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
  document.getElementById('settings-button')
    .setAttribute('aria-pressed', String(name === 'backup'));
  title.textContent = VIEWS[name].title;
  subtitle.textContent = '';
  if (!keepState) VIEWS[name].module.reset?.();
  VIEWS[name].module.render();
  updateLandscape();
  window.scrollTo(0, 0);
}

for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => show(tab.dataset.view));
}
document.getElementById('settings-button').addEventListener('click', () => {
  show(current === 'backup' ? 'today' : 'backup');
});

// ----- Querformat: Woche als Spalten (in „Heute“ und „Woche“) -----

const landscapeQuery = window.matchMedia('(orientation: landscape) and (max-height: 560px)');

function updateLandscape() {
  const on = landscapeQuery.matches && (current === 'today' || current === 'week');
  document.body.classList.toggle('landscape-week', on);
  if (on) week.renderLandscape(landscape, current === 'week' ? week.currentWeekStart() : today.currentDate());
}

landscapeQuery.addEventListener('change', updateLandscape);

// Wenn die App wieder geöffnet wird (z. B. am nächsten Morgen), neu anzeigen.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  store.freezePastDays();
  VIEWS[current].module.render();
  updateLandscape();
});

store.onSaveError(() => {
  toast('Speichern hat nicht geklappt. Bitte erstelle eine Sicherung.');
});

show('today');

// Offline-Betrieb: App-Dateien im Hintergrund speichern (siehe sw.js).
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

// Den Browser bitten, die Daten dauerhaft aufzubewahren.
navigator.storage?.persist?.().catch(() => {});
