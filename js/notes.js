// Ansicht „Notizen“: ein einziger Zettel, der automatisch speichert.

import * as store from './storage.js';
import { el } from './ui.js';

let area;
let status;
let timer;
// Nur speichern, wenn wirklich getippt wurde. Sonst könnte ein noch leeres
// Textfeld die gespeicherte Notiz überschreiben (z. B. beim App-Wechsel).
let dirty = false;

function saveNow() {
  clearTimeout(timer);
  if (!dirty) return;
  dirty = false;
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
  area.value = store.getNotes();
  status = el('p', { class: 'status-line', 'aria-live': 'polite' });

  area.addEventListener('input', () => {
    dirty = true;
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
  if (!dirty && document.activeElement !== area) area.value = store.getNotes();
  status.textContent = '';
}
