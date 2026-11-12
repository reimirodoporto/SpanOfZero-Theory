import type { ScientificUnit } from '../data/metrologyCatalog';

export const PHI_EXACT = (1 + Math.sqrt(5)) / 2; // 1.618033988749895
export const INV_PHI_EXACT = 1 / PHI_EXACT; // 0.6180339887498949
export const INV_PHI_ROUNDED = 0.618;

export type MeasureType = 'half' | 'whole';
export type PrecisionBasis = 'rounded' | 'exact';
export type ComparisonMode = 'notable' | 'secondary' | 'hidden';
export type SpaceDimensions = '1d' | '3d';
export type FastFoldLevel = -1 | 0 | 1 | 2 | 3;

export interface UniRythmicsInputs {
  measureType: MeasureType;
  precisionBasis: PrecisionBasis;
  dodecagonSector: number; // 1..12 (12 = 360°)
  nthExponent: number; // 0..9 (10^-n shift)
  spanOfZeroEnabled: boolean; // -.618 @ +.618 reserved origin span
  spaceDimensions: SpaceDimensions; // 1D axis vs 3D spatial expanse
  fastFoldLevel: FastFoldLevel; // Base-60 compressor exponent (-1 => x60, 0 => 1:1, 1 => /60, 2 => /3600, 3 => /216000)
  primaryUnit: ScientificUnit;
  primaryCustomValue: number;
  primaryCustomSymbol: string;
  multiplierInt: number; // 1..999999 (default 000001)
  comparisonMode: ComparisonMode;
  notableUnit: ScientificUnit;
  secondaryUnit: ScientificUnit;
  secondaryCustomValue: number;
  secondaryCustomSymbol: string;
  secondaryMultiplierInt: number;
  linkSecondaryMultiplier: boolean;
}

export interface BasisRowResult {
  id: string;
  measureLabel: string;
  basisLabel: string;
  measureType: MeasureType;
  precisionBasis: PrecisionBasis;
  basePhi: number;
  fullUnit: number; // 1/1
  tenthUnit: number; // 1/10
  nthUnit: number; // fullUnit * 10^-n
  gunitActive: number; // nthUnit * (sector / 12)
  scaledVarTotal: number;
}

export interface SpanOfZeroMetrics {
  enabled: boolean;
  zeroSpanMin: number; // -0.618 / -1/phi
  zeroSpanMax: number; // +0.618 / +1/phi
  zeroSpanWidth: number; // 2 * basePhi (1.236 / 2/phi)
  firstMeasureStart: number; // +0.618 / 1/phi
  firstMeasureEnd: number; // +1.618 / phi
  activeMeasureStart: number; // basePhi + max(0, effectiveFoldedN - 1)
  activeMeasureEnd: number; // basePhi + effectiveFoldedN
  trailingExpanseEnd: number; // 2 * basePhi + effectiveFoldedN (assumes trailing reserve)
  totalReservedSpan1D: number; // 2 * basePhi + effectiveFoldedN
  volume3DZeroReserve: number; // (2 * basePhi)^3
  volume3DFirstMeasureCube: number; // (basePhi + 1)^3
  volume3DActiveExpanse: number; // (basePhi + effectiveFoldedN)^3
}

export interface FastFoldBase60Metrics {
  foldLevel: FastFoldLevel;
  foldDivisor: number; // 60^foldLevel (or 1/60 when -1)
  foldMultiplier: number; // 60^(-foldLevel)
  effectiveFoldedScalar: number; // multiplierInt * foldMultiplier
  phase60: number; // 0..59 tick on 60-interval dial (0 shown as 60 when multiple of 60)
  dialTick60: number; // 1..60 for visual bezel position
  sexagesimalTuple: [number, number, number]; // [60^2, 60^1, 60^0]
  sexagesimalFormatted: string; // e.g. "00 : 01 : 00"
  recommendedFoldLevel: FastFoldLevel;
}

export interface UniRythmicsComputation {
  basePhi: number;
  fullUnit: number; // 1/1
  tenthUnit: number; // 1/10
  nthFactor: number; // 10^-n
  nthShiftedUnit: number; // fullUnit * 10^-n
  dodecagonRatio: number; // sector / 12
  dodecagonDegrees: number; // sector * 30
  gunitValue: number; // Active 1 Gunit bound value
  spanOfZero: SpanOfZeroMetrics;
  fastFold: FastFoldBase60Metrics;
  primarySingleSi: number; // Effective single value of 1 var
  primarySingleLabel: string;
  primaryHarmonicSingle: number; // 1 Gunit * 1 var
  primaryUnscaledTotal: number; // 1 var * effectiveFoldedScalar
  primaryFinalTotal: number; // Final scaled output accounting for Gunit, fold, and optional 3D/Zero Span
  primaryLinearTotal: number; // 1D linear scaled output
  primaryCubic3DTotal: number; // 3D volumetric scaled output when scaling in 3D space
  effectiveSecondaryMultiplier: number;
  secondarySingleSi: number;
  secondarySingleLabel: string;
  secondaryHarmonicSingle: number;
  secondaryFinalTotal: number;
  comparisonCompatible: boolean;
  comparisonRatioPerFinal: number;
  comparisonInverseRatio: number;
  exactVsRoundedDelta: number;
  fourBasisRows: BasisRowResult[];
}

export function computeBasisValues(
  measureType: MeasureType,
  precisionBasis: PrecisionBasis,
  sector: number,
  nthExponent: number
) {
  const basePhi = precisionBasis === 'exact' ? INV_PHI_EXACT : INV_PHI_ROUNDED;
  const fullUnit = measureType === 'half' ? basePhi * 2 : basePhi;
  const tenthUnit = fullUnit / 10;
  const nthFactor = Math.pow(10, -nthExponent);
  const nthUnit = fullUnit * nthFactor;
  const gunitActive = nthUnit * (sector / 12);

  return { basePhi, fullUnit, tenthUnit, nthFactor, nthUnit, gunitActive };
}

export function computeRecommendedFold(n: number): FastFoldLevel {
  if (n >= 216000) return 3;
  if (n >= 3600) return 2;
  if (n >= 60) return 1;
  return 0;
}

export function computeUniRythmics(input: UniRythmicsInputs): UniRythmicsComputation {
  const sector = Math.min(12, Math.max(1, Math.round(input.dodecagonSector)));
  const nthExponent = Math.min(9, Math.max(0, Math.round(input.nthExponent)));
  const multiplierInt = Math.min(999999, Math.max(1, Math.round(input.multiplierInt)));

  const active = computeBasisValues(
    input.measureType,
    input.precisionBasis,
    sector,
    nthExponent
  );

  // Base-60 Fast Fold Compressor
  const foldLevel = input.fastFoldLevel;
  const foldMultiplier = Math.pow(60, -foldLevel);
  const foldDivisor = Math.pow(60, foldLevel);
  const effectiveFoldedScalar = multiplierInt * foldMultiplier;

  const h60 = Math.floor(multiplierInt / 3600);
  const m60 = Math.floor((multiplierInt % 3600) / 60);
  const s60 = multiplierInt % 60;
  const sexagesimalTuple: [number, number, number] = [h60, m60, s60];
  const sexagesimalFormatted = sexagesimalTuple
    .map((v) => v.toString().padStart(2, '0'))
    .join(' : ');

  const phase60 = multiplierInt % 60;
  const dialTick60 = phase60 === 0 ? 60 : phase60;

  const fastFold: FastFoldBase60Metrics = {
    foldLevel,
    foldDivisor,
    foldMultiplier,
    effectiveFoldedScalar,
    phase60,
    dialTick60,
    sexagesimalTuple,
    sexagesimalFormatted,
    recommendedFoldLevel: computeRecommendedFold(multiplierInt),
  };

  // Span of Zero Theory (-.618 @ +.618, first full measure .618 - 1.618)
  const phiReserve = active.basePhi;
  const zeroSpanMin = -phiReserve;
  const zeroSpanMax = phiReserve;
  const zeroSpanWidth = phiReserve * 2;
  const firstMeasureStart = phiReserve;
  const firstMeasureEnd = phiReserve + 1;

  const activeMeasureStart = input.spanOfZeroEnabled
    ? phiReserve + Math.max(0, effectiveFoldedScalar - 1)
    : Math.max(0, effectiveFoldedScalar - 1);
  const activeMeasureEnd = input.spanOfZeroEnabled
    ? phiReserve + effectiveFoldedScalar
    : effectiveFoldedScalar;
  const trailingExpanseEnd = input.spanOfZeroEnabled
    ? zeroSpanWidth + effectiveFoldedScalar
    : effectiveFoldedScalar;

  const spanOfZero: SpanOfZeroMetrics = {
    enabled: input.spanOfZeroEnabled,
    zeroSpanMin,
    zeroSpanMax,
    zeroSpanWidth,
    firstMeasureStart,
    firstMeasureEnd,
    activeMeasureStart,
    activeMeasureEnd,
    trailingExpanseEnd,
    totalReservedSpan1D: trailingExpanseEnd,
    volume3DZeroReserve: Math.pow(zeroSpanWidth, 3),
    volume3DFirstMeasureCube: Math.pow(firstMeasureEnd, 3),
    volume3DActiveExpanse: Math.pow(activeMeasureEnd, 3),
  };

  const primarySingleSi =
    input.primaryUnit.id === 'custom_unit'
      ? Math.max(1e-50, input.primaryCustomValue || 1)
      : input.primaryUnit.siValue;

  const primarySingleLabel =
    input.primaryUnit.id === 'custom_unit'
      ? input.primaryCustomSymbol.trim() || 'u'
      : input.primaryUnit.siBaseSymbol;

  const primaryHarmonicSingle = active.gunitActive * primarySingleSi;
  const primaryUnscaledTotal = primarySingleSi * effectiveFoldedScalar;

  // Symmetric scaling helper used identically by both 1 var and Secondary var of comparison
  const computeAxisFactor = (foldedScalar: number) => {
    if (!input.spanOfZeroEnabled) {
      return active.gunitActive * foldedScalar;
    }
    // Reserved origin span (+phiReserve) weighted by active sector & 10^-n shift plus harmonic Gunit expansion
    return (
      active.basePhi * active.nthFactor * (sector / 12) +
      active.gunitActive * foldedScalar
    );
  };

  const primaryAxisFactor = computeAxisFactor(effectiveFoldedScalar);
  const primaryLinearTotal = primaryAxisFactor * primarySingleSi;
  const primaryCubic3DTotal = Math.pow(primaryAxisFactor, 3) * primarySingleSi;

  const primaryFinalTotal =
    input.spaceDimensions === '3d' ? primaryCubic3DTotal : primaryLinearTotal;

  const effectiveSecondaryMultiplier = input.linkSecondaryMultiplier
    ? multiplierInt
    : Math.min(999999, Math.max(1, Math.round(input.secondaryMultiplierInt)));
  const effectiveSecondaryFolded = effectiveSecondaryMultiplier * foldMultiplier;

  const targetCompUnit =
    input.comparisonMode === 'notable' ? input.notableUnit : input.secondaryUnit;

  const secondarySingleSi =
    targetCompUnit.id === 'custom_unit'
      ? Math.max(1e-50, input.secondaryCustomValue || 1)
      : targetCompUnit.siValue;

  const secondarySingleLabel =
    targetCompUnit.id === 'custom_unit'
      ? input.secondaryCustomSymbol.trim() || 'u'
      : targetCompUnit.siBaseSymbol;

  const secondaryHarmonicSingle = active.gunitActive * secondarySingleSi;
  const secondaryAxisFactor = computeAxisFactor(effectiveSecondaryFolded);
  const secondaryLinearTotal = secondaryAxisFactor * secondarySingleSi;
  const secondaryCubic3DTotal = Math.pow(secondaryAxisFactor, 3) * secondarySingleSi;

  const secondaryFinalTotal =
    input.comparisonMode === 'notable'
      ? secondarySingleSi
      : input.spaceDimensions === '3d'
      ? secondaryCubic3DTotal
      : secondaryLinearTotal;

  const comparisonCompatible =
    input.primaryUnit.dimension === targetCompUnit.dimension ||
    input.primaryUnit.dimension === 'custom' ||
    targetCompUnit.dimension === 'custom';

  const comparisonRatioPerFinal =
    secondarySingleSi > 0 ? primaryFinalTotal / secondarySingleSi : 0;
  const comparisonInverseRatio =
    primaryFinalTotal > 0 ? secondarySingleSi / primaryFinalTotal : 0;

  // Calculate exact vs rounded difference at current settings
  const exactRow = computeBasisValues(input.measureType, 'exact', sector, nthExponent);
  const roundedRow = computeBasisValues(input.measureType, 'rounded', sector, nthExponent);
  const exactVsRoundedDelta =
    (exactRow.gunitActive - roundedRow.gunitActive) *
    primarySingleSi *
    effectiveFoldedScalar;

  const combinations: {
    id: string;
    measureLabel: string;
    basisLabel: string;
    measureType: MeasureType;
    precisionBasis: PrecisionBasis;
  }[] = [
    {
      id: 'half_rounded',
      measureLabel: 'Half Measure (1/2 = 0.618)',
      basisLabel: 'Rounded (0.618)',
      measureType: 'half',
      precisionBasis: 'rounded',
    },
    {
      id: 'half_exact',
      measureLabel: 'Half Measure (1/2 = 1/φ)',
      basisLabel: 'Exact (2/φ)',
      measureType: 'half',
      precisionBasis: 'exact',
    },
    {
      id: 'whole_rounded',
      measureLabel: 'Whole Measure (1 = 0.618)',
      basisLabel: 'Rounded (0.618)',
      measureType: 'whole',
      precisionBasis: 'rounded',
    },
    {
      id: 'whole_exact',
      measureLabel: 'Whole Measure (1 = 1/φ)',
      basisLabel: 'Exact (1/φ)',
      measureType: 'whole',
      precisionBasis: 'exact',
    },
  ];

  const fourBasisRows: BasisRowResult[] = combinations.map((c) => {
    const res = computeBasisValues(c.measureType, c.precisionBasis, sector, nthExponent);
    return {
      ...c,
      basePhi: res.basePhi,
      fullUnit: res.fullUnit,
      tenthUnit: res.tenthUnit,
      nthUnit: res.nthUnit,
      gunitActive: res.gunitActive,
      scaledVarTotal: res.gunitActive * primarySingleSi * effectiveFoldedScalar,
    };
  });

  return {
    basePhi: active.basePhi,
    fullUnit: active.fullUnit,
    tenthUnit: active.tenthUnit,
    nthFactor: active.nthFactor,
    nthShiftedUnit: active.nthUnit,
    dodecagonRatio: sector / 12,
    dodecagonDegrees: sector * 30,
    gunitValue: active.gunitActive,
    spanOfZero,
    fastFold,
    primarySingleSi,
    primarySingleLabel,
    primaryHarmonicSingle,
    primaryUnscaledTotal,
    primaryFinalTotal,
    primaryLinearTotal,
    primaryCubic3DTotal,
    effectiveSecondaryMultiplier,
    secondarySingleSi,
    secondarySingleLabel,
    secondaryHarmonicSingle,
    secondaryFinalTotal,
    comparisonCompatible,
    comparisonRatioPerFinal,
    comparisonInverseRatio,
    exactVsRoundedDelta,
    fourBasisRows,
  };
}

/**
 * Formats numbers cleanly across standard decimal scales and Planck-level tiny magnitudes.
 */
export function formatSmartPrecision(value: number, sigDigits = 6): string {
  if (!Number.isFinite(value)) return '0';
  if (value === 0) return '0';
  const abs = Math.abs(value);

  if (abs >= 1e-4 && abs < 1e7) {
    const rounded = Number(value.toPrecision(Math.max(sigDigits, 7)));
    if (Math.abs(rounded - Math.round(rounded)) < 1e-12 && abs < 1e6) {
      return Math.round(rounded).toLocaleString('en-US');
    }
    if (abs >= 1000) {
      return value.toLocaleString('en-US', {
        maximumFractionDigits: Math.max(2, sigDigits - 3),
      });
    }
    return Number(value.toFixed(sigDigits)).toString();
  }

  return formatScientificUnicode(value, Math.max(4, sigDigits - 1));
}

const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '⁰',
  '1': '¹',
  '2': '²',
  '3': '³',
  '4': '⁴',
  '5': '⁵',
  '6': '⁶',
  '7': '⁷',
  '8': '⁸',
  '9': '⁹',
  '-': '⁻',
  '+': '',
};

export function toSuperscript(expStr: string): string {
  return expStr
    .split('')
    .map((ch) => SUPERSCRIPT_MAP[ch] ?? ch)
    .join('');
}

export function formatScientificUnicode(value: number, decimals = 5): string {
  if (value === 0) return '0';
  const [mantissa, exp] = value.toExponential(decimals).split('e');
  const cleanExp = parseInt(exp, 10).toString();
  return `${mantissa} × 10${toSuperscript(cleanExp)}`;
}

export function toSixDigits(n: number): number[] {
  const clamped = Math.min(999999, Math.max(1, Math.round(n)));
  return clamped
    .toString()
    .padStart(6, '0')
    .split('')
    .map((d) => parseInt(d, 10));
}

export function fromSixDigits(digits: number[]): number {
  const joined = digits.join('');
  const parsed = parseInt(joined, 10);
  return Math.min(999999, Math.max(1, Number.isNaN(parsed) ? 1 : parsed));
}
