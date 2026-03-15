'use client';

import React, { useState, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { 
  format, 
  addDays, 
  startOfWeek, 
  isSameDay, 
  isPast, 
  isToday, 
  addWeeks, 
  subWeeks,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  addMonths,
  isAfter,
  startOfDay
} from 'date-fns';

interface WeekCalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  className?: string;
}

const WeekCalendar = memo(function WeekCalendar({ selectedDate, onDateSelect, className }: WeekCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = startOfDay(new Date());
  const maxBookingDate = addMonths(today, 1); // 1 month from today

  // Get all days in the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the first day of the week for the month (to align the grid)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = addDays(calendarStart, 41); // 6 weeks worth of days
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => addMonths(prev, -1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  const isDayPast = (date: Date) => {
    return isPast(date) && !isToday(date);
  };

  const isDaySelected = (date: Date) => {
    return selectedDate ? isSameDay(date, selectedDate) : false;
  };

  const isDayDisabled = (date: Date) => {
    return isDayPast(date) || isAfter(date, maxBookingDate);
  };

  const isDayInCurrentMonth = (date: Date) => {
    return isSameMonth(date, currentMonth);
  };

  // Check if we can navigate to previous/next month
  const canGoToPrevious = !isSameMonth(currentMonth, today);
  const canGoToNext = !isSameMonth(currentMonth, maxBookingDate);

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-blue-600" />
            <span className="text-lg">Select Date</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Month Navigation */}
        <div className="flex items-center justify-between">
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            onClick={goToPreviousMonth}
            disabled={!canGoToPrevious}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <p className="text-xs text-gray-500">
              Book up to {format(maxBookingDate, 'MMM d, yyyy')}
            </p>
          </div>
          
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            onClick={goToNextMonth}
            disabled={!canGoToNext}
            className="flex items-center gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.slice(0, 42).map((date, index) => {
            const isSelected = isDaySelected(date);
            const isDisabled = isDayDisabled(date);
            const isTodayDay = isToday(date);
            const isCurrentMonth = isDayInCurrentMonth(date);

            return (
              <Button
                key={index}
                type="button"
                variant="ghost"
                className={`
                  h-12 w-full p-1 relative text-sm font-medium
                  ${!isCurrentMonth ? 'text-gray-300 hover:text-gray-400' : ''}
                  ${isDisabled ? 'opacity-40 cursor-not-allowed hover:bg-transparent' : ''}
                  ${isTodayDay && !isSelected ? 'bg-blue-50 text-blue-700 border border-blue-200' : ''}
                  ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                  ${!isDisabled && !isSelected && isCurrentMonth ? 'hover:bg-gray-100' : ''}
                `}
                disabled={isDisabled}
                onClick={() => {
                  if (!isDisabled) onDateSelect(date);
                }}
              >
                <span className="relative z-10">
                  {format(date, 'd')}
                </span>
                
                {/* Today indicator */}
                {isTodayDay && !isSelected && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                )}
                
                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute inset-0 bg-blue-600 rounded-md"></div>
                )}
              </Button>
            );
          })}
        </div>

        {/* Today Button */}
        {!isSameMonth(currentMonth, today) && (
          <div className="flex justify-center pt-2">
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              onClick={goToCurrentMonth}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <Clock className="h-4 w-4 mr-1" />
              Go to Today
            </Button>
          </div>
        )}

        {/* Selected Date Info */}
        {selectedDate && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-900">
                  Selected Date
                </p>
                <p className="text-lg font-semibold text-green-800">
                  {format(selectedDate, 'EEEE, MMM d, yyyy')}
                </p>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {isSameDay(selectedDate, today) ? 'Today' : 
                 format(selectedDate, 'EEE')}
              </Badge>
            </div>
          </div>
        )}

        {/* Booking Restrictions Info */}
        <div className="text-xs text-gray-500 text-center space-y-1 pt-2 border-t">
          <p>• Bookings available for the next 30 days</p>
          <p>• Past dates are not available for booking</p>
        </div>
      </CardContent>
    </Card>
  );
});

export { WeekCalendar };