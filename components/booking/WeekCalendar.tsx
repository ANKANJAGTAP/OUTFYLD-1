'use client';

import React, { useState, memo } from 'react';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import {
  format,
  addDays,
  startOfWeek,
  isSameDay,
  isPast,
  isToday,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  isAfter,
  startOfDay,
} from 'date-fns';

interface WeekCalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  className?: string;
}

/**
 * Night Match booking calendar — dark grid, Geist Mono digits, lime
 * selection ring with flood glow. No default white calendar anywhere.
 */
const WeekCalendar = memo(function WeekCalendar({
  selectedDate,
  onDateSelect,
  className = '',
}: WeekCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = startOfDay(new Date());
  const maxBookingDate = addMonths(today, 1); // 1 month from today

  const monthStart = startOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = addDays(calendarStart, 41); // 6 weeks
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const goToPreviousMonth = () => setCurrentMonth((prev) => addMonths(prev, -1));
  const goToNextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));
  const goToCurrentMonth = () => setCurrentMonth(new Date());

  const isDayPast = (date: Date) => isPast(date) && !isToday(date);
  const isDaySelected = (date: Date) => (selectedDate ? isSameDay(date, selectedDate) : false);
  const isDayDisabled = (date: Date) => isDayPast(date) || isAfter(date, maxBookingDate);
  const isDayInCurrentMonth = (date: Date) => isSameMonth(date, currentMonth);

  const canGoToPrevious = !isSameMonth(currentMonth, today);
  const canGoToNext = !isSameMonth(currentMonth, maxBookingDate);

  const navBtn =
    'inline-flex items-center gap-1 rounded-[3px] border border-pitchline px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-100 transition-colors duration-200 ease-night hover:border-flood-500 hover:text-flood-500 disabled:pointer-events-none disabled:opacity-30';

  return (
    <div className={`rounded-[4px] border border-pitchline bg-pitch-700/90 ${className}`}>
      <div className="border-b border-pitchline/60 px-6 py-4">
        <p className="nm-overline text-chalk-400">Pick your matchday</p>
      </div>

      <div className="space-y-4 p-6">
        {/* Month navigation */}
        <div className="flex items-center justify-between">
          <button type="button" onClick={goToPreviousMonth} disabled={!canGoToPrevious} className={navBtn}>
            <ChevronLeft className="h-3.5 w-3.5" />
            Prev
          </button>

          <div className="text-center">
            <h3 className="font-display text-2xl uppercase tracking-tight text-chalk-100">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-chalk-400">
              Book up to {format(maxBookingDate, 'MMM d')}
            </p>
          </div>

          <button type="button" onClick={goToNextMonth} disabled={!canGoToNext} className={navBtn}>
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
            <div
              key={day}
              className="py-1.5 text-center font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid — mono digits, lime selection */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.slice(0, 42).map((date, index) => {
            const isSelected = isDaySelected(date);
            const isDisabled = isDayDisabled(date);
            const isTodayDay = isToday(date);
            const isCurrentMonth = isDayInCurrentMonth(date);

            return (
              <button
                key={index}
                type="button"
                disabled={isDisabled}
                onClick={() => {
                  if (!isDisabled) onDateSelect(date);
                }}
                className={`relative h-11 w-full rounded-[3px] font-mono text-sm tabular-nums transition-[background-color,color,box-shadow] duration-200 ease-night ${
                  isSelected
                    ? 'bg-flood-500 font-semibold text-pitch-900 shadow-flood'
                    : isDisabled
                      ? 'cursor-not-allowed text-chalk-400/25'
                      : isCurrentMonth
                        ? 'text-chalk-100 hover:bg-white/5 hover:text-flood-500'
                        : 'text-chalk-400/40 hover:text-chalk-400'
                } ${isTodayDay && !isSelected ? 'border border-flood-500/50' : ''}`}
              >
                {format(date, 'd')}
                {isTodayDay && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-flood-500" />
                )}
              </button>
            );
          })}
        </div>

        {/* Back to today */}
        {!isSameMonth(currentMonth, today) && (
          <div className="flex justify-center pt-1">
            <button type="button" onClick={goToCurrentMonth} className={navBtn}>
              <Clock className="h-3.5 w-3.5" />
              Go to today
            </button>
          </div>
        )}

        {/* Selected date readout */}
        {selectedDate && (
          <div className="flex items-center justify-between rounded-[3px] border border-flood-500/40 bg-flood-500/[0.06] px-4 py-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-chalk-400">
                Matchday
              </p>
              <p className="font-display text-xl uppercase tracking-tight text-chalk-100">
                {format(selectedDate, 'EEEE, MMM d')}
              </p>
            </div>
            <span className="nm-overline text-flood-500">
              {isSameDay(selectedDate, today) ? 'Today' : format(selectedDate, 'EEE')}
            </span>
          </div>
        )}

        <div className="space-y-1 border-t border-pitchline/60 pt-3 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-chalk-400/80">
          <p>Bookings open for the next 30 days</p>
        </div>
      </div>
    </div>
  );
});

export { WeekCalendar };
