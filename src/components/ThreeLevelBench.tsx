import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, Link2, Music, Search, Unlink2, Volume2, VolumeX, ArrowRight } from 'lucide-react';
import { SCIENTIFIC_UNITS, type ScientificUnit } from '../data/metrologyCatalog';
import { getNoteFrequencyHz, getSectorNote } from '../utils/fastAudioEngine';
import {
  formatSmartPrecision,
  toSuperscript,
  type ComparisonMode,
  type FastFoldLevel,
  type MeasureType,
  type PrecisionBasis,
  type UniRythmicsComputation,
  type UniRythmicsInputs,
} from '../utils/uniRythmicsMath';
import { DodecagonDial } from './DodecagonDial';
import { EdisonGearBackdrop } from './EdisonGearBackdrop';
import { RolodexDrumMultiplier } from './RolodexDrumMultiplier';
import { RolodexUnitSelector } from './RolodexUnitSelector';
import { SpanOfZero3DVisual } from './SpanOfZero3DVisual';
import { SpanOfZeroVisualizer } from './SpanOfZeroVisualizer';

interface ThreeLevelBenchProps {
  inputs: UniRythmicsInputs;
  computed: UniRythmicsComputation;
  onUpdate: (patch: Partial<UniRythmicsInputs>) => void;
}

export const ThreeLevelBench: React.FC<ThreeLevelBenchProps> = ({
  inputs,
  computed,
  onUpdate,
}) => {
  const [notableQuery, setNotableQuery] = useState('');
  const [matchSameDimensionOnly, setMatchSameDimensionOnly] = useState(false);
  const [showMusicalNotes, setShowMusicalNotes] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);

  const activeNote = getSectorNote(inputs.dodecagonSector);
  const activeNoteHz = getNoteFrequencyHz(activeNote.chromaticIndex, 4, 440);

  // Mechanically drive gear train angle from active dials, multiplier, Base-60 fold, & 3D span
  const gearDriveAngle = useMemo(() => {
    const multTurns = (inputs.multiplierInt % 360) * 15;
    const secTurns = inputs.dodecagonSector * 30;
    const expTurns = inputs.nthExponent * 45;
    const basisOffset = inputs.measureType === 'half' ? 0 : 90;
    const foldTurns = inputs.fastFoldLevel * 60;
    const spanOffset = inputs.spanOfZeroEnabled ? 22.5 : 0;
    const compTurns =
      inputs.comparisonMode === 'secondary'
        ? (computed.effectiveSecondaryMultiplier % 120) * 6
        : 0;
    return multTurns + secTurns + expTurns + basisOffset + foldTurns + spanOffset + compTurns;
  }, [
    inputs.multiplierInt,
    inputs.dodecagonSector,
    inputs.nthExponent,
    inputs.measureType,
    inputs.fastFoldLevel,
    inputs.spanOfZeroEnabled,
    inputs.comparisonMode,
    computed.effectiveSecondaryMultiplier,
  ]);

  const filteredNotables = useMemo(() => {
    const q = notableQuery.trim().toLowerCase();
    return SCIENTIFIC_UNITS.filter((u) => {
      if (u.id === 'custom_unit') return false;
      if (
        matchSameDimensionOnly &&
        inputs.primaryUnit.dimension !== 'custom' &&
        u.dimension !== inputs.primaryUnit.dimension
      ) {
        return false;
      }
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.symbol.toLowerCase().includes(q) ||
        u.dimensionLabel.toLowerCase().includes(q) ||
        u.summary.toLowerCase().includes(q)
      );
    });
  }, [notableQuery, matchSameDimensionOnly, inputs.primaryUnit.dimension]);

  // Logarithmic visual comparison bars (spans 50 orders of magnitude cleanly)
  const logBarPercent = (val: number) => {
    if (val <= 0 || !Number.isFinite(val)) return 4;
    const logVal = Math.log10(Math.abs(val));
    // Map -45..+15 to 6%..100%
    const normalized = ((logVal + 45) / 60) * 94 + 6;
    return Math.min(100, Math.max(6, normalized));
  };

  const setMeasureType = (measureType: MeasureType) => onUpdate({ measureType });
  const setPrecisionBasis = (precisionBasis: PrecisionBasis) =>
    onUpdate({ precisionBasis });
  const setComparisonMode = (comparisonMode: ComparisonMode) =>
    onUpdate({ comparisonMode });

  return (
    <section aria-label="Uni-Rythmics Three-Level Measurement Instrument" className="space-y-6">
      {/* Main Machined Brass & Thick Edison Vacuum Glass Housing */}
      <div className="brass-chassis relative rounded-[28px] p-2.5 sm:p-4">
        {/* Top & Bottom EL-Wire Edge Traces */}
        <div
          aria-hidden="true"
          className="el-wire-top pointer-events-none absolute inset-x-10 top-0 h-[2px] rounded-full"
        />
        <div
          aria-hidden="true"
          className="el-wire-top pointer-events-none absolute inset-x-16 bottom-0 h-[1.5px] rounded-full opacity-70"
        />

        {/* Corner Brass Fasteners */}
        {[
          'top-3 left-3',
          'top-3 right-3',
          'bottom-3 left-3',
          'bottom-3 right-3',
        ].map((pos) => (
          <span
            key={pos}
            aria-hidden="true"
            className={`pointer-events-none absolute ${pos} hidden h-3 w-3 rounded-full border border-amber-300/40 bg-[#2A2216] shadow-inner sm:block`}
          >
            <span className="absolute inset-x-0.5 top-1/2 h-px -rotate-45 bg-black/70" />
          </span>
        ))}

        {/* Thick Glass Dome Interior */}
        <div className="edison-glass-dome relative overflow-hidden rounded-[22px] border border-white/10 p-4 sm:p-6 lg:p-7">
          <EdisonGearBackdrop driveAngle={gearDriveAngle} />

          {/* Top Instrument Header inside Glass */}
          <div className="relative z-10 mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-amber-500/20 pb-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-amber-100 sm:text-2xl">
                Uni-Rythmics Equivalence Chamber
              </h1>
              <p className="mt-0.5 text-xs text-stone-400">
                360° Dodecagonal Space · Bound Unit φ⁻¹ ≈ 0.618034 · Side-by-Side Harmonic Scaling
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowMusicalNotes((v) => !v)}
                className={`flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                  showMusicalNotes
                    ? 'border-amber-400/50 bg-amber-500/15 text-amber-200'
                    : 'border-white/15 bg-black/40 text-stone-300 hover:border-white/30'
                }`}
              >
                <Music className="h-3.5 w-3.5" />
                <span>{showMusicalNotes ? 'Note Nodes' : 'Numeric Nodes'}</span>
              </button>

              <button
                type="button"
                onClick={() => setAudioEnabled((v) => !v)}
                className={`flex min-h-[40px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                  audioEnabled
                    ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-200'
                    : 'border-white/15 bg-black/40 text-stone-300 hover:border-white/30'
                }`}
              >
                {audioEnabled ? (
                  <Volume2 className="h-3.5 w-3.5" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5" />
                )}
                <span>{audioEnabled ? 'F.A.S.T. Audio On' : 'F.A.S.T. Muted'}</span>
              </button>

              {inputs.comparisonMode === 'hidden' ? (
                <button
                  type="button"
                  onClick={() => setComparisonMode('notable')}
                  className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-cyan-200 transition-colors hover:bg-cyan-500/20 focus-visible:outline-2 focus-visible:outline-cyan-400"
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Show var of comparison</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setComparisonMode('hidden')}
                  className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-white/15 bg-black/40 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-stone-300 transition-colors hover:border-white/30 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-400"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  <span>Hide Level 3</span>
                </button>
              )}
            </div>
          </div>

          {/* 3-LEVEL HORIZONTAL STAGE: [1 Gunit] = [1 var] = [var of comparison] */}
          <div
            className={`relative z-10 grid grid-cols-1 gap-4 ${
              inputs.comparisonMode === 'hidden'
                ? 'lg:grid-cols-[minmax(300px,0.95fr)_auto_minmax(380px,1.2fr)]'
                : 'lg:grid-cols-[minmax(270px,1fr)_auto_minmax(320px,1.18fr)_auto_minmax(280px,1fr)]'
            } items-stretch`}
          >
            {/* ============================================================== */}
            {/* LEVEL 1: 1 GUNIT                                               */}
            {/* ============================================================== */}
            <div className="flex flex-col justify-between rounded-2xl border border-amber-500/25 bg-[#0C0B0A]/80 p-4 sm:p-5">
              <div>
                <div className="mb-3 flex items-baseline justify-between gap-2 border-b border-white/10 pb-2.5">
                  <div>
                    <span className="text-[11px] font-medium text-cyan-300">
                      Level 1 · Base Boundary
                    </span>
                    <h2 className="text-lg font-bold text-amber-100">1 Gunit</h2>
                  </div>
                  <div className="text-right font-mono text-xs tabular-nums text-stone-400">
                    {inputs.measureType === 'half' ? '1/2 = φ⁻¹' : '1/1 = φ⁻¹'}
                  </div>
                </div>

                {/* Dodecagonal 360° Dial with 60 Base-60 ticks & Chromatic Nodes */}
                <DodecagonDial
                  sector={inputs.dodecagonSector}
                  onSectorChange={(sector) => onUpdate({ dodecagonSector: sector })}
                  gunitRatioLabel={`${inputs.dodecagonSector}/12 · ${activeNote.noteName}₄ (${activeNoteHz.toFixed(1)} Hz)`}
                  dialTick60={computed.fastFold.dialTick60}
                  showMusicalNotes={showMusicalNotes}
                  audioEnabled={audioEnabled}
                />

                {/* Measure Type & Precision Controls */}
                <div className="mt-4 space-y-2.5">
                  <div>
                    <span className="mb-1 block text-xs font-medium text-stone-400">
                      Measure Type
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-white/10 bg-black/50 p-1">
                      <button
                        type="button"
                        onClick={() => setMeasureType('half')}
                        className={`min-h-[38px] rounded-md px-2 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                          inputs.measureType === 'half'
                            ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/50'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        Half (1/2 = φ⁻¹)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMeasureType('whole')}
                        className={`min-h-[38px] rounded-md px-2 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                          inputs.measureType === 'whole'
                            ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/50'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        Whole (1 = φ⁻¹)
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="mb-1 block text-xs font-medium text-stone-400">
                      Precision Basis
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-white/10 bg-black/50 p-1">
                      <button
                        type="button"
                        onClick={() => setPrecisionBasis('rounded')}
                        className={`min-h-[38px] rounded-md px-2 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                          inputs.precisionBasis === 'rounded'
                            ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/50'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        Rounded (0.618)
                      </button>
                      <button
                        type="button"
                        onClick={() => setPrecisionBasis('exact')}
                        className={`min-h-[38px] rounded-md px-2 py-1.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                          inputs.precisionBasis === 'exact'
                            ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/50'
                            : 'text-stone-400 hover:text-stone-200'
                        }`}
                      >
                        Exact (1/φ)
                      </button>
                    </div>
                  </div>

                  {/* Nth-power decimal shift slider/selector */}
                  <div className="rounded-lg border border-white/10 bg-black/40 p-2.5">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-stone-300">
                        Nth-Decimal Shift (1/10ⁿ)
                      </span>
                      <span className="font-mono tabular-nums text-cyan-300">
                        × 10{toSuperscript(`-${inputs.nthExponent}`)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={9}
                      step={1}
                      aria-label="Nth decimal power shift exponent"
                      value={inputs.nthExponent}
                      onChange={(e) =>
                        onUpdate({ nthExponent: parseInt(e.target.value, 10) })
                      }
                      className="h-2 w-full cursor-pointer accent-amber-400"
                    />
                    <div className="mt-1 flex justify-between font-mono text-[10px] text-stone-500">
                      <span>1/1 (10⁰)</span>
                      <span>1/10 (10⁻¹)</span>
                      <span>10⁻⁵</span>
                      <span>10⁻⁹</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Level 1 Readouts Below */}
              <div className="mt-4 space-y-2 border-t border-amber-500/20 pt-3">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-stone-400">Full Unit (1/1):</span>
                  <span className="font-mono font-semibold tabular-nums text-stone-100">
                    {formatSmartPrecision(computed.fullUnit, 6)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-stone-400">One-Tenth (1/10):</span>
                  <span className="font-mono font-semibold tabular-nums text-stone-200">
                    {formatSmartPrecision(computed.tenthUnit, 6)}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-stone-400">1st Measure Rule:</span>
                  <span className="font-mono font-semibold tabular-nums text-cyan-200">
                    {inputs.spanOfZeroEnabled
                      ? `${formatSmartPrecision(computed.spanOfZero.firstMeasureStart, 3)} – ${formatSmartPrecision(computed.spanOfZero.firstMeasureEnd, 3)}`
                      : '0.000 – 1.000'}
                  </span>
                </div>
                <div className="mt-2 rounded-lg border border-amber-500/30 bg-black/55 px-3 py-2">
                  <div className="text-[11px] text-stone-400">
                    Active 1 Gunit Value
                  </div>
                  <div className="font-mono text-2xl font-bold tabular-nums filament-glow">
                    {formatSmartPrecision(computed.gunitValue, 6)}
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* EQUIVALENCE BRIDGE 1 (=)                                       */}
            {/* ============================================================== */}
            <div className="flex items-center justify-center py-1 lg:py-0">
              <div className="flex items-center gap-2 lg:flex-col">
                <span className="el-wire-bridge h-[2px] w-10 rounded-full lg:h-12 lg:w-[2px]" />
                <span
                  aria-label="equals"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/50 bg-[#0B1117] font-mono text-lg font-bold text-cyan-300 shadow-[0_0_16px_rgba(56,189,248,0.25)]"
                >
                  =
                </span>
                <span className="el-wire-bridge h-[2px] w-10 rounded-full lg:h-12 lg:w-[2px]" />
              </div>
            </div>

            {/* ============================================================== */}
            {/* LEVEL 2: 1 VAR + x000001 SCALAR + FINAL TOTAL                   */}
            {/* ============================================================== */}
            <div className="flex flex-col justify-between rounded-2xl border border-amber-400/35 bg-[#0D0B09]/85 p-4 sm:p-5">
              <div>
                <div className="mb-3 flex items-baseline justify-between gap-2 border-b border-white/10 pb-2.5">
                  <div>
                    <span className="text-[11px] font-medium text-cyan-300">
                      Level 2 · Main Variable &amp; Scalar
                    </span>
                    <h2 className="text-lg font-bold text-amber-100">1 var</h2>
                  </div>
                  <div className="text-right text-xs text-stone-400">
                    {inputs.primaryUnit.dimensionLabel}
                  </div>
                </div>

                {/* Main Variable Selector */}
                <RolodexUnitSelector
                  selectedUnit={inputs.primaryUnit}
                  onSelectUnit={(unit) => onUpdate({ primaryUnit: unit })}
                  customValue={inputs.primaryCustomValue}
                  customSymbol={inputs.primaryCustomSymbol}
                  onCustomValueChange={(val) => onUpdate({ primaryCustomValue: val })}
                  onCustomSymbolChange={(sym) => onUpdate({ primaryCustomSymbol: sym })}
                  labelPrefix="Main Variable (1 var)"
                />

                {/* Quiet unboxed scientific metadata */}
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-400">
                  <span>{inputs.primaryUnit.stevensScale} Scale</span>
                  <span aria-hidden="true">·</span>
                  <span>{inputs.primaryUnit.spatialProperty}</span>
                  <span aria-hidden="true">·</span>
                  <span>{inputs.primaryUnit.method}</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-stone-300">{inputs.primaryUnit.sourceNote}</span>
                </div>

                {/* 1 var Single-Unit Readout directly below selector */}
                <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/45 p-3">
                  <div>
                    <div className="text-[11px] text-stone-400">
                      Single Unit (1 var)
                    </div>
                    <div className="mt-0.5 font-mono text-base font-semibold tabular-nums text-stone-100">
                      {formatSmartPrecision(computed.primarySingleSi, 6)}{' '}
                      <span className="text-xs font-normal text-stone-400">
                        {computed.primarySingleLabel}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-stone-400">
                      1 Gunit × 1 var
                    </div>
                    <div className="mt-0.5 font-mono text-base font-semibold tabular-nums text-amber-200">
                      {formatSmartPrecision(computed.primaryHarmonicSingle, 6)}{' '}
                      <span className="text-xs font-normal text-amber-300/70">
                        {computed.primarySingleLabel}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Adjustable Scalar Integer Multiplier beneath 1 var (x000001 upward) */}
                <div className="mt-3 space-y-2.5">
                  <RolodexDrumMultiplier
                    value={inputs.multiplierInt}
                    onChange={(next) => onUpdate({ multiplierInt: next })}
                    label="Scalar Multiplier Beneath 1 var (000001 Upward)"
                  />

                  {/* Base-60 Fast Fold Compressor */}
                  <div className="rounded-xl border border-cyan-500/25 bg-black/55 p-3">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-medium text-cyan-200">
                        Base-60 Fast Fold Compressor
                      </span>
                      <span className="font-mono text-xs tabular-nums text-amber-200">
                        60-Tuple: {computed.fastFold.sexagesimalFormatted}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      {(
                        [
                          { level: -1 as FastFoldLevel, label: '×60' },
                          { level: 0 as FastFoldLevel, label: '1:1 (60⁰)' },
                          { level: 1 as FastFoldLevel, label: '÷60¹' },
                          { level: 2 as FastFoldLevel, label: '÷60²' },
                          { level: 3 as FastFoldLevel, label: '÷60³' },
                        ] as const
                      ).map((opt) => (
                        <button
                          key={opt.level}
                          type="button"
                          onClick={() => onUpdate({ fastFoldLevel: opt.level })}
                          className={`min-h-[34px] flex-1 rounded-md border px-2 font-mono text-[11px] font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                            inputs.fastFoldLevel === opt.level
                              ? 'border-cyan-400/60 bg-cyan-500/20 text-cyan-100'
                              : 'border-white/10 bg-[#12141A] text-stone-400 hover:border-white/25 hover:text-stone-200'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}

                      {computed.fastFold.recommendedFoldLevel > 0 &&
                        inputs.fastFoldLevel !== computed.fastFold.recommendedFoldLevel && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdate({
                                fastFoldLevel: computed.fastFold.recommendedFoldLevel,
                              })
                            }
                            className="min-h-[34px] rounded-md border border-amber-400/50 bg-amber-500/15 px-2.5 text-[11px] font-semibold whitespace-nowrap text-amber-200 transition-colors hover:bg-amber-500/25 focus-visible:outline-2 focus-visible:outline-cyan-400"
                          >
                            Auto-Fold (÷60{toSuperscript(String(computed.fastFold.recommendedFoldLevel))})
                          </button>
                        )}
                    </div>

                    <div className="mt-2 flex items-center justify-between text-[11px] text-stone-400">
                      <span>Compressed Scalar:</span>
                      <span className="font-mono font-semibold tabular-nums text-stone-200">
                        {formatSmartPrecision(computed.fastFold.effectiveFoldedScalar, 6)}{' '}
                        ({computed.fastFold.dialTick60}/60 dial tick)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Final Total & Step-by-Step Transparent Calculation Breakdown */}
              <div className="mt-4 space-y-3 border-t border-amber-500/25 pt-3.5">
                <div className="rounded-xl border border-amber-400/40 bg-black/70 p-3.5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="text-xs font-medium text-amber-200/90">
                      Final Scaled Total ({inputs.spaceDimensions === '3d' ? '3D Expanse' : '1D Linear'})
                    </span>
                    <span className="font-mono text-[11px] tabular-nums text-stone-400">
                      {inputs.spaceDimensions === '3d'
                        ? `1D Linear: ${formatSmartPrecision(computed.primaryLinearTotal, 5)} ${computed.primarySingleLabel}`
                        : `3D Space: ${formatSmartPrecision(computed.primaryCubic3DTotal, 5)} ${computed.primarySingleLabel}³`}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold tabular-nums filament-glow sm:text-3xl">
                      {formatSmartPrecision(computed.primaryFinalTotal, 7)}
                    </span>
                    <span className="font-mono text-sm font-medium text-amber-300/80">
                      {computed.primarySingleLabel}
                      {inputs.spaceDimensions === '3d' ? '³' : ''}
                    </span>
                  </div>
                </div>

                {/* Transparent Visual Math Trace */}
                <div className="space-y-1.5 rounded-xl border border-white/10 bg-black/40 p-3 text-xs">
                  <div className="font-medium text-stone-300">
                    Transparent Calculation Trace
                  </div>
                  <div className="flex items-center justify-between gap-2 font-mono text-[11px] tabular-nums">
                    <span className="text-stone-400">
                      1. Base φ⁻¹ &amp; Measure ({inputs.measureType === 'half' ? '× 2' : '× 1'})
                    </span>
                    <span className="text-stone-200">
                      {formatSmartPrecision(computed.fullUnit, 6)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 font-mono text-[11px] tabular-nums">
                    <span className="text-stone-400">
                      2. Scale (× 10{toSuperscript(`-${inputs.nthExponent}`)}) &amp; Sector ({inputs.dodecagonSector}/12)
                    </span>
                    <span className="text-amber-200">
                      {formatSmartPrecision(computed.gunitValue, 6)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 font-mono text-[11px] tabular-nums">
                    <span className="text-stone-400">
                      3. Base-60 Folded Scalar ({inputs.multiplierInt.toString().padStart(6, '0')} ÷ {formatSmartPrecision(computed.fastFold.foldDivisor, 4)})
                    </span>
                    <span className="text-cyan-200">
                      {formatSmartPrecision(computed.fastFold.effectiveFoldedScalar, 6)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 font-mono text-[11px] tabular-nums">
                    <span className="text-stone-400">
                      4. {inputs.spanOfZeroEnabled ? 'Span of Zero Window' : 'Origin Zero Window'}
                    </span>
                    <span className="text-stone-200">
                      {formatSmartPrecision(computed.spanOfZero.activeMeasureStart, 3)} –{' '}
                      {formatSmartPrecision(computed.spanOfZero.activeMeasureEnd, 3)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-1.5 font-mono text-[11px] tabular-nums">
                    <span className="text-stone-300">
                      5. Final {inputs.spaceDimensions === '3d' ? '3D Cubic' : '1D Linear'} Output
                    </span>
                    <span className="font-semibold text-amber-300">
                      {formatSmartPrecision(computed.primaryFinalTotal, 7)}{' '}
                      {computed.primarySingleLabel}
                      {inputs.spaceDimensions === '3d' ? '³' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ============================================================== */}
            {/* LEVEL 3: OPTIONAL VAR OF COMPARISON                            */}
            {/* ============================================================== */}
            {inputs.comparisonMode !== 'hidden' && (
              <>
                <div className="flex items-center justify-center py-1 lg:py-0">
                  <div className="flex items-center gap-2 lg:flex-col">
                    <span className="el-wire-bridge h-[2px] w-10 rounded-full lg:h-12 lg:w-[2px]" />
                    <span
                      aria-label="compared with"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/50 bg-[#0B1117] font-mono text-lg font-bold text-cyan-300 shadow-[0_0_16px_rgba(56,189,248,0.25)]"
                    >
                      =
                    </span>
                    <span className="el-wire-bridge h-[2px] w-10 rounded-full lg:h-12 lg:w-[2px]" />
                  </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-cyan-500/25 bg-[#0B0D10]/85 p-4 sm:p-5">
                  <div>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5">
                      <div>
                        <span className="text-[11px] font-medium text-cyan-300">
                          Level 3 · Optional Reference
                        </span>
                        <h2 className="text-lg font-bold text-amber-100">
                          var of comparison
                        </h2>
                      </div>

                      <div className="flex rounded-lg border border-white/10 bg-black/50 p-0.5">
                        <button
                          type="button"
                          onClick={() => setComparisonMode('notable')}
                          className={`min-h-[34px] rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                            inputs.comparisonMode === 'notable'
                              ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/50'
                              : 'text-stone-400 hover:text-stone-200'
                          }`}
                        >
                          Notable Query
                        </button>
                        <button
                          type="button"
                          onClick={() => setComparisonMode('secondary')}
                          className={`min-h-[34px] rounded-md px-2.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                            inputs.comparisonMode === 'secondary'
                              ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/50'
                              : 'text-stone-400 hover:text-stone-200'
                          }`}
                        >
                          Secondary Scale
                        </button>
                      </div>
                    </div>

                    {inputs.comparisonMode === 'notable' ? (
                      <div className="space-y-3">
                        {/* Searchable Notable Constant Query */}
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                          <input
                            type="search"
                            value={notableQuery}
                            onChange={(e) => setNotableQuery(e.target.value)}
                            placeholder="Query Planck, light, Earth, meter..."
                            aria-label="Search notable scientific constants"
                            className="h-10 w-full rounded-lg border border-cyan-500/30 bg-black/60 pl-9 pr-3 text-xs text-stone-100 placeholder:text-stone-500 focus:border-cyan-400 focus:outline-none"
                          />
                        </div>

                        <label className="flex cursor-pointer items-center gap-2 text-xs text-stone-300">
                          <input
                            type="checkbox"
                            checked={matchSameDimensionOnly}
                            onChange={(e) => setMatchSameDimensionOnly(e.target.checked)}
                            className="h-4 w-4 rounded border-white/20 bg-black accent-cyan-400"
                          />
                          <span>
                            Match {inputs.primaryUnit.dimensionLabel} only
                          </span>
                        </label>

                        {/* Scrollable Notable Query Results */}
                        <div className="max-h-48 space-y-1.5 overflow-y-auto pr-1">
                          {filteredNotables.length === 0 ? (
                            <div className="rounded-lg border border-white/10 bg-black/35 p-3 text-xs text-stone-400">
                              No notable constant matches that filter. Clear search or disable dimension matching.
                            </div>
                          ) : (
                            filteredNotables.map((unit) => {
                              const isSelected = unit.id === inputs.notableUnit.id;
                              return (
                                <button
                                  key={unit.id}
                                  type="button"
                                  onClick={() => onUpdate({ notableUnit: unit })}
                                  className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                                    isSelected
                                      ? 'border-cyan-400/60 bg-cyan-500/15 text-cyan-100'
                                      : 'border-white/10 bg-black/35 text-stone-300 hover:border-white/25 hover:bg-black/55'
                                  }`}
                                >
                                  <div className="min-w-0">
                                    <div className="truncate text-xs font-semibold">
                                      {unit.name} ({unit.symbol})
                                    </div>
                                    <div className="truncate text-[11px] text-stone-400">
                                      {unit.dimensionLabel}
                                    </div>
                                  </div>
                                  <div className="shrink-0 font-mono text-[11px] tabular-nums text-amber-200">
                                    {formatSmartPrecision(unit.siValue, 4)} {unit.siBaseSymbol}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <RolodexUnitSelector
                          selectedUnit={inputs.secondaryUnit}
                          onSelectUnit={(unit) => onUpdate({ secondaryUnit: unit })}
                          customValue={inputs.secondaryCustomValue}
                          customSymbol={inputs.secondaryCustomSymbol}
                          onCustomValueChange={(val) =>
                            onUpdate({ secondaryCustomValue: val })
                          }
                          onCustomSymbolChange={(sym) =>
                            onUpdate({ secondaryCustomSymbol: sym })
                          }
                          labelPrefix="Secondary Comparison Variable"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            onUpdate({
                              linkSecondaryMultiplier: !inputs.linkSecondaryMultiplier,
                            })
                          }
                          className="flex min-h-[38px] w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-black/45 px-3 text-xs font-medium text-cyan-200 transition-colors hover:bg-cyan-500/15 focus-visible:outline-2 focus-visible:outline-cyan-400"
                        >
                          {inputs.linkSecondaryMultiplier ? (
                            <>
                              <Link2 className="h-3.5 w-3.5" />
                              <span>
                                Linked to 1 var Scalar (×
                                {inputs.multiplierInt.toString().padStart(6, '0')})
                              </span>
                            </>
                          ) : (
                            <>
                              <Unlink2 className="h-3.5 w-3.5" />
                              <span>Independent Secondary Scalar Active</span>
                            </>
                          )}
                        </button>

                        {!inputs.linkSecondaryMultiplier && (
                          <RolodexDrumMultiplier
                            compact
                            value={inputs.secondaryMultiplierInt}
                            onChange={(next) =>
                              onUpdate({ secondaryMultiplierInt: next })
                            }
                            label="Secondary Scalar Multiplier"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Level 3 Equivalence & Ratio Output */}
                  <div className="mt-4 space-y-2.5 border-t border-cyan-500/20 pt-3.5">
                    <div className="rounded-xl border border-cyan-500/30 bg-black/65 p-3">
                      <div className="text-[11px] text-stone-400">
                        {inputs.comparisonMode === 'notable'
                          ? `Notable Reference · ${inputs.notableUnit.name}`
                          : `Scaled ${inputs.secondaryUnit.name} (×${computed.effectiveSecondaryMultiplier
                              .toString()
                              .padStart(6, '0')})`}
                      </div>
                      <div className="mt-1 font-mono text-xl font-bold tabular-nums text-cyan-200">
                        {formatSmartPrecision(computed.secondaryFinalTotal, 6)}{' '}
                        <span className="text-xs font-normal text-cyan-300/80">
                          {computed.secondarySingleLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-stone-400">
                        {inputs.comparisonMode === 'notable'
                          ? inputs.notableUnit.summary
                          : inputs.secondaryUnit.summary}
                      </p>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-black/45 p-2.5 font-mono text-[11px] tabular-nums">
                      <div className="mb-1 font-sans text-xs font-medium text-stone-300">
                        {computed.comparisonCompatible
                          ? 'Direct Dimensional Equivalence'
                          : 'Cross-Dimension Scale Ratio'}
                      </div>
                      <div className="flex items-center justify-between gap-2 text-amber-200">
                        <span>1 var Total ÷ Ref:</span>
                        <span>
                          {formatSmartPrecision(
                            inputs.comparisonMode === 'notable'
                              ? computed.comparisonRatioPerFinal
                              : computed.primaryFinalTotal /
                                  Math.max(1e-50, computed.secondaryFinalTotal),
                            5
                          )}
                          ×
                        </span>
                      </div>
                      <div className="mt-0.5 flex items-center justify-between gap-2 text-stone-400">
                        <span>Ref ÷ 1 var Total:</span>
                        <span>
                          {formatSmartPrecision(
                            inputs.comparisonMode === 'notable'
                              ? computed.comparisonInverseRatio
                              : computed.secondaryFinalTotal /
                                  Math.max(1e-50, computed.primaryFinalTotal),
                            5
                          )}
                          ×
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Span of Zero Reserved Base-Transition Rail inside ThreeLevelBench */}
          <SpanOfZeroVisualizer
            spanOfZeroEnabled={inputs.spanOfZeroEnabled}
            measureType={inputs.measureType}
            precisionBasis={inputs.precisionBasis}
            computed={computed}
            onToggleSpanOfZero={(spanOfZeroEnabled) => onUpdate({ spanOfZeroEnabled })}
            onSelectMeasureType={(measureType) => onUpdate({ measureType })}
          />
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 3D SPAN OF ZERO & BASE-60 RESERVED EXPANSE VISUALIZER                */}
      {/* ==================================================================== */}
      <SpanOfZero3DVisual
        spanOfZeroEnabled={inputs.spanOfZeroEnabled}
        spaceDimensions={inputs.spaceDimensions}
        computed={computed}
        onToggleSpanOfZero={(spanOfZeroEnabled) => onUpdate({ spanOfZeroEnabled })}
        onChangeSpaceDimensions={(spaceDimensions) => onUpdate({ spaceDimensions })}
      />

      {/* ==================================================================== */}
      {/* SIDE-BY-SIDE VISUAL SCALING MECHANISM & 4-BASIS COMPARISON STRIP     */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Visual Proportional Scale Bars */}
        <div className="rounded-2xl border border-white/10 bg-[#111217] p-5 lg:col-span-5">
          <h3 className="text-base font-semibold text-amber-100">
            Visual Magnitude &amp; Scaling Comparison
          </h3>
          <p className="mt-1 text-xs text-stone-400">
            Logarithmic order-of-magnitude bar comparing your active 1 Gunit boundary, standard SI multiple, and Uni-Rythmics final total.
          </p>

          <div className="mt-4 space-y-3.5">
            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-stone-300">1 Gunit Bound Factor</span>
                <span className="font-mono tabular-nums text-amber-300">
                  {formatSmartPrecision(computed.gunitValue, 6)}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/60">
                <div
                  className="h-full rounded-full bg-amber-400 transition-all duration-200"
                  style={{ width: `${logBarPercent(computed.gunitValue)}%` }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-stone-300">
                  1 var Final Total (×{inputs.multiplierInt.toString().padStart(6, '0')})
                </span>
                <span className="font-mono tabular-nums text-amber-200">
                  {formatSmartPrecision(computed.primaryFinalTotal, 6)}{' '}
                  {computed.primarySingleLabel}
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/60">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-200"
                  style={{ width: `${logBarPercent(computed.primaryFinalTotal)}%` }}
                />
              </div>
            </div>

            {inputs.comparisonMode !== 'hidden' && (
              <div>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-stone-300">
                    var of comparison ({inputs.comparisonMode === 'notable' ? inputs.notableUnit.symbol : inputs.secondaryUnit.symbol})
                  </span>
                  <span className="font-mono tabular-nums text-cyan-300">
                    {formatSmartPrecision(computed.secondaryFinalTotal, 6)}{' '}
                    {computed.secondarySingleLabel}
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/60">
                  <div
                    className="h-full rounded-full bg-cyan-400 transition-all duration-200"
                    style={{ width: `${logBarPercent(computed.secondaryFinalTotal)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
            <span className="text-stone-400">
              Rounded (0.618) vs Exact (1/φ) Drift at ×{inputs.multiplierInt.toString().padStart(6, '0')}:
            </span>
            <span className="font-mono font-semibold tabular-nums text-cyan-300">
              {computed.exactVsRoundedDelta >= 0 ? '+' : ''}
              {formatSmartPrecision(computed.exactVsRoundedDelta, 5)} {computed.primarySingleLabel}
            </span>
          </div>
        </div>

        {/* Right: Simultaneous 4-Basis Side-by-Side Comparison Table */}
        <div className="rounded-2xl border border-white/10 bg-[#111217] p-5 lg:col-span-7">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h3 className="text-base font-semibold text-amber-100">
                Side-by-Side Basis Comparison (1/1 &amp; 1/10)
              </h3>
              <p className="mt-0.5 text-xs text-stone-400">
                Click any row to switch the active machine basis immediately.
              </p>
            </div>
            <span className="font-mono text-xs tabular-nums text-stone-400">
              Sector {inputs.dodecagonSector}/12 · 10{toSuperscript(`-${inputs.nthExponent}`)}
            </span>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-stone-400">
                  <th className="py-2 pr-3 font-medium">Measure Type</th>
                  <th className="px-3 py-2 font-medium">Full Unit (1/1)</th>
                  <th className="px-3 py-2 font-medium">One-Tenth (1/10)</th>
                  <th className="py-2 pl-3 text-right font-medium">
                    Scaled {inputs.primaryUnit.symbol} (×{inputs.multiplierInt})
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {computed.fourBasisRows.map((row) => {
                  const isActive =
                    row.measureType === inputs.measureType &&
                    row.precisionBasis === inputs.precisionBasis;
                  return (
                    <tr
                      key={row.id}
                      onClick={() =>
                        onUpdate({
                          measureType: row.measureType,
                          precisionBasis: row.precisionBasis,
                        })
                      }
                      className={`cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-amber-500/12 text-amber-100'
                          : 'text-stone-300 hover:bg-white/[0.03]'
                      }`}
                    >
                      <td className="py-2.5 pr-3">
                        <div className="flex items-center gap-1.5 font-medium">
                          {isActive && (
                            <ArrowRight className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                          )}
                          <span>{row.measureLabel}</span>
                        </div>
                        <div className="text-[11px] text-stone-500">{row.basisLabel}</div>
                      </td>
                      <td className="px-3 py-2.5 font-mono tabular-nums">
                        {formatSmartPrecision(row.fullUnit, 6)}
                      </td>
                      <td className="px-3 py-2.5 font-mono tabular-nums">
                        {formatSmartPrecision(row.tenthUnit, 6)}
                      </td>
                      <td className="py-2.5 pl-3 text-right font-mono font-semibold tabular-nums text-amber-200">
                        {formatSmartPrecision(row.scaledVarTotal, 6)} {computed.primarySingleLabel}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
