import React, { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import {
  computeBasisValues,
  formatSmartPrecision,
  toSuperscript,
  type UniRythmicsComputation,
  type UniRythmicsInputs,
} from '../utils/uniRythmicsMath';

interface ScaleMatrixViewProps {
  inputs: UniRythmicsInputs;
  computed: UniRythmicsComputation;
  onUpdate: (patch: Partial<UniRythmicsInputs>) => void;
  onNavigateWorkbench: () => void;
}

const DECADE_EXPONENTS = [0, 1, 2, 3, 4, 5, 6];
const MULTIPLIER_COLUMNS = [1, 10, 100, 1000, 10000];

export const ScaleMatrixView: React.FC<ScaleMatrixViewProps> = ({
  inputs,
  computed,
  onUpdate,
  onNavigateWorkbench,
}) => {
  const [selectedExp, setSelectedExp] = useState<number>(inputs.nthExponent);

  const activateBasis = (
    measureType: 'half' | 'whole',
    precisionBasis: 'rounded' | 'exact',
    nthExponent: number
  ) => {
    onUpdate({ measureType, precisionBasis, nthExponent });
    onNavigateWorkbench();
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-amber-100">
            Nth-Decimal &amp; Side-by-Side Scale Matrix
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-stone-400">
            Compare how Rounded (0.618) and Exact (1/φ) Golden Ratio measures scale across decimal shifts (1/10ⁿ) and integer rolodex multipliers for{' '}
            <span className="font-medium text-amber-200">{inputs.primaryUnit.name}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-stone-400">
          <span>Active Dodecagon Arc:</span>
          <span className="font-mono font-semibold tabular-nums text-cyan-300">
            {inputs.dodecagonSector}/12 ({computed.dodecagonDegrees}°)
          </span>
        </div>
      </div>

      {/* Interactive Decade Selector */}
      <div className="rounded-2xl border border-white/10 bg-[#111217] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-amber-100">
              Decimal Precision Ladder (1/1 to 10⁻⁶)
            </h2>
            <p className="mt-0.5 text-xs text-stone-400">
              Select a decimal shift to inspect how dividing by powers of 10 scales both Half Measure and Whole Measure bases.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {DECADE_EXPONENTS.map((exp) => (
              <button
                key={exp}
                type="button"
                onClick={() => setSelectedExp(exp)}
                className={`min-h-[38px] rounded-lg border px-3 font-mono text-xs font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                  selectedExp === exp
                    ? 'border-amber-400/60 bg-amber-500/20 text-amber-200'
                    : 'border-white/10 bg-black/40 text-stone-400 hover:border-white/25 hover:text-stone-200'
                }`}
              >
                {exp === 0 ? '1/1 (10⁰)' : exp === 1 ? '1/10 (10⁻¹)' : `10${toSuperscript(`-${exp}`)}`}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-stone-400">
                <th className="py-2.5 pr-4 font-medium">Measure Type</th>
                <th className="px-3 py-2.5 font-medium">Basis</th>
                <th className="px-3 py-2.5 font-medium">1/1 Full Unit</th>
                <th className="px-3 py-2.5 font-medium">1/10 Unit</th>
                <th className="px-3 py-2.5 font-medium">
                  At 10{toSuperscript(`-${selectedExp}`)} × {inputs.dodecagonSector}/12
                </th>
                <th className="px-3 py-2.5 font-medium">
                  {inputs.primaryUnit.symbol} × {inputs.multiplierInt.toString().padStart(6, '0')}
                </th>
                <th className="py-2.5 pl-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {computed.fourBasisRows.map((row) => {
                const shifted = computeBasisValues(
                  row.measureType,
                  row.precisionBasis,
                  inputs.dodecagonSector,
                  selectedExp
                );
                const scaledTotal =
                  shifted.gunitActive * computed.primarySingleSi * inputs.multiplierInt;

                return (
                  <tr key={row.id} className="text-stone-200 hover:bg-white/[0.02]">
                    <td className="py-3 pr-4 font-medium text-amber-100">
                      {row.measureLabel}
                    </td>
                    <td className="px-3 py-3 text-stone-400">{row.basisLabel}</td>
                    <td className="px-3 py-3 font-mono tabular-nums">
                      {formatSmartPrecision(row.fullUnit, 7)}
                    </td>
                    <td className="px-3 py-3 font-mono tabular-nums">
                      {formatSmartPrecision(row.tenthUnit, 7)}
                    </td>
                    <td className="px-3 py-3 font-mono font-semibold tabular-nums text-cyan-200">
                      {formatSmartPrecision(shifted.gunitActive, 7)}
                    </td>
                    <td className="px-3 py-3 font-mono font-semibold tabular-nums text-amber-300">
                      {formatSmartPrecision(scaledTotal, 7)} {computed.primarySingleLabel}
                    </td>
                    <td className="py-3 pl-3 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          activateBasis(row.measureType, row.precisionBasis, selectedExp)
                        }
                        className="inline-flex min-h-[36px] items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium whitespace-nowrap text-amber-200 transition-colors hover:bg-amber-500/20 focus-visible:outline-2 focus-visible:outline-cyan-400"
                      >
                        <span>Load</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Multi-Step Integer Multiplier Progression (x000001 through x010000) */}
      <div className="rounded-2xl border border-white/10 bg-[#111217] p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-amber-100">
              Integer Scalar Progression ({inputs.primaryUnit.name} vs{' '}
              {inputs.comparisonMode === 'secondary'
                ? inputs.secondaryUnit.name
                : inputs.notableUnit.name}
              )
            </h2>
            <p className="mt-0.5 text-xs text-stone-400">
              Shows exact linear scaling across decades of the rolodex integer scalar under your active{' '}
              {inputs.measureType === 'half' ? 'Half' : 'Whole'} /{' '}
              {inputs.precisionBasis === 'exact' ? 'Exact (1/φ)' : 'Rounded (0.618)'} calibration.
            </p>
          </div>
          <span className="font-mono text-xs tabular-nums text-amber-300">
            1 Gunit = {formatSmartPrecision(computed.gunitValue, 6)}
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-stone-400">
                <th className="py-2.5 pr-3 font-medium">Rolodex Scalar</th>
                <th className="px-3 py-2.5 font-medium">
                  Standard {inputs.primaryUnit.symbol} (Unbound)
                </th>
                <th className="px-3 py-2.5 font-medium">
                  Uni-Rythmics {inputs.primaryUnit.symbol}
                </th>
                <th className="px-3 py-2.5 font-medium">
                  Comparison ({inputs.comparisonMode === 'secondary' ? inputs.secondaryUnit.symbol : inputs.notableUnit.symbol})
                </th>
                <th className="py-2.5 pl-3 text-right font-medium">Apply Scalar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {Array.from(
                new Set([inputs.multiplierInt, ...MULTIPLIER_COLUMNS])
              )
                .sort((a, b) => a - b)
                .map((mult) => {
                  const isCurrent = mult === inputs.multiplierInt;
                  const unbound = computed.primarySingleSi * mult;
                  const scaled = computed.primaryHarmonicSingle * mult;
                  const compScaled =
                    inputs.comparisonMode === 'secondary'
                      ? computed.secondaryHarmonicSingle * mult
                      : computed.secondarySingleSi;

                  return (
                    <tr
                      key={mult}
                      className={
                        isCurrent ? 'bg-amber-500/10 text-amber-100' : 'text-stone-300'
                      }
                    >
                      <td className="py-2.5 pr-3 font-mono font-semibold tabular-nums text-cyan-300">
                        ×{mult.toString().padStart(6, '0')}
                      </td>
                      <td className="px-3 py-2.5 font-mono tabular-nums">
                        {formatSmartPrecision(unbound, 6)} {computed.primarySingleLabel}
                      </td>
                      <td className="px-3 py-2.5 font-mono font-semibold tabular-nums text-amber-200">
                        {formatSmartPrecision(scaled, 6)} {computed.primarySingleLabel}
                      </td>
                      <td className="px-3 py-2.5 font-mono tabular-nums text-stone-300">
                        {formatSmartPrecision(compScaled, 6)} {computed.secondarySingleLabel}
                      </td>
                      <td className="py-2.5 pl-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            onUpdate({ multiplierInt: mult });
                            onNavigateWorkbench();
                          }}
                          className="min-h-[34px] rounded border border-white/15 bg-black/40 px-2.5 py-1 text-xs whitespace-nowrap text-stone-200 transition-colors hover:border-amber-400/50 hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-cyan-400"
                        >
                          {isCurrent ? 'Active' : 'Dial'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
