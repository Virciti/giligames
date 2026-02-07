/**
 * SVG path data for outfit items, keyed by svgKey.
 * Each function returns a JSX.Element (SVG <g> group) for the item.
 * Takes primary color, optional secondary color, and layer (back/front).
 */

import { createElement as h, type ReactElement } from 'react';

type PartRenderer = (primary: string, secondary: string | undefined, layer: 'back' | 'front') => ReactElement | null;

function g(props: Record<string, unknown>, ...children: (ReactElement | null)[]) {
  return h('g', props, ...children.filter(Boolean));
}
function path(props: Record<string, unknown>) {
  return h('path', props);
}
function ellipse(props: Record<string, unknown>) {
  return h('ellipse', props);
}
function rect(props: Record<string, unknown>) {
  return h('rect', props);
}
function circle(props: Record<string, unknown>) {
  return h('circle', props);
}
function line(props: Record<string, unknown>) {
  return h('line', props);
}

// ============================================================
// TOPS
// ============================================================

const tshirt: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'tshirt' },
    path({ d: 'M76 126 L70 190 L130 190 L124 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    path({ d: 'M88 126 Q100 134 112 126', fill: lighten(primary), stroke: darken(primary), strokeWidth: 0.5 }),
    line({ x1: 76, y1: 126, x2: 66, y2: 150, stroke: darken(primary), strokeWidth: 0.5 }),
    line({ x1: 124, y1: 126, x2: 134, y2: 150, stroke: darken(primary), strokeWidth: 0.5 }),
  );
};

const stripedTee: PartRenderer = (primary, secondary = '#FFFFFF', layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'stripedTee' },
    path({ d: 'M76 126 L70 190 L130 190 L124 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // Stripes
    ...[140, 150, 160, 170, 180].map((y) =>
      rect({ key: `stripe-${y}`, x: 71, y, width: 58, height: 4, fill: secondary, opacity: 0.6 })
    ),
    path({ d: 'M88 126 Q100 134 112 126', fill: lighten(primary), stroke: darken(primary), strokeWidth: 0.5 }),
  );
};

const tankTop: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'tankTop' },
    path({ d: 'M82 126 L76 188 L124 188 L118 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    path({ d: 'M90 126 Q100 132 110 126', fill: lighten(primary), stroke: darken(primary), strokeWidth: 0.5 }),
  );
};

const hoodie: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'hoodie' },
    path({ d: 'M72 126 L66 195 L134 195 L128 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // Hood
    path({ d: 'M82 126 Q100 118 118 126 Q112 110 100 108 Q88 110 82 126Z', fill: darken(primary), stroke: darken(primary), strokeWidth: 0.3 }),
    // Pocket
    rect({ x: 86, y: 165, width: 28, height: 14, rx: 3, fill: darken(primary), opacity: 0.3 }),
    // Drawstrings
    line({ x1: 94, y1: 126, x2: 92, y2: 145, stroke: '#FFF', strokeWidth: 0.8 }),
    line({ x1: 106, y1: 126, x2: 108, y2: 145, stroke: '#FFF', strokeWidth: 0.8 }),
  );
};

const blouse: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'blouse' },
    path({ d: 'M76 126 L72 192 L128 192 L124 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    path({ d: 'M88 126 Q100 136 112 126', fill: lighten(primary), stroke: darken(primary), strokeWidth: 0.5 }),
    // Collar
    path({ d: 'M88 126 L82 138 L92 132Z', fill: '#FFF', stroke: darken(primary), strokeWidth: 0.3 }),
    path({ d: 'M112 126 L118 138 L108 132Z', fill: '#FFF', stroke: darken(primary), strokeWidth: 0.3 }),
    // Button line
    ...[140, 152, 164, 176].map((y) =>
      circle({ key: `btn-${y}`, cx: 100, cy: y, r: 1.5, fill: darken(primary) })
    ),
  );
};

const polo: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'polo' },
    path({ d: 'M76 126 L70 192 L130 192 L124 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // Collar
    path({ d: 'M84 126 Q100 120 116 126 Q108 130 100 128 Q92 130 84 126Z', fill: '#FFF', stroke: darken(primary), strokeWidth: 0.5 }),
    // Buttons
    circle({ cx: 100, cy: 134, r: 1.2, fill: darken(primary) }),
    circle({ cx: 100, cy: 140, r: 1.2, fill: darken(primary) }),
  );
};

const leotard: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'leotard' },
    path({ d: 'M82 126 L78 220 Q100 225 122 220 L118 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    path({ d: 'M90 126 Q100 132 110 126', fill: lighten(primary), stroke: darken(primary), strokeWidth: 0.3 }),
    // Sparkle accents
    circle({ cx: 95, cy: 155, r: 1, fill: '#FFD700', opacity: 0.8 }),
    circle({ cx: 105, cy: 165, r: 1, fill: '#FFD700', opacity: 0.8 }),
    circle({ cx: 92, cy: 175, r: 1, fill: '#FFD700', opacity: 0.8 }),
    circle({ cx: 108, cy: 150, r: 1, fill: '#FFD700', opacity: 0.8 }),
  );
};

const sequinTop: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'sequinTop' },
    path({ d: 'M76 126 L72 190 L128 190 L124 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // Sequin sparkle dots
    ...[
      [82, 135], [90, 142], [98, 138], [106, 145], [114, 135],
      [85, 155], [95, 160], [105, 158], [115, 152],
      [80, 175], [92, 170], [100, 178], [110, 172], [120, 177],
    ].map(([x, y], i) =>
      circle({ key: `seq-${i}`, cx: x, cy: y, r: 1.2, fill: '#FFD700', opacity: 0.7 })
    ),
  );
};

const athleticTop: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'athleticTop' },
    path({ d: 'M80 126 L76 188 L124 188 L120 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // Racing stripe
    path({ d: 'M96 126 L94 188 L106 188 L104 126Z', fill: '#FFF', opacity: 0.4 }),
  );
};

const winterCoat: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'winterCoat' },
    path({ d: 'M68 126 L62 200 L138 200 L132 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // Fur collar
    ellipse({ cx: 100, cy: 128, rx: 30, ry: 8, fill: '#FFF', stroke: '#DDD', strokeWidth: 0.3 }),
    // Zipper
    line({ x1: 100, y1: 136, x2: 100, y2: 198, stroke: '#999', strokeWidth: 1.5 }),
    // Pockets
    rect({ x: 72, y: 165, width: 18, height: 12, rx: 3, fill: darken(primary), opacity: 0.3 }),
    rect({ x: 110, y: 165, width: 18, height: 12, rx: 3, fill: darken(primary), opacity: 0.3 }),
  );
};

const pjTop: PartRenderer = (primary, secondary = '#FFE66D', layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'pjTop' },
    path({ d: 'M76 126 L70 192 L130 192 L124 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    path({ d: 'M88 126 Q100 134 112 126', fill: lighten(primary) }),
    // Stars pattern
    ...[
      [85, 145], [100, 155], [115, 140], [88, 170], [110, 175], [98, 185],
    ].map(([x, y], i) =>
      path({ key: `star-${i}`, d: starPath(x!, y!, 3), fill: secondary, opacity: 0.6 })
    ),
  );
};

const rainJacket: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'rainJacket' },
    path({ d: 'M70 126 L64 198 L136 198 L130 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // Hood
    path({ d: 'M80 126 Q100 116 120 126 Q114 108 100 106 Q86 108 80 126Z', fill: darken(primary), strokeWidth: 0.3 }),
    // Zipper
    line({ x1: 100, y1: 126, x2: 100, y2: 196, stroke: '#999', strokeWidth: 1.5 }),
    // Rain flap
    path({ d: 'M98 126 L96 195', stroke: darken(primary), strokeWidth: 1 }),
  );
};

const superheroTop: PartRenderer = (primary, secondary = '#FFE66D', layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'superheroTop' },
    path({ d: 'M76 126 L72 195 L128 195 L124 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // Emblem
    path({ d: starPath(100, 158, 12), fill: secondary }),
    // Belt line
    rect({ x: 72, y: 188, width: 56, height: 6, fill: secondary }),
  );
};

const gownBodice: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'gownBodice' },
    path({ d: 'M78 126 L74 192 L126 192 L122 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // Sweetheart neckline
    path({ d: 'M86 126 Q93 136 100 132 Q107 136 114 126', fill: lighten(primary), stroke: darken(primary), strokeWidth: 0.5 }),
    // Sparkle accents
    ...[
      [92, 140], [100, 148], [108, 140], [96, 160], [104, 160],
      [100, 175], [90, 180], [110, 180],
    ].map(([x, y], i) =>
      circle({ key: `sp-${i}`, cx: x, cy: y, r: 1, fill: '#FFD700', opacity: 0.8 })
    ),
  );
};

const rainbowHoodie: PartRenderer = (primary, secondary = '#9B5DE5', layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'rainbowHoodie' },
    rect({ x: 68, y: 126, width: 64, height: 69, rx: 4, fill: primary }),
    // Rainbow gradient stripes
    ...[
      ['#FF6B6B', 136], ['#FF9F43', 146], ['#FFE66D', 156], ['#7BC74D', 166], ['#4ECDC4', 176], [secondary, 186],
    ].map(([color, y], i) =>
      rect({ key: `rbs-${i}`, x: 70, y, width: 60, height: 8, fill: color as string, opacity: 0.7 })
    ),
    // Hood
    path({ d: 'M82 126 Q100 118 118 126 Q112 110 100 108 Q88 110 82 126Z', fill: darken(primary) }),
  );
};

// ============================================================
// BOTTOMS
// ============================================================

const jeans: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'jeans' },
    path({ d: 'M72 188 L76 365 L92 365 L100 240 L108 365 L124 365 L128 188 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    line({ x1: 100, y1: 188, x2: 100, y2: 240, stroke: darken(primary), strokeWidth: 0.5 }),
    // Pockets
    path({ d: 'M76 194 L80 194 L82 210 L74 210Z', fill: darken(primary), opacity: 0.2 }),
    path({ d: 'M118 194 L124 194 L126 210 L120 210Z', fill: darken(primary), opacity: 0.2 }),
  );
};

const shorts: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'shorts' },
    path({ d: 'M72 188 L78 270 L96 270 L100 220 L104 270 L122 270 L128 188 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    line({ x1: 100, y1: 188, x2: 100, y2: 220, stroke: darken(primary), strokeWidth: 0.5 }),
  );
};

const skirt: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'skirt' },
    path({ d: 'M74 188 L62 290 L138 290 L126 188 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // Pleats
    ...[82, 92, 102, 112, 122].map((x) =>
      line({ key: `pleat-${x}`, x1: x, y1: 192, x2: x - 4, y2: 288, stroke: darken(primary), strokeWidth: 0.3, opacity: 0.5 })
    ),
  );
};

const leggings: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'leggings' },
    path({ d: 'M74 188 L76 370 L90 370 L100 230 L110 370 L124 370 L126 188 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.3 }),
  );
};

const tutu: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'tutu' },
    // Waistband
    rect({ x: 74, y: 188, width: 52, height: 8, rx: 2, fill: darken(primary) }),
    // Tutu layers (fluffy)
    ellipse({ cx: 100, cy: 220, rx: 46, ry: 28, fill: primary, opacity: 0.5 }),
    ellipse({ cx: 100, cy: 218, rx: 42, ry: 24, fill: primary, opacity: 0.6 }),
    ellipse({ cx: 100, cy: 216, rx: 38, ry: 20, fill: primary, opacity: 0.7 }),
    // Sparkles
    circle({ cx: 78, cy: 215, r: 1, fill: '#FFD700', opacity: 0.6 }),
    circle({ cx: 120, cy: 222, r: 1, fill: '#FFD700', opacity: 0.6 }),
    circle({ cx: 95, cy: 230, r: 1, fill: '#FFD700', opacity: 0.6 }),
  );
};

const gymShorts: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'gymShorts' },
    path({ d: 'M74 188 L76 260 L96 260 L100 215 L104 260 L124 260 L126 188 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // Side stripe
    path({ d: 'M74 188 L76 260', stroke: '#FFF', strokeWidth: 2, opacity: 0.5 }),
    path({ d: 'M126 188 L124 260', stroke: '#FFF', strokeWidth: 2, opacity: 0.5 }),
  );
};

const snowPants: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'snowPants' },
    path({ d: 'M70 188 L72 370 L92 370 L100 240 L108 370 L128 370 L130 188 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // Puffy quilted lines
    ...[210, 240, 270, 300, 330].map((y) =>
      path({ key: `quilt-${y}`, d: `M74 ${y} Q100 ${y + 5} 126 ${y}`, stroke: darken(primary), strokeWidth: 0.5, fill: 'none' })
    ),
  );
};

const pjPants: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'pjPants' },
    path({ d: 'M72 188 L74 370 L92 370 L100 235 L108 370 L126 370 L128 188 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.3 }),
    // Cloud pattern
    ...[
      [84, 220], [112, 240], [88, 280], [116, 300], [82, 340], [110, 350],
    ].map(([x, y], i) =>
      ellipse({ key: `cloud-${i}`, cx: x, cy: y, rx: 6, ry: 3, fill: '#FFF', opacity: 0.2 })
    ),
  );
};

const rainPants: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'rainPants' },
    path({ d: 'M70 188 L72 370 L92 370 L100 240 L108 370 L128 370 L130 188 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
  );
};

const sparkleSkirt: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'sparkleSkirt' },
    path({ d: 'M72 188 L56 320 L144 320 L128 188 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // Big sparkles
    ...[
      [80, 220], [115, 230], [90, 260], [120, 270], [70, 290], [130, 300], [100, 310],
    ].map(([x, y], i) =>
      path({ key: `spk-${i}`, d: starPath(x!, y!, 3), fill: '#FFD700', opacity: 0.7 })
    ),
  );
};

const heroPants: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'heroPants' },
    path({ d: 'M72 188 L74 370 L92 370 L100 240 L108 370 L126 370 L128 188 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // Side lightning bolt
    path({ d: 'M74 210 L80 230 L76 230 L82 260', stroke: '#FFE66D', strokeWidth: 2, fill: 'none' }),
    path({ d: 'M126 210 L120 230 L124 230 L118 260', stroke: '#FFE66D', strokeWidth: 2, fill: 'none' }),
  );
};

const flarePants: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'flarePants' },
    path({ d: 'M74 188 L60 370 L98 370 L100 230 L102 370 L140 370 L126 188 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
  );
};

// ============================================================
// DRESSES
// ============================================================

const sundress: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'sundress' },
    // Bodice
    path({ d: 'M82 126 L78 190 L122 190 L118 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // Straps
    line({ x1: 88, y1: 118, x2: 86, y2: 126, stroke: primary, strokeWidth: 3 }),
    line({ x1: 112, y1: 118, x2: 114, y2: 126, stroke: primary, strokeWidth: 3 }),
    // Skirt
    path({ d: 'M78 190 L65 310 L135 310 L122 190 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // Flower pattern
    ...[
      [90, 230], [110, 250], [85, 270], [115, 280], [100, 300],
    ].map(([x, y], i) =>
      circle({ key: `flwr-${i}`, cx: x, cy: y, r: 3, fill: '#FFF', opacity: 0.4 })
    ),
  );
};

const partyDress: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'partyDress' },
    path({ d: 'M80 126 L76 190 L124 190 L120 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    path({ d: 'M76 190 L60 300 L140 300 L124 190 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    path({ d: 'M88 126 Q100 134 112 126', fill: lighten(primary), stroke: darken(primary), strokeWidth: 0.5 }),
    // Belt/sash
    rect({ x: 76, y: 186, width: 48, height: 6, rx: 2, fill: darken(primary) }),
  );
};

const schoolJumper: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'schoolJumper' },
    path({ d: 'M82 126 L78 190 L122 190 L118 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    path({ d: 'M78 190 L68 290 L132 290 L122 190 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // V-neck
    path({ d: 'M88 126 L100 145 L112 126', fill: '#FFF', stroke: darken(primary), strokeWidth: 0.5 }),
    // Pleats
    ...[84, 94, 104, 114].map((x) =>
      line({ key: `pl-${x}`, x1: x, y1: 192, x2: x - 2, y2: 288, stroke: darken(primary), strokeWidth: 0.3 })
    ),
  );
};

const balletDress: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'balletDress' },
    // Bodice
    path({ d: 'M82 126 L80 190 L120 190 L118 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // Tutu skirt (fluffy layers)
    ellipse({ cx: 100, cy: 215, rx: 48, ry: 30, fill: primary, opacity: 0.4 }),
    ellipse({ cx: 100, cy: 212, rx: 44, ry: 26, fill: primary, opacity: 0.5 }),
    ellipse({ cx: 100, cy: 209, rx: 40, ry: 22, fill: primary, opacity: 0.7 }),
    // Sparkles
    ...[
      [82, 135], [118, 135], [100, 142], [85, 210], [115, 215], [100, 230],
    ].map(([x, y], i) =>
      circle({ key: `sp-${i}`, cx: x, cy: y, r: 1.2, fill: '#FFD700', opacity: 0.7 })
    ),
  );
};

const unitard: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'unitard' },
    path({ d: 'M82 126 L78 270 L96 270 L100 200 L104 270 L122 270 L118 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    path({ d: 'M90 126 Q100 132 110 126', fill: lighten(primary) }),
    // Diagonal accent
    path({ d: 'M82 126 L118 200', stroke: '#FFF', strokeWidth: 1.5, opacity: 0.3 }),
  );
};

const onesie: PartRenderer = (primary, secondary = '#FFB6C1', layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'onesie' },
    // Full body
    path({ d: 'M76 126 L72 370 L92 370 L100 240 L108 370 L128 370 L124 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // Hood with unicorn horn
    path({ d: 'M82 126 Q100 116 118 126 Q112 108 100 106 Q88 108 82 126Z', fill: primary }),
    path({ d: 'M100 106 L97 88 L103 88Z', fill: '#FFD700' }),
    // Ears
    path({ d: 'M86 112 L82 100 L90 108Z', fill: secondary }),
    path({ d: 'M114 112 L118 100 L110 108Z', fill: secondary }),
    // Belly
    ellipse({ cx: 100, cy: 170, rx: 18, ry: 25, fill: '#FFF', opacity: 0.3 }),
    // Zipper
    line({ x1: 100, y1: 126, x2: 100, y2: 200, stroke: '#999', strokeWidth: 1 }),
  );
};

const fancyDress: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'fancyDress' },
    path({ d: 'M80 126 L76 190 L124 190 L120 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    path({ d: 'M76 190 L62 320 L138 320 L124 190 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    path({ d: 'M88 126 Q100 136 112 126', fill: lighten(primary) }),
    // Elegant neckline
    path({ d: 'M86 126 Q100 138 114 126', stroke: darken(primary), strokeWidth: 0.5, fill: 'none' }),
    // Waist sash
    rect({ x: 76, y: 186, width: 48, height: 5, rx: 2, fill: darken(primary) }),
    // Bow at waist
    path({ d: 'M100 188 L92 182 L100 186 L108 182Z', fill: darken(primary) }),
  );
};

const princessGown: PartRenderer = (primary, secondary = '#FFD700', layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'princessGown' },
    // Bodice
    path({ d: 'M80 126 L76 192 L124 192 L120 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // Sweetheart neckline
    path({ d: 'M86 126 Q93 138 100 134 Q107 138 114 126', fill: lighten(primary), stroke: darken(primary), strokeWidth: 0.5 }),
    // Massive ballgown skirt
    path({ d: 'M76 192 L40 380 L160 380 L124 192 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // Gold trim
    path({ d: 'M40 380 Q100 370 160 380', stroke: secondary, strokeWidth: 2, fill: 'none' }),
    path({ d: 'M50 370 Q100 360 150 370', stroke: secondary, strokeWidth: 1, fill: 'none', opacity: 0.5 }),
    // Sparkles all over
    ...[
      [90, 140], [110, 140], [100, 150],
      [80, 230], [100, 250], [120, 240], [70, 280], [130, 280],
      [60, 330], [90, 340], [110, 330], [140, 340],
      [50, 370], [80, 365], [120, 370], [150, 365],
    ].map(([x, y], i) =>
      circle({ key: `sp-${i}`, cx: x, cy: y, r: 1.5, fill: secondary, opacity: 0.7 })
    ),
  );
};

const heroSuit: PartRenderer = (primary, secondary = '#0066FF', layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'heroSuit' },
    // Full body suit
    path({ d: 'M78 126 L74 370 L92 370 L100 240 L108 370 L126 370 L122 126 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // Belt
    rect({ x: 74, y: 188, width: 52, height: 8, rx: 2, fill: secondary }),
    // Belt buckle
    rect({ x: 94, y: 186, width: 12, height: 12, rx: 2, fill: '#FFE66D', stroke: darken('#FFE66D'), strokeWidth: 0.5 }),
    // Chest emblem
    path({ d: starPath(100, 155, 14), fill: secondary }),
    // Boot tops
    line({ x1: 74, y1: 330, x2: 92, y2: 330, stroke: secondary, strokeWidth: 3 }),
    line({ x1: 108, y1: 330, x2: 126, y2: 330, stroke: secondary, strokeWidth: 3 }),
  );
};

const rainbowDress: PartRenderer = (primary, _secondary, layer) => {
  if (layer !== 'front') return null;
  const colors = ['#FF6B6B', '#FF9F43', '#FFE66D', '#7BC74D', '#4ECDC4', '#9B5DE5'];
  return g({ key: 'rainbowDress' },
    path({ d: 'M82 126 L78 190 L122 190 L118 126 Z', fill: primary }),
    // Rainbow skirt layers
    ...colors.map((c, i) =>
      path({ key: `rl-${i}`, d: `M${78 - i * 3} ${190 + i * 22} L${60 - i * 4} ${212 + i * 22} L${140 + i * 4} ${212 + i * 22} L${122 + i * 3} ${190 + i * 22}Z`, fill: c, opacity: 0.7 })
    ),
  );
};

// ============================================================
// SHOES
// ============================================================

const sneakers: PartRenderer = (primary, secondary = '#FFB6C1', layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'sneakers' },
    // Left shoe
    path({ d: 'M66 368 L64 380 L96 380 L94 368 Z', fill: primary, stroke: '#CCC', strokeWidth: 0.5 }),
    circle({ cx: 78, cy: 374, r: 1.5, fill: secondary }),
    // Right shoe
    path({ d: 'M106 368 L104 380 L136 380 L134 368 Z', fill: primary, stroke: '#CCC', strokeWidth: 0.5 }),
    circle({ cx: 118, cy: 374, r: 1.5, fill: secondary }),
  );
};

const sandals: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'sandals' },
    // Left sandal
    ellipse({ cx: 80, cy: 378, rx: 16, ry: 5, fill: primary }),
    path({ d: 'M72 378 Q80 370 88 378', stroke: primary, strokeWidth: 2, fill: 'none' }),
    // Right sandal
    ellipse({ cx: 120, cy: 378, rx: 16, ry: 5, fill: primary }),
    path({ d: 'M112 378 Q120 370 128 378', stroke: primary, strokeWidth: 2, fill: 'none' }),
  );
};

const maryJanes: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'maryJanes' },
    // Left shoe
    path({ d: 'M64 368 L62 382 L96 382 L94 368 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    path({ d: 'M74 368 Q80 364 86 368', stroke: primary, strokeWidth: 2, fill: 'none' }),
    circle({ cx: 80, cy: 368, r: 1.5, fill: '#333' }),
    // Right shoe
    path({ d: 'M104 368 L102 382 L136 382 L134 368 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    path({ d: 'M114 368 Q120 364 126 368', stroke: primary, strokeWidth: 2, fill: 'none' }),
    circle({ cx: 120, cy: 368, r: 1.5, fill: '#333' }),
  );
};

const hiTops: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'hiTops' },
    // Left hi-top
    path({ d: 'M66 350 L64 382 L96 382 L94 350 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    rect({ x: 68, y: 350, width: 24, height: 4, fill: '#FFF' }),
    // Right hi-top
    path({ d: 'M106 350 L104 382 L136 382 L134 350 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    rect({ x: 108, y: 350, width: 24, height: 4, fill: '#FFF' }),
  );
};

const balletSlippers: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'balletSlippers' },
    ellipse({ cx: 80, cy: 376, rx: 14, ry: 6, fill: primary, stroke: darken(primary), strokeWidth: 0.3 }),
    // Ribbons
    path({ d: 'M80 370 Q75 360 70 355', stroke: primary, strokeWidth: 1, fill: 'none' }),
    path({ d: 'M80 370 Q85 360 90 355', stroke: primary, strokeWidth: 1, fill: 'none' }),
    ellipse({ cx: 120, cy: 376, rx: 14, ry: 6, fill: primary, stroke: darken(primary), strokeWidth: 0.3 }),
    path({ d: 'M120 370 Q115 360 110 355', stroke: primary, strokeWidth: 1, fill: 'none' }),
    path({ d: 'M120 370 Q125 360 130 355', stroke: primary, strokeWidth: 1, fill: 'none' }),
  );
};

const gymShoes: PartRenderer = (primary, secondary = '#7BC74D', layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'gymShoes' },
    path({ d: 'M66 368 L64 382 L96 382 L94 368 Z', fill: primary, stroke: '#DDD', strokeWidth: 0.5 }),
    path({ d: 'M70 372 L90 372', stroke: secondary, strokeWidth: 2 }),
    path({ d: 'M106 368 L104 382 L136 382 L134 368 Z', fill: primary, stroke: '#DDD', strokeWidth: 0.5 }),
    path({ d: 'M110 372 L130 372', stroke: secondary, strokeWidth: 2 }),
  );
};

const snowBoots: PartRenderer = (primary, secondary = '#FFFFFF', layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'snowBoots' },
    // Left boot
    path({ d: 'M66 340 L62 384 L98 384 L94 340 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    ellipse({ cx: 80, cy: 342, rx: 15, ry: 5, fill: secondary }),
    // Right boot
    path({ d: 'M106 340 L102 384 L138 384 L134 340 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    ellipse({ cx: 120, cy: 342, rx: 15, ry: 5, fill: secondary }),
  );
};

const bunnySlippers: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'bunnySlippers' },
    // Left slipper
    ellipse({ cx: 80, cy: 378, rx: 16, ry: 8, fill: primary }),
    // Bunny ears
    ellipse({ cx: 72, cy: 365, rx: 3, ry: 8, fill: primary }),
    ellipse({ cx: 72, cy: 365, rx: 1.5, ry: 5, fill: lighten(primary) }),
    ellipse({ cx: 80, cy: 365, rx: 3, ry: 8, fill: primary }),
    ellipse({ cx: 80, cy: 365, rx: 1.5, ry: 5, fill: lighten(primary) }),
    // Eyes
    circle({ cx: 76, cy: 374, r: 1.5, fill: '#333' }),
    circle({ cx: 84, cy: 374, r: 1.5, fill: '#333' }),
    // Right slipper
    ellipse({ cx: 120, cy: 378, rx: 16, ry: 8, fill: primary }),
    ellipse({ cx: 112, cy: 365, rx: 3, ry: 8, fill: primary }),
    ellipse({ cx: 112, cy: 365, rx: 1.5, ry: 5, fill: lighten(primary) }),
    ellipse({ cx: 120, cy: 365, rx: 3, ry: 8, fill: primary }),
    ellipse({ cx: 120, cy: 365, rx: 1.5, ry: 5, fill: lighten(primary) }),
    circle({ cx: 116, cy: 374, r: 1.5, fill: '#333' }),
    circle({ cx: 124, cy: 374, r: 1.5, fill: '#333' }),
  );
};

const rainBoots: PartRenderer = (primary, secondary = '#FF6B6B', layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'rainBoots' },
    path({ d: 'M66 345 L62 384 L98 384 L94 345 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    rect({ x: 66, y: 345, width: 28, height: 5, fill: secondary }),
    path({ d: 'M106 345 L102 384 L138 384 L134 345 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    rect({ x: 106, y: 345, width: 28, height: 5, fill: secondary }),
  );
};

const glassSlippers: PartRenderer = (primary, secondary = '#FFD700', layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'glassSlippers' },
    // Transparent-looking shoes
    ellipse({ cx: 80, cy: 376, rx: 16, ry: 7, fill: primary, opacity: 0.5, stroke: secondary, strokeWidth: 0.8 }),
    path({ d: starPath(80, 373, 3), fill: secondary, opacity: 0.8 }),
    ellipse({ cx: 120, cy: 376, rx: 16, ry: 7, fill: primary, opacity: 0.5, stroke: secondary, strokeWidth: 0.8 }),
    path({ d: starPath(120, 373, 3), fill: secondary, opacity: 0.8 }),
  );
};

const heroBoots: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'heroBoots' },
    path({ d: 'M66 335 L62 384 L98 384 L94 335 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    // Lightning bolt
    path({ d: 'M76 345 L80 355 L78 355 L82 365', stroke: '#FFE66D', strokeWidth: 2, fill: 'none' }),
    path({ d: 'M106 335 L102 384 L138 384 L134 335 Z', fill: primary, stroke: darken(primary), strokeWidth: 0.5 }),
    path({ d: 'M116 345 L120 355 L118 355 L122 365', stroke: '#FFE66D', strokeWidth: 2, fill: 'none' }),
  );
};

const platformShoes: PartRenderer = (primary, secondary = '#FFE66D', layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'platformShoes' },
    // Left platform
    rect({ x: 64, y: 374, width: 32, height: 10, rx: 3, fill: primary }),
    path({ d: 'M66 368 L64 374 L96 374 L94 368Z', fill: primary }),
    path({ d: starPath(80, 378, 3), fill: secondary }),
    // Right platform
    rect({ x: 104, y: 374, width: 32, height: 10, rx: 3, fill: primary }),
    path({ d: 'M106 368 L104 374 L136 374 L134 368Z', fill: primary }),
    path({ d: starPath(120, 378, 3), fill: secondary }),
  );
};

// ============================================================
// ACCESSORIES
// ============================================================

const hairBow: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'hairBow' },
    // Bow on right side of head
    path({ d: 'M125 52 L135 42 L130 52 L140 46 L130 55 L135 62 L125 55Z', fill: primary }),
    circle({ cx: 128, cy: 52, r: 2, fill: darken(primary) }),
  );
};

const headband: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'headband' },
    path({ d: 'M65 52 Q100 42 135 52', stroke: primary, strokeWidth: 4, fill: 'none', strokeLinecap: 'round' }),
  );
};

const sunglasses: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'sunglasses' },
    // Heart-shaped lenses
    path({ d: 'M76 68 Q76 62 82 62 Q88 62 88 68 Q88 78 82 82 Q76 78 76 68Z', fill: primary, opacity: 0.8 }),
    path({ d: 'M112 68 Q112 62 118 62 Q124 62 124 68 Q124 78 118 82 Q112 78 112 68Z', fill: primary, opacity: 0.8 }),
    // Bridge
    line({ x1: 88, y1: 68, x2: 112, y2: 68, stroke: primary, strokeWidth: 1.5 }),
    // Arms
    line({ x1: 76, y1: 66, x2: 65, y2: 72, stroke: primary, strokeWidth: 1.5 }),
    line({ x1: 124, y1: 66, x2: 135, y2: 72, stroke: primary, strokeWidth: 1.5 }),
  );
};

const backpack: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'backpack' },
    // Straps visible from front
    path({ d: 'M86 126 L88 165', stroke: primary, strokeWidth: 3 }),
    path({ d: 'M114 126 L112 165', stroke: primary, strokeWidth: 3 }),
  );
};

const danceRibbon: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'danceRibbon' },
    // Ribbon flowing from right hand
    path({ d: 'M150 200 Q170 180 160 160 Q150 140 170 120 Q180 105 165 90', stroke: primary, strokeWidth: 2.5, fill: 'none', strokeLinecap: 'round' }),
    circle({ cx: 148, cy: 200, r: 2, fill: '#999' }),
  );
};

const wristbands: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'wristbands' },
    rect({ x: 47, y: 195, width: 12, height: 8, rx: 2, fill: primary }),
    rect({ x: 141, y: 195, width: 12, height: 8, rx: 2, fill: primary }),
  );
};

const necklace: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'necklace' },
    path({ d: 'M82 118 Q100 130 118 118', stroke: primary, strokeWidth: 1.5, fill: 'none' }),
    circle({ cx: 100, cy: 128, r: 4, fill: primary }),
  );
};

const scarf: PartRenderer = (primary, secondary = '#FFFFFF', layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'scarf' },
    // Scarf wrap around neck
    path({ d: 'M78 115 Q100 125 122 115 Q120 130 110 132 L108 160 L102 160 L100 130 Q90 132 78 120Z', fill: primary, stroke: darken(primary), strokeWidth: 0.3 }),
    // Stripe
    path({ d: 'M100 130 L100 160', stroke: secondary, strokeWidth: 2, opacity: 0.5 }),
  );
};

const sleepMask: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'sleepMask' },
    // Pushed up on forehead
    path({ d: 'M70 50 Q100 44 130 50 Q130 58 100 55 Q70 58 70 50Z', fill: primary }),
    // Star decoration
    path({ d: starPath(100, 50, 4), fill: '#FFE66D', opacity: 0.8 }),
  );
};

const umbrella: PartRenderer = (primary, secondary = '#FFE66D', layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'umbrella' },
    // Umbrella held in left hand (above head)
    // Handle
    line({ x1: 50, y1: 195, x2: 50, y2: 30, stroke: '#8B4513', strokeWidth: 2 }),
    // Canopy
    path({ d: 'M20 35 Q50 5 80 35', fill: primary }),
    path({ d: 'M20 35 Q35 15 50 35', fill: secondary, opacity: 0.5 }),
    path({ d: 'M50 35 Q65 15 80 35', fill: secondary, opacity: 0.5 }),
    // Hook handle
    path({ d: 'M50 195 Q44 200 48 205', stroke: '#8B4513', strokeWidth: 2, fill: 'none' }),
  );
};

const earrings: PartRenderer = (primary, _sec, layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'earrings' },
    circle({ cx: 63, cy: 86, r: 3, fill: primary }),
    circle({ cx: 63, cy: 86, r: 1, fill: '#FFF', opacity: 0.5 }),
    circle({ cx: 137, cy: 86, r: 3, fill: primary }),
    circle({ cx: 137, cy: 86, r: 1, fill: '#FFF', opacity: 0.5 }),
  );
};

const tiara: PartRenderer = (primary, secondary = '#C0C0C0', layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'tiara' },
    // Crown band
    path({ d: 'M72 42 Q100 38 128 42', stroke: primary, strokeWidth: 3, fill: 'none' }),
    // Points
    path({ d: 'M80 42 L78 32 L84 38', fill: primary }),
    path({ d: 'M92 40 L90 28 L96 36', fill: primary }),
    path({ d: 'M100 39 L100 24 L104 36', fill: primary }),
    path({ d: 'M108 40 L110 28 L114 36', fill: primary }),
    path({ d: 'M120 42 L122 32 L116 38', fill: primary }),
    // Jewels
    circle({ cx: 100, cy: 28, r: 2.5, fill: '#FF6B6B' }),
    circle({ cx: 90, cy: 32, r: 1.5, fill: secondary }),
    circle({ cx: 110, cy: 32, r: 1.5, fill: secondary }),
  );
};

const cape: PartRenderer = (primary, _sec, layer) => {
  if (layer === 'back') {
    return g({ key: 'cape-back' },
      path({ d: 'M78 126 Q60 250 50 380 L150 380 Q140 250 122 126Z', fill: primary, opacity: 0.9, stroke: darken(primary), strokeWidth: 0.5 }),
    );
  }
  if (layer === 'front') {
    // Collar clasp at neck
    return g({ key: 'cape-front' },
      circle({ cx: 88, cy: 122, r: 3, fill: '#FFD700' }),
      circle({ cx: 112, cy: 122, r: 3, fill: '#FFD700' }),
      line({ x1: 88, y1: 122, x2: 112, y2: 122, stroke: '#FFD700', strokeWidth: 1.5 }),
    );
  }
  return null;
};

const magicWand: PartRenderer = (primary, secondary = '#FFE66D', layer) => {
  if (layer !== 'front') return null;
  return g({ key: 'magicWand' },
    // Wand in right hand
    line({ x1: 150, y1: 198, x2: 165, y2: 140, stroke: primary, strokeWidth: 3 }),
    // Star tip
    path({ d: starPath(167, 135, 8), fill: secondary }),
    // Sparkle trail
    circle({ cx: 160, cy: 155, r: 1.5, fill: secondary, opacity: 0.6 }),
    circle({ cx: 155, cy: 170, r: 1, fill: secondary, opacity: 0.4 }),
    circle({ cx: 162, cy: 165, r: 1.2, fill: secondary, opacity: 0.5 }),
  );
};

// ============================================================
// HAIRSTYLES
// ============================================================

const ponytail: PartRenderer = (primary, _sec, layer) => {
  if (layer === 'back') {
    return g({ key: 'ponytail-back' },
      // Hair base
      ellipse({ cx: 100, cy: 72, rx: 42, ry: 48, fill: primary }),
      // Ponytail draping down back
      path({ d: 'M108 50 Q130 55 128 80 Q132 130 125 180', stroke: primary, strokeWidth: 14, fill: 'none', strokeLinecap: 'round' }),
    );
  }
  if (layer === 'front') {
    return g({ key: 'ponytail-front' },
      // Hair top
      path({ d: 'M62 68 Q65 35 100 28 Q135 35 138 68 Q130 50 100 45 Q70 50 62 68Z', fill: primary }),
      // Hair tie
      circle({ cx: 118, cy: 50, r: 4, fill: darken(primary) }),
    );
  }
  return null;
};

const pigtails: PartRenderer = (primary, _sec, layer) => {
  if (layer === 'back') {
    return g({ key: 'pigtails-back' },
      ellipse({ cx: 100, cy: 72, rx: 42, ry: 48, fill: primary }),
    );
  }
  if (layer === 'front') {
    return g({ key: 'pigtails-front' },
      path({ d: 'M62 68 Q65 35 100 28 Q135 35 138 68 Q130 50 100 45 Q70 50 62 68Z', fill: primary }),
      // Left pigtail
      path({ d: 'M68 60 Q55 80 58 120 Q55 140 60 160', stroke: primary, strokeWidth: 10, fill: 'none', strokeLinecap: 'round' }),
      circle({ cx: 66, cy: 58, r: 3, fill: darken(primary) }),
      // Right pigtail
      path({ d: 'M132 60 Q145 80 142 120 Q145 140 140 160', stroke: primary, strokeWidth: 10, fill: 'none', strokeLinecap: 'round' }),
      circle({ cx: 134, cy: 58, r: 3, fill: darken(primary) }),
    );
  }
  return null;
};

const braids: PartRenderer = (primary, _sec, layer) => {
  if (layer === 'back') {
    return g({ key: 'braids-back' },
      ellipse({ cx: 100, cy: 72, rx: 42, ry: 48, fill: primary }),
    );
  }
  if (layer === 'front') {
    return g({ key: 'braids-front' },
      path({ d: 'M62 68 Q65 35 100 28 Q135 35 138 68 Q130 50 100 45 Q70 50 62 68Z', fill: primary }),
      // Left braid (zigzag)
      path({ d: 'M70 65 L66 80 L72 95 L66 110 L72 125 L66 140 L72 155 L68 165', stroke: primary, strokeWidth: 7, fill: 'none', strokeLinecap: 'round' }),
      // Right braid
      path({ d: 'M130 65 L134 80 L128 95 L134 110 L128 125 L134 140 L128 155 L132 165', stroke: primary, strokeWidth: 7, fill: 'none', strokeLinecap: 'round' }),
      // Ribbon ties
      circle({ cx: 68, cy: 167, r: 3, fill: '#FF6B6B' }),
      circle({ cx: 132, cy: 167, r: 3, fill: '#FF6B6B' }),
    );
  }
  return null;
};

const bob: PartRenderer = (primary, _sec, layer) => {
  if (layer === 'back') {
    return g({ key: 'bob-back' },
      ellipse({ cx: 100, cy: 75, rx: 42, ry: 48, fill: primary }),
    );
  }
  if (layer === 'front') {
    return g({ key: 'bob-front' },
      path({ d: 'M62 68 Q65 35 100 28 Q135 35 138 68 Q130 50 100 45 Q70 50 62 68Z', fill: primary }),
      // Bob sides (neat chin-length)
      path({ d: 'M60 68 Q58 90 64 105 Q68 100 70 90 Q66 80 62 68Z', fill: darken(primary) }),
      path({ d: 'M140 68 Q142 90 136 105 Q132 100 130 90 Q134 80 138 68Z', fill: darken(primary) }),
      // Bangs
      path({ d: 'M68 55 Q82 48 100 50 Q118 48 132 55 Q125 55 100 52 Q75 55 68 55Z', fill: darken(primary) }),
    );
  }
  return null;
};

const balletBun: PartRenderer = (primary, _sec, layer) => {
  if (layer === 'back') {
    return g({ key: 'balletBun-back' },
      ellipse({ cx: 100, cy: 72, rx: 42, ry: 48, fill: primary }),
      // Bun at top
      circle({ cx: 100, cy: 30, r: 14, fill: primary }),
      circle({ cx: 100, cy: 30, r: 12, fill: darken(primary), opacity: 0.3 }),
    );
  }
  if (layer === 'front') {
    return g({ key: 'balletBun-front' },
      path({ d: 'M62 68 Q65 35 100 28 Q135 35 138 68 Q130 50 100 45 Q70 50 62 68Z', fill: primary }),
      // Sparkle pins in bun
      circle({ cx: 92, cy: 28, r: 1.5, fill: '#FFD700' }),
      circle({ cx: 108, cy: 28, r: 1.5, fill: '#FFD700' }),
      circle({ cx: 100, cy: 22, r: 1.5, fill: '#FFD700' }),
    );
  }
  return null;
};

const beachWaves: PartRenderer = (primary, _sec, layer) => {
  if (layer === 'back') {
    return g({ key: 'beachWaves-back' },
      ellipse({ cx: 100, cy: 72, rx: 44, ry: 50, fill: primary }),
      // Wavy hair flowing down
      path({ d: 'M60 72 Q55 100 60 130 Q55 160 62 190', stroke: primary, strokeWidth: 12, fill: 'none', strokeLinecap: 'round' }),
      path({ d: 'M140 72 Q145 100 140 130 Q145 160 138 190', stroke: primary, strokeWidth: 12, fill: 'none', strokeLinecap: 'round' }),
    );
  }
  if (layer === 'front') {
    return g({ key: 'beachWaves-front' },
      path({ d: 'M60 68 Q65 33 100 26 Q135 33 140 68 Q130 48 100 43 Q70 48 60 68Z', fill: primary }),
      // Wavy fringe
      path({ d: 'M70 55 Q78 50 86 55 Q94 50 102 55 Q110 50 118 55 Q126 50 130 55', stroke: darken(primary), strokeWidth: 0.5, fill: 'none' }),
    );
  }
  return null;
};

const glamourCurls: PartRenderer = (primary, _sec, layer) => {
  if (layer === 'back') {
    return g({ key: 'glamourCurls-back' },
      ellipse({ cx: 100, cy: 72, rx: 46, ry: 52, fill: primary }),
      // Curly hair volume
      ...[
        'M56 80 Q50 100 55 120 Q48 140 55 160 Q50 175 56 185',
        'M144 80 Q150 100 145 120 Q152 140 145 160 Q150 175 144 185',
      ].map((d, i) =>
        path({ key: `curl-${i}`, d, stroke: primary, strokeWidth: 14, fill: 'none', strokeLinecap: 'round' })
      ),
    );
  }
  if (layer === 'front') {
    return g({ key: 'glamourCurls-front' },
      path({ d: 'M58 68 Q62 30 100 24 Q138 30 142 68 Q132 45 100 40 Q68 45 58 68Z', fill: primary }),
      // Curly bangs
      path({ d: 'M72 58 Q78 52 84 58', stroke: darken(primary), strokeWidth: 0.8, fill: 'none' }),
      path({ d: 'M90 55 Q96 50 102 55', stroke: darken(primary), strokeWidth: 0.8, fill: 'none' }),
      path({ d: 'M108 56 Q114 50 120 56', stroke: darken(primary), strokeWidth: 0.8, fill: 'none' }),
    );
  }
  return null;
};

const messyBun: PartRenderer = (primary, _sec, layer) => {
  if (layer === 'back') {
    return g({ key: 'messyBun-back' },
      ellipse({ cx: 100, cy: 72, rx: 42, ry: 48, fill: primary }),
      // Messy bun on top
      circle({ cx: 105, cy: 32, r: 16, fill: primary }),
      // Stray strands
      path({ d: 'M95 32 Q88 22 92 15', stroke: primary, strokeWidth: 2, fill: 'none' }),
      path({ d: 'M115 32 Q120 20 116 14', stroke: primary, strokeWidth: 2, fill: 'none' }),
    );
  }
  if (layer === 'front') {
    return g({ key: 'messyBun-front' },
      path({ d: 'M62 68 Q65 35 100 28 Q135 35 138 68 Q130 50 100 45 Q70 50 62 68Z', fill: primary }),
      // Loose strands on face
      path({ d: 'M75 55 Q72 65 74 78', stroke: primary, strokeWidth: 1.5, fill: 'none' }),
      path({ d: 'M125 55 Q128 65 126 78', stroke: primary, strokeWidth: 1.5, fill: 'none' }),
    );
  }
  return null;
};

const rainbowHair: PartRenderer = (_primary, _sec, layer) => {
  const colors = ['#FF6B6B', '#FF9F43', '#FFE66D', '#7BC74D', '#4ECDC4', '#9B5DE5'];
  if (layer === 'back') {
    return g({ key: 'rainbow-back' },
      ellipse({ cx: 100, cy: 72, rx: 44, ry: 50, fill: colors[0] }),
      // Rainbow cascading strands
      ...colors.map((c, i) =>
        path({
          key: `strand-${i}`,
          d: `M${60 + i * 4} 70 Q${55 + i * 3} ${120 + i * 10} ${60 + i * 5} ${180 + i * 5}`,
          stroke: c,
          strokeWidth: 8,
          fill: 'none',
          strokeLinecap: 'round',
        })
      ),
      ...colors.map((c, i) =>
        path({
          key: `strand-r-${i}`,
          d: `M${140 - i * 4} 70 Q${145 - i * 3} ${120 + i * 10} ${140 - i * 5} ${180 + i * 5}`,
          stroke: c,
          strokeWidth: 8,
          fill: 'none',
          strokeLinecap: 'round',
        })
      ),
    );
  }
  if (layer === 'front') {
    return g({ key: 'rainbow-front' },
      path({ d: 'M60 68 Q65 33 100 26 Q135 33 140 68 Q130 48 100 43 Q70 48 60 68Z', fill: colors[0] }),
      // Rainbow streak fringe
      ...colors.slice(1).map((c, i) =>
        path({
          key: `fringe-${i}`,
          d: `M${72 + i * 12} 55 Q${78 + i * 12} 48 ${84 + i * 12} 55`,
          stroke: c,
          strokeWidth: 3,
          fill: 'none',
        })
      ),
    );
  }
  return null;
};

const princessUpdo: PartRenderer = (primary, _sec, layer) => {
  if (layer === 'back') {
    return g({ key: 'princessUpdo-back' },
      ellipse({ cx: 100, cy: 72, rx: 42, ry: 48, fill: primary }),
      // Elaborate updo tower
      ellipse({ cx: 100, cy: 35, rx: 22, ry: 18, fill: primary }),
      circle({ cx: 100, cy: 22, r: 10, fill: primary }),
    );
  }
  if (layer === 'front') {
    return g({ key: 'princessUpdo-front' },
      path({ d: 'M62 68 Q65 35 100 28 Q135 35 138 68 Q130 50 100 45 Q70 50 62 68Z', fill: primary }),
      // Elegant swept bangs
      path({ d: 'M70 55 Q85 48 100 52 Q115 48 130 55', fill: darken(primary), opacity: 0.5 }),
      // Sparkle pins
      circle({ cx: 85, cy: 32, r: 2, fill: '#FFD700' }),
      circle({ cx: 100, cy: 26, r: 2, fill: '#FFD700' }),
      circle({ cx: 115, cy: 32, r: 2, fill: '#FFD700' }),
      // Curling tendril
      path({ d: 'M68 65 Q64 75 66 85', stroke: primary, strokeWidth: 2, fill: 'none' }),
      path({ d: 'M132 65 Q136 75 134 85', stroke: primary, strokeWidth: 2, fill: 'none' }),
    );
  }
  return null;
};

// ============================================================
// HELPERS
// ============================================================

function darken(hex: string): string {
  const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - 30);
  const green = Math.max(0, parseInt(hex.slice(3, 5), 16) - 30);
  const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - 30);
  return `#${r.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function lighten(hex: string): string {
  const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + 40);
  const green = Math.min(255, parseInt(hex.slice(3, 5), 16) + 40);
  const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + 40);
  return `#${r.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function starPath(cx: number, cy: number, r: number): string {
  const inner = r * 0.4;
  const points: string[] = [];
  for (let i = 0; i < 5; i++) {
    const outerAngle = (i * 72 - 90) * (Math.PI / 180);
    const innerAngle = ((i * 72 + 36) - 90) * (Math.PI / 180);
    points.push(`${cx + r * Math.cos(outerAngle)},${cy + r * Math.sin(outerAngle)}`);
    points.push(`${cx + inner * Math.cos(innerAngle)},${cy + inner * Math.sin(innerAngle)}`);
  }
  return `M${points.join(' L')}Z`;
}

// ============================================================
// REGISTRY
// ============================================================

export const outfitParts: Record<string, PartRenderer> = {
  // Tops
  tshirt, stripedTee, tankTop, hoodie, blouse, polo,
  leotard, sequinTop, athleticTop, winterCoat, pjTop,
  rainJacket, superheroTop, gownBodice, rainbowHoodie,
  // Bottoms
  jeans, shorts, skirt, leggings, tutu, gymShorts,
  snowPants, pjPants, rainPants, sparkleSkirt, heroPants, flarePants,
  // Dresses
  sundress, partyDress, schoolJumper, balletDress, unitard,
  onesie, fancyDress, princessGown, heroSuit, rainbowDress,
  // Shoes
  sneakers, sandals, maryJanes, hiTops, balletSlippers, gymShoes,
  snowBoots, bunnySlippers, rainBoots, glassSlippers, heroBoots, platformShoes,
  // Accessories
  hairBow, headband, sunglasses, backpack, danceRibbon, wristbands,
  necklace, scarf, sleepMask, umbrella, earrings, tiara, cape, magicWand,
  // Hairstyles
  ponytail, pigtails, braids, bob, balletBun, beachWaves,
  glamourCurls, messyBun, rainbowHair, princessUpdo,
};
