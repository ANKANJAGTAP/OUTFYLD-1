import Booking from '@/app/models/Booking';

/**
 * Dynamic Pricing Engine — Phase 2
 *
 * Calculates per-period discounts (Morning / Afternoon / Night / Midnight)
 * based on booking demand over the next 4 days.
 *
 * The discount scales between 0 % and the owner's maxDiscount:
 *   fillRate >= 70%  →  0 % of maxDiscount   (peak — no discount)
 *   fillRate >= 40%  → 25 % of maxDiscount
 *   fillRate >= 20%  → 50 % of maxDiscount
 *   fillRate <  20%  → 100% of maxDiscount   (low demand — full discount)
 */

// ─── Types ───────────────────────────────────────────────────────────
export type TimePeriod = 'morning' | 'afternoon' | 'night' | 'midnight';

export interface DiscountResult {
  originalPrice: number;
  offerPrice: number;
  discountPercent: number;
  discountAmount: number;
  offerLabel: string;
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

const ALL_PERIODS: TimePeriod[] = ['morning', 'afternoon', 'night', 'midnight'];

// ─── Helpers ─────────────────────────────────────────────────────────

/** Map an hour (0–23) to a time period */
export function getTimePeriod(hour: number): TimePeriod {
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 24) return 'night';
  return 'midnight'; // 0–5
}

/** Hour ranges for each period */
const PERIOD_RANGES: Record<TimePeriod, [number, number]> = {
  morning:   [6, 12],
  afternoon: [12, 18],
  night:     [18, 24],
  midnight:  [0, 6],
};

/** Convert "HH:MM" to a decimal hour (e.g. "14:30" → 14.5) */
function parseHour(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h + (m || 0) / 60;
}

/** Get the day name ("Monday", …) from a Date */
function getDayName(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/** Get next N dates starting from today */
export function getNextDates(n: number): { dateStr: string; dayName: string }[] {
  const results: { dateStr: string; dayName: string }[] = [];
  const now = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    results.push({ dateStr: `${yyyy}-${mm}-${dd}`, dayName: getDayName(d) });
  }
  return results;
}

// ─── Slot counting ──────────────────────────────────────────────────

export function countAvailableSlotsInPeriod(
  availableSlots: TurfSlot[],
  period: TimePeriod,
  dates: { dateStr: string; dayName: string }[],
): number {
  const [periodStart, periodEnd] = PERIOD_RANGES[period];
  let total = 0;

  for (const { dayName } of dates) {
    const daySlots = availableSlots.filter((s) => s.day === dayName);
    for (const slot of daySlots) {
      const slotStart = parseHour(slot.startTime);
      const slotEnd   = parseHour(slot.endTime);
      const overlapStart = Math.max(slotStart, periodStart);
      const overlapEnd   = Math.min(slotEnd, periodEnd);
      if (overlapEnd > overlapStart) {
        total += Math.floor(overlapEnd - overlapStart);
      }
    }
  }
  return total;
}

// ─── Booking counting (batch, all periods) ──────────────────────────

/**
 * Count confirmed bookings for multiple turfs across ALL periods
 * in a single aggregation query. Returns Map<turfId, Map<period, count>>.
 */
export async function countBookingsAllPeriodsBatch(
  turfIds: string[],
  dates: { dateStr: string; dayName: string }[],
): Promise<Map<string, Map<TimePeriod, number>>> {
  const dateStrings = dates.map((d) => d.dateStr);
  const mongoose = require('mongoose');

  const results = await Booking.aggregate([
    {
      $match: {
        turfId: { $in: turfIds.map((id) => new mongoose.Types.ObjectId(id)) },
        'slot.date': { $in: dateStrings },
        status: 'confirmed',
      },
    },
    {
      $project: {
        turfId: 1,
        startHour: {
          $toInt: { $substr: ['$slot.startTime', 0, 2] },
        },
      },
    },
    {
      $addFields: {
        period: {
          $switch: {
            branches: [
              { case: { $and: [{ $gte: ['$startHour', 6] }, { $lt: ['$startHour', 12] }] }, then: 'morning' },
              { case: { $and: [{ $gte: ['$startHour', 12] }, { $lt: ['$startHour', 18] }] }, then: 'afternoon' },
              { case: { $and: [{ $gte: ['$startHour', 18] }, { $lt: ['$startHour', 24] }] }, then: 'night' },
            ],
            default: 'midnight',
          },
        },
      },
    },
    {
      $group: {
        _id: { turfId: '$turfId', period: '$period' },
        count: { $sum: 1 },
      },
    },
  ]);

  const map = new Map<string, Map<TimePeriod, number>>();
  for (const r of results) {
    const turfId = r._id.turfId.toString();
    if (!map.has(turfId)) map.set(turfId, new Map());
    map.get(turfId)!.set(r._id.period as TimePeriod, r.count);
  }
  return map;
}

/** Legacy helper — count for a single period (used by booking create API) */
export async function countBookingsInPeriodBatch(
  turfIds: string[],
  period: TimePeriod,
  dates: { dateStr: string; dayName: string }[],
): Promise<Map<string, number>> {
  const allCounts = await countBookingsAllPeriodsBatch(turfIds, dates);
  const map = new Map<string, number>();
  Array.from(allCounts.entries()).forEach(([turfId, periodMap]) => {
    map.set(turfId, periodMap.get(period) || 0);
  });
  return map;
}

// ─── Core discount calculation ──────────────────────────────────────

export function calculateDynamicDiscount(
  originalPrice: number,
  maxDiscountPercent: number,
  confirmedBookings: number,
  totalAvailableSlots: number,
): DiscountResult {
  if (!maxDiscountPercent || maxDiscountPercent <= 0) {
    return {
      originalPrice,
      offerPrice: originalPrice,
      discountPercent: 0,
      discountAmount: 0,
      offerLabel: '',
    };
  }

  if (totalAvailableSlots <= 0) {
    const discountPercent = maxDiscountPercent;
    const discountAmount = Math.round((originalPrice * discountPercent) / 100);
    return {
      originalPrice,
      offerPrice: originalPrice - discountAmount,
      discountPercent,
      discountAmount,
      offerLabel: `${discountPercent}% OFF`,
    };
  }

  const fillRate = confirmedBookings / totalAvailableSlots;

  let discountFraction: number;
  if (fillRate >= 0.7) {
    discountFraction = 0;      // peak — no discount
  } else if (fillRate >= 0.4) {
    discountFraction = 0.25;   // moderate-high demand
  } else if (fillRate >= 0.2) {
    discountFraction = 0.5;    // moderate demand
  } else {
    discountFraction = 1.0;    // low demand — full max discount
  }

  const discountPercent = Math.round(maxDiscountPercent * discountFraction);
  const discountAmount  = Math.round((originalPrice * discountPercent) / 100);
  const offerPrice      = originalPrice - discountAmount;

  return {
    originalPrice,
    offerPrice,
    discountPercent,
    discountAmount,
    offerLabel: discountPercent > 0 ? `${discountPercent}% OFF` : '',
  };
}

// ─── Per-period discount calculation ────────────────────────────────

/**
 * Calculate per-period discounts for a SPECIFIC DATE.
 * Used by the booking page — shows slot prices based on that day's demand only.
 */
export async function calculatePeriodDiscountsForDate(
  turf: {
    _id: any;
    pricing: number;
    maxDiscount?: number;
    availableSlots?: TurfSlot[];
  },
  dateStr: string, // YYYY-MM-DD
): Promise<PeriodDiscounts> {
  const turfId = turf._id.toString();
  const d = new Date(dateStr + 'T00:00:00');
  const dayName = getDayName(d);
  const singleDate = [{ dateStr, dayName }];

  // Count bookings for just this one date
  const allBookingCounts = await countBookingsAllPeriodsBatch([turfId], singleDate);
  const periodCounts = allBookingCounts.get(turfId) || new Map();

  const result = {} as PeriodDiscounts;

  for (const period of ALL_PERIODS) {
    const confirmedBookings = periodCounts.get(period) || 0;
    // Count available slots for just this one day
    const totalSlots = countAvailableSlotsInPeriod(
      turf.availableSlots || [],
      period,
      singleDate,
    );

    result[period] = calculateDynamicDiscount(
      turf.pricing,
      turf.maxDiscount || 0,
      confirmedBookings,
      totalSlots,
    );
  }

  return result;
}

/**
 * Calculate dynamic discount for ALL 4 time periods for a single turf
 * using 4-day average demand. Used by browse card and turf detail header.
 */
export async function calculateAllPeriodDiscounts(
  turf: {
    _id: any;
    pricing: number;
    maxDiscount?: number;
    availableSlots?: TurfSlot[];
  },
): Promise<PeriodDiscounts> {
  const dates = getNextDates(4);
  const turfId = turf._id.toString();

  const allBookingCounts = await countBookingsAllPeriodsBatch([turfId], dates);
  const periodCounts = allBookingCounts.get(turfId) || new Map();

  const result = {} as PeriodDiscounts;

  for (const period of ALL_PERIODS) {
    const confirmedBookings = periodCounts.get(period) || 0;
    const totalSlots = countAvailableSlotsInPeriod(
      turf.availableSlots || [],
      period,
      dates,
    );

    result[period] = calculateDynamicDiscount(
      turf.pricing,
      turf.maxDiscount || 0,
      confirmedBookings,
      totalSlots,
    );
  }

  return result;
}

/**
 * Find the best (highest) discount across all periods.
 * Used by browse page to show the most attractive offer.
 */
export function getBestDiscount(periodDiscounts: PeriodDiscounts): DiscountResult {
  let best: DiscountResult = periodDiscounts.morning;

  for (const period of ALL_PERIODS) {
    if (periodDiscounts[period].discountPercent > best.discountPercent) {
      best = periodDiscounts[period];
    }
  }

  return best;
}

// ─── High-level function for the browse API ─────────────────────────

/**
 * Enrich a list of turfs with their BEST dynamic offer (highest discount
 * across all periods). Uses a single batch query for all turfs.
 */
export async function enrichTurfsWithOffers(
  turfs: Array<{
    _id: any;
    pricing: number;
    maxDiscount?: number;
    availableSlots?: TurfSlot[];
  }>,
): Promise<Map<string, TurfWithOffer>> {
  const dates = getNextDates(4);

  const turfIds = turfs.map((t) => t._id.toString());
  const allBookingCounts = await countBookingsAllPeriodsBatch(turfIds, dates);

  const offerMap = new Map<string, TurfWithOffer>();

  for (const turf of turfs) {
    const id = turf._id.toString();
    const periodCounts = allBookingCounts.get(id) || new Map();

    // Calculate discount for each period, find best
    let bestDiscount: DiscountResult | null = null;

    for (const period of ALL_PERIODS) {
      const confirmedBookings = periodCounts.get(period) || 0;
      const totalSlots = countAvailableSlotsInPeriod(
        turf.availableSlots || [],
        period,
        dates,
      );

      const discount = calculateDynamicDiscount(
        turf.pricing,
        turf.maxDiscount || 0,
        confirmedBookings,
        totalSlots,
      );

      if (!bestDiscount || discount.discountPercent > bestDiscount.discountPercent) {
        bestDiscount = discount;
      }
    }

    const d = bestDiscount!;
    offerMap.set(id, {
      originalPrice: d.originalPrice,
      offerPrice: d.offerPrice,
      discountPercent: d.discountPercent,
      discountAmount: d.discountAmount,
      offerLabel: d.discountPercent > 0 ? `Up to ${d.discountPercent}% OFF` : '',
    });
  }

  return offerMap;
}
