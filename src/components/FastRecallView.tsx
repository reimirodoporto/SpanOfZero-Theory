import React, { useMemo, useState } from 'react';
import {
  BookmarkPlus,
  Music,
  Play,
  Radio,
  Trash2,
  Volume2,
} from 'lucide-react';
import { SCIENTIFIC_UNITS } from '../data/metrologyCatalog';
import {
  CHORD_PRESETS,
  CHROMATIC_DODECAGON_NODES,
  FAST_MEMORY_STORAGE_KEY,
  buildSeededMemorySlots,
  getNoteFrequencyHz,
  playChordSignature,
  playVacuumTubeTone,
  resolveChordConvergence,
  type FastMemorySlot,
  type TuningModel,
  type TuningReferenceHz,
} from '../utils/fastAudioEngine';
import {
  formatSmartPrecision,
  type UniRythmicsComputation,
  type UniRythmicsInputs,
} from '../utils/uniRythmicsMath';

interface FastRecallViewProps {
  inputs: UniRythmicsInputs;
  computed: UniRythmicsComputation;
  onUpdate: (patch: Partial<UniRythmicsInputs>) => void;
  onNavigateWorkbench: () => void;
}

export const FastRecallView: React.FC<FastRecallViewProps> = ({
  inputs,
  computed,
  onUpdate,
  onNavigateWorkbench,
}) => {
  const [selectedChordId, setSelectedChordId] = useState<string>('g_major');
  const [octave, setOctave] = useState<number>(4);
  const [tuningRefHz, setTuningRefHz] = useState<TuningReferenceHz>(440);
  const [tuningModel, setTuningModel] = useState<TuningModel>('12tet');
  const [memoryLabel, setMemoryLabel] = useState<string>('');
  const [lastRecalledId, setLastRecalledId] = useState<string | null>(null);

  const [memorySlots, setMemorySlots] = useState<FastMemorySlot[]>(() => {
    try {
      const raw = localStorage.getItem(FAST_MEMORY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore storage read failure
    }
    return buildSeededMemorySlots();
  });

  const activeChord =
    CHORD_PRESETS.find((c) => c.id === selectedChordId) ?? CHORD_PRESETS[0];

  const resolvedNodes = useMemo(
    () => resolveChordConvergence(activeChord, octave, tuningRefHz, tuningModel),
    [activeChord, octave, tuningRefHz, tuningModel]
  );

  const persistSlots = (next: FastMemorySlot[]) => {
    setMemorySlots(next);
    try {
      localStorage.setItem(FAST_MEMORY_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore storage quota errors
    }
  };

  const handleNodeClick = (sector: number, chromaticIndex: number) => {
    const hz = getNoteFrequencyHz(chromaticIndex, octave, tuningRefHz);
    playVacuumTubeTone(hz, 0.9, 0, 0.16);
    onUpdate({ dodecagonSector: sector });
  };

  const handlePlayChord = (arpeggiate: boolean) => {
    playChordSignature(
      resolvedNodes.map((n) => n.activeHz),
      arpeggiate
    );
  };

  const handleSyncRootToWorkbench = () => {
    const rootFreq = resolvedNodes[0]?.activeHz ?? 391.995436;
    const customUnit =
      SCIENTIFIC_UNITS.find((u) => u.id === 'custom_unit') ?? inputs.primaryUnit;
    onUpdate({
      dodecagonSector: activeChord.rootSector,
      primaryUnit: customUnit,
      primaryCustomValue: Number(rootFreq.toFixed(4)),
      primaryCustomSymbol: 'Hz',
    });
    playChordSignature(
      resolvedNodes.map((n) => n.activeHz),
      true
    );
    onNavigateWorkbench();
  };

  const handleStoreMemory = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed =
      memoryLabel.trim() ||
      `${activeChord.name.split(' (')[0]} · Node ${inputs.dodecagonSector}/12 · ×${inputs.multiplierInt
        .toString()
        .padStart(6, '0')}`;

    const slot: FastMemorySlot = {
      id: `fast_${Date.now()}`,
      label: trimmed,
      createdAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      chordId: activeChord.id,
      tuningRefHz,
      tuningModel,
      octave,
      signatureHz: resolvedNodes.map((n) => Number(n.activeHz.toFixed(2))),
      snapshot: {
        measureType: inputs.measureType,
        precisionBasis: inputs.precisionBasis,
        dodecagonSector: inputs.dodecagonSector,
        nthExponent: inputs.nthExponent,
        spanOfZeroEnabled: inputs.spanOfZeroEnabled,
        spaceDimensions: inputs.spaceDimensions,
        fastFoldLevel: inputs.fastFoldLevel,
        primaryUnitId: inputs.primaryUnit.id,
        multiplierInt: inputs.multiplierInt,
      },
    };

    playChordSignature(slot.signatureHz, true);
    persistSlots([slot, ...memorySlots]);
    setMemoryLabel('');
    setLastRecalledId(slot.id);
  };

  const handleRecallMemory = (slot: FastMemorySlot) => {
    playChordSignature(slot.signatureHz, true);
    setSelectedChordId(slot.chordId);
    setTuningRefHz(slot.tuningRefHz);
    setTuningModel(slot.tuningModel);
    setOctave(slot.octave);
    setLastRecalledId(slot.id);

    const matchedUnit =
      SCIENTIFIC_UNITS.find((u) => u.id === slot.snapshot.primaryUnitId) ??
      inputs.primaryUnit;

    onUpdate({
      measureType: slot.snapshot.measureType,
      precisionBasis: slot.snapshot.precisionBasis,
      dodecagonSector: slot.snapshot.dodecagonSector,
      nthExponent: slot.snapshot.nthExponent,
      spanOfZeroEnabled: slot.snapshot.spanOfZeroEnabled,
      spaceDimensions: slot.snapshot.spaceDimensions,
      fastFoldLevel: slot.snapshot.fastFoldLevel,
      primaryUnit: matchedUnit,
      multiplierInt: slot.snapshot.multiplierInt,
    });
  };

  const handleDeleteMemory = (id: string) => {
    persistSlots(memorySlots.filter((s) => s.id !== id));
  };

  // Dodecagon geometry helpers for SVG chord polygon
  const cx = 145;
  const cy = 145;
  const r = 104;

  const nodePositions = CHROMATIC_DODECAGON_NODES.map((node) => {
    const rad = ((node.degree - 90) * Math.PI) / 180;
    return {
      ...node,
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
      lx: cx + (r + 22) * Math.cos(rad),
      ly: cy + (r + 22) * Math.sin(rad),
    };
  });

  const chordPolygonPoints = resolvedNodes
    .map((rn) => {
      const pos = nodePositions.find((p) => p.sector === rn.sector);
      return pos ? `${pos.x.toFixed(1)},${pos.y.toFixed(1)}` : '';
    })
    .filter(Boolean)
    .join(' ');

  const rootResolved = resolvedNodes[0];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-amber-100">
            F.A.S.T. Recall &amp; Harmonic Convergence
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-stone-400">
            Frequency Audible Tuned Storage maps 12 chromatic pitches onto the 360° Uni-Rythmics dodecagon. Audition how chords like G Major converge on Golden Ratio intervals and store machine states as audible frequency signatures.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSyncRootToWorkbench}
          className="flex min-h-[40px] items-center gap-2 rounded-lg border border-amber-400/50 bg-amber-500/15 px-3.5 py-2 text-xs font-semibold whitespace-nowrap text-amber-200 transition-colors hover:bg-amber-500/25 focus-visible:outline-2 focus-visible:outline-cyan-400"
        >
          <Radio className="h-3.5 w-3.5" />
          <span>Sync {rootResolved?.noteName} ({rootResolved?.activeHz.toFixed(1)} Hz) to 1 var</span>
        </button>
      </div>

      {/* Main Harmonic Dodecagon + Convergence Table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left: Edison-Glass Chromatic Dodecagon Convergence Wheel */}
        <div className="brass-chassis rounded-[24px] p-3 lg:col-span-5">
          <div className="edison-glass-dome relative flex h-full flex-col justify-between rounded-[18px] border border-white/10 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div>
                <h2 className="text-base font-bold text-amber-100">
                  12-Node Harmonic Dodecagon
                </h2>
                <p className="text-xs text-stone-400">
                  Click any node to play its frequency and lock the sector
                </p>
              </div>
              <span className="font-mono text-xs tabular-nums text-cyan-300">
                Active Sector {inputs.dodecagonSector}/12
              </span>
            </div>

            {/* Interactive SVG Wheel */}
            <div className="my-4 flex justify-center">
              <svg
                viewBox="0 0 290 290"
                className="h-[275px] w-[275px] select-none sm:h-[290px] sm:w-[290px]"
                role="group"
                aria-label="Harmonic chromatic dodecagon chord convergence dial"
              >
                {/* Outer EL-wire ring */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={r + 10}
                  fill="none"
                  stroke="rgba(56, 189, 248, 0.22)"
                  strokeWidth="1"
                />
                <polygon
                  points={nodePositions
                    .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
                    .join(' ')}
                  fill="none"
                  stroke="rgba(197, 160, 89, 0.35)"
                  strokeWidth="1.2"
                />

                {/* Radial spokes */}
                {nodePositions.map((p) => (
                  <line
                    key={`spoke-${p.sector}`}
                    x1={cx}
                    y1={cy}
                    x2={p.x}
                    y2={p.y}
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="1"
                  />
                ))}

                {/* Converging Chord Polygon */}
                <polygon
                  points={chordPolygonPoints}
                  fill="rgba(56, 189, 248, 0.14)"
                  stroke="#38BDF8"
                  strokeWidth="2.2"
                  strokeLinejoin="round"
                />

                {/* Center Hub */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="42"
                  fill="#0B0B0E"
                  stroke="rgba(245, 158, 11, 0.45)"
                  strokeWidth="1.5"
                />
                <text
                  x={cx}
                  y={cy - 6}
                  textAnchor="middle"
                  className="fill-amber-200 font-display text-[13px] font-bold"
                >
                  {activeChord.name.split(' (')[0]}
                </text>
                <text
                  x={cx}
                  y={cy + 11}
                  textAnchor="middle"
                  className="fill-cyan-300 font-mono text-[10px]"
                >
                  Node {activeChord.rootSector}/12 · {activeChord.rootSector * 30}°
                </text>

                {/* 12 Clickable Note Vertices */}
                {nodePositions.map((p) => {
                  const chordMatch = resolvedNodes.find((rn) => rn.sector === p.sector);
                  const isRoot = p.sector === activeChord.rootSector;
                  const isSelectedSector = p.sector === inputs.dodecagonSector;

                  return (
                    <g
                      key={p.sector}
                      role="button"
                      tabIndex={0}
                      aria-label={`Play ${p.noteName} at dodecagon node ${p.sector} (${p.degree} degrees)`}
                      onClick={() => handleNodeClick(p.sector, p.chromaticIndex)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleNodeClick(p.sector, p.chromaticIndex);
                        }
                      }}
                      className="cursor-pointer focus:outline-none"
                    >
                      <circle
                        cx={p.x}
                        cy={p.y}
                        r={isRoot ? 14 : chordMatch ? 12 : 10}
                        fill={
                          isRoot
                            ? '#F59E0B'
                            : chordMatch
                            ? '#0EA5E9'
                            : isSelectedSector
                            ? '#292114'
                            : '#14151B'
                        }
                        stroke={
                          isRoot
                            ? '#FEF3C7'
                            : chordMatch
                            ? '#BAE6FD'
                            : isSelectedSector
                            ? '#F59E0B'
                            : '#475569'
                        }
                        strokeWidth={isRoot || chordMatch ? 2 : 1.2}
                      />
                      <text
                        x={p.x}
                        y={p.y + 3.5}
                        textAnchor="middle"
                        className={`pointer-events-none font-mono text-[10px] font-bold ${
                          isRoot || chordMatch ? 'fill-[#090A0E]' : 'fill-stone-300'
                        }`}
                      >
                        {p.noteName}
                      </text>
                      <text
                        x={p.lx}
                        y={p.ly + 3}
                        textAnchor="middle"
                        className="pointer-events-none font-mono text-[9px] fill-stone-500"
                      >
                        {p.sector}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Playback & Tuning Controls */}
            <div className="space-y-3 border-t border-white/10 pt-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handlePlayChord(false)}
                  className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold whitespace-nowrap text-stone-950 transition-colors hover:bg-amber-400 focus-visible:outline-2 focus-visible:outline-cyan-400"
                >
                  <Volume2 className="h-4 w-4" />
                  <span>Play Chord</span>
                </button>
                <button
                  type="button"
                  onClick={() => handlePlayChord(true)}
                  className="flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-cyan-400/50 bg-cyan-500/15 px-3 py-2 text-xs font-semibold whitespace-nowrap text-cyan-200 transition-colors hover:bg-cyan-500/25 focus-visible:outline-2 focus-visible:outline-cyan-400"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Arpeggiate F.A.S.T.</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Chord Selector, Tuning Calibration & Convergence Table */}
        <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-[#111217] p-5 lg:col-span-7">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label
                  htmlFor="chord-preset-select"
                  className="mb-1 block text-xs font-medium text-stone-400"
                >
                  Harmonic Chord / Convergence Structure
                </label>
                <select
                  id="chord-preset-select"
                  value={selectedChordId}
                  onChange={(e) => setSelectedChordId(e.target.value)}
                  className="h-10 w-full rounded-lg border border-amber-500/35 bg-[#0A0B0E] px-3 text-sm font-medium text-amber-100 focus:border-cyan-400 focus:outline-none"
                >
                  {CHORD_PRESETS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="mb-1 block text-xs font-medium text-stone-400">
                  Octave Register
                </span>
                <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/10 bg-black/50 p-1">
                  {[3, 4, 5].map((oct) => (
                    <button
                      key={oct}
                      type="button"
                      onClick={() => setOctave(oct)}
                      className={`min-h-[32px] rounded font-mono text-xs font-medium transition-colors ${
                        octave === oct
                          ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/50'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      Oct {oct}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <span className="mb-1 block text-xs font-medium text-stone-400">
                  Reference Pitch Calibration
                </span>
                <div className="grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-black/50 p-1">
                  {([440, 432] as const).map((hz) => (
                    <button
                      key={hz}
                      type="button"
                      onClick={() => setTuningRefHz(hz)}
                      className={`min-h-[34px] rounded font-mono text-xs font-medium whitespace-nowrap transition-colors ${
                        tuningRefHz === hz
                          ? 'bg-cyan-500/20 text-cyan-200 ring-1 ring-cyan-400/50'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      A₄ = {hz} Hz
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-1 block text-xs font-medium text-stone-400">
                  Scale Tuning Model
                </span>
                <div className="grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-black/50 p-1">
                  <button
                    type="button"
                    onClick={() => setTuningModel('12tet')}
                    className={`min-h-[34px] rounded text-xs font-medium whitespace-nowrap transition-colors ${
                      tuningModel === '12tet'
                        ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/50'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    12-TET Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => setTuningModel('phi_convergent')}
                    className={`min-h-[34px] rounded text-xs font-medium whitespace-nowrap transition-colors ${
                      tuningModel === 'phi_convergent'
                        ? 'bg-amber-500/20 text-amber-200 ring-1 ring-amber-400/50'
                        : 'text-stone-400 hover:text-stone-200'
                    }`}
                  >
                    Golden φ-Tuned
                  </button>
                </div>
              </div>
            </div>

            <p className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs leading-relaxed text-stone-300">
              {activeChord.description}
            </p>

            {/* Convergence Breakdown Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-white/10 text-stone-400">
                    <th className="py-2 pr-3 font-medium">Note · Node</th>
                    <th className="px-2 py-2 font-medium">Interval</th>
                    <th className="px-2 py-2 font-medium">Active Freq</th>
                    <th className="px-2 py-2 font-medium">Ratio / Root</th>
                    <th className="py-2 pl-2 text-right font-medium">
                      Uni-Rythmics Match
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {resolvedNodes.map((node) => (
                    <tr
                      key={`${node.sector}-${node.semitoneOffset}`}
                      onClick={() => playVacuumTubeTone(node.activeHz, 0.9, 0, 0.16)}
                      className="cursor-pointer text-stone-200 transition-colors hover:bg-white/[0.03]"
                    >
                      <td className="py-2.5 pr-3">
                        <div className="font-mono font-semibold text-amber-200">
                          {node.noteName} · {node.sector}/12 ({node.degree}°)
                        </div>
                      </td>
                      <td className="px-2 py-2.5 text-stone-300">
                        {node.intervalLabel}
                      </td>
                      <td className="px-2 py-2.5 font-mono tabular-nums text-cyan-200">
                        {node.activeHz.toFixed(2)} Hz
                      </td>
                      <td className="px-2 py-2.5 font-mono tabular-nums">
                        {node.ratioToRoot.toFixed(5)}×
                      </td>
                      <td className="py-2.5 pl-2 text-right font-mono tabular-nums">
                        <div className="text-amber-200">{node.nearestGoldenConstant}</div>
                        <div className="text-[10px] text-stone-400">
                          {node.goldenConvergenceDeltaPct >= 0 ? '+' : ''}
                          {node.goldenConvergenceDeltaPct.toFixed(2)}% delta
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Current Machine Harmonic State Summary */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3 text-xs text-stone-400">
            <span>
              Current Workbench State: Sector {inputs.dodecagonSector}/12 ·{' '}
              {inputs.measureType === 'half' ? 'Half' : 'Whole'} · ×
              {inputs.multiplierInt.toString().padStart(6, '0')}
            </span>
            <span className="font-mono tabular-nums text-amber-200">
              1 Gunit = {formatSmartPrecision(computed.gunitValue, 6)}
            </span>
          </div>
        </div>
      </div>

      {/* F.A.S.T. (Frequency Audible Tuned Storage) Memory Recall Bank */}
      <div className="rounded-2xl border border-cyan-500/25 bg-[#111217] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-cyan-300" />
              <h2 className="text-base font-bold text-amber-100">
                F.A.S.T. Recall of Memory — Audible Tuned Storage Bank
              </h2>
            </div>
            <p className="mt-1 text-xs text-stone-400">
              Encode your current Uni-Rythmics calibration, dodecagon node, and Base-60 scalar into a frequency-tagged memory slot. Recalling a slot restores the geometry and plays back its acoustic tuning signature.
            </p>
          </div>

          <form onSubmit={handleStoreMemory} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              maxLength={48}
              value={memoryLabel}
              onChange={(e) => setMemoryLabel(e.target.value)}
              placeholder="Name memory slot (e.g. G Chord 3D Lock)..."
              aria-label="Memory slot label"
              className="h-10 w-64 rounded-lg border border-cyan-500/30 bg-black/55 px-3 text-xs text-stone-100 placeholder:text-stone-500 focus:border-cyan-400 focus:outline-none"
            />
            <button
              type="submit"
              className="flex min-h-[40px] items-center gap-1.5 rounded-lg bg-cyan-500 px-3.5 py-2 text-xs font-semibold whitespace-nowrap text-slate-950 transition-colors hover:bg-cyan-400 focus-visible:outline-2 focus-visible:outline-amber-400"
            >
              <BookmarkPlus className="h-4 w-4" />
              <span>Store in F.A.S.T.</span>
            </button>
          </form>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {memorySlots.map((slot) => {
            const isRecalled = lastRecalledId === slot.id;
            return (
              <div
                key={slot.id}
                className={`flex flex-col justify-between rounded-xl border p-4 transition-colors ${
                  isRecalled
                    ? 'border-cyan-400/60 bg-cyan-500/10'
                    : 'border-white/10 bg-black/40'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-semibold text-amber-100">
                      {slot.label}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleDeleteMemory(slot.id)}
                      aria-label={`Delete memory slot ${slot.label}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-stone-500 transition-colors hover:bg-rose-500/15 hover:text-rose-300 focus-visible:outline-2 focus-visible:outline-cyan-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="mt-1.5 font-mono text-[11px] tabular-nums text-cyan-200">
                    {slot.signatureHz.map((hz) => `${hz.toFixed(1)}Hz`).join(' · ')}
                  </div>

                  <div className="mt-1 text-[11px] text-stone-400">
                    Node {slot.snapshot.dodecagonSector}/12 ·{' '}
                    {slot.snapshot.measureType === 'half' ? 'Half' : 'Whole'} ·{' '}
                    {slot.snapshot.spaceDimensions.toUpperCase()} · ×
                    {slot.snapshot.multiplierInt.toString().padStart(6, '0')}
                    {slot.snapshot.fastFoldLevel !== 0
                      ? ` · Fold 60^${slot.snapshot.fastFoldLevel}`
                      : ''}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
                  <button
                    type="button"
                    onClick={() => handleRecallMemory(slot)}
                    className="flex min-h-[36px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-semibold whitespace-nowrap text-amber-200 transition-colors hover:bg-amber-500/25 focus-visible:outline-2 focus-visible:outline-cyan-400"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Recall &amp; Play</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => playChordSignature(slot.signatureHz, true)}
                    aria-label={`Audition frequency signature for ${slot.label}`}
                    className="flex min-h-[36px] items-center justify-center gap-1 rounded-lg border border-white/15 bg-black/50 px-2.5 py-1 text-xs whitespace-nowrap text-stone-300 transition-colors hover:border-cyan-400/50 hover:text-cyan-200 focus-visible:outline-2 focus-visible:outline-cyan-400"
                  >
                    <Volume2 className="h-3.5 w-3.5" />
                    <span>Tone</span>
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
