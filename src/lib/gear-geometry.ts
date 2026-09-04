/**
 * Laying out a gear train for drawing, shared by the page and the share card.
 *
 * Wheels sit on one horizontal axis. Meshed wheels touch; belted wheels stand apart with the belt
 * drawn between them, open (top to top, bottom to bottom) or crossed. A wheel that meshes with a
 * neighbour is drawn with teeth — a dashed outline with one dash per tooth, so the tooth count is
 * also visible — and a wheel that only carries belts is drawn plain. Everything is in lightness and
 * line; nothing is carried by hue.
 */
import type { GearLink } from './generators/gear-train';

export interface Wheel {
  cx: number;
  cy: number;
  r: number;
  size: number;
  /** Drawn with teeth when it meshes with a neighbour. */
  toothed: boolean;
}

export interface Belt {
  crossed: boolean;
  /** Two line segments, each as [x1, y1, x2, y2]. */
  lines: [number, number, number, number][];
}

export interface TrainLayout {
  wheels: Wheel[];
  belts: Belt[];
  width: number;
  height: number;
}

/** Radius per unit of size. Sizes run 12–36, so wheels are 12–36 units across at scale 1. */
const RADIUS_PER_UNIT = 1;
const BELT_GAP = 28;
const PAD = 14;

export function layoutTrain(sizes: readonly number[], links: readonly GearLink[]): TrainLayout {
  const radii = sizes.map((s) => s * RADIUS_PER_UNIT);
  const maxR = Math.max(...radii);
  const cy = maxR + PAD;
  const wheels: Wheel[] = [];
  let x = PAD + radii[0]!;
  for (let i = 0; i < sizes.length; i++) {
    if (i > 0) {
      const gap = links[i - 1] === 'mesh' ? 0 : BELT_GAP;
      x += radii[i - 1]! + gap + radii[i]!;
    }
    const toothed = (i > 0 && links[i - 1] === 'mesh') || (i < links.length && links[i] === 'mesh');
    wheels.push({ cx: x, cy, r: radii[i]!, size: sizes[i]!, toothed });
  }
  const belts: Belt[] = [];
  for (let i = 0; i < links.length; i++) {
    if (links[i] === 'mesh') continue;
    const a = wheels[i]!;
    const b = wheels[i + 1]!;
    const crossed = links[i] === 'crossed';
    belts.push({
      crossed,
      lines: crossed
        ? [
            [a.cx, a.cy - a.r, b.cx, b.cy + b.r],
            [a.cx, a.cy + a.r, b.cx, b.cy - b.r],
          ]
        : [
            [a.cx, a.cy - a.r, b.cx, b.cy - b.r],
            [a.cx, a.cy + a.r, b.cx, b.cy + b.r],
          ],
    });
  }
  const last = wheels[wheels.length - 1]!;
  return { wheels, belts, width: last.cx + last.r + PAD, height: 2 * maxR + 2 * PAD };
}

/** Dash pattern giving one dash per tooth around the circumference. */
export function toothDash(wheel: Wheel): string {
  const pitch = (2 * Math.PI * wheel.r) / wheel.size;
  return `${round(pitch / 2)} ${round(pitch / 2)}`;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
