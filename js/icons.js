// Kleine Symbole für die Zeitblöcke, selbst gezeichnet (keine fremden Dateien).
// Jedes Symbol besteht aus einfachen Linien auf einer 24×24-Fläche.

const SVG_NS = 'http://www.w3.org/2000/svg';

// name: [Beschriftung, Farbton, Formen]
export const ICONS = {
  sun: ['Sonne', 'sun', [
    ['circle', { cx: 12, cy: 12, r: 4 }],
    ['path', { d: 'M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8' }],
  ]],
  plant: ['Pflanze', 'green', [
    ['path', { d: 'M12 21v-9M7 21h10' }],
    ['path', { d: 'M12 13c-4 0-6.5-2.5-6.5-6.5 4 0 6.5 2.5 6.5 6.5z' }],
    ['path', { d: 'M12 11c0-3.5 2.2-5.5 6-5.5 0 3.8-2.2 5.5-6 5.5z' }],
  ]],
  bed: ['Bett', 'earth', [
    ['path', { d: 'M3 6v13M3 16h18v3M21 16v-3a3 3 0 0 0-3-3h-7v6' }],
    ['circle', { cx: 6.5, cy: 12.5, r: 1.7 }],
  ]],
  pot: ['Topf', 'earth', [
    ['path', { d: 'M5 11h14v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4z' }],
    ['path', { d: 'M3 11h18M7 11a5 3 0 0 1 10 0M12 6v1.5' }],
  ]],
  bowl: ['Schale', 'earth', [
    ['path', { d: 'M3 11h18a9 8 0 0 1-18 0z' }],
    ['path', { d: 'M9 7c0-1.5 1.5-1.5 1.5-3M13.5 7c0-1.5 1.5-1.5 1.5-3' }],
  ]],
  cup: ['Tasse', 'earth', [
    ['path', { d: 'M5 9h11v6a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z' }],
    ['path', { d: 'M16 11h1.5a2.5 2.5 0 0 1 0 5H16M9 3.5c0 1.5 1.5 1.5 1.5 3M12.5 3.5c0 1.5 1.5 1.5 1.5 3' }],
  ]],
  phone: ['Telefon', 'sky', [
    ['path', { d: 'M6.6 3.5h3l1.5 4-2 1.3a11 11 0 0 0 6.1 6.1l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7a2 2 0 0 1 2.1-2.2z' }],
  ]],
  tree: ['Tanne', 'green', [
    ['path', { d: 'M12 3l-5 6.5h3L6 15h4l-3 4h10l-3-4h4l-4-5.5h3z' }],
    ['path', { d: 'M12 19v2.5' }],
  ]],
  book: ['Buch', 'sky', [
    ['path', { d: 'M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5z' }],
    ['path', { d: 'M12 6.5v13' }],
  ]],
  moon: ['Mond', 'sky', [
    ['path', { d: 'M19.5 14.5A8 8 0 1 1 9.5 4.5a6.5 6.5 0 0 0 10 10z' }],
    ['path', { d: 'M17.5 3.5v3M16 5h3' }],
  ]],
  journal: ['Tagebuch', 'rose', [
    ['rect', { x: 5, y: 3, width: 14, height: 18, rx: 2 }],
    ['path', { d: 'M12 15.5s-3-1.8-3-3.8a1.5 1.5 0 0 1 3-.7 1.5 1.5 0 0 1 3 .7c0 2-3 3.8-3 3.8z' }],
  ]],
  can: ['Gießkanne', 'green', [
    ['path', { d: 'M6 10h9v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z' }],
    ['path', { d: 'M15 13l5-4M7.5 10V8.5a3 3 0 0 1 6 0V10M21 12v1M19.5 14.5v1' }],
  ]],
  bath: ['Badewanne', 'sky', [
    ['path', { d: 'M3 12h18v2a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5z' }],
    ['path', { d: 'M7 19l-1 2M17 19l1 2M6 12V6a2 2 0 0 1 4 0' }],
  ]],
  sofa: ['Sofa', 'earth', [
    ['path', { d: 'M5 11V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v3' }],
    ['path', { d: 'M3 12a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v5H3zM5 17v2M19 17v2' }],
  ]],
  basket: ['Wäschekorb', 'earth', [
    ['path', { d: 'M4 10h16l-1.5 9a2 2 0 0 1-2 1.5h-9a2 2 0 0 1-2-1.5z' }],
    ['path', { d: 'M8 10l2-5M16 10l-2-5M9 13.5v4M12 13.5v4M15 13.5v4' }],
  ]],
  broom: ['Besen', 'earth', [
    ['path', { d: 'M20 4l-7 7' }],
    ['path', { d: 'M13 11l-3-1-6.5 7 3.5 3.5 7-6.5z' }],
    ['path', { d: 'M7.5 16.5l2 2' }],
  ]],
  clipboard: ['Liste', 'sky', [
    ['rect', { x: 5, y: 4, width: 14, height: 17, rx: 2 }],
    ['path', { d: 'M9 2.5h6v3H9zM8.5 10h7M8.5 13.5h7M8.5 17h4' }],
  ]],
  brush: ['Pinsel', 'rose', [
    ['path', { d: 'M14 10l6-6M11.5 12.5l2.5-2.5' }],
    ['path', { d: 'M11.5 12.5c-2-2-6.5 0-7.5 7.5 7.5-1 9.5-5.5 7.5-7.5z' }],
  ]],
  pill: ['Tablette', 'rose', [
    ['rect', { x: 3, y: 9, width: 18, height: 6, rx: 3, transform: 'rotate(-45 12 12)' }],
    ['path', { d: 'M9.9 9.9l4.2 4.2' }],
  ]],
  drop: ['Wasser', 'sky', [
    ['path', { d: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z' }],
  ]],
  bag: ['Einkauf', 'earth', [
    ['path', { d: 'M5 8h14l-1 12H6z' }],
    ['path', { d: 'M9 8V6a3 3 0 0 1 6 0v2' }],
  ]],
  leaf: ['Blatt', 'green', [
    ['path', { d: 'M5 19c0-8 5-14 14-14 0 9-6 14-14 14z' }],
    ['path', { d: 'M5 19l9-9' }],
  ]],
};

// Stichworte → Symbol. Die erste passende Zeile gewinnt, deshalb ist die Reihenfolge wichtig.
const KEYWORDS = [
  ['pill', ['medikament', 'tablette', 'supplement', 'vitamin']],
  ['sun', ['morgen', 'aufstehen', 'früh']],
  ['pot', ['koch', 'küche', 'abendessen']],
  ['bowl', ['mittag', 'essen', 'snack']],
  ['moon', ['abend', 'nacht', 'schlafen gehen']],
  ['bed', ['schlafzimmer', 'bett']],
  ['bath', ['bad', 'dusch']],
  ['sofa', ['wohnzimmer', 'sofa', 'couch']],
  ['basket', ['wäsche', 'waschen']],
  ['can', ['gießen', 'blumen']],
  ['plant', ['mobilität', 'haltung', 'übung', 'yoga', 'dehnen', 'sport', 'gymnastik']],
  ['bag', ['einkauf', 'einkaufen', 'supermarkt']],
  ['tree', ['spazier', 'draußen', 'frische luft', 'wald', 'natur']],
  ['cup', ['pause', 'kaffee', 'tee', 'durchatmen', 'ausruhen']],
  ['phone', ['telefon', 'anruf', 'anrufen']],
  ['book', ['lesen', 'buch', 'entspann']],
  ['journal', ['tagebuch', 'dankbar', 'journal', 'schreiben']],
  ['brush', ['pinsel', 'make-up', 'schmink']],
  ['drop', ['trinken', 'wasser']],
  ['broom', ['saugen', 'wischen', 'putzen', 'aufräumen', 'staub', 'haushalt', 'ordnung', 'flur']],
  ['clipboard', ['planung', 'plan', 'projekt', 'recherch', 'organis', 'termin', 'suche', 'mail', 'formular']],
];

export function suggestIcon(text) {
  const lower = String(text).toLowerCase();
  for (const [name, words] of KEYWORDS) {
    if (words.some((w) => lower.includes(w))) return name;
  }
  return 'leaf';
}

// Gewähltes Symbol oder – wenn keins gewählt ist – ein passender Vorschlag.
export function iconFor(item) {
  return ICONS[item.icon] ? item.icon : suggestIcon(item.text);
}

export function svgIcon(name, size = 24) {
  const [label, tone, shapes] = ICONS[name] || ICONS.leaf;
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.setAttribute('class', `icon tone-${tone}`);
  svg.dataset.label = label;
  for (const [tag, attrs] of shapes) {
    const shape = document.createElementNS(SVG_NS, tag);
    for (const [key, value] of Object.entries(attrs)) shape.setAttribute(key, String(value));
    svg.append(shape);
  }
  return svg;
}

export function iconLabel(name) {
  return (ICONS[name] || ICONS.leaf)[0];
}
