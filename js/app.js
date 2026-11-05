// Startpunkt der App: verbindet die Reiter unten mit den Ansichten.

const TITLES = {
  today: 'Heute',
  week: 'Woche',
  month: 'Monat',
  notes: 'Notizen',
  backup: 'Datensicherung',
};

let current = 'today';

function show(name) {
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
  document.getElementById('view-title').textContent = TITLES[name];
  window.scrollTo(0, 0);
}

for (const tab of document.querySelectorAll('.tab')) {
  tab.addEventListener('click', () => show(tab.dataset.view));
}
document.getElementById('settings-button').addEventListener('click', () => {
  show(current === 'backup' ? 'today' : 'backup');
});

show('today');
