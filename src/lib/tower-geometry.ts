/**
 * Drawing geometry for a Tower of London board, shared by the live view, the card thumbnail and the
 * social card so the three cannot disagree about what a bead looks like. Beads are told apart by
 * outline — disc, square, triangle — and never by hue.
 */
import { BEAD_SHAPES } from './generators/tower';

/** Board geometry in a 0–100 × 0–62 box. Pegs sit on a base line; beads stack from it. */
export const TOWER_BOX = { w: 100, h: 62 };
export const PEG_X = [20, 50, 80];
export const BEAD = 14;
export const BASE_Y = 56;

export function beadPath(bead: number, cx: number, cy: number, size = BEAD): string {
  const r = size / 2;
  switch (BEAD_SHAPES[bead]) {
    case 'square':
      return `M${cx - r * 0.86},${cy - r * 0.86} h${r * 1.72} v${r * 1.72} h${-r * 1.72} Z`;
    case 'triangle':
      return `M${cx},${cy - r} L${cx + r * 0.95},${cy + r * 0.75} L${cx - r * 0.95},${cy + r * 0.75} Z`;
    default:
      return `M${cx - r},${cy} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0 Z`;
  }
}

