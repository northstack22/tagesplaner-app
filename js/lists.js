// Reiter „Listen“: tägliche Routinen, wöchentliche Aufgaben und eine langfristige Liste.
// Tägliche Routinen setzen sich jeden Morgen zurück, wöchentliche jeden Montag.

import * as store from './storage.js';
import { el, toast, blockRow, blockAddForm, progressText } from './ui.js';

export const LIST_INFO = {
  daily: {
    title: 'Tägliche Routinen',
    hint: 'Setzt sich jeden Morgen von selbst zurück.',
    placeholder: 'Neue tägliche Routine',
  },
  weekly: {
    title: 'Wöchentliche Aufgaben',
    hint: 'Setzt sich jeden Montag von selbst zurück.',
    placeholder: 'Neue wöchentliche Aufgabe',
  },
  longterm: {
    title: 'Langfristig',
    hint: 'Bleibt stehen, bis es erledigt ist.',
    placeholder: 'Neuer langfristiger Punkt',
  },
};

// Zeilen einer Liste mit Abhaken, Bearbeiten und Löschen (mit „Rückgängig“).
export function checklistRows(kind, rerender) {
  const items = store.listItems(kind);
  const ordered = kind === 'longterm'
    ? [...items.filter((i) => !i.done), ...items.filter((i) => i.done)]
    : items;
  return ordered.map((item) => blockRow(item, {
    simple: true,
    onToggle: () => {
      store.toggleListItem(kind, item.id);
      rerender();
    },
    onSave: (_, changes) => {
      store.updateListItem(kind, item.id, changes.text);
      rerender();
    },
    onDelete: () => {
      const removed = store.deleteListItem(kind, item.id);
      rerender();
      toast('Eintrag gelöscht.', {
        label: 'Rückgängig',
        run: () => {
          store.restoreListItem(removed);
          rerender();
        },
      });
    },
  }));
}

// Aufklappbare Karte für „Heute“ (täglich) und „Woche“ (wöchentlich).
// Ist alles erledigt, klappt sie sich zu, damit sie nicht ablenkt.
export function renderChecklistCard(container, kind) {
  const items = store.listItems(kind);
  if (items.length === 0) {
    container.replaceChildren();
    return;
  }
  const allDone = items.every((i) => i.done);
  const remembered = container.dataset.open;
  const open = remembered === undefined ? !allDone : remembered === 'true';
  const rerender = () => renderChecklistCard(container, kind);

  const details = el('details', { class: 'card checklist-card', open },
    el('summary', {},
      el('span', { class: 'section-title', text: LIST_INFO[kind].title }),
      el('span', { class: 'summary-progress', text: allDone ? 'Alles erledigt' : progressText(items) })),
    el('ul', { class: 'block-list' }, checklistRows(kind, rerender)));
  details.addEventListener('toggle', () => {
    container.dataset.open = String(details.open);
  });
  container.replaceChildren(details);
}

// ----- Reiter „Listen“ -----

const parts = {};

export function init(section) {
  for (const kind of Object.keys(LIST_INFO)) {
    const info = LIST_INFO[kind];
    parts[kind] = {
      progress: el('span', { class: 'summary-progress' }),
      list: el('ul', { class: 'block-list' }),
    };
    section.append(el('section', { class: 'card list-section', 'aria-label': info.title },
      el('div', { class: 'card-head' },
        el('h2', { class: 'section-title', text: info.title }),
        parts[kind].progress),
      el('p', { class: 'hint', text: info.hint }),
      parts[kind].list,
      blockAddForm({
        id: `list-add-${kind}`,
        placeholder: info.placeholder,
        label: info.placeholder,
        withTime: false,
        onAdd: (text) => {
          store.addListItem(kind, text);
          renderKind(kind);
        },
      })));
  }
}

function renderKind(kind) {
  const items = store.listItems(kind);
  parts[kind].progress.textContent = progressText(items);
  parts[kind].list.replaceChildren(...checklistRows(kind, () => renderKind(kind)));
}

export function render() {
  for (const kind of Object.keys(LIST_INFO)) renderKind(kind);
}
