import { useMemo, useState } from 'react';
import { SCIENTIFIC_UNITS, type ScientificUnit } from './data/metrologyCatalog';
import {
  computeUniRythmics,
  type UniRythmicsInputs,
} from './utils/uniRythmicsMath';
import { ThreeLevelBench } from './components/ThreeLevelBench';
import { ScaleMatrixView } from './components/ScaleMatrixView';
import { TaxonomiesView } from './components/TaxonomiesView';
import { ChallengesView } from './components/ChallengesView';
import { FastRecallView } from './components/FastRecallView';

type ActiveTab = 'workbench' | 'fast' | 'matrix' | 'taxonomies' | 'challenges';

const DEFAULT_PRIMARY =
  SCIENTIFIC_UNITS.find((u) => u.id === 'meter') ?? SCIENTIFIC_UNITS[0];
const DEFAULT_NOTABLE =
  SCIENTIFIC_UNITS.find((u) => u.id === 'light_nanosecond') ??
  SCIENTIFIC_UNITS[1];
const DEFAULT_SECONDARY =
  SCIENTIFIC_UNITS.find((u) => u.id === 'planck_time') ?? SCIENTIFIC_UNITS[1];

const INITIAL_INPUTS: UniRythmicsInputs = {
  measureType: 'half',
  precisionBasis: 'exact',
  dodecagonSector: 12,
  nthExponent: 0,
  spanOfZeroEnabled: true,
  spaceDimensions: '3d',
  fastFoldLevel: 0,
  primaryUnit: DEFAULT_PRIMARY,
  primaryCustomValue: 1,
  primaryCustomSymbol: 'u',
  multiplierInt: 1,
  comparisonMode: 'notable',
  notableUnit: DEFAULT_NOTABLE,
  secondaryUnit: DEFAULT_SECONDARY,
  secondaryCustomValue: 1,
  secondaryCustomSymbol: 'u₂',
  secondaryMultiplierInt: 1,
  linkSecondaryMultiplier: true,
};

const NAV_ITEMS: { id: ActiveTab; label: string }[] = [
  { id: 'workbench', label: 'Workbench' },
  { id: 'fast', label: 'F.A.S.T. Recall' },
  { id: 'matrix', label: 'Scale Matrix' },
  { id: 'taxonomies', label: 'Taxonomies' },
  { id: 'challenges', label: 'Challenges' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('workbench');
  const [inputs, setInputs] = useState<UniRythmicsInputs>(INITIAL_INPUTS);

  const computed = useMemo(() => computeUniRythmics(inputs), [inputs]);

  const handleUpdate = (patch: Partial<UniRythmicsInputs>) => {
    setInputs((prev) => ({ ...prev, ...patch }));
  };

  const handleResetCalibration = () => {
    setInputs(INITIAL_INPUTS);
  };

  const handleLoadPrimaryFromTaxonomy = (unit: ScientificUnit) => {
    setInputs((prev) => ({ ...prev, primaryUnit: unit }));
    setActiveTab('workbench');
  };

  const handleLoadComparisonFromTaxonomy = (unit: ScientificUnit) => {
    setInputs((prev) => ({
      ...prev,
      comparisonMode: 'notable',
      notableUnit: unit,
      secondaryUnit: unit,
    }));
    setActiveTab('workbench');
  };

  return (
    <div className="min-h-screen bg-[#090A0E] text-[#EDE6D8] flex flex-col">
      {/* Three-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 border-b border-amber-500/20 bg-[#090A0E]/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-8 px-4 py-3 sm:px-6 lg:px-8">
          {/* Zone 1: Single-line Brand Title */}
          <a
            href="#workbench"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('workbench');
            }}
            className="font-display text-lg font-bold tracking-tight text-amber-200 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            Uni-Rythmics
          </a>

          {/* Zone 2: 4 single-line Navigation Links */}
          <nav
            aria-label="Primary sections"
            className="hidden md:flex items-center gap-6 text-sm font-medium"
          >
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`relative py-1 whitespace-nowrap shrink-0 transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                    isActive
                      ? 'text-amber-300'
                      : 'text-stone-400 hover:text-stone-100'
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-0 -bottom-[13px] h-[2px] bg-cyan-400 shadow-[0_0_8px_rgba(56,189,248,0.65)]"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={handleResetCalibration}
              className="min-h-[38px] rounded-lg border border-amber-500/40 bg-[#17130D] px-3.5 py-1.5 text-xs font-semibold text-amber-200 whitespace-nowrap shrink-0 transition-colors hover:border-amber-400 hover:bg-amber-500/15 focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              Reset Calibration
            </button>
          </div>
        </div>

        {/* Mobile compact single-line view bar */}
        <div className="flex items-center gap-1 overflow-x-auto border-t border-white/5 px-4 py-1.5 md:hidden">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`min-h-[34px] rounded-md px-3 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                  isActive
                    ? 'bg-amber-500/20 text-amber-200'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {activeTab === 'workbench' && (
          <ThreeLevelBench
            inputs={inputs}
            computed={computed}
            onUpdate={handleUpdate}
          />
        )}

        {activeTab === 'fast' && (
          <FastRecallView
            inputs={inputs}
            computed={computed}
            onUpdate={handleUpdate}
            onNavigateWorkbench={() => setActiveTab('workbench')}
          />
        )}

        {activeTab === 'matrix' && (
          <ScaleMatrixView
            inputs={inputs}
            computed={computed}
            onUpdate={handleUpdate}
            onNavigateWorkbench={() => setActiveTab('workbench')}
          />
        )}

        {activeTab === 'taxonomies' && (
          <TaxonomiesView
            activePrimaryId={inputs.primaryUnit.id}
            activeComparisonId={
              inputs.comparisonMode === 'notable'
                ? inputs.notableUnit.id
                : inputs.secondaryUnit.id
            }
            onLoadPrimary={handleLoadPrimaryFromTaxonomy}
            onLoadComparison={handleLoadComparisonFromTaxonomy}
          />
        )}

        {activeTab === 'challenges' && (
          <ChallengesView
            inputs={inputs}
            computed={computed}
            onUpdate={handleUpdate}
            onNavigateWorkbench={() => setActiveTab('workbench')}
          />
        )}
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-white/10 bg-[#07080B]">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-4 text-xs text-stone-500 sm:px-6 lg:px-8">
          <span>Uni-Rythmics Horological Metrology Engine</span>
          <span className="font-mono tabular-nums">
            φ⁻¹ = (√5 − 1) / 2 ≈ 0.618033989 · CODATA 2022 Constants
          </span>
        </div>
      </footer>
    </div>
  );
}

