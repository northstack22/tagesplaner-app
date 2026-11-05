// Ansicht „Datensicherung“: alle Daten als Datei sichern und wiederherstellen.
// Außerdem die ruhige Erinnerung, wenn die letzte Sicherung länger her ist.

import * as store from './storage.js';
import { todayKey, formatFull, isValidKey } from './dates.js';
import { el, toast, plural } from './ui.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const parts = {};

// ----- Sicherung erstellen -----

function download(file, onDone) {
  const url = URL.createObjectURL(file);
  const link = el('a', { href: url, download: file.name, hidden: true });
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  finished(onDone);
}

function finished(onDone) {
  store.markBackup();
  toast('Sicherung erstellt.');
  render();
  onDone?.();
}

// `onDone` wird aufgerufen, wenn die Sicherung erstellt wurde.
export function exportData(onDone) {
  const name = `tagesplaner-sicherung-${todayKey()}.json`;
  const file = new File([store.exportJson()], name, { type: 'application/json' });

  // Auf iPhone und iPad öffnet sich das Teilen-Menü („In Dateien sichern“).
  const touch = navigator.maxTouchPoints > 0;
  if (touch && navigator.canShare && navigator.canShare({ files: [file] })) {
    navigator.share({ files: [file] })
      .then(() => finished(onDone))
      .catch((error) => {
        if (error && error.name === 'AbortError') return; // abgebrochen, alles gut
        download(file, onDone);
      });
    return;
  }
  download(file, onDone);
}

// ----- Sicherung wiederherstellen -----

function showMessage(text) {
  parts.preview.replaceChildren(el('div', { class: 'card card-soft' }, el('p', { text })));
}

function readFile(file) {
  if (file.size > MAX_FILE_SIZE) {
    showMessage('Diese Datei ist zu groß für eine Tagesplaner-Sicherung. Es wurde nichts verändert.');
    return;
  }
  file.text().then((text) => {
    let raw;
    let clean;
    try {
      raw = JSON.parse(text);
      clean = store.sanitize(raw);
    } catch {
      showMessage('Diese Datei ist keine Tagesplaner-Sicherung. Es wurde nichts verändert.');
      return;
    }
    showPreview(clean, isValidKey(raw.exportedAt) ? raw.exportedAt : null);
  }).catch(() => {
    showMessage('Die Datei konnte nicht gelesen werden. Es wurde nichts verändert.');
  });
}

function showPreview(data, exportedAt) {
  const summary = [
    plural(data.tasks.length, 'Aufgabe', 'Aufgaben'),
    plural(data.events.length, 'Termin', 'Termine'),
    data.notes.trim() ? 'Notizen' : 'keine Notizen',
  ].join(', ');

  parts.preview.replaceChildren(el('div', { class: 'card card-soft' },
    el('h2', { class: 'section-title', text: 'Diese Sicherung wiederherstellen?' }),
    exportedAt ? el('p', { text: `Erstellt am ${formatFull(exportedAt)}` }) : null,
    el('p', { text: `Enthält: ${summary}.` }),
    el('p', { class: 'hint', text: 'Alle jetzigen Einträge auf diesem Gerät werden dabei ersetzt.' }),
    el('div', { class: 'button-row' },
      el('button', {
        type: 'button',
        class: 'button primary',
        text: 'Ja, wiederherstellen',
        onclick: () => {
          if (!store.replaceAll(data)) return;
          parts.preview.replaceChildren();
          render();
          toast('Sicherung wiederhergestellt.', { label: 'Rückgängig', run: undo });
        },
      }),
      el('button', { type: 'button', class: 'button', text: 'Abbrechen', onclick: () => parts.preview.replaceChildren() }))));
}

function undo() {
  if (store.undoImport()) toast('Vorheriger Stand ist zurück.');
  render();
}

// ----- Ansicht -----

export function init(section) {
  parts.last = el('p', { class: 'hint' });
  parts.preview = el('div');
  parts.undo = el('button', { type: 'button', class: 'button quiet', text: 'Stand vor dem letzten Wiederherstellen zurückholen', onclick: undo });

  const fileInput = el('input', { type: 'file', class: 'visually-hidden', tabindex: '-1', 'aria-hidden': 'true' });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (file) readFile(file);
  });

  section.append(
    el('div', { class: 'card' },
      el('h2', { class: 'section-title', text: 'Sicherung erstellen' }),
      el('p', { text: 'Deine Einträge sind nur auf diesem Gerät gespeichert. Eine Sicherungsdatei schützt sie, zum Beispiel wenn du ein neues iPhone bekommst.' }),
      el('p', { class: 'hint spaced', text: 'Auf dem iPhone: im Teilen-Menü „In Dateien sichern“ wählen, z. B. iCloud Drive.' }),
      el('div', { class: 'button-row' },
        el('button', { type: 'button', class: 'button primary', text: 'Sicherung erstellen', onclick: () => exportData() })),
      parts.last),
    el('div', { class: 'card' },
      el('h2', { class: 'section-title', text: 'Wiederherstellen' }),
      el('p', { text: 'Wähle eine Sicherungsdatei aus. Du siehst vorher, was darin ist.' }),
      el('div', { class: 'button-row' },
        el('button', { type: 'button', class: 'button', text: 'Sicherungsdatei auswählen', onclick: () => fileInput.click() })),
      fileInput,
      parts.undo),
    parts.preview,
    el('p', { class: 'hint about', text: 'Diese App funktioniert ohne Internet. Keine Konten, keine Werbung, kein Tracking. Nichts verlässt dein Gerät.' }),
  );
}

export function reset() {
  parts.preview.replaceChildren();
}

export function render() {
  const last = store.lastBackup();
  parts.last.textContent = last ? `Zuletzt gesichert am ${formatFull(last)}.` : 'Noch keine Sicherung erstellt.';
  parts.last.classList.add('spaced');
  parts.undo.hidden = !store.hasStateBeforeImport();
}

// ----- Erinnerung (wird oben in „Heute“ angezeigt) -----

export function renderReminder(container, rerender) {
  if (!store.backupDue()) {
    container.replaceChildren();
    return;
  }
  container.replaceChildren(el('div', { class: 'card card-soft' },
    el('p', { text: 'Deine letzte Sicherung ist schon eine Weile her.' }),
    el('div', { class: 'button-row' },
      el('button', { type: 'button', class: 'button primary', text: 'Jetzt sichern', onclick: () => exportData(rerender) }),
      el('button', {
        type: 'button',
        class: 'button quiet',
        text: 'Später',
        onclick: () => {
          store.snoozeReminder(3);
          rerender();
        },
      }))));
}
