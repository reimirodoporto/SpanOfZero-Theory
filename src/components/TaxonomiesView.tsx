import React, { useState } from 'react';
import { ArrowRightLeft, Layers } from 'lucide-react';
import {
  MEASUREMENT_TAXONOMIES,
  SCIENTIFIC_UNITS,
  type ScientificUnit,
} from '../data/metrologyCatalog';
import { formatSmartPrecision } from '../utils/uniRythmicsMath';

interface TaxonomiesViewProps {
  activePrimaryId: string;
  activeComparisonId: string;
  onLoadPrimary: (unit: ScientificUnit) => void;
  onLoadComparison: (unit: ScientificUnit) => void;
}

export const TaxonomiesView: React.FC<TaxonomiesViewProps> = ({
  activePrimaryId,
  activeComparisonId,
  onLoadPrimary,
  onLoadComparison,
}) => {
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string>('si_base');

  const activeFramework =
    MEASUREMENT_TAXONOMIES.find((f) => f.id === selectedFrameworkId) ??
    MEASUREMENT_TAXONOMIES[0];

  const loadUnitById = (unitId: string, target: 'primary' | 'comparison') => {
    const found = SCIENTIFIC_UNITS.find((u) => u.id === unitId);
    if (!found) return;
    if (target === 'primary') {
      onLoadPrimary(found);
    } else {
      onLoadComparison(found);
    }
  };

  return (
    <section className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-amber-100">
          Scientific Measurement Taxonomies
        </h1>
        <p className="mt-1 max-w-3xl text-sm text-stone-400">
          Explore the recognized classification systems of metrology—from Stevens&apos; four levels of measurement and the seven SI base dimensions to Planck quantum units—and load any quantity directly into the Uni-Rythmics workbench.
        </p>
      </div>

      {/* Framework Selector Tabs */}
      <div className="flex flex-wrap gap-2">
        {MEASUREMENT_TAXONOMIES.map((fw) => {
          const isSelected = fw.id === activeFramework.id;
          return (
            <button
              key={fw.id}
              type="button"
              onClick={() => setSelectedFrameworkId(fw.id)}
              className={`min-h-[42px] rounded-xl border px-4 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                isSelected
                  ? 'border-amber-400/60 bg-amber-500/15 text-amber-100'
                  : 'border-white/10 bg-[#111217] text-stone-300 hover:border-white/25 hover:text-white'
              }`}
            >
              <div className="text-xs font-semibold whitespace-nowrap">{fw.title}</div>
              <div className="text-[11px] text-stone-400">{fw.countLabel}</div>
            </button>
          );
        })}
      </div>

      {/* Selected Framework Breakdown */}
      <div className="rounded-2xl border border-white/10 bg-[#111217] p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/10 pb-3">
          <div>
            <h2 className="text-lg font-bold text-amber-100">{activeFramework.title}</h2>
            <p className="mt-1 text-sm text-stone-400">{activeFramework.overview}</p>
          </div>
          <span className="font-mono text-xs text-cyan-300">
            {activeFramework.countLabel}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {activeFramework.groups.map((grp) => (
            <div
              key={grp.name}
              className="flex flex-col justify-between rounded-xl border border-white/10 bg-black/35 p-4"
            >
              <div>
                <h3 className="text-sm font-semibold text-amber-200">{grp.name}</h3>
                <p className="mt-1 text-xs leading-relaxed text-stone-300">
                  {grp.detail}
                </p>
                <div className="mt-2.5 text-[11px] text-stone-400">
                  Examples: {grp.examples.join(' · ')}
                </div>
              </div>

              {grp.linkedUnitId && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-3">
                  <button
                    type="button"
                    onClick={() => loadUnitById(grp.linkedUnitId!, 'primary')}
                    className="min-h-[36px] rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-1 text-xs font-medium whitespace-nowrap text-amber-200 transition-colors hover:bg-amber-500/20 focus-visible:outline-2 focus-visible:outline-cyan-400"
                  >
                    Load into 1 var
                  </button>
                  <button
                    type="button"
                    onClick={() => loadUnitById(grp.linkedUnitId!, 'comparison')}
                    className="min-h-[36px] rounded-lg border border-cyan-500/35 bg-cyan-500/10 px-3 py-1 text-xs font-medium whitespace-nowrap text-cyan-200 transition-colors hover:bg-cyan-500/20 focus-visible:outline-2 focus-visible:outline-cyan-400"
                  >
                    Set as Comparison
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Complete Unit & Physical Constant Directory */}
      <div className="rounded-2xl border border-white/10 bg-[#111217] p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4 text-amber-400" />
          <h2 className="text-base font-semibold text-amber-100">
            Calibrated Scientific Constants &amp; Unit Registry
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {SCIENTIFIC_UNITS.filter((u) => u.id !== 'custom_unit').map((unit) => {
            const isPrimary = unit.id === activePrimaryId;
            const isComp = unit.id === activeComparisonId;

            return (
              <div
                key={unit.id}
                className={`flex flex-col justify-between rounded-xl border p-4 ${
                  isPrimary
                    ? 'border-amber-400/50 bg-amber-500/8'
                    : isComp
                    ? 'border-cyan-400/45 bg-cyan-500/8'
                    : 'border-white/10 bg-black/35'
                }`}
              >
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-semibold text-stone-100">
                      {unit.name} ({unit.symbol})
                    </h3>
                    <span className="font-mono text-xs tabular-nums text-amber-300">
                      {formatSmartPrecision(unit.siValue, 4)} {unit.siBaseSymbol}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-stone-400">
                    {unit.dimensionLabel} · {unit.stevensScale} · {unit.method}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-stone-300">
                    {unit.summary}
                  </p>
                </div>

                <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
                  <button
                    type="button"
                    onClick={() => onLoadPrimary(unit)}
                    className="min-h-[36px] flex-1 rounded-lg border border-amber-500/30 bg-[#17140F] px-2.5 py-1 text-xs font-medium whitespace-nowrap text-amber-200 transition-colors hover:border-amber-400/60 hover:bg-amber-500/15 focus-visible:outline-2 focus-visible:outline-cyan-400"
                  >
                    {isPrimary ? 'Active in 1 var' : 'Use as 1 var'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onLoadComparison(unit)}
                    className="flex min-h-[36px] items-center gap-1 rounded-lg border border-cyan-500/30 bg-[#0D1318] px-2.5 py-1 text-xs font-medium whitespace-nowrap text-cyan-200 transition-colors hover:border-cyan-400/60 hover:bg-cyan-500/15 focus-visible:outline-2 focus-visible:outline-cyan-400"
                  >
                    <ArrowRightLeft className="h-3 w-3" />
                    <span>{isComp ? 'Comparing' : 'Compare'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
