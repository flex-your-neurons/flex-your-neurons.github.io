/**
 * A gear train drawn: wheels on one axis, teeth where they mesh, belts where they don't, a turning
 * arrow over the first wheel and a question mark over the last.
 */
import { dict, type Locale } from '../lib/i18n';
import { layoutTrain, toothDash } from '../lib/gear-geometry';
import { ANTICLOCKWISE, CLOCKWISE, type GearLink } from '../lib/generators/gear-train';

export default function GearsView({
  sizes,
  links,
  driverClockwise,
  locale,
  className,
}: {
  sizes: readonly number[];
  links: readonly GearLink[];
  driverClockwise: boolean;
  locale: Locale;
  className?: string;
}) {
  const t = dict(locale).gen.gearTrain;
  const layout = layoutTrain(sizes, links);
  const last = layout.wheels.length - 1;
  return (
    <svg
      class={className ?? 'figure-svg gears-svg'}
      viewBox={`0 -18 ${layout.width} ${layout.height + 18}`}
      role="img"
      aria-label={t.describe(sizes.map(String), links.map((l) => t.linkNames[l]), driverClockwise)}
      data-gears={sizes.join(',')}
      data-links={links.join(',')}
      data-driver={driverClockwise ? 'clockwise' : 'anticlockwise'}
    >
      {layout.belts.map((belt, i) =>
        belt.lines.map((line, j) => (
          <line
            key={`${i}-${j}`}
            x1={line[0]}
            y1={line[1]}
            x2={line[2]}
            y2={line[3]}
            stroke="currentColor"
            stroke-width={1.6}
            stroke-linecap="round"
            data-belt={belt.crossed ? 'crossed' : 'open'}
          />
        )),
      )}
      {layout.wheels.map((wheel, i) => (
        <g key={i} data-wheel={String(i)} data-size={String(wheel.size)}>
          <circle
            cx={wheel.cx}
            cy={wheel.cy}
            r={wheel.r}
            fill="currentColor"
            fill-opacity={0.06}
            stroke="currentColor"
            stroke-width={wheel.toothed ? 3 : 1.6}
            stroke-dasharray={wheel.toothed ? toothDash(wheel) : undefined}
          />
          {wheel.toothed && (
            <circle cx={wheel.cx} cy={wheel.cy} r={wheel.r - 2.2} fill="none" stroke="currentColor" stroke-width={1} />
          )}
          <circle cx={wheel.cx} cy={wheel.cy} r={2} fill="currentColor" />
          <text
            x={wheel.cx}
            y={wheel.cy + wheel.r * 0.55}
            text-anchor="middle"
            dominant-baseline="central"
            font-size={Math.max(8, wheel.r * 0.42)}
            font-weight={650}
            fill="currentColor"
          >
            {wheel.size}
          </text>
          {(i === 0 || i === last) && (
            <text
              x={wheel.cx}
              y={wheel.cy - wheel.r - 8}
              text-anchor="middle"
              dominant-baseline="central"
              font-size={14}
              font-weight={700}
              fill="currentColor"
              data-marker={i === 0 ? 'driver' : 'asked'}
            >
              {i === 0 ? (driverClockwise ? CLOCKWISE : ANTICLOCKWISE) : '?'}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}
