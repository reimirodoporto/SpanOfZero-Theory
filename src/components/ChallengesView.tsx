import React, { useState } from 'react';
import { CheckCircle2, Circle, Compass, Sliders } from 'lucide-react';
import { CALIBRATION_CHALLENGES, type CalibrationChallenge } from '../data/challenges';
import { SCIENTIFIC_UNITS } from '../data/metrologyCatalog';
import {
  formatSmartPrecision,
  type UniRythmicsComputation,
  type UniRythmicsInputs,
} from '../utils/uniRythmicsMath';

interface ChallengesViewProps {
  inputs: UniRythmicsInputs;
  computed: UniRythmicsComputation;
  onUpdate: (patch: Partial<UniRythmicsInputs>) => void;
  onNavigateWorkbench: () => void;
}

const STORAGE_KEY = 'uni_rythmics_completed_challenges_v1';

export const ChallengesView: React.FC<ChallengesViewProps> = ({
  inputs,
  computed,
  onUpdate,
  onNavigateWorkbench,
}) => {
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [selectedId, setSelectedId] = useState<string>(CALIBRATION_CHALLENGES[0].id);

  const activeChallenge =
    CALIBRATION_CHALLENGES.find((c) => c.id === selectedId) ??
    CALIBRATION_CHALLENGES[0];

  const evaluation = activeChallenge.check({
    measureType: inputs.measureType,
    precisionBasis: inputs.precisionBasis,
    dodecagonSector: inputs.dodecagonSector,
    nthExponent: inputs.nthExponent,
    primaryUnitId: inputs.primaryUnit.id,
    multiplierInt: inputs.multiplierInt,
    finalTotal: computed.primaryFinalTotal,
    gunitValue: computed.gunitValue,
    spanOfZeroEnabled: inputs.spanOfZeroEnabled,
    fastFoldLevel: inputs.fastFoldLevel,
  });

  const recordCompletion = (challenge: CalibrationChallenge) => {
    if (!evaluation.passed) return;
    if (!completedIds.includes(challenge.id)) {
      const next = [...completedIds, challenge.id];
      setCompletedIds(next);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage write errors
      }
    }
  };

  const applyHintToWorkbench = (challenge: CalibrationChallenge) => {
    const unit =
      SCIENTIFIC_UNITS.find((u) => u.id === challenge.hintSetup.primaryUnitId) ??
      inputs.primaryUnit;
    onUpdate({
      measureType: challenge.hintSetup.measureType,
      precisionBasis: challenge.hintSetup.precisionBasis,
      dodecagonSector: challenge.hintSetup.dodecagonSector,
      nthExponent: challenge.hintSetup.nthExponent,
      primaryUnit: unit,
      multiplierInt: challenge.hintSetup.multiplierInt,
      ...(challenge.hintSetup.spanOfZeroEnabled !== undefined
        ? { spanOfZeroEnabled: challenge.hintSetup.spanOfZeroEnabled }
        : {}),
      ...(challenge.hintSetup.fastFoldLevel !== undefined
        ? { fastFoldLevel: challenge.hintSetup.fastFoldLevel }
        : {}),
    });
    onNavigateWorkbench();
  };

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-amber-100">
            Calibration Challenges
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-stone-400">
            Learn how Half/Whole bases, dodecagonal sectors, nth-decimal shifts, and integer rolodex multipliers interact by calibrating the live Workbench to match each target state.
          </p>
        </div>

        <div className="font-mono text-xs tabular-nums text-cyan-300">
          Solved: {completedIds.length} / {CALIBRATION_CHALLENGES.length}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Challenge Selector List */}
        <div className="space-y-2.5 lg:col-span-5">
          {CALIBRATION_CHALLENGES.map((ch) => {
            const isDone = completedIds.includes(ch.id);
            const isSelected = ch.id === activeChallenge.id;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => setSelectedId(ch.id)}
                className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                  isSelected
                    ? 'border-amber-400/60 bg-amber-500/12 text-amber-100'
                    : 'border-white/10 bg-[#111217] text-stone-300 hover:border-white/25 hover:text-white'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {isDone ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <Circle className="h-5 w-5 text-stone-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs text-amber-300">
                      {ch.number}. {ch.difficulty}
                    </span>
                    {isDone && (
                      <span className="text-[11px] font-medium text-emerald-400">
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-sm font-semibold">{ch.title}</div>
                  <div className="mt-1 truncate font-mono text-[11px] text-stone-400">
                    {ch.targetDescription}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Active Challenge Inspector & Live Verification */}
        <div className="flex flex-col justify-between rounded-2xl border border-amber-500/25 bg-[#111217] p-6 lg:col-span-7">
          <div className="space-y-4">
            <div className="border-b border-white/10 pb-3">
              <div className="text-xs font-medium text-cyan-300">
                Challenge {activeChallenge.number} · {activeChallenge.difficulty}
              </div>
              <h2 className="mt-1 text-xl font-bold text-amber-100">
                {activeChallenge.title}
              </h2>
            </div>

            <p className="text-sm leading-relaxed text-stone-200">
              {activeChallenge.objective}
            </p>

            <div className="rounded-xl border border-white/10 bg-black/45 p-4">
              <div className="text-xs font-medium text-stone-400">
                Live Machine Verification Checklist
              </div>
              <div className="mt-3 space-y-2">
                {evaluation.checks.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      {item.ok ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-stone-500" />
                      )}
                      <span className={item.ok ? 'text-stone-100' : 'text-stone-400'}>
                        {item.label}
                      </span>
                    </div>
                    <span
                      className={`font-mono text-[11px] font-medium ${
                        item.ok ? 'text-emerald-400' : 'text-stone-500'
                      }`}
                    >
                      {item.ok ? 'Matched' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Current Workbench Telemetry Summary */}
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-black/35 p-3.5 text-xs sm:grid-cols-3">
              <div>
                <div className="text-stone-400">Current 1 Gunit</div>
                <div className="mt-0.5 font-mono font-semibold tabular-nums text-amber-300">
                  {formatSmartPrecision(computed.gunitValue, 6)}
                </div>
              </div>
              <div>
                <div className="text-stone-400">1 var × Scalar</div>
                <div className="mt-0.5 font-mono font-semibold tabular-nums text-stone-100">
                  {inputs.primaryUnit.symbol} × {inputs.multiplierInt.toString().padStart(6, '0')}
                </div>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <div className="text-stone-400">Final Total</div>
                <div className="mt-0.5 font-mono font-semibold tabular-nums text-cyan-200">
                  {formatSmartPrecision(computed.primaryFinalTotal, 6)} {computed.primarySingleLabel}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3.5 text-xs leading-relaxed text-stone-300">
              <span className="font-semibold text-amber-200">Why it works: </span>
              {activeChallenge.explanation}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={onNavigateWorkbench}
                className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-white/15 bg-black/50 px-3.5 py-2 text-xs font-medium whitespace-nowrap text-stone-200 transition-colors hover:border-white/30 hover:text-white focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Adjust in Workbench</span>
              </button>

              <button
                type="button"
                onClick={() => applyHintToWorkbench(activeChallenge)}
                className="flex min-h-[40px] items-center gap-1.5 rounded-lg border border-cyan-500/35 bg-cyan-500/10 px-3.5 py-2 text-xs font-medium whitespace-nowrap text-cyan-200 transition-colors hover:bg-cyan-500/20 focus-visible:outline-2 focus-visible:outline-cyan-400"
              >
                <Compass className="h-3.5 w-3.5" />
                <span>Load Target Calibration</span>
              </button>
            </div>

            <button
              type="button"
              disabled={!evaluation.passed}
              onClick={() => recordCompletion(activeChallenge)}
              className={`min-h-[40px] rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                evaluation.passed
                  ? 'bg-amber-500 text-stone-950 hover:bg-amber-400'
                  : 'cursor-not-allowed border border-white/10 bg-white/5 text-stone-500'
              }`}
            >
              {completedIds.includes(activeChallenge.id)
                ? 'Challenge Verified'
                : evaluation.passed
                ? 'Verify Completion'
                : 'Match All Criteria First'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
