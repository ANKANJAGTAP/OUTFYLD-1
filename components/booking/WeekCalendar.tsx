'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { format, addDays, startOfWeek, isSameDay, isPast, isToday, addWeeks, subWeeks } from 'date-fns';

interface WeekCalendarProps {
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  className?: string;
}

export function WeekCalendar({ selectedDate, onDateSelect, className }: WeekCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());

  // Get the start of the current week (Monday)
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  
  // Generate 7 days for the week
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const goToPreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  const goToNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const getDayName = (date: Date) => {
    return format(date, 'EEE'); // Mon, Tue, Wed, etc.
  };

  const getDateNumber = (date: Date) => {
    return format(date, 'd'); // 1, 2, 3, etc.
  };

  const getMonthYear = () => {
    return format(weekStart, 'MMMM yyyy'); // October 2025
  };

  const isDayPast = (date: Date) => {
    return isPast(date) && !isToday(date);
  };

  const isDaySelected = (date: Date) => {
    return selectedDate ? isSameDay(date, selectedDate) : false;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            <span>Select Date</span>
          </div>
          <div className="text-lg font-semibold">{getMonthYear()}</div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Week Navigation */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
              Previous Week
            </Button>
            <Button variant="outline" size="sm" onClick={goToCurrentWeek}>
              This Week
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              Next Week
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Week Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((date, index) => {
              const isSelected = isDaySelected(date);
              const isPastDay = isDayPast(date);
              const isTodayDay = isToday(date);

              return (
                <Button
                  key={index}
                  variant={isSelected ? "default" : "outline"}
                  className={`flex flex-col p-3 h-auto ${
                    isPastDay 
                      ? 'opacity-50 text-gray-400 cursor-not-allowed' 
                      : isTodayDay 
                      ? 'ring-2 ring-blue-500 ring-offset-2' 
                      : ''
                  } ${
                    isSelected ? 'bg-blue-600 hover:bg-blue-700' : ''
                  }`}
                  disabled={isPastDay}
                  onClick={() => !isPastDay && onDateSelect(date)}
                >
                  <span className="text-xs font-medium">{getDayName(date)}</span>
                  <span className="text-lg font-bold">{getDateNumber(date)}</span>
                  {isTodayDay && <span className="text-xs text-blue-600">Today</span>}
                </Button>
              );
            })}
          </div>

          {/* Selected Date Info */}
          {selectedDate && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900">
                Selected Date: {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}