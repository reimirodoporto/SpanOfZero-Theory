import React, { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { fromSixDigits, toSixDigits } from '../utils/uniRythmicsMath';

interface RolodexDrumMultiplierProps {
  value: number;
  onChange: (next: number) => void;
  label?: string;
  compact?: boolean;
}

const DIGIT_PLACE_NAMES = [
  'Hundred Thousands',
  'Ten Thousands',
  'Thousands',
  'Hundreds',
  'Tens',
  'Ones',
];

export const RolodexDrumMultiplier: React.FC<RolodexDrumMultiplierProps> = ({
  value,
  onChange,
  label = 'Integer Scalar Multiplier',
  compact = false,
}) => {
  const [directInput, setDirectInput] = useState<string>('');
  const digits = toSixDigits(value);

  const stepDigit = (index: number, delta: 1 | -1) => {
    const placeValue = Math.pow(10, 5 - index);
    const nextRaw = value + delta * placeValue;
    const clamped = Math.min(999999, Math.max(1, nextRaw));
    onChange(clamped);
  };

  const handleDrumWheel = (index: number, e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    stepDigit(index, e.deltaY < 0 ? 1 : -1);
  };

  const handleDrumKeyDown = (index: number, e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      stepDigit(index, 1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      stepDigit(index, -1);
    } else if (/^[0-9]$/.test(e.key)) {
      e.preventDefault();
      const nextDigits = [...digits];
      nextDigits[index] = parseInt(e.key, 10);
      onChange(fromSixDigits(nextDigits));
    }
  };

  const commitDirectInput = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(directInput.replace(/[^0-9]/g, ''), 10);
    if (!Number.isNaN(parsed)) {
      onChange(Math.min(999999, Math.max(1, parsed)));
    }
    setDirectInput('');
  };

  return (
    <div className="rounded-xl border border-amber-500/25 bg-[#0C0B09]/90 p-3 shadow-inner">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-stone-300">{label}</span>
        <span className="font-mono text-xs tabular-nums text-cyan-300">
          ×{value.toString().padStart(6, '0')}
        </span>
      </div>

      {/* 6-Digit Watch Rolodex Drum Rack */}
      <div className="flex items-center justify-center gap-1 sm:gap-1.5">
        <span
          aria-hidden="true"
          className="pr-1 font-mono text-lg font-bold text-amber-400/90 select-none"
        >
          ×
        </span>
        {digits.map((digit, idx) => (
          <div
            key={idx}
            onWheel={(e) => handleDrumWheel(idx, e)}
            onKeyDown={(e) => handleDrumKeyDown(idx, e)}
            tabIndex={0}
            role="spinbutton"
            aria-label={`${DIGIT_PLACE_NAMES[idx]} digit`}
            aria-valuemin={0}
            aria-valuemax={9}
            aria-valuenow={digit}
            className="flex flex-col items-center rounded-md focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            <button
              type="button"
              onClick={() => stepDigit(idx, 1)}
              aria-label={`Increment ${DIGIT_PLACE_NAMES[idx]} digit`}
              className={`flex items-center justify-center rounded-t border border-b-0 border-amber-500/25 bg-[#191510] text-amber-300/80 transition-colors hover:bg-amber-500/20 hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                compact ? 'h-7 w-8' : 'h-8 w-9 sm:w-10'
              }`}
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>

            <div
              className={`rolodex-drum-face relative flex items-center justify-center border-x border-amber-500/30 font-mono font-bold tabular-nums filament-glow select-none ${
                compact ? 'h-10 w-8 text-lg' : 'h-12 w-9 text-xl sm:w-10 sm:text-2xl'
              }`}
            >
              {/* Mechanical center rib line */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/75 shadow-[0_1px_0_rgba(255,255,255,0.08)]"
              />
              <span className="relative z-10">{digit}</span>
            </div>

            <button
              type="button"
              onClick={() => stepDigit(idx, -1)}
              aria-label={`Decrement ${DIGIT_PLACE_NAMES[idx]} digit`}
              className={`flex items-center justify-center rounded-b border border-t-0 border-amber-500/25 bg-[#191510] text-amber-300/80 transition-colors hover:bg-amber-500/20 hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-cyan-400 ${
                compact ? 'h-7 w-8' : 'h-8 w-9 sm:w-10'
              }`}
            >
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Quick stepping & direct entry */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5 border-t border-white/10 pt-2.5">
        <div className="flex flex-wrap items-center gap-1">
          {[1, 10, 100, 1000].map((step) => (
            <button
              key={step}
              type="button"
              onClick={() => onChange(Math.min(999999, value + step))}
              className="min-h-[36px] rounded border border-amber-500/20 bg-[#17140F] px-2 font-mono text-[11px] font-medium whitespace-nowrap text-amber-200 transition-colors hover:border-amber-400/50 hover:bg-amber-500/15 focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              +{step}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onChange(1)}
            title="Reset scalar multiplier to 000001"
            aria-label="Reset scalar multiplier to 000001"
            className="flex min-h-[36px] items-center gap-1 rounded border border-slate-700 bg-slate-900/70 px-2 text-[11px] whitespace-nowrap text-slate-300 transition-colors hover:border-cyan-400/50 hover:text-cyan-200 focus-visible:outline-2 focus-visible:outline-cyan-400"
          >
            <RotateCcw className="h-3 w-3" />
            <span>000001</span>
          </button>
        </div>

        {!compact && (
          <form onSubmit={commitDirectInput} className="flex items-center gap-1">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={directInput}
              onChange={(e) => setDirectInput(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Set N"
              aria-label="Enter integer multiplier directly"
              className="h-9 w-20 rounded border border-amber-500/25 bg-[#080706] px-2 font-mono text-xs tabular-nums text-amber-100 placeholder:text-stone-500 focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              className="h-9 rounded border border-cyan-500/35 bg-cyan-500/10 px-2.5 text-xs font-medium whitespace-nowrap text-cyan-200 transition-colors hover:bg-cyan-500/20 focus-visible:outline-2 focus-visible:outline-cyan-400"
            >
              Apply
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
