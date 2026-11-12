import React, { useState } from 'react';
import {
  formatSmartPrecision,
  type MeasureType,
  type PrecisionBasis,
  type UniRythmicsComputation,
} from '../utils/uniRythmicsMath';

interface SpanOfZeroVisualizerProps {
  spanOfZeroEnabled: boolean;
  measureType: MeasureType;
  precisionBasis: PrecisionBasis;
  computed: UniRythmicsComputation;
  onToggleSpanOfZero: (enabled: boolean) => void;
  onSelectMeasureType: (type: MeasureType) => void;
}

export const SpanOfZeroVisualizer: React.FC<SpanOfZeroVisualizerProps> = ({
  spanOfZeroEnabled,
  measureType,
  precisionBasis,
  computed,
  onToggleSpanOfZero,
  onSelectMeasureType,
}) => {
  const [inspectedPoint, setInspectedPoint] = useState<string | null>(null);

  const phiVal = computed.basePhi; // 0.618 or 0.6180339887...
  const negPhi = -phiVal;
  const posPhi = phiVal;
  const firstMeasureEnd = phiVal + 1; // 1.618 or 1.6180339887...
  const zeroSpanWidth = phiVal * 2; // 1.236 or 1.236067977...

  // SVG coordinate space covering domain [-0.80, +1.80] (total domain = 2.60)
  const svgW = 920;
  const svgH = 128;
  const padL = 34;
  const padR = 34;
  const domainMin = -0.8;
  const domainMax = 1.8;
  const plotW = svgW - padL - padR;

  const toX = (val: number) => {
    const clamped = Math.min(domainMax, Math.max(domainMin, val));
    return padL + ((clamped - domainMin) / (domainMax - domainMin)) * plotW;
  };

  const xNegPhi = toX(negPhi);
  const xZero = toX(0);
  const xPosPhi = toX(posPhi);
  const xFullHalf = toX(zeroSpanWidth);
  const xFirstEnd = toX(firstMeasureEnd);

  // Active Gunit marker along the positive axis
  const gunitPos = Math.min(domainMax, Math.max(0, computed.gunitValue));
  const xGunit = toX(gunitPos);

  // Active transition boundary endpoint along the ruler
  const transitionEndpoint = spanOfZeroEnabled
    ? computed.spanOfZero.activeMeasureEnd
    : computed.fastFold.effectiveFoldedScalar;
  const isOverflowingScale = transitionEndpoint > domainMax;
  const xTransition = toX(transitionEndpoint);

  const decPlaces = precisionBasis === 'exact' ? 6 : 3;

  const landmarks = [
    {
      id: 'neg_phi',
      val: negPhi,
      label: `-${phiVal.toFixed(decPlaces)}`,
      sub: 'Lower Zero Reserve',
      color: '#F59E0B',
      action: () => onToggleSpanOfZero(true),
    },
    {
      id: 'zero',
      val: 0,
      label: '0',
      sub: 'Symmetry Origin',
      color: '#FDE68A',
      action: () => onToggleSpanOfZero(!spanOfZeroEnabled),
    },
    {
      id: 'pos_phi',
      val: posPhi,
      label: `+${phiVal.toFixed(decPlaces)}`,
      sub: 'Upper Zero Reserve / Whole 1/1',
      color: '#F59E0B',
      action: () => onSelectMeasureType('whole'),
    },
    {
      id: 'full_half',
      val: zeroSpanWidth,
      label: zeroSpanWidth.toFixed(decPlaces),
      sub: 'Full Span Width (Half 1/1)',
      color: '#FBBF24',
      action: () => onSelectMeasureType('half'),
    },
    {
      id: 'first_end',
      val: firstMeasureEnd,
      label: firstMeasureEnd.toFixed(decPlaces),
      sub: '1st Measure Upper Edge (φ)',
      color: '#38BDF8',
      action: () => onToggleSpanOfZero(true),
    },
  ];

  return (
    <div
      aria-label="Span of Zero Reserved Transition Visualizer"
      className="relative z-10 mt-5 rounded-2xl border border-amber-500/30 bg-[#0A0908]/85 p-4 sm:p-5"
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <div className="text-[11px] font-medium text-cyan-300">
            Base Measurement Transition Buffer
          </div>
          <h3 className="text-base font-bold text-amber-100">
            Span of Zero (−{phiVal.toFixed(3)} to +{phiVal.toFixed(3)})
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden text-right font-mono text-xs tabular-nums sm:block">
            <div className="text-stone-400">Reserved Width (2 × φ⁻¹)</div>
            <div className="font-semibold text-amber-300">
              {spanOfZeroEnabled ? zeroSpanWidth.toFixed(decPlaces) : '0.000 (Bypassed)'}
            </div>
          </div>

          <div className="flex rounded-lg border border-white/10 bg-black/55 p-0.5">
            <button
              type="button"
              onClick={() => onToggleSpanOfZero(true)}
              className={`min-h-[36px] rounded-md px-3 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                spanOfZeroEnabled
                  ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/50'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Reserved (−0.618 @ +0.618)
            </button>
            <button
              type="button"
              onClick={() => onToggleSpanOfZero(false)}
              className={`min-h-[36px] rounded-md px-3 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                !spanOfZeroEnabled
                  ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/50'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Classic (0)
            </button>
          </div>
        </div>
      </div>

      {/* Calibrated Vacuum-Tube Spectrum Scale */}
      <div className="mt-3.5 overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgW} ${svgH}`}
          className="h-[124px] min-w-[660px] w-full select-none"
          role="img"
          aria-label="Graduated linear spectrum displaying the reserved span of zero between -0.618 and +0.618 and the first full measure transition up to 1.618"
        >
          <defs>
            <pattern
              id="zeroReserveHatch"
              width="8"
              height="8"
              patternTransform="rotate(45 0 0)"
              patternUnits="userSpaceOnUse"
            >
              <line
                x1="0"
                y1="0"
                x2="0"
                y2="8"
                stroke="rgba(245, 158, 11, 0.28)"
                strokeWidth="2"
              />
            </pattern>
            <linearGradient id="spanAmberGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(245, 158, 11, 0.22)" />
              <stop offset="50%" stopColor="rgba(253, 230, 138, 0.14)" />
              <stop offset="100%" stopColor="rgba(245, 158, 11, 0.22)" />
            </linearGradient>
            <linearGradient id="firstMeasureGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(56, 189, 248, 0.18)" />
              <stop offset="100%" stopColor="rgba(56, 189, 248, 0.06)" />
            </linearGradient>
          </defs>

          {/* Background base rail */}
          <rect
            x={padL}
            y="44"
            width={plotW}
            height="34"
            rx="6"
            fill="#06070A"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth="1"
          />

          {/* Reserved Span of Zero Band [-0.618 .. +0.618] */}
          <g opacity={spanOfZeroEnabled ? 1 : 0.25}>
            <rect
              x={xNegPhi}
              y="44"
              width={xPosPhi - xNegPhi}
              height="34"
              fill="url(#spanAmberGrad)"
            />
            <rect
              x={xNegPhi}
              y="44"
              width={xPosPhi - xNegPhi}
              height="34"
              fill="url(#zeroReserveHatch)"
              stroke="#F59E0B"
              strokeWidth="1.4"
            />
            <text
              x={(xNegPhi + xZero) / 2}
              y="64"
              textAnchor="middle"
              className="fill-amber-200/85 font-mono text-[10px] font-medium"
            >
              −φ⁻¹ Reserve
            </text>
            <text
              x={(xZero + xPosPhi) / 2}
              y="64"
              textAnchor="middle"
              className="fill-amber-200/85 font-mono text-[10px] font-medium"
            >
              +φ⁻¹ Reserve
            </text>
          </g>

          {/* First Full Measure Transition Band [+0.618 .. +1.618] */}
          <rect
            x={spanOfZeroEnabled ? xPosPhi : xZero}
            y="44"
            width={spanOfZeroEnabled ? xFirstEnd - xPosPhi : toX(1) - xZero}
            height="34"
            fill="url(#firstMeasureGrad)"
            stroke="rgba(56, 189, 248, 0.55)"
            strokeWidth="1.2"
            strokeDasharray="4 3"
          />
          <text
            x={
              spanOfZeroEnabled
                ? (xPosPhi + xFirstEnd) / 2
                : (xZero + toX(1)) / 2
            }
            y="64"
            textAnchor="middle"
            className="fill-cyan-200 font-mono text-[10px] font-medium"
          >
            {spanOfZeroEnabled ? '1st Measure (+0.618 → +1.618)' : '1st Measure (0 → 1.000)'}
          </text>

          {/* Fine graduated 0.1 ticks across [-0.8 .. +1.8] */}
          {Array.from({ length: 27 }, (_, i) => {
            const v = Number((-0.8 + i * 0.1).toFixed(1));
            const x = toX(v);
            const isMajor = Math.abs(v % 0.5) < 0.01 || Math.abs(v) < 0.01;
            return (
              <line
                key={v}
                x1={x}
                y1="78"
                x2={x}
                y2={isMajor ? 88 : 84}
                stroke={isMajor ? 'rgba(226, 232, 240, 0.45)' : 'rgba(148, 163, 184, 0.22)'}
                strokeWidth={isMajor ? 1.2 : 0.8}
              />
            );
          })}

          {/* Center Zero Origin vertical axis */}
          <line
            x1={xZero}
            y1="36"
            x2={xZero}
            y2="88"
            stroke="#FDE68A"
            strokeWidth="1.6"
          />

          {/* Interactive Landmark Reticle Nodes */}
          {landmarks.map((lm) => {
            const lx = toX(lm.val);
            const isHovered = inspectedPoint === lm.id;
            return (
              <g
                key={lm.id}
                role="button"
                tabIndex={0}
                aria-label={`${lm.sub}: ${lm.label}`}
                onMouseEnter={() => setInspectedPoint(lm.id)}
                onMouseLeave={() => setInspectedPoint(null)}
                onFocus={() => setInspectedPoint(lm.id)}
                onBlur={() => setInspectedPoint(null)}
                onClick={lm.action}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    lm.action();
                  }
                }}
                className="cursor-pointer focus:outline-none"
              >
                <line
                  x1={lx}
                  y1="38"
                  x2={lx}
                  y2="86"
                  stroke={lm.color}
                  strokeWidth={isHovered ? 2.2 : 1.3}
                  strokeOpacity={0.85}
                />
                <circle
                  cx={lx}
                  cy="41"
                  r={isHovered ? 5 : 3.5}
                  fill={lm.color}
                />
                <text
                  x={lx}
                  y="104"
                  textAnchor="middle"
                  className="font-mono text-[10.5px] font-semibold"
                  fill={lm.color}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {lm.label}
                </text>
              </g>
            );
          })}

          {/* Top Bracket Callout: Span of Zero [-0.618 @ +0.618] */}
          <path
            d={`M ${xNegPhi} 24 L ${xNegPhi} 18 L ${xPosPhi} 18 L ${xPosPhi} 24`}
            fill="none"
            stroke="rgba(245, 158, 11, 0.7)"
            strokeWidth="1.3"
          />
          <text
            x={xZero}
            y="13"
            textAnchor="middle"
            className="fill-amber-200 font-mono text-[10.5px] font-semibold"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            Span of Zero: −{phiVal.toFixed(3)} @ +{phiVal.toFixed(3)} (Width {zeroSpanWidth.toFixed(3)})
          </text>

          {/* Active 1 Gunit Marker Diamond */}
          <g transform={`translate(${xGunit}, 44)`}>
            <polygon points="0,-9 6,-1 0,5 -6,-1" fill="#FFB443" stroke="#090A0E" strokeWidth="1" />
          </g>
          <text
            x={xGunit}
            y="30"
            textAnchor="middle"
            className="fill-[#FFB443] font-mono text-[9.5px] font-bold"
          >
            1 Gunit ({formatSmartPrecision(computed.gunitValue, 3)})
          </text>

          {/* Active Scaled Transition Needle */}
          <g transform={`translate(${xTransition}, 78)`}>
            <polygon points="0,0 5,8 -5,8" fill="#38BDF8" />
          </g>
          {isOverflowingScale && (
            <text
              x={svgW - padR}
              y="13"
              textAnchor="end"
              className="fill-cyan-300 font-mono text-[10px]"
            >
              Expanse → {formatSmartPrecision(transitionEndpoint, 4)}
            </text>
          )}
        </svg>
      </div>

      {/* Bottom Transition Summary Row */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-2.5 text-xs">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-stone-300">
          <span>
            Mode:{' '}
            <strong className="font-medium text-amber-200">
              {measureType === 'half' ? 'Half Measure (1/1 = Full Span Width)' : 'Whole Measure (1/1 = +φ⁻¹ Edge)'}
            </strong>
          </span>
          <span aria-hidden="true" className="text-stone-600">·</span>
          <span>
            Active Transition Window:{' '}
            <span className="font-mono font-semibold tabular-nums text-cyan-200">
              {formatSmartPrecision(computed.spanOfZero.activeMeasureStart, 4)} –{' '}
              {formatSmartPrecision(computed.spanOfZero.activeMeasureEnd, 4)}
            </span>
          </span>
        </div>

        <div className="font-mono text-[11px] tabular-nums text-stone-400">
          {inspectedPoint
            ? landmarks.find((l) => l.id === inspectedPoint)?.sub
            : `Reserved Bounds: [${negPhi.toFixed(decPlaces)}, +${posPhi.toFixed(decPlaces)}]`}
        </div>
      </div>
    </div>
  );
};
