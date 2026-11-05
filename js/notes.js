// Ansicht „Notizen“: ein einziger Zettel, der automatisch speichert.

import * as store from './storage.js';
import { el } from './ui.js';

let area;
let status;
let timer;

function saveNow() {
  clearTimeout(timer);
  if (area.value === store.getNotes()) return;
  status.textContent = store.setNotes(area.value) ? 'Gespeichert' : '';
}

export function init(section) {
  area = el('textarea', {
    class: 'notes-area',
    placeholder: 'Platz für Gedanken, Ideen und Listen …',
    'aria-label': 'Notizen',
    maxlength: store.LIMITS.notes,
    spellcheck: 'true',
  });
  status = el('p', { class: 'status-line', 'aria-live': 'polite' });

  area.addEventListener('input', () => {
    status.textContent = '';
    clearTimeout(timer);
    timer = setTimeout(saveNow, 500);
  });
  area.addEventListener('blur', saveNow);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveNow();
  });
  window.addEventListener('pagehide', saveNow);

  section.append(area, status);
}

export function render() {
  if (document.activeElement !== area) area.value = store.getNotes();
  status.textContent = '';
}
