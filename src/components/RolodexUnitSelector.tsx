import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SCIENTIFIC_UNITS, type ScientificUnit } from '../data/metrologyCatalog';

interface RolodexUnitSelectorProps {
  selectedUnit: ScientificUnit;
  onSelectUnit: (unit: ScientificUnit) => void;
  customValue: number;
  customSymbol: string;
  onCustomValueChange: (val: number) => void;
  onCustomSymbolChange: (sym: string) => void;
  labelPrefix?: string;
}

const CATEGORY_LABELS: Record<ScientificUnit['category'], string> = {
  si_base: 'SI Base Dimensions',
  quantum_planck: 'Quantum & Planck Scales',
  kinematic: 'Kinematic & Submultiples',
  cosmic_geodesic: 'Cosmic & Geodesic Constants',
  custom: 'Custom Operator Variable',
};

export const RolodexUnitSelector: React.FC<RolodexUnitSelectorProps> = ({
  selectedUnit,
  onSelectUnit,
  customValue,
  customSymbol,
  onCustomValueChange,
  onCustomSymbolChange,
  labelPrefix = 'Variable Slot',
}) => {
  const currentIdx = SCIENTIFIC_UNITS.findIndex((u) => u.id === selectedUnit.id);

  const cycleUnit = (delta: -1 | 1) => {
    const nextIdx =
      (currentIdx + delta + SCIENTIFIC_UNITS.length) % SCIENTIFIC_UNITS.length;
    onSelectUnit(SCIENTIFIC_UNITS[nextIdx]);
  };

  const categories = Object.keys(CATEGORY_LABELS) as ScientificUnit['category'][];

  return (
    <div className="space-y-2.5">
      {/* Watch complication aperture with prev/next rolodex buttons */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => cycleUnit(-1)}
          aria-label={`Previous ${labelPrefix} option`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-500/25 bg-[#17140F] text-amber-300 transition-colors hover:border-amber-400/60 hover:bg-amber-500/15 focus-visible:outline-2 focus-visible:outline-cyan-400"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <div className="relative min-w-0 flex-1">
          <select
            aria-label={`Select ${labelPrefix}`}
            value={selectedUnit.id}
            onChange={(e) => {
              const found = SCIENTIFIC_UNITS.find((u) => u.id === e.target.value);
              if (found) onSelectUnit(found);
            }}
            className="h-10 w-full cursor-pointer appearance-none rounded-lg border border-amber-500/35 bg-[#12100C] px-3 pr-7 font-display text-sm font-semibold text-amber-100 focus:border-cyan-400 focus:outline-none"
          >
            {categories.map((cat) => (
              <optgroup
                key={cat}
                label={CATEGORY_LABELS[cat]}
                className="bg-[#12100C] text-stone-200"
              >
                {SCIENTIFIC_UNITS.filter((u) => u.category === cat).map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    1 {unit.name} ({unit.symbol})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-amber-400"
          >
            ▼
          </span>
        </div>

        <button
          type="button"
          onClick={() => cycleUnit(1)}
          aria-label={`Next ${labelPrefix} option`}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-500/25 bg-[#17140F] text-amber-300 transition-colors hover:border-amber-400/60 hover:bg-amber-500/15 focus-visible:outline-2 focus-visible:outline-cyan-400"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Custom operator variable inputs when custom_unit is selected */}
      {selectedUnit.id === 'custom_unit' && (
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-cyan-500/25 bg-black/40 p-2.5">
          <div>
            <label
              htmlFor={`${labelPrefix}-custom-val`}
              className="mb-1 block text-[11px] text-stone-400"
            >
              Base Magnitude
            </label>
            <input
              id={`${labelPrefix}-custom-val`}
              type="number"
              step="any"
              min="0.0000001"
              value={customValue}
              onChange={(e) => {
                const parsed = parseFloat(e.target.value);
                onCustomValueChange(Number.isFinite(parsed) && parsed > 0 ? parsed : 1);
              }}
              className="h-9 w-full rounded border border-amber-500/25 bg-[#090806] px-2 font-mono text-xs tabular-nums text-amber-100 focus:border-cyan-400 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor={`${labelPrefix}-custom-sym`}
              className="mb-1 block text-[11px] text-stone-400"
            >
              Unit Label
            </label>
            <input
              id={`${labelPrefix}-custom-sym`}
              type="text"
              maxLength={8}
              value={customSymbol}
              onChange={(e) => onCustomSymbolChange(e.target.value)}
              placeholder="u"
              className="h-9 w-full rounded border border-amber-500/25 bg-[#090806] px-2 font-mono text-xs text-amber-100 focus:border-cyan-400 focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};
