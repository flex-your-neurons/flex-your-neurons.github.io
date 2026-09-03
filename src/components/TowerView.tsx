/**
 * A Tower of London board: three pegs of unequal height and three beads told apart by shape.
 *
 * Shared by the live stimulus and the format card, so the two cannot drift. Beads are drawn as plain
 * shapes in `currentColor` — the identity of a bead is its outline, never its hue, and the three
 * outlines (disc, square, triangle) stay distinct at any size the card or the quiz draws them.
 */
import { BASE_Y, BEAD, beadPath, PEG_X, TOWER_BOX } from '../lib/tower-geometry';

interface Props {
  capacities: number[];
  /** One array per peg, bead ids bottom-up. */
  pegs: number[][];
  /** Accessible description of the whole board. */
  label: string;
  className?: string;
}

export default function TowerView({ capacities, pegs, label, className }: Props) {
  return (
    <svg
      class={className ?? 'tower-board'}
      viewBox={`0 0 ${TOWER_BOX.w} ${TOWER_BOX.h}`}
      role="img"
      aria-label={label}
      data-tower-board=""
    >
      <line x1="4" y1={BASE_Y} x2="96" y2={BASE_Y} stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      {capacities.map((capacity, peg) => (
        <line
          key={peg}
          x1={PEG_X[peg]}
          y1={BASE_Y}
          x2={PEG_X[peg]}
          y2={BASE_Y - capacity * BEAD - 4}
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          opacity="0.55"
          data-peg={peg}
          data-capacity={capacity}
        />
      ))}
      {pegs.map((stack, peg) =>
        stack.map((bead, level) => (
          <path
            key={`${peg}-${level}`}
            d={beadPath(bead, PEG_X[peg]!, BASE_Y - BEAD / 2 - level * BEAD)}
            fill={bead === 1 ? 'none' : 'currentColor'}
            stroke="currentColor"
            stroke-width={bead === 1 ? 2.2 : 0}
            data-bead={bead}
          />
        )),
      )}
    </svg>
  );
}
