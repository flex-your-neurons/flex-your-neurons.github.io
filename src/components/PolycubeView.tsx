/**
 * A polycube drawn in isometric projection, for the 3-D block rotation format.
 *
 * Faces are told apart by lightness alone: top lightest, left mid, right darkest. That is the only
 * depth cue an isometric drawing has and it carries no information — every option is shaded the same
 * way — so nothing here depends on hue.
 */
import { dict, type Locale } from '../lib/i18n';
import { drawPolycube, normalise, POLYCUBE_SHADE, type Cube } from '../lib/polycube-geometry';

const EDGE = 18;

/**
 * A box that fits every one of these objects, for drawing a set of them at one scale.
 *
 * An isometric drawing of a polycube is as tall or as wide as the object's orientation happens to
 * make it, and an option box that fits each drawing on its own draws each at its own scale — a
 * column of nine cubes in small cubes beside a compact block in large ones. The options of a
 * rotation item are there to be compared, so they are given one box and one scale: the largest
 * drawing sets it, the rest are centred in it.
 */
export function polycubeBox(objects: readonly (readonly Cube[])[]): { width: number; height: number } {
  const drawings = objects.map((cubes) => drawPolycube(cubes, EDGE));
  return {
    width: Math.max(...drawings.map((d) => d.width)),
    height: Math.max(...drawings.map((d) => d.height)),
  };
}

export default function PolycubeView({
  cubes,
  label,
  className,
  box,
}: {
  cubes: readonly Cube[];
  label?: string;
  className?: string;
  /** A common box, from `polycubeBox`, to centre the drawing in rather than fitting it alone. */
  box?: { width: number; height: number };
}) {
  const drawing = drawPolycube(cubes, EDGE);
  const width = box ? Math.max(box.width, drawing.width) : drawing.width;
  const height = box ? Math.max(box.height, drawing.height) : drawing.height;
  return (
    <svg
      class={className ?? 'figure-svg polycube-svg'}
      viewBox={`${(drawing.width - width) / 2} ${(drawing.height - height) / 2} ${width} ${height}`}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
      data-polycube={normalise(cubes)
        .map((c) => c.join(','))
        .join(' ')}
    >
      {drawing.faces.map((face, i) => (
        <polygon
          key={i}
          points={face.points}
          fill="currentColor"
          fill-opacity={POLYCUBE_SHADE[face.shade]}
          stroke="currentColor"
          stroke-width={1}
          stroke-linejoin="round"
        />
      ))}
    </svg>
  );
}

/**
 * A polycube read aloud, layer by layer from the bottom, each layer row by row — so two different
 * objects never describe identically, which is what the option labels are for.
 */
export function describePolycube(cubes: readonly Cube[], locale: Locale): string {
  const t = dict(locale).gen.blockRotation;
  const n = normalise(cubes);
  const layers = Math.max(...n.map((c) => c[2])) + 1;
  const parts: string[] = [];
  for (let z = 0; z < layers; z++) {
    const inLayer = n.filter((c) => c[2] === z);
    const rows = Math.max(...inLayer.map((c) => c[1]), -1) + 1;
    const rowText: string[] = [];
    for (let y = 0; y < rows; y++) {
      const xs = inLayer.filter((c) => c[1] === y).map((c) => c[0] + 1);
      if (xs.length > 0) rowText.push(t.describeRow(y + 1, xs));
    }
    parts.push(t.describeLayer(z + 1, rowText));
  }
  return t.describe(n.length, parts);
}
