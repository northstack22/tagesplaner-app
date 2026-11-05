// Startpunkt der App: verbindet die Reiter unten mit den Ansichten.

import * as store from './storage.js';
import { toast } from './ui.js';
import * as today from './today.js';
import * as week from './week.js';
import * as month from './month.js';
import * as notes from './notes.js';
import * as backup from './backup.js';

const VIEWS = {
  today: { title: 'Heute', module: today },
  week: { title: 'Woche', module: week },
  month: { title: 'Monat', module: month },
  notes: { title: 'Notizen', module: notes },
  backup: { title: 'Datensicherung', module: backup },
};

let current = 'today';
const subtitle = document.getElementById('view-subtitle');

const ctx = {
  goTo: (name) => show(name),
  setSubtitle: (text) => {
    subtitle.textContent = text;
  },
  // Erinnerung an die Sicherung oben in „Heute“.
  renderExtra: (container) => backup.renderReminder(container, () => today.render()),
};

for (const [name, view] of Object.entries(VIEWS)) {
  view.module.init(document.getElementById(`view-${name}`), ctx);
}

function show(name) {
  if (!VIEWS[name]) return;
  current = name;
  for (const section of document.querySelectorAll('.view')) {
    section.hidden = section.id !== `view-${name}`;
  }
  for (const tab of document.querySelectorAll('.tab')) {
    if (tab.dataset.view === name) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  }
  document.getElementById('settings-button')
    .setAttribute('aria-pressed', String(name === 'backup'));
  document.getElementById('view-title').textContent = VIEWS[name].title;
  subtitle.textContent = '';
  VIEWS[name].module.reset?.();
  VIEWS[name].module.render();
  window.scrollTo(0, 0);
}

for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => show(tab.dataset.view));
}
document.getElementById('settings-button').addEventListener('click', () => {
  show(current === 'backup' ? 'today' : 'backup');
});

// Wenn die App wieder geöffnet wird (z. B. am nächsten Morgen), neu anzeigen.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') VIEWS[current].module.render();
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
