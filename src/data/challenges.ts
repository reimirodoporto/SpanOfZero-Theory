import type {
  FastFoldLevel,
  MeasureType,
  PrecisionBasis,
} from '../utils/uniRythmicsMath';

export interface CalibrationChallenge {
  id: string;
  number: string;
  title: string;
  difficulty: 'Foundational' | 'Intermediate' | 'Quantum';
  objective: string;
  explanation: string;
  targetDescription: string;
  check: (params: {
    measureType: MeasureType;
    precisionBasis: PrecisionBasis;
    dodecagonSector: number;
    nthExponent: number;
    primaryUnitId: string;
    multiplierInt: number;
    finalTotal: number;
    gunitValue: number;
    spanOfZeroEnabled?: boolean;
    fastFoldLevel?: FastFoldLevel;
  }) => {
    passed: boolean;
    checks: { label: string; ok: boolean }[];
  };
  hintSetup: {
    measureType: MeasureType;
    precisionBasis: PrecisionBasis;
    dodecagonSector: number;
    nthExponent: number;
    primaryUnitId: string;
    multiplierInt: number;
    spanOfZeroEnabled?: boolean;
    fastFoldLevel?: FastFoldLevel;
  };
}

export const CALIBRATION_CHALLENGES: CalibrationChallenge[] = [
  {
    id: 'half-measure-doubling',
    number: '01',
    title: 'Half-Measure Doubling (1/2 = 0.618)',
    difficulty: 'Foundational',
    objective:
      'Calibrate 1 Gunit so that 0.618 serves as a half measure, yielding a full 1/1 unit of 1.236 across the complete 360° dodecagon.',
    explanation:
      'When 0.618 represents 1/2 of a unit, multiplying by 2 establishes the full 1/1 boundary at 1.236 across all 12 sectors.',
    targetDescription: '1 Gunit = 1.236 · Meter × 000001 = 1.236 m',
    check: (p) => {
      const checks = [
        { label: 'Measure Type set to Half Measure (1/2 = φ⁻¹)', ok: p.measureType === 'half' },
        { label: 'Basis set to Rounded (0.618)', ok: p.precisionBasis === 'rounded' },
        { label: 'Dodecagon Sector at 12/12 (360°)', ok: p.dodecagonSector === 12 },
        { label: 'Nth-Power Shift at 10⁰ (1/1)', ok: p.nthExponent === 0 },
        { label: '1 var set to Meter with ×000001', ok: p.primaryUnitId === 'meter' && p.multiplierInt === 1 },
      ];
      return { passed: checks.every((c) => c.ok), checks };
    },
    hintSetup: {
      measureType: 'half',
      precisionBasis: 'rounded',
      dodecagonSector: 12,
      nthExponent: 0,
      primaryUnitId: 'meter',
      multiplierInt: 1,
    },
  },
  {
    id: 'tenth-shift-whole',
    number: '02',
    title: 'One-Tenth Decimal Shift (1/10 Whole)',
    difficulty: 'Foundational',
    objective:
      'Set Whole Measure (1 = 0.618 Rounded) and shift one decimal place left (10⁻¹) so 1 Gunit reads 0.0618, then dial the integer scalar to ×000010 to restore 0.618 m.',
    explanation:
      'Shifting 0.618 left by 10⁻¹ produces the 1/10 unit (0.0618). Multiplying by 000010 on the rolodex scalar visually cancels the 1/10 shift.',
    targetDescription: '1 Gunit = 0.0618 · Final Total = 0.618 m',
    check: (p) => {
      const checks = [
        { label: 'Whole Measure (1 = φ⁻¹) & Rounded (0.618)', ok: p.measureType === 'whole' && p.precisionBasis === 'rounded' },
        { label: 'Nth-Power Shift at 10⁻¹ (1/10)', ok: p.nthExponent === 1 },
        { label: 'Dodecagon Sector at 12/12 (360°)', ok: p.dodecagonSector === 12 },
        { label: 'Rolodex Multiplier dialed to ×000010', ok: p.multiplierInt === 10 && p.primaryUnitId === 'meter' },
      ];
      return { passed: checks.every((c) => c.ok), checks };
    },
    hintSetup: {
      measureType: 'whole',
      precisionBasis: 'rounded',
      dodecagonSector: 12,
      nthExponent: 1,
      primaryUnitId: 'meter',
      multiplierInt: 10,
    },
  },
  {
    id: 'dodecagon-harmonic-balance',
    number: '03',
    title: 'Dodecagonal 120° Sector Compensation',
    difficulty: 'Intermediate',
    objective:
      'Use Exact Golden Ratio (2/φ) in Half Measure at a 4/12 (120°) dodecagonal slice, then step the rolodex scalar to ×000003 to recover full 1/1 symmetry.',
    explanation:
      'A 120° slice equals 4/12 = 1/3 of the 360° dodecagonal space. Applying an integer multiplier of 3 restores exact 2/φ ≈ 1.236068.',
    targetDescription: 'Sector 4/12 (120°) · ×000003 → Final ≈ 1.236068 m',
    check: (p) => {
      const checks = [
        { label: 'Half Measure with Exact (1/φ) precision', ok: p.measureType === 'half' && p.precisionBasis === 'exact' },
        { label: 'Dodecagon Sector set to 4/12 (120°)', ok: p.dodecagonSector === 4 },
        { label: 'Nth-Power Shift at 10⁰', ok: p.nthExponent === 0 },
        { label: 'Rolodex Multiplier at ×000003 on Meter', ok: p.multiplierInt === 3 && p.primaryUnitId === 'meter' },
      ];
      return { passed: checks.every((c) => c.ok), checks };
    },
    hintSetup: {
      measureType: 'half',
      precisionBasis: 'exact',
      dodecagonSector: 4,
      nthExponent: 0,
      primaryUnitId: 'meter',
      multiplierInt: 3,
    },
  },
  {
    id: 'exact-vs-rounded-scale',
    number: '04',
    title: 'Revealing the 0.618 Truncation Drift',
    difficulty: 'Intermediate',
    objective:
      'Dial the rolodex scalar up to ×001000 on 1 Meter in Whole Exact (1/φ) mode at 360° to observe how rounding error grows over large multipliers.',
    explanation:
      'While 0.618 differs from 0.618033989... by only ~0.000034 at ×1, scaling to ×001000 reveals a drift of 0.033989 meters.',
    targetDescription: 'Whole Exact · ×001000 → 618.033989 m (vs 618 m rounded)',
    check: (p) => {
      const checks = [
        { label: 'Whole Measure with Exact (1/φ) precision', ok: p.measureType === 'whole' && p.precisionBasis === 'exact' },
        { label: 'Dodecagon Sector at 12/12 (360°)', ok: p.dodecagonSector === 12 },
        { label: 'Rolodex Multiplier dialed to ×001000', ok: p.multiplierInt === 1000 && p.primaryUnitId === 'meter' },
      ];
      return { passed: checks.every((c) => c.ok), checks };
    },
    hintSetup: {
      measureType: 'whole',
      precisionBasis: 'exact',
      dodecagonSector: 12,
      nthExponent: 0,
      primaryUnitId: 'meter',
      multiplierInt: 1000,
    },
  },
  {
    id: 'planck-time-harmonic',
    number: '05',
    title: 'Planck Time Scalar Amplification',
    difficulty: 'Quantum',
    objective:
      'Load Planck Time (5.391247 × 10⁻⁴⁴ s) into 1 var under Half Exact (2/φ) at 360°, then dial the scalar multiplier to ×000012.',
    explanation:
      'Uni-Rythmics handles extreme quantum constants seamlessly, preserving CODATA mantissa precision across integer rolodex steps.',
    targetDescription: '1 var = Planck Time · ×000012 · Half Exact',
    check: (p) => {
      const checks = [
        { label: '1 var set to Planck Time (tₚ)', ok: p.primaryUnitId === 'planck_time' },
        { label: 'Half Measure with Exact (1/φ) precision', ok: p.measureType === 'half' && p.precisionBasis === 'exact' },
        { label: 'Dodecagon Sector at 12/12 (360°)', ok: p.dodecagonSector === 12 },
        { label: 'Rolodex Multiplier dialed to ×000012', ok: p.multiplierInt === 12 },
      ];
      return { passed: checks.every((c) => c.ok), checks };
    },
    hintSetup: {
      measureType: 'half',
      precisionBasis: 'exact',
      dodecagonSector: 12,
      nthExponent: 0,
      primaryUnitId: 'planck_time',
      multiplierInt: 12,
    },
  },
  {
    id: 'span-of-zero-base60-fold',
    number: '06',
    title: 'Span of Zero & Base-60 Fast Fold',
    difficulty: 'Intermediate',
    objective:
      'Keep Span of Zero (−0.618 @ +0.618) active in 3D space, dial the integer multiplier to ×000060, and engage Fast Fold ÷60¹ to compress 60 back into the first full measure (0.618 – 1.618).',
    explanation:
      'Dividing a 60-interval cycle by 60¹ folds ×000060 back to a single 1st full measure span (0.618 – 1.618) across the 60-tick dodecagonal ring.',
    targetDescription: '×000060 · Fold ÷60¹ · First Measure 0.618 – 1.618',
    check: (p) => {
      const checks = [
        { label: 'Span of Zero (−φ⁻¹ @ +φ⁻¹) enabled', ok: Boolean(p.spanOfZeroEnabled) },
        { label: 'Rolodex Multiplier dialed to ×000060', ok: p.multiplierInt === 60 },
        { label: 'Base-60 Fast Fold Compressor at ÷60¹', ok: p.fastFoldLevel === 1 },
      ];
      return { passed: checks.every((c) => c.ok), checks };
    },
    hintSetup: {
      measureType: 'half',
      precisionBasis: 'rounded',
      dodecagonSector: 12,
      nthExponent: 0,
      primaryUnitId: 'meter',
      multiplierInt: 60,
      spanOfZeroEnabled: true,
      fastFoldLevel: 1,
    },
  },
];
