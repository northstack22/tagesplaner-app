// Kleine Bausteine für die Oberfläche.
// Texte werden immer als reiner Text eingefügt (nie als HTML),
// damit eingetippter Text nie als Code ausgeführt werden kann.

import * as store from './storage.js';

const { LIMITS } = store;

// Erstellt ein Element, z. B. el('button', { class: 'button', text: 'OK', onclick: fn })
export function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : String(value));
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child); // Strings werden dabei automatisch zu reinem Text.
  }
  return node;
}

export function plural(count, one, many) {
  return `${count} ${count === 1 ? one : many}`;
}

// ----- Kurze Meldung unten, optional mit Knopf (z. B. „Rückgängig“) -----

let toastTimer;

function hideToast() {
  document.getElementById('toast').hidden = true;
}

export function toast(message, action) {
  const box = document.getElementById('toast');
  box.replaceChildren(el('span', { text: message }));
  if (action) {
    box.append(el('button', {
      type: 'button',
      text: action.label,
      onclick: () => {
        hideToast();
        action.run();
      },
    }));
  }
  box.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, action ? 6000 : 3000);
}

// ----- Eingabefeld mit Plus-Knopf -----

export function addForm({ id, placeholder, label, onAdd }) {
  const input = el('input', {
    id,
    type: 'text',
    class: 'text-input',
    placeholder,
    'aria-label': label,
    maxlength: LIMITS.taskText,
    autocomplete: 'off',
    enterkeyhint: 'done',
  });
  const form = el('form', {
    class: 'add-form',
    onsubmit: (event) => {
      event.preventDefault();
      if (input.value.trim() === '') return;
      onAdd(input.value);
      input.value = '';
    },
  }, input, el('button', { type: 'submit', class: 'button primary add-button', 'aria-label': 'Hinzufügen', text: '+' }));
  return form;
}

// ----- Eine Aufgabe mit Haken; Tipp auf den Text öffnet die Bearbeitung -----

export function taskRow(task, { onToggle, onEdit, onDelete }) {
  const li = el('li', { class: task.done ? 'task done' : 'task' });

  const showView = () => {
    li.replaceChildren(
      el('button', {
        type: 'button',
        class: 'check',
        'aria-pressed': String(task.done),
        'aria-label': task.done ? `„${task.text}“ wieder öffnen` : `„${task.text}“ abhaken`,
        onclick: () => onToggle(task),
      }),
      el('button', { type: 'button', class: 'task-text', text: task.text, onclick: showEdit }),
    );
  };

  const showEdit = () => {
    const input = el('input', {
      type: 'text',
      class: 'text-input',
      value: task.text,
      maxlength: LIMITS.taskText,
      'aria-label': 'Aufgabe bearbeiten',
      autocomplete: 'off',
      enterkeyhint: 'done',
    });
    li.replaceChildren(el('form', {
      class: 'edit-form',
      onsubmit: (event) => {
        event.preventDefault();
        onEdit(task, input.value);
      },
    },
    input,
    el('div', { class: 'button-row' },
      el('button', { type: 'submit', class: 'button primary', text: 'Fertig' }),
      el('button', { type: 'button', class: 'button', text: 'Abbrechen', onclick: showView }),
      el('button', { type: 'button', class: 'button quiet', text: 'Löschen', onclick: () => onDelete(task) }))));
    input.focus();
  };

  showView();
  return li;
}

// Die üblichen Aktionen für eine Aufgabe. `rerender` zeichnet die Liste danach neu.
export function taskHandlers(rerender) {
  return {
    onToggle: (task) => {
      store.setTaskDone(task.id, !task.done);
      rerender();
    },
    onEdit: (task, text) => {
      store.setTaskText(task.id, text);
      rerender();
    },
    onDelete: (task) => {
      const removed = store.deleteTasks([task.id]);
      rerender();
      toast('Aufgabe gelöscht.', {
        label: 'Rückgängig',
        run: () => {
          store.restoreTasks(removed);
          rerender();
        },
      });
    },
  };
}

// Offene Aufgaben zuerst, erledigte darunter. Reihenfolge sonst wie eingetragen.
export function sortTasks(tasks) {
  return [...tasks.filter((t) => !t.done), ...tasks.filter((t) => t.done)];
}
