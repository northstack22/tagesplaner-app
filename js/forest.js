// Dezenter Waldrahmen: Tannen, Pilze und Farne als einfache Zeichnung.
// Rein dekorativ, Screenreader überspringen ihn.

const NS = 'http://www.w3.org/2000/svg';

function node(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, typeof v === 'number' ? v.toFixed(1) : v);
  parent.append(n);
  return n;
}

function canvas(className, width, height) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('preserveAspectRatio', 'xMidYMax meet');
  svg.setAttribute('class', className);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  return svg;
}

function fir(svg, x, base, h, cls) {
  node('rect', { x: x - h * 0.04, y: base - h * 0.16, width: h * 0.08, height: h * 0.16, class: 'trunk' }, svg);
  for (let k = 0; k < 3; k += 1) {
    const top = base - h + k * h * 0.24;
    const bottom = top + h * 0.42;
    const half = h * 0.62 * (0.28 + k * 0.11);
    node('path', { d: `M${x} ${top.toFixed(1)}L${(x - half).toFixed(1)} ${bottom.toFixed(1)}L${(x + half).toFixed(1)} ${bottom.toFixed(1)}Z`, class: cls }, svg);
  }
}

function mushroom(svg, x, base, s) {
  node('rect', { x: x - s * 0.17, y: base - s * 0.55, width: s * 0.34, height: s * 0.55, rx: s * 0.12, class: 'stem' }, svg);
  node('path', { d: `M${(x - s * 0.6).toFixed(1)} ${(base - s * 0.48).toFixed(1)}A${(s * 0.6).toFixed(1)} ${(s * 0.5).toFixed(1)} 0 0 1 ${(x + s * 0.6).toFixed(1)} ${(base - s * 0.48).toFixed(1)}Z`, class: 'cap' }, svg);
  node('circle', { cx: x - s * 0.24, cy: base - s * 0.72, r: s * 0.07, class: 'dot' }, svg);
  node('circle', { cx: x + s * 0.18, cy: base - s * 0.82, r: s * 0.06, class: 'dot' }, svg);
  node('circle', { cx: x + s * 0.34, cy: base - s * 0.6, r: s * 0.05, class: 'dot' }, svg);
}

function fern(svg, x, base, h, lean) {
  let d = `M${x} ${base}Q${x} ${base - h * 0.6} ${x + lean} ${base - h}`;
  for (let i = 1; i <= 6; i += 1) {
    const t = i / 7;
    const px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * x + t * t * (x + lean);
    const py = (1 - t) * (1 - t) * base + 2 * (1 - t) * t * (base - h * 0.6) + t * t * (base - h);
    const len = h * 0.3 * (1 - t * 0.65);
    d += `M${px.toFixed(1)} ${py.toFixed(1)}l${(-len).toFixed(1)} ${(-len * 0.35).toFixed(1)}`;
    d += `M${px.toFixed(1)} ${py.toFixed(1)}l${(len * 0.9).toFixed(1)} ${(-len * 0.45).toFixed(1)}`;
  }
  node('path', { d, class: 'fern' }, svg);
}

// Schmaler Streifen oben: Tannen links und rechts, ein Pilz.
export function forestTop() {
  const svg = canvas('forest-top', 400, 40);
  const base = 40;
  [[10, 30, 'fir-b'], [26, 38, 'fir-a'], [44, 26, 'fir-b'], [60, 18, 'fir-a'],
    [334, 20, 'fir-a'], [350, 30, 'fir-b'], [368, 38, 'fir-a'], [388, 28, 'fir-b']]
    .forEach(([x, h, cls]) => fir(svg, x, base, h, cls));
  mushroom(svg, 318, base, 11);
  fern(svg, 82, base, 16, 6);
  return svg;
}

// Waldboden am Ende der Seite: Farne, Pilze, kleine Tannen.
export function forestFloor() {
  const svg = canvas('forest-floor', 400, 56);
  const base = 54;
  node('path', { d: 'M0 54.5Q100 50 200 54t200 0', class: 'ground' }, svg);
  fern(svg, 20, base, 34, 10);
  fern(svg, 38, base, 24, -6);
  mushroom(svg, 64, base, 14);
  mushroom(svg, 80, base, 9);
  [[300, 34, 'fir-b'], [318, 44, 'fir-a'], [338, 30, 'fir-b']].forEach(([x, h, cls]) => fir(svg, x, base, h, cls));
  fern(svg, 366, base, 28, -8);
  mushroom(svg, 386, base, 10);
  return svg;
}
