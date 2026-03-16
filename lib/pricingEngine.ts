import mongoose from 'mongoose';
import Booking from '@/app/models/Booking';

// ─── Types ───────────────────────────────────────────────────────────
export type TimePeriod = 'morning' | 'afternoon' | 'night' | 'midnight';

export interface DiscountResult {
  originalPrice: number;
  offerPrice: number;
  discountPercent: number;
  discountAmount: number;
  offerLabel: string;
  isSurge?: boolean;
}

export interface PeriodDiscounts {
  morning: DiscountResult;
  afternoon: DiscountResult;
  night: DiscountResult;
  midnight: DiscountResult;
}

export interface TurfWithOffer {
  originalPrice: number;
  offerPrice: number;
  discountPercent: number;
  discountAmount: number;
  offerLabel: string;
}

interface TurfSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface TurfInput {
  _id: any;
  pricing: number;
  maxDiscount?: number;
  maxSurge?: number;
  availableSlots?: TurfSlot[];
}

interface PricingContext {
  hoursUntilPeriodStart?: number;
  dayOfWeek?: number;
  actualFillRate?: number; // ✅ FIX #3: Pass actual fill for surge check
}

interface AnalysisDates {
  target: string;
  targetDayName: string;
  adjacent: { dateStr: string; dayName: string }[];
  historical: { dateStr: string; dayName: string }[];
  allDateStrings: string[];
  daysUntilTarget: number;
}

// ─── Constants ───────────────────────────────────────────────────────

const ALL_PERIODS: TimePeriod[] = ['morning', 'afternoon', 'night', 'midnight'];

// ✅ Periods that users actually book (exclude midnight for best-offer logic)
const BOOKABLE_PERIODS: TimePeriod[] = ['morning', 'afternoon', 'night'];

const PERIOD_RANGES: Record<TimePeriod, [number, number]> = {
  morning: [6, 12],
  afternoon: [12, 18],
  night: [18, 24],
  midnight: [0, 6],
};

const PEAK_THRESHOLD = 0.7;
const SURGE_THRESHOLD = 0.85;
const MIN_DISPLAY_THRESHOLD = 5;
const HISTORICAL_WEEKS = 4;
const ADJACENT_RANGE = 2;

const BLEND_WEIGHT_TIERS = [
  { maxDays: 0, actual: 0.70, historical: 0.15, trend: 0.15 },
  { maxDays: 1, actual: 0.50, historical: 0.30, trend: 0.20 },
  { maxDays: 3, actual: 0.35, historical: 0.40, trend: 0.25 },
  { maxDays: 7, actual: 0.20, historical: 0.45, trend: 0.35 },
  { maxDays: Infinity, actual: 0.10, historical: 0.55, trend: 0.35 },
];

const DAY_MULTIPLIERS: Record<number, number> = {
  0: 0.85, // Sunday
  1: 1.15, // Monday
  2: 1.15, // Tuesday
  3: 1.15, // Wednesday
  4: 1.15, // Thursday
  5: 1.0,  // Friday
  6: 0.85, // Saturday
};

// ─── No-discount helpers ─────────────────────────────────────────────

const NO_DISCOUNT = (price: number): DiscountResult => ({
  originalPrice: price,
  offerPrice: price,
  discountPercent: 0,
  discountAmount: 0,
  offerLabel: '',
  isSurge: false,
});

const NO_DISCOUNT_ALL_PERIODS = (price: number): PeriodDiscounts => ({
  morning: NO_DISCOUNT(price),
  afternoon: NO_DISCOUNT(price),
  night: NO_DISCOUNT(price),
  midnight: NO_DISCOUNT(price),
});

// ─── Basic Helpers ───────────────────────────────────────────────────

export function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'night';
  return 'midnight';
}

function parseHour(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h + (m || 0) / 60;
}

function getDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/**
 * ✅ FIX #1: Use LOCAL date string instead of UTC.
 *
 * BEFORE (BUGGY):
 *   d.toISOString().split('T')[0]
 *   At 11 PM IST: returns TOMORROW's date in UTC
 *
 * AFTER (CORRECT):
 *   Manual local date formatting
 *   At 11 PM IST: returns TODAY's date correctly
 */
function toDateStr(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getNextDates(n: number): { dateStr: string; dayName: string }[] {
  const results: { dateStr: string; dayName: string }[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    results.push({ dateStr: toDateStr(d), dayName: getDayName(d) });
  }
  return results;
}

function getHoursUntilPeriod(dateStr: string, period: TimePeriod): number {
  const [periodStartHour] = PERIOD_RANGES[period];
  // ✅ FIX #1: Parse date parts to avoid timezone issues
  const [year, month, day] = dateStr.split('-').map(Number);
  const periodStart = new Date(year, month - 1, day, periodStartHour, 0, 0);
  return (periodStart.getTime() - Date.now()) / (1000 * 60 * 60);
}

// ─── Analysis Date Computation ──────────────────────────────────────

function getAnalysisDates(targetDateStr: string): AnalysisDates {
  // ✅ FIX #1: Parse without 'T00:00:00' suffix to avoid timezone issues
  const [year, month, day] = targetDateStr.split('-').map(Number);
  const target = new Date(year, month - 1, day);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const daysUntil = Math.max(
    0, // ✅ FIX: Clamp to 0 for past dates
    Math.round(
      (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
  );

  const adjacent: { dateStr: string; dayName: string }[] = [];
  const historical: { dateStr: string; dayName: string }[] = [];
  const allSet = new Set<string>();

  allSet.add(targetDateStr);

  for (let offset = -ADJACENT_RANGE; offset <= ADJACENT_RANGE; offset++) {
    if (offset === 0) continue;
    const d = new Date(year, month - 1, day + offset);
    const ds = toDateStr(d);
    adjacent.push({ dateStr: ds, dayName: getDayName(d) });
    allSet.add(ds);
  }

  for (let w = 1; w <= HISTORICAL_WEEKS; w++) {
    const d = new Date(year, month - 1, day - w * 7);
    const ds = toDateStr(d);
    historical.push({ dateStr: ds, dayName: getDayName(d) });
    allSet.add(ds);
  }

  return {
    target: targetDateStr,
    targetDayName: getDayName(target),
    adjacent,
    historical,
    allDateStrings: Array.from(allSet),
    daysUntilTarget: daysUntil,
  };
}

function getAnalysisDatesForRange(
  upcomingDates: { dateStr: string; dayName: string }[]
): {
  allDateStrings: string[];
  historicalByUpcoming: Map<string, string[]>;
} {
  const allSet = new Set<string>();
  const historicalByUpcoming = new Map<string, string[]>();

  for (const { dateStr } of upcomingDates) {
    allSet.add(dateStr);
    // ✅ FIX #1: Parse without timezone issues
    const [year, month, day] = dateStr.split('-').map(Number);
    const histDates: string[] = [];

    for (let w = 1; w <= HISTORICAL_WEEKS; w++) {
      const d = new Date(year, month - 1, day - w * 7);
      const ds = toDateStr(d);
      histDates.push(ds);
      allSet.add(ds);
    }

    historicalByUpcoming.set(dateStr, histDates);
  }

  return {
    allDateStrings: Array.from(allSet),
    historicalByUpcoming,
  };
}

// ─── Slot Counting ──────────────────────────────────────────────────

function countAllPeriodSlots(
  availableSlots: TurfSlot[],
  dates: { dateStr: string; dayName: string }[],
): Record<TimePeriod, number> {
  const counts: Record<TimePeriod, number> = {
    morning: 0, afternoon: 0, night: 0, midnight: 0,
  };

  const slotsByDay = new Map<string, TurfSlot[]>();
  for (const slot of availableSlots) {
    const arr = slotsByDay.get(slot.day);
    if (arr) arr.push(slot);
    else slotsByDay.set(slot.day, [slot]);
  }

  for (const { dayName } of dates) {
    const daySlots = slotsByDay.get(dayName);
    if (!daySlots) continue;

    for (const slot of daySlots) {
      const slotStart = parseHour(slot.startTime);
      const slotEnd = parseHour(slot.endTime);

      for (const period of ALL_PERIODS) {
        const [pStart, pEnd] = PERIOD_RANGES[period];
        const overlapStart = Math.max(slotStart, pStart);
        const overlapEnd = Math.min(slotEnd, pEnd);
        if (overlapEnd > overlapStart) {
          counts[period] += Math.floor(overlapEnd - overlapStart);
        }
      }
    }
  }

  return counts;
}

function getSlotCountForDayPeriod(
  availableSlots: TurfSlot[],
  dayName: string,
  period: TimePeriod,
): number {
  return countAllPeriodSlots(availableSlots, [{ dateStr: '', dayName }])[period];
}

export function countAvailableSlotsInPeriod(
  availableSlots: TurfSlot[],
  period: TimePeriod,
  dates: { dateStr: string; dayName: string }[],
): number {
  return countAllPeriodSlots(availableSlots, dates)[period];
}

// ─── Booking Counting ───────────────────────────────────────────────

async function countBookingsByDateAndPeriodBatch(
  turfIds: string[],
  dateStrings: string[],
): Promise<Map<string, Map<string, Map<TimePeriod, number>>>> {
  if (turfIds.length === 0 || dateStrings.length === 0) return new Map();

  const results = await Booking.aggregate([
    {
      $match: {
        turfId: {
          $in: turfIds.map((id) => new mongoose.Types.ObjectId(id)),
        },
        'slot.date': { $in: dateStrings },
        status: 'confirmed',
      },
    },
    {
      $addFields: {
        startHour: {
          $toInt: {
            $arrayElemAt: [{ $split: ['$slot.startTime', ':'] }, 0],
          },
        },
      },
    },
    {
      $addFields: {
        period: {
          $switch: {
            branches: [
              {
                case: {
                  $and: [{ $gte: ['$startHour', 6] }, { $lt: ['$startHour', 12] }],
                },
                then: 'morning',
              },
              {
                case: {
                  $and: [{ $gte: ['$startHour', 12] }, { $lt: ['$startHour', 18] }],
                },
                then: 'afternoon',
              },
              {
                case: {
                  $and: [{ $gte: ['$startHour', 18] }, { $lt: ['$startHour', 24] }],
                },
                then: 'night',
              },
            ],
            default: 'midnight',
          },
        },
      },
    },
    {
      $group: {
        _id: { turfId: '$turfId', date: '$slot.date', period: '$period' },
        count: { $sum: 1 },
      },
    },
  ]);

  const map = new Map<string, Map<string, Map<TimePeriod, number>>>();
  for (const r of results) {
    const turfId = r._id.turfId.toString();
    const date = r._id.date;
    const period = r._id.period as TimePeriod;
    if (!map.has(turfId)) map.set(turfId, new Map());
    if (!map.get(turfId)!.has(date)) map.get(turfId)!.set(date, new Map());
    map.get(turfId)!.get(date)!.set(period, r.count);
  }
  return map;
}

export async function countBookingsAllPeriodsBatch(
  turfIds: string[],
  dates: { dateStr: string; dayName: string }[],
): Promise<Map<string, Map<TimePeriod, number>>> {
  const dateStrings = dates.map((d) => d.dateStr);
  const detailed = await countBookingsByDateAndPeriodBatch(turfIds, dateStrings);

  const collapsed = new Map<string, Map<TimePeriod, number>>();

  Array.from(detailed.entries()).forEach(([turfId, dateMap]) => {
    if (!collapsed.has(turfId)) collapsed.set(turfId, new Map());

    Array.from(dateMap.entries()).forEach(([, periodMap]) => {
      Array.from(periodMap.entries()).forEach(([period, count]) => {
        const current = collapsed.get(turfId)!.get(period) || 0;
        collapsed.get(turfId)!.set(period, current + count);
      });
    });
  });

  return collapsed;
}

// ─── Fill Rate Blending ─────────────────────────────────────────────

function getBlendWeights(
  daysUntil: number,
  hasHistorical: boolean,
  hasTrend: boolean,
): { actual: number; historical: number; trend: number } {
  const tier = BLEND_WEIGHT_TIERS.find((t) => daysUntil <= t.maxDays)!;
  let { actual, historical, trend } = tier;

  if (!hasHistorical) {
    actual += historical;
    historical = 0;
  }
  if (!hasTrend) {
    actual += trend;
    trend = 0;
  }

  return { actual, historical, trend };
}

function computeEffectiveFillRate(
  actualFillRate: number,
  historicalFillRate: number,
  trendFillRate: number,
  daysUntilDate: number,
  hasHistorical: boolean,
  hasTrend: boolean,
): number {
  const weights = getBlendWeights(daysUntilDate, hasHistorical, hasTrend);

  const blended =
    weights.actual * actualFillRate +
    weights.historical * historicalFillRate +
    weights.trend * trendFillRate;

  return Math.max(0, Math.min(1, blended));
}

/**
 * ✅ FIX #3: Now returns BOTH blended fill rate AND actual fill rate.
 * Blended is used for discount curve.
 * Actual is used for surge check (surge = real scarcity, not predicted).
 */
function computeBlendedFillRateForPeriod(
  period: TimePeriod,
  availableSlots: TurfSlot[],
  turfDateData: Map<string, Map<TimePeriod, number>>,
  analysisDates: AnalysisDates,
): { blendedFillRate: number; actualFillRate: number } {
  // ── ACTUAL ──
  const actualCount =
    turfDateData.get(analysisDates.target)?.get(period) || 0;
  const actualSlots = getSlotCountForDayPeriod(
    availableSlots,
    analysisDates.targetDayName,
    period,
  );
  // ✅ FIX #4: Clamp to 0-1 (handles schedule changes)
  const actualFillRate = actualSlots > 0
    ? Math.min(1, actualCount / actualSlots)
    : 0;

  // ── HISTORICAL ──
  let histTotalBookings = 0;
  let histTotalSlots = 0;
  let histWeeksWithData = 0;

  for (const { dateStr, dayName } of analysisDates.historical) {
    const count = turfDateData.get(dateStr)?.get(period) || 0;
    const slots = getSlotCountForDayPeriod(availableSlots, dayName, period);
    histTotalBookings += count;
    histTotalSlots += slots;
    if (count > 0) histWeeksWithData++;
  }

  const hasHistorical = histWeeksWithData > 0;
  // ✅ FIX #4: Clamp historical fill rate
  const historicalFillRate =
    histTotalSlots > 0
      ? Math.min(1, histTotalBookings / histTotalSlots)
      : 0;

  // ── TREND ──
  let adjTotalBookings = 0;
  let adjTotalSlots = 0;
  let adjDaysWithData = 0;

  for (const { dateStr, dayName } of analysisDates.adjacent) {
    const count = turfDateData.get(dateStr)?.get(period) || 0;
    const slots = getSlotCountForDayPeriod(availableSlots, dayName, period);
    adjTotalBookings += count;
    adjTotalSlots += slots;
    if (count > 0) adjDaysWithData++;
  }

  const hasTrend = adjDaysWithData > 0;
  const trendFillRate =
    adjTotalSlots > 0
      ? Math.min(1, adjTotalBookings / adjTotalSlots)
      : 0;

  // ── BLEND ──
  const blendedFillRate = computeEffectiveFillRate(
    actualFillRate,
    historicalFillRate,
    trendFillRate,
    analysisDates.daysUntilTarget,
    hasHistorical,
    hasTrend,
  );

  return { blendedFillRate, actualFillRate };
}

// ─── Discount Sub-Functions ─────────────────────────────────────────

function getBaseDiscountFraction(fillRate: number): number {
  if (fillRate >= PEAK_THRESHOLD) return 0;
  return 1 - fillRate / PEAK_THRESHOLD;
}

function getUrgencyMultiplier(hoursUntilPeriodStart?: number): number {
  if (hoursUntilPeriodStart === undefined) return 1.0;
  if (hoursUntilPeriodStart <= 0) return 1.50;
  if (hoursUntilPeriodStart <= 2) return 1.35;
  if (hoursUntilPeriodStart <= 4) return 1.20;
  if (hoursUntilPeriodStart <= 8) return 1.10;
  if (hoursUntilPeriodStart <= 24) return 1.0;
  if (hoursUntilPeriodStart <= 48) return 0.95;
  return 0.90;
}

function getDayTypeMultiplier(dayOfWeek?: number): number {
  if (dayOfWeek === undefined) return 1.0;
  return DAY_MULTIPLIERS[dayOfWeek] ?? 1.0;
}

/**
 * ✅ FIX #3: Surge now uses ACTUAL fill rate, not blended.
 * Surge = real scarcity right now, not predicted scarcity.
 */
function getSurgeResult(
  originalPrice: number,
  actualFillRate: number,
  maxSurgePercent: number,
): DiscountResult | null {
  if (maxSurgePercent <= 0 || actualFillRate < SURGE_THRESHOLD) return null;

  const surgeProgress = Math.min(
    1,
    (actualFillRate - SURGE_THRESHOLD) / (1 - SURGE_THRESHOLD),
  );
  const surgePercent = Math.round(maxSurgePercent * surgeProgress);
  if (surgePercent <= 0) return null;

  const surgeAmount = Math.round((originalPrice * surgePercent) / 100);
  return {
    originalPrice,
    offerPrice: originalPrice + surgeAmount,
    discountPercent: 0,
    discountAmount: 0,
    offerLabel: '🔥 High Demand',
    isSurge: true,
  };
}

// ─── Core Discount Calculation ──────────────────────────────────────

/**
 * ✅ FIX #3: Now accepts actualFillRate separately for surge check.
 *
 * - effectiveFillRate (blended) → used for discount curve
 * - context.actualFillRate      → used for surge check
 */
export function calculateDynamicDiscount(
  originalPrice: number,
  maxDiscountPercent: number,
  effectiveFillRate: number,
  context?: PricingContext,
  maxSurgePercent: number = 0,
): DiscountResult {
  if (!maxDiscountPercent || maxDiscountPercent <= 0) {
    return NO_DISCOUNT(originalPrice);
  }

  // ✅ FIX #3: Surge uses ACTUAL fill rate from context
  const actualForSurge = context?.actualFillRate ?? effectiveFillRate;
  const surgeResult = getSurgeResult(originalPrice, actualForSurge, maxSurgePercent);
  if (surgeResult) return surgeResult;

  // Smooth base discount from blended fill rate
  const baseFraction = getBaseDiscountFraction(effectiveFillRate);
  if (baseFraction <= 0) return NO_DISCOUNT(originalPrice);

  const urgency = getUrgencyMultiplier(context?.hoursUntilPeriodStart);
  const dayType = getDayTypeMultiplier(context?.dayOfWeek);

  const effectiveFraction = Math.min(1.0, baseFraction * urgency * dayType);
  const discountPercent = Math.round(maxDiscountPercent * effectiveFraction);

  if (discountPercent < MIN_DISPLAY_THRESHOLD) {
    return NO_DISCOUNT(originalPrice);
  }

  const discountAmount = Math.round((originalPrice * discountPercent) / 100);

  return {
    originalPrice,
    offerPrice: originalPrice - discountAmount,
    discountPercent,
    discountAmount,
    offerLabel: `${discountPercent}% OFF`,
    isSurge: false,
  };
}

// ─── Public API Functions ───────────────────────────────────────────

/**
 * BOOKING PAGE: Per-period discounts for a SPECIFIC DATE.
 */
export async function calculatePeriodDiscountsForDate(
  turf: TurfInput,
  dateStr: string,
): Promise<PeriodDiscounts> {
  const maxDiscount = turf.maxDiscount || 0;
  if (maxDiscount <= 0) return NO_DISCOUNT_ALL_PERIODS(turf.pricing);

  const turfId = turf._id.toString();
  const analysis = getAnalysisDates(dateStr);

  const allData = await countBookingsByDateAndPeriodBatch(
    [turfId],
    analysis.allDateStrings,
  );
  const turfDateData = allData.get(turfId) || new Map();

  // ✅ FIX #1: Parse date locally
  const [year, month, day] = dateStr.split('-').map(Number);
  const targetDate = new Date(year, month - 1, day);
  const dayOfWeek = targetDate.getDay();

  const result = {} as PeriodDiscounts;

  for (const period of ALL_PERIODS) {
    const periodSlots = getSlotCountForDayPeriod(
      turf.availableSlots || [],
      analysis.targetDayName,
      period,
    );

    // ✅ FIX #2: No slots = NO DISCOUNT (not max discount)
    if (periodSlots <= 0) {
      result[period] = NO_DISCOUNT(turf.pricing);
      continue;
    }

    // ✅ FIX #3: Get both blended and actual fill rates
    const { blendedFillRate, actualFillRate } = computeBlendedFillRateForPeriod(
      period,
      turf.availableSlots || [],
      turfDateData,
      analysis,
    );

    const context: PricingContext = {
      hoursUntilPeriodStart: getHoursUntilPeriod(dateStr, period),
      dayOfWeek,
      actualFillRate, // ✅ FIX #3: Pass actual for surge
    };

    result[period] = calculateDynamicDiscount(
      turf.pricing,
      maxDiscount,
      blendedFillRate, // discount uses blended
      context,
      turf.maxSurge || 0,
    );
  }

  return result;
}

/**
 * TURF DETAIL PAGE: Per-period discounts using 4-day average.
 */
export async function calculateAllPeriodDiscounts(
  turf: TurfInput,
): Promise<PeriodDiscounts> {
  const maxDiscount = turf.maxDiscount || 0;
  if (maxDiscount <= 0) return NO_DISCOUNT_ALL_PERIODS(turf.pricing);

  const turfId = turf._id.toString();
  const upcomingDates = getNextDates(4);

  const { allDateStrings, historicalByUpcoming } =
    getAnalysisDatesForRange(upcomingDates);

  const allData = await countBookingsByDateAndPeriodBatch(
    [turfId],
    allDateStrings,
  );
  const turfDateData = allData.get(turfId) || new Map();

  const result = {} as PeriodDiscounts;

  for (const period of ALL_PERIODS) {
    let totalEffectiveFillRate = 0;
    let daysWithSlots = 0;

    for (const { dateStr, dayName } of upcomingDates) {
      const slotsForDay = getSlotCountForDayPeriod(
        turf.availableSlots || [],
        dayName,
        period,
      );
      if (slotsForDay <= 0) continue;

      const actualCount =
        turfDateData.get(dateStr)?.get(period) || 0;
      // ✅ FIX #4: Clamp fill rate
      const actualFill = Math.min(1, actualCount / slotsForDay);

      const histDates = historicalByUpcoming.get(dateStr) || [];
      let histTotal = 0;
      let histSlots = 0;
      let histHasData = false;

      for (const hd of histDates) {
        const hCount = turfDateData.get(hd)?.get(period) || 0;
        histTotal += hCount;
        histSlots += slotsForDay;
        if (hCount > 0) histHasData = true;
      }
      // ✅ FIX #4: Clamp
      const histFill = histSlots > 0
        ? Math.min(1, histTotal / histSlots)
        : 0;

      const blended = histHasData
        ? 0.5 * actualFill + 0.5 * histFill
        : actualFill;

      totalEffectiveFillRate += blended;
      daysWithSlots++;
    }

    // ✅ FIX #2: If NO days have slots for this period → NO DISCOUNT
    if (daysWithSlots === 0) {
      result[period] = NO_DISCOUNT(turf.pricing);
      continue;
    }

    const avgFillRate = totalEffectiveFillRate / daysWithSlots;

    result[period] = calculateDynamicDiscount(
      turf.pricing,
      maxDiscount,
      avgFillRate,
      undefined, // no urgency/day-type for overview
      turf.maxSurge || 0,
    );
  }

  return result;
}

/**
 * ✅ FIX #5: Find best discount from BOOKABLE periods only.
 * Excludes midnight (0-6 AM) since almost no turf operates then.
 * Prevents "Up to 30% OFF" labels from midnight period
 * when actual operating hours have 5-8% discount.
 *
 * Falls back to checking all periods if no bookable period has a discount.
 */
export function getBestDiscount(
  periodDiscounts: PeriodDiscounts,
): DiscountResult {
  // First try: only bookable periods (morning, afternoon, night)
  let best: DiscountResult | null = null;

  for (const period of BOOKABLE_PERIODS) {
    const d = periodDiscounts[period];
    if (!best || d.discountPercent > best.discountPercent) {
      best = d;
    }
  }

  // If bookable periods have discount, use that
  if (best && best.discountPercent > 0) return best;

  // Fallback: check all periods (including midnight)
  let fallback = periodDiscounts.morning;
  for (const period of ALL_PERIODS) {
    if (periodDiscounts[period].discountPercent > fallback.discountPercent) {
      fallback = periodDiscounts[period];
    }
  }

  return fallback;
}

/**
 * BROWSE PAGE: Enrich turfs with best offer.
 */
export async function enrichTurfsWithOffers(
  turfs: TurfInput[],
): Promise<Map<string, TurfWithOffer>> {
  const offerMap = new Map<string, TurfWithOffer>();

  const dynamicTurfs: TurfInput[] = [];
  for (const turf of turfs) {
    if (turf.maxDiscount && turf.maxDiscount > 0) {
      dynamicTurfs.push(turf);
    } else {
      offerMap.set(turf._id.toString(), {
        originalPrice: turf.pricing,
        offerPrice: turf.pricing,
        discountPercent: 0,
        discountAmount: 0,
        offerLabel: '',
      });
    }
  }

  if (dynamicTurfs.length === 0) return offerMap;

  const upcomingDates = getNextDates(4);
  const dynamicIds = dynamicTurfs.map((t) => t._id.toString());

  const { allDateStrings, historicalByUpcoming } =
    getAnalysisDatesForRange(upcomingDates);

  const allData = await countBookingsByDateAndPeriodBatch(
    dynamicIds,
    allDateStrings,
  );

  for (const turf of dynamicTurfs) {
    const id = turf._id.toString();
    const turfDateData = allData.get(id) || new Map();
    let bestDiscount: DiscountResult | null = null;

    // ✅ FIX #5: Only check BOOKABLE periods for best offer
    for (const period of BOOKABLE_PERIODS) {
      let totalFillRate = 0;
      let daysWithSlots = 0;

      for (const { dateStr, dayName } of upcomingDates) {
        const slotsForDay = getSlotCountForDayPeriod(
          turf.availableSlots || [],
          dayName,
          period,
        );
        if (slotsForDay <= 0) continue;

        const actualCount =
          turfDateData.get(dateStr)?.get(period) || 0;
        const actualFill = Math.min(1, actualCount / slotsForDay);

        const histDates = historicalByUpcoming.get(dateStr) || [];
        let histTotal = 0;
        let histSlots = 0;
        let histHasData = false;

        for (const hd of histDates) {
          const hCount = turfDateData.get(hd)?.get(period) || 0;
          histTotal += hCount;
          histSlots += slotsForDay;
          if (hCount > 0) histHasData = true;
        }
        const histFill = histSlots > 0
          ? Math.min(1, histTotal / histSlots)
          : 0;

        const blended = histHasData
          ? 0.5 * actualFill + 0.5 * histFill
          : actualFill;

        totalFillRate += blended;
        daysWithSlots++;
      }

      // ✅ FIX #2: Skip period if no slots exist
      if (daysWithSlots === 0) continue;

      const avgFillRate = totalFillRate / daysWithSlots;

      const discount = calculateDynamicDiscount(
        turf.pricing,
        turf.maxDiscount || 0,
        avgFillRate,
        undefined,
        turf.maxSurge || 0,
      );

      if (
        !bestDiscount ||
        discount.discountPercent > bestDiscount.discountPercent
      ) {
        bestDiscount = discount;
      }
    }

    // If no bookable period has a discount, show no offer
    const d = bestDiscount || NO_DISCOUNT(turf.pricing);

    offerMap.set(id, {
      originalPrice: d.originalPrice,
      offerPrice: d.offerPrice,
      discountPercent: d.discountPercent,
      discountAmount: d.discountAmount,
      offerLabel:
        d.discountPercent > 0 ? `Up to ${d.discountPercent}% OFF` : '',
    });
  }

  return offerMap;
}