'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Plus, Trash2, Calendar, Zap } from 'lucide-react';

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface SlotManagerProps {
  value: TimeSlot[];
  onChange: (slots: TimeSlot[]) => void;
}

const DAYS = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 
  'Friday', 'Saturday', 'Sunday'
];

const TIME_OPTIONS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00', '23:00'
];

export function SlotManager({ value, onChange }: SlotManagerProps) {
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  // Generate 1-hour slots automatically
  const generateHourlySlots = () => {
    if (!selectedDay || !startTime || !endTime) {
      alert('Please select day, start time, and end time');
      return;
    }

    const start = parseInt(startTime.split(':')[0]);
    const end = parseInt(endTime.split(':')[0]);
    
    if (end <= start) {
      alert('End time must be after start time');
      return;
    }

    // Remove existing slots for this day to avoid duplicates
    const otherDaySlots = value.filter(slot => slot.day !== selectedDay);
    
    // Generate new hourly slots
    const newSlots: TimeSlot[] = [];
    for (let hour = start; hour < end; hour++) {
      const slotStart = `${hour.toString().padStart(2, '0')}:00`;
      const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;
      
      newSlots.push({
        day: selectedDay,
        startTime: slotStart,
        endTime: slotEnd
      });
    }

    onChange([...otherDaySlots, ...newSlots]);
    setSelectedDay('');
    setStartTime('');
    setEndTime('');
  };

  const generateCommonSchedule = (scheduleType: 'weekdays' | 'weekends' | 'all') => {
    const daysToGenerate = 
      scheduleType === 'weekdays' ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] :
      scheduleType === 'weekends' ? ['Saturday', 'Sunday'] :
      DAYS;

    const newSlots: TimeSlot[] = [];
    
    // Generate extended business hours: 6 AM to 11 PM
    daysToGenerate.forEach(day => {
      for (let hour = 6; hour < 23; hour++) {
        const slotStart = `${hour.toString().padStart(2, '0')}:00`;
        const slotEnd = `${(hour + 1).toString().padStart(2, '0')}:00`;
        
        newSlots.push({
          day,
          startTime: slotStart,
          endTime: slotEnd
        });
      }
    });

    // Remove existing slots for these days
    const existingSlots = value.filter(slot => !daysToGenerate.includes(slot.day));
    onChange([...existingSlots, ...newSlots]);
  };

  const removeSlot = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const removeDaySlots = (day: string) => {
    onChange(value.filter(slot => slot.day !== day));
  };

  const getSlotsByDay = () => {
    const slotsByDay: { [key: string]: TimeSlot[] } = {};
    
    DAYS.forEach(day => {
      slotsByDay[day] = value
        .filter(slot => slot.day === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
    });
    
    return slotsByDay;
  };

  const slotsByDay = getSlotsByDay();

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-blue-600" />
            Time Slot Management
          </CardTitle>
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              Select a day and time range to automatically generate 1-hour slots. 
              Each booking will be exactly 1 hour long.
            </AlertDescription>
          </Alert>
        </CardHeader>
        <CardContent>
          {/* Quick Presets */}
          <div className="mb-6 p-4 bg-gray-50 border rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-600" />
              Quick Setup (6 AM - 11 PM)
            </h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateCommonSchedule('weekdays')}
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
              >
                Mon-Fri
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateCommonSchedule('weekends')}
                className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
              >
                Weekends
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateCommonSchedule('all')}
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300"
              >
                All 7 Days
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onChange([])}
                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-300"
              >
                Clear All
              </Button>
            </div>
          </div>

          {/* Custom Slot Generator */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Custom Day Setup
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Select value={selectedDay} onValueChange={setSelectedDay}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map(day => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Start time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="End time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button 
                onClick={generateHourlySlots} 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!selectedDay || !startTime || !endTime}
              >
                <Zap className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Schedule Display */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-600" />
              Weekly Schedule
            </span>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              {value.length} total slots
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {DAYS.map(day => {
              const daySlots = slotsByDay[day];
              return (
                <div key={day} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-semibold text-gray-900">{day}</h5>
                    <div className="flex items-center gap-2">
                      <Badge variant={daySlots.length > 0 ? "default" : "secondary"} className="text-xs">
                        {daySlots.length} slots
                      </Badge>
                      {daySlots.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeDaySlots(day)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 px-2 py-1 h-6"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {daySlots.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {daySlots.map((slot, dayIndex) => {
                        const globalIndex = value.findIndex(s => 
                          s.day === slot.day && 
                          s.startTime === slot.startTime && 
                          s.endTime === slot.endTime
                        );
                        
                        return (
                          <div 
                            key={`${slot.day}-${slot.startTime}-${slot.endTime}`}
                            className="flex items-center justify-between bg-white p-2 rounded border text-xs group hover:bg-green-50 transition-colors"
                          >
                            <span className="text-gray-700 font-medium">
                              {slot.startTime.slice(0, 5)} - {slot.endTime.slice(0, 5)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeSlot(globalIndex)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 px-1 py-0 h-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic text-center py-4">
                      No slots available
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {value.length === 0 && (
            <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg mt-4">
              <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-500 font-medium">No time slots configured</p>
              <p className="text-sm text-gray-400 mt-1">
                Use the generator above to create your first slots
              </p>
            </div>
          )}

          {value.length > 0 && (
            <Alert className="mt-4 bg-green-50 border-green-200">
              <Clock className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Schedule Summary:</strong> You have {value.length} hourly slots across{' '}
                {Object.values(slotsByDay).filter(slots => slots.length > 0).length} days.
                Customers can book any available 1-hour slot.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}