import React from 'react';
import { Minus, Plus } from 'lucide-react';
import {
  getNoteFrequencyHz,
  getSectorNote,
  playVacuumTubeTone,
} from '../utils/fastAudioEngine';

interface DodecagonDialProps {
  sector: number; // 1..12
  onSectorChange: (next: number) => void;
  gunitRatioLabel: string;
  dialTick60?: number; // 1..60 Base-60 scalar tick
  showMusicalNotes?: boolean;
  audioEnabled?: boolean;
}

export const DodecagonDial: React.FC<DodecagonDialProps> = ({
  sector,
  onSectorChange,
  gunitRatioLabel,
  dialTick60 = 1,
  showMusicalNotes = false,
  audioEnabled = false,
}) => {
  const cx = 110;
  const cy = 110;
  const radius = 82;

  // Compute vertices for 12 nodes starting at 12 o'clock (-90deg), going clockwise
  const nodes = Array.from({ length: 12 }, (_, idx) => {
    const num = idx + 1;
    // Place 12 at top (-90 deg), 1 at -60 deg, ..., 11 at -120 deg
    const angleDeg = num * 30 - 90;
    const rad = (angleDeg * Math.PI) / 180;
    const x = cx + radius * Math.cos(rad);
    const y = cy + radius * Math.sin(rad);
    return { num, x, y, angleDeg: num * 30 };
  });

  // Dodecagon perimeter polygon ordered clockwise 12 -> 1 -> 2 ... -> 11
  const orderedOutline = [nodes[11], ...nodes.slice(0, 11)];
  const polygonPoints = orderedOutline.map((n) => `${n.x.toFixed(1)},${n.y.toFixed(1)}`).join(' ');

  // Wedge path covering sectors 0 deg to sector * 30 deg from top (12 o'clock)
  const buildArcPath = () => {
    if (sector >= 12) {
      return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${(cx - 0.01).toFixed(2)} ${cy - radius} Z`;
    }
    const endDeg = sector * 30 - 90;
    const endRad = (endDeg * Math.PI) / 180;
    const ex = cx + radius * Math.cos(endRad);
    const ey = cy + radius * Math.sin(endRad);
    const largeArc = sector > 6 ? 1 : 0;
    return `M ${cx} ${cy} L ${cx} ${cy - radius} A ${radius} ${radius} 0 ${largeArc} 1 ${ex.toFixed(2)} ${ey.toFixed(2)} Z`;
  };

  const activeEndDeg = sector * 30 - 90;
  const activeEndRad = (activeEndDeg * Math.PI) / 180;
  const pointerX = cx + (radius - 14) * Math.cos(activeEndRad);
  const pointerY = cy + (radius - 14) * Math.sin(activeEndRad);

  // Base-60 scalar interval bezel position (6° per tick, 0° at top)
  const tick60AngleRad = ((dialTick60 * 6 - 90) * Math.PI) / 180;
  const tick60X = cx + (radius + 14) * Math.cos(tick60AngleRad);
  const tick60Y = cy + (radius + 14) * Math.sin(tick60AngleRad);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex items-center justify-center">
        <svg
          viewBox="0 0 220 220"
          className="h-[204px] w-[204px] select-none"
          role="group"
          aria-label="360 degree dodecagonal unit space dial with 60 base intervals"
        >
          <defs>
            <radialGradient id="dialGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255, 170, 51, 0.24)" />
              <stop offset="100%" stopColor="rgba(255, 170, 51, 0.03)" />
            </radialGradient>
          </defs>

          {/* Outer EL-wire hairline circle */}
          <circle
            cx={cx}
            cy={cy}
            r={radius + 11}
            fill="none"
            stroke="rgba(56, 189, 248, 0.25)"
            strokeWidth="1"
          />

          {/* 60 Base-60 scalar interval ticks (5 per 30° dodecagon sector) */}
          {Array.from({ length: 60 }, (_, i) => {
            const tickNum = i + 1;
            const a = ((tickNum * 6 - 90) * Math.PI) / 180;
            const isDodecNode = tickNum % 5 === 0;
            const isActiveTick = tickNum === dialTick60;
            const r1 = radius + 6;
            const r2 = isDodecNode ? radius + 13 : radius + 9.5;
            return (
              <line
                key={tickNum}
                x1={cx + r1 * Math.cos(a)}
                y1={cy + r1 * Math.sin(a)}
                x2={cx + r2 * Math.cos(a)}
                y2={cy + r2 * Math.sin(a)}
                stroke={
                  isActiveTick
                    ? '#38BDF8'
                    : isDodecNode
                    ? 'rgba(197, 160, 89, 0.65)'
                    : 'rgba(148, 163, 184, 0.24)'
                }
                strokeWidth={isActiveTick ? 2.2 : isDodecNode ? 1.5 : 0.9}
              />
            );
          })}

          {/* Active Base-60 tick beacon on outer bezel */}
          <circle
            cx={tick60X}
            cy={tick60Y}
            r="3"
            fill="#38BDF8"
          />

          {/* Active sector wedge fill */}
          <path
            d={buildArcPath()}
            fill="url(#dialGlow)"
            stroke="rgba(255, 170, 51, 0.55)"
            strokeWidth="1.25"
          />

          {/* 12-sided Dodecagon perimeter */}
          <polygon
            points={polygonPoints}
            fill="none"
            stroke="rgba(197, 160, 89, 0.45)"
            strokeWidth="1.5"
          />

          {/* Radial sector dividers */}
          {nodes.map((node) => (
            <line
              key={`ray-${node.num}`}
              x1={cx}
              y1={cy}
              x2={node.x}
              y2={node.y}
              stroke={node.num <= sector ? 'rgba(255, 170, 51, 0.22)' : 'rgba(255, 255, 255, 0.06)'}
              strokeWidth="1"
            />
          ))}

          {/* Active watch hand pointer */}
          <line
            x1={cx}
            y1={cy}
            x2={pointerX}
            y2={pointerY}
            stroke="#38BDF8"
            strokeWidth="2.2"
            strokeLinecap="round"
          />

          {/* Center hub */}
          <circle
            cx={cx}
            cy={cy}
            r="35"
            fill="#0D0C0A"
            stroke="rgba(197, 160, 89, 0.65)"
            strokeWidth="1.5"
          />
          <circle
            cx={cx}
            cy={cy}
            r="31"
            fill="none"
            stroke="rgba(56, 189, 248, 0.25)"
            strokeWidth="0.75"
          />
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            className="fill-[#FFB443] font-mono text-[13px] font-bold"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {sector}/12
          </text>
          <text
            x={cx}
            y={cy + 11}
            textAnchor="middle"
            className="fill-[#38BDF8] font-mono text-[10px]"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {sector * 30}° Space
          </text>

          {/* 12 clickable sector nodes */}
          {nodes.map((node) => {
            const isActive = node.num === sector;
            const isWithin = node.num <= sector;
            const noteInfo = getSectorNote(node.num);
            const handleSelectNode = (num: number) => {
              if (audioEnabled) {
                const nInfo = getSectorNote(num);
                const hz = getNoteFrequencyHz(nInfo.chromaticIndex, 4, 440);
                playVacuumTubeTone(hz, 0.7, 0, 0.14);
              }
              onSectorChange(num);
            };
            return (
              <g
                key={node.num}
                role="button"
                tabIndex={0}
                aria-label={`Set dodecagonal boundary to sector ${node.num} of 12 (${node.angleDeg} degrees, note ${noteInfo.noteName})`}
                aria-pressed={isActive}
                onClick={() => handleSelectNode(node.num)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectNode(node.num);
                  }
                }}
                className="cursor-pointer focus:outline-none"
              >
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={isActive ? 13 : 11}
                  fill={isActive ? '#F59E0B' : isWithin ? '#231C11' : '#121318'}
                  stroke={isActive ? '#FDE68A' : isWithin ? '#C5A059' : '#475569'}
                  strokeWidth={isActive ? 2 : 1.2}
                />
                <text
                  x={node.x}
                  y={node.y + 3.5}
                  textAnchor="middle"
                  className={`pointer-events-none font-mono text-[9.5px] font-semibold ${
                    isActive ? 'fill-[#090A0E]' : isWithin ? 'fill-[#FBBF24]' : 'fill-[#94A3B8]'
                  }`}
                >
                  {showMusicalNotes ? noteInfo.noteName : node.num}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Stepper Bar beneath Dial */}
      <div className="flex w-full items-center justify-between gap-2 rounded-lg border border-amber-500/20 bg-black/40 px-2.5 py-1.5">
        <button
          type="button"
          onClick={() => onSectorChange(sector > 1 ? sector - 1 : 12)}
          aria-label="Decrease dodecagon sector"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-amber-500/25 bg-[#17140F] text-amber-300 transition-colors hover:border-amber-400/60 hover:bg-amber-500/15 focus-visible:outline-2 focus-visible:outline-cyan-400"
        >
          <Minus className="h-4 w-4" />
        </button>

        <div className="text-center">
          <div className="text-[11px] text-stone-400">Dodecagon Ratio</div>
          <div className="font-mono text-xs font-semibold tabular-nums text-amber-200">
            {gunitRatioLabel}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onSectorChange(sector < 12 ? sector + 1 : 1)}
          aria-label="Increase dodecagon sector"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-amber-500/25 bg-[#17140F] text-amber-300 transition-colors hover:border-amber-400/60 hover:bg-amber-500/15 focus-visible:outline-2 focus-visible:outline-cyan-400"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
