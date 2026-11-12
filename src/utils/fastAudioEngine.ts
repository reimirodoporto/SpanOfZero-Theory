import {
  INV_PHI_EXACT,
  PHI_EXACT,
  type FastFoldLevel,
  type MeasureType,
  type PrecisionBasis,
  type SpaceDimensions,
} from './uniRythmicsMath';

export interface DodecagonNote {
  sector: number; // 1..12 (12 at top 360°/0°, 1 at 30°, ..., 7 at 210°)
  chromaticIndex: number; // 0 = C, 1 = C#, ..., 7 = G, ..., 11 = B
  noteName: string;
  degree: number; // 30..360
}

// 12-Node Chromatic Dodecagon: C sits at top node 12 (360°/0°), G sits at node 7 (210°)
export const CHROMATIC_DODECAGON_NODES: DodecagonNote[] = [
  { sector: 1, chromaticIndex: 1, noteName: 'C♯', degree: 30 },
  { sector: 2, chromaticIndex: 2, noteName: 'D', degree: 60 },
  { sector: 3, chromaticIndex: 3, noteName: 'D♯', degree: 90 },
  { sector: 4, chromaticIndex: 4, noteName: 'E', degree: 120 },
  { sector: 5, chromaticIndex: 5, noteName: 'F', degree: 150 },
  { sector: 6, chromaticIndex: 6, noteName: 'F♯', degree: 180 },
  { sector: 7, chromaticIndex: 7, noteName: 'G', degree: 210 },
  { sector: 8, chromaticIndex: 8, noteName: 'G♯', degree: 240 },
  { sector: 9, chromaticIndex: 9, noteName: 'A', degree: 270 },
  { sector: 10, chromaticIndex: 10, noteName: 'A♯', degree: 300 },
  { sector: 11, chromaticIndex: 11, noteName: 'B', degree: 330 },
  { sector: 12, chromaticIndex: 0, noteName: 'C', degree: 360 },
];

export type TuningReferenceHz = 440 | 432;
export type TuningModel = '12tet' | 'phi_convergent';

export interface ChordPreset {
  id: string;
  name: string;
  rootSector: number;
  semitoneOffsets: number[];
  intervalLabels: string[];
  description: string;
}

export const CHORD_PRESETS: ChordPreset[] = [
  {
    id: 'g_major',
    name: 'G Major Triad (G – B – D)',
    rootSector: 7,
    semitoneOffsets: [0, 4, 7],
    intervalLabels: ['Root (G)', 'Major 3rd (B)', 'Perfect 5th (D)'],
    description:
      'Anchored at node 7/12 (210°), spanning 120° to B (330°) and 90° to D (60°). Major 3rd (1.2599) converges closely onto Half Measure 2/φ (1.2361).',
  },
  {
    id: 'g_minor',
    name: 'G Minor Triad (G – B♭ – D)',
    rootSector: 7,
    semitoneOffsets: [0, 3, 7],
    intervalLabels: ['Root (G)', 'Minor 3rd (B♭)', 'Perfect 5th (D)'],
    description:
      'Root at node 7/12 (210°) with 90° minor 3rd to A♯/B♭ (300°) and 120° major 3rd to D (60°).',
  },
  {
    id: 'g_dominant7',
    name: 'G Dominant 7th (G – B – D – F)',
    rootSector: 7,
    semitoneOffsets: [0, 4, 7, 10],
    intervalLabels: ['Root (G)', 'Major 3rd (B)', 'Perfect 5th (D)', 'Minor 7th (F)'],
    description:
      'Four-node harmonic trapezoid inside the 360° dodecagon spanning nodes 7, 11, 2, and 5.',
  },
  {
    id: 'c_major',
    name: 'C Major Triad (C – E – G)',
    rootSector: 12,
    semitoneOffsets: [0, 4, 7],
    intervalLabels: ['Root (C)', 'Major 3rd (E)', 'Perfect 5th (G)'],
    description:
      'Root at top 12/12 apex (360°/0°), E at 4/12 (120°), and G at 7/12 (210°).',
  },
  {
    id: 'd_major',
    name: 'D Major Triad (D – F♯ – A)',
    rootSector: 2,
    semitoneOffsets: [0, 4, 7],
    intervalLabels: ['Root (D)', 'Major 3rd (F♯)', 'Perfect 5th (A)'],
    description:
      'Root at node 2/12 (60°), F♯ at 6/12 (180°), and A at 9/12 (270°).',
  },
  {
    id: 'a_minor',
    name: 'A Minor Triad (A – C – E)',
    rootSector: 9,
    semitoneOffsets: [0, 3, 7],
    intervalLabels: ['Root (A)', 'Minor 3rd (C)', 'Perfect 5th (E)'],
    description:
      'Centered on concert reference A at node 9/12 (270°), C at 12/12 (360°), E at 4/12 (120°).',
  },
  {
    id: 'golden_phi_chord',
    name: 'Golden φ-Convergence (G · G×2/φ · G×φ)',
    rootSector: 7,
    semitoneOffsets: [0, 4, 8],
    intervalLabels: ['Root (G)', '2/φ Harmonic (1.236×)', 'φ Golden 6th (1.618×)'],
    description:
      'Pure Golden Ratio harmonic convergence from G: multiplies root frequency by 2/φ (1.236068) and φ (1.618034) across symmetric 120° equilateral nodes.',
  },
];

export interface ResolvedChordNode {
  sector: number;
  degree: number;
  noteName: string;
  intervalLabel: string;
  semitoneOffset: number;
  tetHz: number;
  goldenHz: number;
  activeHz: number;
  ratioToRoot: number;
  nearestGoldenConstant: string;
  goldenConvergenceDeltaPct: number;
}

export function getSectorNote(sector: number): DodecagonNote {
  const normalized = ((sector - 1 + 12) % 12) + 1;
  return (
    CHROMATIC_DODECAGON_NODES.find((n) => n.sector === normalized) ??
    CHROMATIC_DODECAGON_NODES[11]
  );
}

export function getNoteFrequencyHz(
  chromaticIndex: number,
  octave: number,
  referenceA4: TuningReferenceHz
): number {
  // MIDI note number: C4 = 60, A4 = 69
  const midi = (octave + 1) * 12 + chromaticIndex;
  return referenceA4 * Math.pow(2, (midi - 69) / 12);
}

export function resolveChordConvergence(
  chord: ChordPreset,
  octave: number,
  referenceA4: TuningReferenceHz,
  tuningModel: TuningModel
): ResolvedChordNode[] {
  const rootNode = getSectorNote(chord.rootSector);
  const rootTetHz = getNoteFrequencyHz(rootNode.chromaticIndex, octave, referenceA4);

  return chord.semitoneOffsets.map((offset, idx) => {
    const targetChromatic = (rootNode.chromaticIndex + offset) % 12;
    const octaveBump = Math.floor((rootNode.chromaticIndex + offset) / 12);
    const targetSector = targetChromatic === 0 ? 12 : targetChromatic;
    const nodeInfo = getSectorNote(targetSector);

    const tetHz = getNoteFrequencyHz(
      targetChromatic,
      octave + octaveBump,
      referenceA4
    );

    // Golden-ratio convergent frequency mapping from root
    let goldenRatio = Math.pow(2, offset / 12);
    if (chord.id === 'golden_phi_chord') {
      goldenRatio = offset === 0 ? 1 : offset === 4 ? 2 * INV_PHI_EXACT : PHI_EXACT;
    } else if (offset === 4) {
      goldenRatio = 2 * INV_PHI_EXACT; // 1.236068 (Half Measure 2/phi)
    } else if (offset === 7) {
      goldenRatio = 1.5; // 3:2 exact fifth
    } else if (offset === 8) {
      goldenRatio = PHI_EXACT; // 1.618034 (Golden phi)
    } else if (offset === 10) {
      goldenRatio = Math.sqrt(PHI_EXACT * 2); // ~1.7989 harmonic 7th
    }

    const goldenHz = rootTetHz * goldenRatio;
    const activeHz = tuningModel === 'phi_convergent' ? goldenHz : tetHz;
    const ratioToRoot = activeHz / rootTetHz;

    // Measure proximity to core Uni-Rythmics golden constants (0.618, 1.000, 1.236, 1.618)
    const candidates = [
      { label: '1/φ (0.618)', val: INV_PHI_EXACT },
      { label: '1/1 Unity (1.000)', val: 1 },
      { label: '2/φ Half-Full (1.236)', val: 2 * INV_PHI_EXACT },
      { label: 'φ Golden (1.618)', val: PHI_EXACT },
      { label: '2×φ⁻¹+1 (2.236)', val: 2 * INV_PHI_EXACT + 1 },
    ];
    let best = candidates[0];
    let bestDiff = Math.abs(ratioToRoot - best.val);
    for (const c of candidates) {
      const d = Math.abs(ratioToRoot - c.val);
      if (d < bestDiff) {
        best = c;
        bestDiff = d;
      }
    }

    return {
      sector: nodeInfo.sector,
      degree: nodeInfo.degree,
      noteName: `${nodeInfo.noteName}${octave + octaveBump}`,
      intervalLabel: chord.intervalLabels[idx] ?? `+${offset} st`,
      semitoneOffset: offset,
      tetHz,
      goldenHz,
      activeHz,
      ratioToRoot,
      nearestGoldenConstant: best.label,
      goldenConvergenceDeltaPct: ((ratioToRoot - best.val) / best.val) * 100,
    };
  });
}

// ============================================================================
// Web Audio API F.A.S.T. Synthesizer (Zero external audio assets)
// ============================================================================

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new Ctx();
  }
  if (sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {
      // Ignore user-gesture restriction error if not triggered directly
    });
  }
  return sharedAudioCtx;
}

export function playVacuumTubeTone(
  frequencyHz: number,
  durationSec = 0.85,
  delaySec = 0,
  gainPeak = 0.14
): void {
  const ctx = getAudioContext();
  if (!ctx || !Number.isFinite(frequencyHz) || frequencyHz <= 0) return;

  const clampedFreq = Math.min(3500, Math.max(55, frequencyHz));
  const start = ctx.currentTime + delaySec;

  const masterGain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2400, start);

  // Warm fundamental sine + gentle 2nd harmonic triangle for Edison vacuum warmth
  const osc1 = ctx.createOscillator();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(clampedFreq, start);

  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(clampedFreq * 2, start);

  const osc2Gain = ctx.createGain();
  osc2Gain.gain.setValueAtTime(0.16, start);

  masterGain.gain.setValueAtTime(0.0001, start);
  masterGain.gain.linearRampToValueAtTime(gainPeak, start + 0.02);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, start + durationSec);

  osc1.connect(filter);
  osc2.connect(osc2Gain);
  osc2Gain.connect(filter);
  filter.connect(masterGain);
  masterGain.connect(ctx.destination);

  osc1.start(start);
  osc2.start(start);
  osc1.stop(start + durationSec + 0.04);
  osc2.stop(start + durationSec + 0.04);
}

export function playChordSignature(
  frequenciesHz: number[],
  arpeggiate = false
): void {
  const stepDelay = arpeggiate ? 0.11 : 0.015;
  const duration = arpeggiate ? 1.15 : 1.35;
  const gainPerVoice = Math.min(0.12, 0.28 / Math.max(1, frequenciesHz.length));

  frequenciesHz.forEach((hz, idx) => {
    playVacuumTubeTone(hz, duration, idx * stepDelay, gainPerVoice);
  });
}

// ============================================================================
// F.A.S.T. (Frequency Audible Tuned Storage) Memory Slot Schema
// ============================================================================

export interface FastMemorySlot {
  id: string;
  label: string;
  createdAt: string;
  chordId: string;
  tuningRefHz: TuningReferenceHz;
  tuningModel: TuningModel;
  octave: number;
  signatureHz: number[];
  snapshot: {
    measureType: MeasureType;
    precisionBasis: PrecisionBasis;
    dodecagonSector: number;
    nthExponent: number;
    spanOfZeroEnabled: boolean;
    spaceDimensions: SpaceDimensions;
    fastFoldLevel: FastFoldLevel;
    primaryUnitId: string;
    multiplierInt: number;
  };
}

export const FAST_MEMORY_STORAGE_KEY = 'uni_rythmics_fast_memory_slots_v1';

export function buildSeededMemorySlots(): FastMemorySlot[] {
  const gChord = CHORD_PRESETS[0]; // G Major
  const phiChord = CHORD_PRESETS[6]; // Golden phi-triad
  const cChord = CHORD_PRESETS[3]; // C Major

  const gSig = resolveChordConvergence(gChord, 4, 440, '12tet').map((n) => n.activeHz);
  const phiSig = resolveChordConvergence(phiChord, 4, 432, 'phi_convergent').map(
    (n) => n.activeHz
  );
  const cSig = resolveChordConvergence(cChord, 4, 440, '12tet').map((n) => n.activeHz);

  return [
    {
      id: 'seed_g_major_lock',
      label: 'G Major Convergence (Node 7/12 · G–B–D)',
      createdAt: 'Preset Calibration',
      chordId: gChord.id,
      tuningRefHz: 440,
      tuningModel: '12tet',
      octave: 4,
      signatureHz: gSig,
      snapshot: {
        measureType: 'half',
        precisionBasis: 'exact',
        dodecagonSector: 7,
        nthExponent: 0,
        spanOfZeroEnabled: true,
        spaceDimensions: '3d',
        fastFoldLevel: 0,
        primaryUnitId: 'g4_pitch',
        multiplierInt: 1,
      },
    },
    {
      id: 'seed_phi_resonance',
      label: 'Golden φ-Triad Resonance (A432 · 2/φ & φ)',
      createdAt: 'Preset Calibration',
      chordId: phiChord.id,
      tuningRefHz: 432,
      tuningModel: 'phi_convergent',
      octave: 4,
      signatureHz: phiSig,
      snapshot: {
        measureType: 'half',
        precisionBasis: 'exact',
        dodecagonSector: 12,
        nthExponent: 0,
        spanOfZeroEnabled: true,
        spaceDimensions: '3d',
        fastFoldLevel: 0,
        primaryUnitId: 'a4_verdi',
        multiplierInt: 1,
      },
    },
    {
      id: 'seed_planck_fold',
      label: 'Planck-Time Base-60 Fold (×000060 · ÷60¹)',
      createdAt: 'Preset Calibration',
      chordId: cChord.id,
      tuningRefHz: 440,
      tuningModel: '12tet',
      octave: 4,
      signatureHz: cSig,
      snapshot: {
        measureType: 'half',
        precisionBasis: 'rounded',
        dodecagonSector: 12,
        nthExponent: 0,
        spanOfZeroEnabled: true,
        spaceDimensions: '3d',
        fastFoldLevel: 1,
        primaryUnitId: 'planck_time',
        multiplierInt: 60,
      },
    },
  ];
}
