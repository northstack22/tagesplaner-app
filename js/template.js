// Wochenvorlage bearbeiten: Standard-Blöcke für jeden Wochentag.
// Neue Tage werden daraus automatisch befüllt.

import * as store from './storage.js';
import { todayKey, isoWeekday, WEEKDAYS_SHORT, WEEKDAYS_LONG } from './dates.js';
import { el, toast, blockRow, blockAddForm, plural } from './ui.js';

let ctx;
let weekday = 1; // 1 = Montag … 7 = Sonntag
const parts = {};

export function init(section, context) {
  ctx = context;
  parts.chips = el('div', { class: 'weekday-chips', role: 'group', 'aria-label': 'Wochentag wählen' });
  parts.dayTitle = el('h2', { class: 'section-title' });
  parts.list = el('ul', { class: 'block-list' });
  parts.status = el('p', { class: 'status-line' });
  parts.copy = el('div', { class: 'copy-area' });
  parts.add = blockAddForm({
    id: 'template-new',
    placeholder: 'Neuer Block, z. B. Spaziergang',
    label: 'Neuer Block für die Vorlage',
    onAdd: (text, start, end) => {
      if (!store.addTemplateBlock(weekday, text, start, end)) {
        toast('Für diesen Tag sind schon sehr viele Blöcke eingetragen.');
        return;
      }
      render();
    },
  });

  section.append(
    el('div', { class: 'pager-extra left' },
      el('button', { type: 'button', class: 'button', text: '‹ Zurück zur Woche', onclick: () => ctx.goTo('week') })),
    el('div', { class: 'card card-soft' },
      el('p', { text: 'Hier richtest du deine Standardwoche ein. Jeder Tag wird automatisch daraus befüllt.' }),
      el('p', { class: 'hint spaced', text: 'Änderungen gelten für alle Tage, an denen noch nichts abgehakt oder geändert wurde. Routine-Blöcke wandern nicht in „Von gestern“.' })),
    parts.chips,
    el('div', { class: 'card list-card' }, parts.dayTitle, parts.list, parts.status),
    el('div', { class: 'card add-card' }, parts.add),
    parts.copy,
  );
}

export function reset() {
  weekday = isoWeekday(todayKey());
  delete parts.copy.dataset.open;
}

export function render() {
  ctx.setSubtitle('Gilt für jede neue Woche');
  renderChips();
  const name = WEEKDAYS_LONG[weekday - 1];
  parts.dayTitle.textContent = name;
  const input = parts.add.querySelector('input[type=text]');
  input.setAttribute('aria-label', `Neuer Block für ${name}`);

  const blocks = store.templateDay(weekday);
  parts.list.replaceChildren(...blocks.map((block) => blockRow(block, {
    checkable: false,
    onSave: (_, changes) => {
      store.updateTemplateBlock(weekday, block.id, changes);
      render();
    },
    onDelete: () => {
      const removed = store.deleteTemplateBlock(weekday, block.id);
      render();
      toast('Block gelöscht.', {
        label: 'Rückgängig',
        run: () => {
          store.restoreTemplateBlock(removed);
          render();
        },
      });
    },
  })));
  parts.status.textContent = blocks.length
    ? plural(blocks.length, 'Block', 'Blöcke')
    : `Noch keine Blöcke für ${name}. Trag unten den ersten ein.`;
  renderCopy(blocks.length);
}

function renderChips() {
  const chips = WEEKDAYS_SHORT.map((short, i) => {
    const wd = i + 1;
    const count = store.templateDay(wd).length;
    return el('button', {
      type: 'button',
      class: 'chip',
      'aria-pressed': String(wd === weekday),
      'aria-label': `${WEEKDAYS_LONG[i]}, ${plural(count, 'Block', 'Blöcke')}`,
      onclick: () => {
        weekday = wd;
        delete parts.copy.dataset.open;
        render();
      },
    }, el('span', { text: short }), el('span', { class: 'chip-count', text: String(count) }));
  });
  parts.chips.replaceChildren(...chips);
}

// ----- Einen Tag auf andere Tage kopieren -----

function renderCopy(blockCount) {
  const name = WEEKDAYS_LONG[weekday - 1];
  if (blockCount === 0) {
    parts.copy.replaceChildren();
    return;
  }
  if (parts.copy.dataset.open !== 'true') {
    parts.copy.replaceChildren(el('button', {
      type: 'button',
      class: 'button',
      text: `${name} auf andere Tage kopieren`,
      onclick: () => {
        parts.copy.dataset.open = 'true';
        renderCopy(blockCount);
      },
    }));
    return;
  }

  const boxes = [];
  const labels = [];
  for (let wd = 1; wd <= 7; wd += 1) {
    if (wd === weekday) continue;
    const box = el('input', { type: 'checkbox', value: String(wd) });
    boxes.push(box);
    labels.push(el('label', { class: 'check-chip' }, box, el('span', { text: WEEKDAYS_SHORT[wd - 1] })));
  }

  parts.copy.replaceChildren(el('div', { class: 'card' },
    el('h2', { class: 'section-title', text: `${name} kopieren auf …` }),
    el('div', { class: 'copy-days' }, labels),
    el('button', {
      type: 'button',
      class: 'add-link',
      text: 'Alle Werktage auswählen',
      onclick: () => {
        for (const b of boxes) b.checked = Number(b.value) <= 5;
      },
    }),
    el('p', { class: 'hint', text: 'Die Blöcke an den gewählten Tagen werden ersetzt.' }),
    el('div', { class: 'button-row' },
      el('button', {
        type: 'button',
        class: 'button primary',
        text: 'Kopieren',
        onclick: () => {
          const targets = boxes.filter((b) => b.checked).map((b) => Number(b.value));
          if (targets.length === 0) {
            toast('Bitte mindestens einen Tag auswählen.');
            return;
          }
          const previous = store.copyTemplateDay(weekday, targets);
          delete parts.copy.dataset.open;
          render();
          toast(`Auf ${plural(targets.length, 'Tag', 'Tage')} kopiert.`, {
            label: 'Rückgängig',
            run: () => {
              store.restoreTemplateDays(previous);
              render();
            },
          });
        },
      }),
      el('button', {
        type: 'button',
        class: 'button',
        text: 'Abbrechen',
        onclick: () => {
          delete parts.copy.dataset.open;
          renderCopy(blockCount);
        },
      }))));
}
