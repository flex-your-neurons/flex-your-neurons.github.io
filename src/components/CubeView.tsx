/**
 * The two pictures of the cube-net format: a net laid flat, and a cube seen corner-on.
 *
 * Both draw their marks from `markPath`, so the mark on a square of the net and the same mark
 * skewed onto a face of the cube are the same path under different transforms. Faces are told apart
 * by lightness alone; nothing here carries information in hue.
 */
import { dict, type Locale } from '../lib/i18n';
import { cubeBox, cubeFaces, FACE_SHADE, isOrientedMark, markPath, markTransform, type CubeMark } from '../lib/cube-geometry';

const EDGE = 40;

function Mark({ mark, transform }: { mark: CubeMark; transform: string }) {
  const path = markPath(mark);
  return (
    <path
      d={path.d}
      transform={transform}
      fill="currentColor"
      fill-rule={path.evenOdd ? 'evenodd' : 'nonzero'}
      data-mark={mark}
    />
  );
}

/** A cube showing its top, left and right faces. */
export default function CubeView({
  faces,
  turns,
  label,
  className,
}: {
  faces: readonly [CubeMark, CubeMark, CubeMark];
  /** Quarter turns clockwise of each mark from upright; absent means upright. */
  turns?: readonly [number, number, number];
  label?: string;
  className?: string;
}) {
  const { w, h } = cubeBox(EDGE);
  const drawn = cubeFaces(EDGE);
  const pad = 2;
  return (
    <svg
      class={className ?? 'figure-svg cube-svg'}
      viewBox={`${-pad} ${-pad} ${w + pad * 2} ${h + pad * 2}`}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
      data-cube={faces.join('/')}
      data-turns={turns ? turns.join('') : undefined}
    >
      {drawn.map((face, i) => (
        <g key={i} data-face={['top', 'left', 'right'][i]}>
          <polygon
            points={face.points}
            fill="currentColor"
            fill-opacity={FACE_SHADE[i]}
            stroke="currentColor"
            stroke-width={1.2}
            stroke-linejoin="round"
          />
          <Mark mark={faces[i]!} transform={markTransform(face.transform, turns?.[i] ?? 0)} />
        </g>
      ))}
    </svg>
  );
}

const CELL = 20;
const PAD = 3;

/** The net: marked squares in their places on the grid. */
export function NetView({
  rows,
  cols,
  cells,
  label,
  className,
}: {
  rows: number;
  cols: number;
  cells: readonly { r: number; c: number; mark: CubeMark }[];
  label?: string;
  className?: string;
}) {
  const w = cols * CELL + PAD * 2;
  const h = rows * CELL + PAD * 2;
  return (
    <svg
      class={className ?? 'figure-svg net-svg'}
      viewBox={`0 0 ${w} ${h}`}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
      data-net={cells.map((c) => `${c.r},${c.c}:${c.mark}`).join(' ')}
      style={{ maxWidth: `${cols * 3.2}rem` }}
    >
      {cells.map((cell) => {
        const x = PAD + cell.c * CELL;
        const y = PAD + cell.r * CELL;
        return (
          <g key={`${cell.r}-${cell.c}`} data-net-cell="" data-row={String(cell.r)} data-col={String(cell.c)}>
            <rect
              x={x}
              y={y}
              width={CELL}
              height={CELL}
              fill="currentColor"
              fill-opacity={0.05}
              stroke="currentColor"
              stroke-width={1}
            />
            <Mark mark={cell.mark} transform={`matrix(${CELL} 0 0 ${CELL} ${x} ${y})`} />
          </g>
        );
      })}
    </svg>
  );
}

/** How a cube option reads aloud. Oriented marks say which way they are turned. */
export function describeCube(
  faces: readonly [CubeMark, CubeMark, CubeMark],
  locale: Locale,
  turns?: readonly [number, number, number],
): string {
  const g = dict(locale).gen;
  if (!turns && !faces.some(isOrientedMark)) {
    const t = g.cubeNet;
    return t.cube(t.marks[faces[0]], t.marks[faces[1]], t.marks[faces[2]]);
  }
  const t = g.cubeNetOriented;
  const face = (i: 0 | 1 | 2) => t.turned(t.marks[faces[i]], turns?.[i] ?? 0);
  return t.cube(face(0), face(1), face(2));
}
