import React from 'react';
import {
  formatSmartPrecision,
  type SpaceDimensions,
  type UniRythmicsComputation,
} from '../utils/uniRythmicsMath';

interface SpanOfZero3DVisualProps {
  spanOfZeroEnabled: boolean;
  spaceDimensions: SpaceDimensions;
  computed: UniRythmicsComputation;
  onToggleSpanOfZero: (enabled: boolean) => void;
  onChangeSpaceDimensions: (dims: SpaceDimensions) => void;
}

export const SpanOfZero3DVisual: React.FC<SpanOfZero3DVisualProps> = ({
  spanOfZeroEnabled,
  spaceDimensions,
  computed,
  onToggleSpanOfZero,
  onChangeSpaceDimensions,
}) => {
  const { spanOfZero, fastFold } = computed;
  const phiStr = formatSmartPrecision(computed.basePhi, 3);
  const firstEndStr = formatSmartPrecision(spanOfZero.firstMeasureEnd, 3);

  // Isometric cube projection helper for 3D space diagram
  const iso = (x: number, y: number, z: number, cx = 138, cy = 104, scale = 32) => {
    const px = cx + (x - z) * scale * 0.866;
    const py = cy + (x + z) * scale * 0.48 - y * scale;
    return [px, py] as const;
  };

  const buildCubeEdges = (min: number, max: number) => {
    const c = [
      iso(min, min, min),
      iso(max, min, min),
      iso(max, max, min),
      iso(min, max, min),
      iso(min, min, max),
      iso(max, min, max),
      iso(max, max, max),
      iso(min, max, max),
    ];
    const edges: [number, number][] = [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 4],
      [0, 4],
      [1, 5],
      [2, 6],
      [3, 7],
    ];
    return edges.map(([a, b]) => ({
      x1: c[a][0],
      y1: c[a][1],
      x2: c[b][0],
      y2: c[b][1],
    }));
  };

  // Reserved Zero Span Cube: [-0.618, +0.618] in 3D space
  const zeroSpanEdges = buildCubeEdges(-0.618, 0.618);
  // First Full Measure Outer Envelope: [0.618, 1.618] scaled down smoothly into view
  const expanseScale = Math.min(1.65, 0.618 + Math.log10(fastFold.effectiveFoldedScalar + 1) * 0.85 + 0.62);
  const expanseEdges = buildCubeEdges(
    spanOfZeroEnabled ? -0.618 : 0,
    spanOfZeroEnabled ? expanseScale : expanseScale - 0.3
  );

  // Axis endpoints
  const origin = iso(0, 0, 0);
  const xPos = iso(2.15, 0, 0);
  const xNeg = iso(-1.45, 0, 0);
  const yPos = iso(0, 2.15, 0);
  const yNeg = iso(0, -1.45, 0);
  const zPos = iso(0, 0, 2.15);
  const zNeg = iso(0, 0, -1.45);

  return (
    <div className="rounded-2xl border border-amber-500/25 bg-[#101116] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-3.5">
        <div>
          <h3 className="text-base font-semibold text-amber-100">
            3D Span of Zero &amp; Reserved Expanse (−{phiStr} @ +{phiStr})
          </h3>
          <p className="mt-0.5 text-xs text-stone-400">
            Reserves −{phiStr} through +{phiStr} around zero on each axis so the first full measure lands at {phiStr} – {firstEndStr}, leaving trailing expanse room.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-white/10 bg-black/50 p-0.5">
            <button
              type="button"
              onClick={() => onToggleSpanOfZero(true)}
              className={`min-h-[34px] rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                spanOfZeroEnabled
                  ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/50'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Span of Zero (±{phiStr})
            </button>
            <button
              type="button"
              onClick={() => onToggleSpanOfZero(false)}
              className={`min-h-[34px] rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                !spanOfZeroEnabled
                  ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/50'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Classic Origin (0)
            </button>
          </div>

          <div className="flex rounded-lg border border-white/10 bg-black/50 p-0.5">
            <button
              type="button"
              onClick={() => onChangeSpaceDimensions('1d')}
              className={`min-h-[34px] rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                spaceDimensions === '1d'
                  ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/50'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              1D Linear
            </button>
            <button
              type="button"
              onClick={() => onChangeSpaceDimensions('3d')}
              className={`min-h-[34px] rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                spaceDimensions === '3d'
                  ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/50'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              3D Space (X·Y·Z)
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-12 items-center">
        {/* Isometric 3D Spatial Projection SVG */}
        <div className="flex flex-col items-center rounded-xl border border-white/10 bg-[#08090C] p-3 md:col-span-5">
          <svg
            viewBox="0 0 276 208"
            className="h-[190px] w-full max-w-[276px]"
            role="img"
            aria-label="Isometric 3D Span of Zero visualization showing reserved origin cube and outer measure expanse"
          >
            {/* 3D Axes */}
            <line
              x1={xNeg[0]}
              y1={xNeg[1]}
              x2={xPos[0]}
              y2={xPos[1]}
              stroke="rgba(148,163,184,0.3)"
              strokeDasharray="3 3"
            />
            <line
              x1={yNeg[0]}
              y1={yNeg[1]}
              x2={yPos[0]}
              y2={yPos[1]}
              stroke="rgba(148,163,184,0.3)"
              strokeDasharray="3 3"
            />
            <line
              x1={zNeg[0]}
              y1={zNeg[1]}
              x2={zPos[0]}
              y2={zPos[1]}
              stroke="rgba(148,163,184,0.3)"
              strokeDasharray="3 3"
            />

            {/* Outer Active Measure Expanse Cube (Cyan EL-Wire) */}
            {expanseEdges.map((edge, idx) => (
              <line
                key={`exp-${idx}`}
                x1={edge.x1}
                y1={edge.y1}
                x2={edge.x2}
                y2={edge.y2}
                stroke={spaceDimensions === '3d' ? '#38BDF8' : 'rgba(56, 189, 248, 0.35)'}
                strokeWidth={spaceDimensions === '3d' ? 1.5 : 1}
              />
            ))}

            {/* Inner Reserved Span-of-Zero Cube [-0.618, +0.618] (Tungsten Amber) */}
            {spanOfZeroEnabled &&
              zeroSpanEdges.map((edge, idx) => (
                <line
                  key={`zero-${idx}`}
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke="#F59E0B"
                  strokeWidth="1.4"
                  strokeOpacity="0.9"
                />
              ))}

            {/* Center Zero Origin */}
            <circle cx={origin[0]} cy={origin[1]} r="3.5" fill="#FDE68A" />
            <text
              x={origin[0] + 6}
              y={origin[1] + 10}
              className="fill-amber-200 font-mono text-[9px]"
            >
              0
            </text>

            {/* Axis labels */}
            <text x={xPos[0] + 4} y={xPos[1] + 3} className="fill-cyan-300 font-mono text-[10px]">
              X
            </text>
            <text x={yPos[0] - 3} y={yPos[1] - 5} className="fill-cyan-300 font-mono text-[10px]">
              Y
            </text>
            <text x={zPos[0] - 12} y={zPos[1] + 4} className="fill-cyan-300 font-mono text-[10px]">
              Z
            </text>
          </svg>
          <div className="mt-1 flex items-center gap-4 text-[11px] text-stone-400">
            <span className="text-amber-300">Amber: Zero Span (−{phiStr}..+{phiStr})</span>
            <span className="text-cyan-300">Cyan: Active Expanse</span>
          </div>
        </div>

        {/* Linear Axis Interval & 3D Space Readout */}
        <div className="space-y-3 md:col-span-7">
          {/* 1D Linear Span Number Line */}
          <div className="rounded-xl border border-white/10 bg-black/45 p-3.5">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-stone-300">
                Axis Measure Interval Rule
              </span>
              <span className="font-mono tabular-nums text-amber-300">
                1st Measure: {phiStr} – {firstEndStr}
              </span>
            </div>

            {/* Proportional span visual bar */}
            <div className="grid grid-cols-12 gap-1 rounded-lg bg-[#08090C] p-1.5 font-mono text-[10px] tabular-nums">
              <div className="col-span-3 rounded border border-amber-500/40 bg-amber-500/15 px-2 py-1.5 text-center text-amber-200">
                <div>−{phiStr} @ 0</div>
                <div className="text-[9px] text-amber-300/75">Neg Reserve</div>
              </div>
              <div className="col-span-3 rounded border border-amber-500/40 bg-amber-500/15 px-2 py-1.5 text-center text-amber-200">
                <div>0 @ +{phiStr}</div>
                <div className="text-[9px] text-amber-300/75">Pos Reserve</div>
              </div>
              <div className="col-span-4 rounded border border-cyan-400/50 bg-cyan-500/15 px-2 py-1.5 text-center text-cyan-100">
                <div>
                  {formatSmartPrecision(spanOfZero.activeMeasureStart, 3)} –{' '}
                  {formatSmartPrecision(spanOfZero.activeMeasureEnd, 3)}
                </div>
                <div className="text-[9px] text-cyan-300">Active Folded Span</div>
              </div>
              <div className="col-span-2 rounded border border-dashed border-amber-400/35 bg-black/40 px-1.5 py-1.5 text-center text-stone-400">
                <div>+{phiStr}</div>
                <div className="text-[9px]">Tail</div>
              </div>
            </div>
          </div>

          {/* Numerical Coordinates Grid */}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
            <div className="rounded-lg border border-white/10 bg-black/40 p-2.5">
              <div className="text-[11px] text-stone-400">Zero Span Width</div>
              <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-amber-200">
                {formatSmartPrecision(spanOfZero.zeroSpanWidth, 6)}
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-black/40 p-2.5">
              <div className="text-[11px] text-stone-400">
                Active Axis Range
              </div>
              <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-cyan-200">
                {formatSmartPrecision(spanOfZero.activeMeasureStart, 3)}–
                {formatSmartPrecision(spanOfZero.activeMeasureEnd, 3)}
              </div>
            </div>

            <div className="col-span-2 rounded-lg border border-white/10 bg-black/40 p-2.5 sm:col-span-1">
              <div className="text-[11px] text-stone-400">
                {spaceDimensions === '3d' ? '3D Expanse Volume' : 'With Tail Reserve'}
              </div>
              <div className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-amber-300">
                {spaceDimensions === '3d'
                  ? `${formatSmartPrecision(spanOfZero.volume3DActiveExpanse, 5)} u³`
                  : formatSmartPrecision(spanOfZero.trailingExpanseEnd, 6)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
