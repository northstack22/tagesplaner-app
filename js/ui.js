// Kleine Bausteine für die Oberfläche.
// Texte werden immer als reiner Text eingefügt (nie als HTML),
// damit eingetippter Text nie als Code ausgeführt werden kann.

import { LIMITS } from './storage.js';
import { ICONS, svgIcon, iconFor, suggestIcon, iconLabel } from './icons.js';

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

// "08:00–09:00", "08:00" oder "" (ohne Uhrzeit)
export function timeText(item) {
  if (!item.start) return '';
  return item.end ? `${item.start}–${item.end}` : item.start;
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

// ----- Uhrzeit von–bis -----

function timeInputs(start = '', end = '') {
  const startInput = el('input', { type: 'time', class: 'text-input time-input', value: start, 'aria-label': 'Uhrzeit von' });
  const endInput = el('input', { type: 'time', class: 'text-input time-input', value: end, 'aria-label': 'Uhrzeit bis' });
  const row = el('div', { class: 'time-row' },
    el('label', { class: 'time-label' }, el('span', { text: 'von' }), startInput),
    el('label', { class: 'time-label' }, el('span', { text: 'bis' }), endInput));
  return {
    row,
    startInput,
    endInput,
    clear: () => {
      startInput.value = '';
      endInput.value = '';
    },
  };
}

// ----- Symbol auswählen -----

function iconPicker(selected, text) {
  let value = ICONS[selected] ? selected : '';
  const buttons = [];
  const choose = (name) => {
    value = name;
    for (const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.icon === name));
  };
  const auto = el('button', {
    type: 'button',
    class: 'icon-choice auto',
    'data-icon': '',
    'aria-pressed': String(value === ''),
    'aria-label': 'Symbol automatisch wählen',
    onclick: () => choose(''),
  }, el('span', { text: 'Auto' }));
  buttons.push(auto);
  for (const name of Object.keys(ICONS)) {
    buttons.push(el('button', {
      type: 'button',
      class: 'icon-choice',
      'data-icon': name,
      'aria-pressed': String(value === name),
      'aria-label': iconLabel(name),
      onclick: () => choose(name),
    }, svgIcon(name, 22)));
  }
  const node = el('fieldset', { class: 'icon-picker' },
    el('legend', { text: `Symbol (automatisch: ${iconLabel(suggestIcon(text))})` }),
    el('div', { class: 'icon-grid' }, buttons));
  return { node, get value() { return value; } };
}

// ----- Eine Zeile: Symbol, Uhrzeit, Text, Haken -----
// Tipp auf den Text öffnet die Bearbeitung.
// Optionen: checkable (mit Haken), simple (nur Text, ohne Uhrzeit/Symbol), isNow (gerade dran)

export function blockRow(item, {
  checkable = true, simple = false, isNow = false, onToggle, onSave, onDelete,
}) {
  let classes = 'block';
  if (item.done) classes += ' done';
  if (isNow) classes += ' is-now';
  if (simple) classes += ' simple';
  const li = el('li', { class: classes });

  const showView = () => {
    const time = timeText(item);
    // Leere Platzhalter (null) weglassen, sonst stünde „null“ als Text da.
    li.replaceChildren(...[
      simple ? null : el('span', { class: 'block-icon' }, svgIcon(iconFor(item))),
      el('button', { type: 'button', class: 'block-main', onclick: showEdit },
        time || isNow ? el('span', { class: 'block-time' },
          time,
          isNow ? el('span', { class: 'now-badge', text: 'Jetzt' }) : null) : null,
        el('span', { class: 'block-text', text: item.text })),
      checkable ? el('button', {
        type: 'button',
        class: 'check',
        'aria-pressed': String(Boolean(item.done)),
        'aria-label': item.done ? `„${item.text}“ wieder öffnen` : `„${item.text}“ abhaken`,
        onclick: () => onToggle(item),
      }) : null,
    ].filter(Boolean));
  };

  const showEdit = () => {
    const input = el('input', {
      type: 'text',
      class: 'text-input',
      value: item.text,
      maxlength: LIMITS.taskText,
      'aria-label': 'Text bearbeiten',
      autocomplete: 'off',
      enterkeyhint: 'done',
    });
    const times = simple ? null : timeInputs(item.start, item.end);
    const picker = simple ? null : iconPicker(item.icon, item.text);
    li.replaceChildren(el('form', {
      class: 'edit-form',
      onsubmit: (event) => {
        event.preventDefault();
        const changes = { text: input.value };
        if (!simple) {
          changes.start = times.startInput.value;
          changes.end = times.endInput.value;
          changes.icon = picker.value;
        }
        onSave(item, changes);
      },
    },
    input,
    times ? times.row : null,
    picker ? picker.node : null,
    el('div', { class: 'button-row' },
      el('button', { type: 'submit', class: 'button primary', text: 'Fertig' }),
      el('button', { type: 'button', class: 'button', text: 'Abbrechen', onclick: showView }),
      el('button', { type: 'button', class: 'button quiet', text: 'Löschen', onclick: () => onDelete(item) }))));
    input.focus();
  };

  showView();
  return li;
}

// ----- Eingabe für einen neuen Eintrag, optional mit Uhrzeit -----

export function blockAddForm({ id, placeholder, label, withTime = true, onAdd }) {
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
  const times = withTime ? timeInputs() : null;
  if (times) times.row.hidden = true;
  const toggle = withTime ? el('button', {
    type: 'button',
    class: 'add-link',
    text: '+ Uhrzeit',
    'aria-expanded': 'false',
    onclick: () => {
      const open = times.row.hidden;
      times.row.hidden = !open;
      if (!open) times.clear();
      toggle.textContent = open ? 'Ohne Uhrzeit' : '+ Uhrzeit';
      toggle.setAttribute('aria-expanded', String(open));
    },
  }) : null;

  return el('form', {
    class: 'add-block',
    onsubmit: (event) => {
      event.preventDefault();
      if (input.value.trim() === '') return;
      onAdd(input.value, times ? times.startInput.value : '', times ? times.endInput.value : '');
      input.value = '';
      if (times) times.clear();
      input.focus();
    },
  },
  el('div', { class: 'add-form' },
    input,
    el('button', { type: 'submit', class: 'button primary add-button', 'aria-label': 'Hinzufügen', text: '+' })),
  times ? times.row : null,
  toggle);
}

// Zeile mit Überschrift und Fortschritt, z. B. „Tägliche Routinen · 3 von 9“
export function progressText(items) {
  const done = items.filter((i) => i.done).length;
  return items.length ? `${done} von ${items.length}` : '';
}
