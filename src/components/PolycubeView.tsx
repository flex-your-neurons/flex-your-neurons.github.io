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

export default function PolycubeView({
  cubes,
  label,
  className,
}: {
  cubes: readonly Cube[];
  label?: string;
  className?: string;
}) {
  const drawing = drawPolycube(cubes, EDGE);
  return (
    <svg
      class={className ?? 'figure-svg polycube-svg'}
      viewBox={`0 0 ${drawing.width} ${drawing.height}`}
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
