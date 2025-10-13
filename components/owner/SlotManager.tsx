'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Clock, Plus, Trash2 } from 'lucide-react';

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
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30',
  '21:00', '21:30', '22:00', '22:30', '23:00'
];

export function SlotManager({ value, onChange }: SlotManagerProps) {
  const [newSlot, setNewSlot] = useState<TimeSlot>({
    day: '',
    startTime: '',
    endTime: ''
  });

  const addSlot = () => {
    if (!newSlot.day || !newSlot.startTime || !newSlot.endTime) {
      alert('Please fill all fields');
      return;
    }

    // Validate that end time is after start time
    const start = new Date(`2024-01-01 ${newSlot.startTime}`);
    const end = new Date(`2024-01-01 ${newSlot.endTime}`);
    
    if (end <= start) {
      alert('End time must be after start time');
      return;
    }

    // Check for overlapping slots on the same day
    const overlapping = value.some(slot => {
      if (slot.day !== newSlot.day) return false;
      
      const existingStart = new Date(`2024-01-01 ${slot.startTime}`);
      const existingEnd = new Date(`2024-01-01 ${slot.endTime}`);
      
      return (start < existingEnd && end > existingStart);
    });

    if (overlapping) {
      alert('This time slot overlaps with an existing slot on the same day');
      return;
    }

    onChange([...value, newSlot]);
    setNewSlot({ day: '', startTime: '', endTime: '' });
  };

  const removeSlot = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Available Time Slots
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Set up your available time slots for each day. Customers will only be able to book during these times.
          </p>

          {/* Add New Slot */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <h4 className="text-sm font-medium mb-3">Add New Time Slot</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Select 
                value={newSlot.day} 
                onValueChange={(day) => setNewSlot({...newSlot, day})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select day" />
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map(day => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={newSlot.startTime} 
                onValueChange={(startTime) => setNewSlot({...newSlot, startTime})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Start time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={newSlot.endTime} 
                onValueChange={(endTime) => setNewSlot({...newSlot, endTime})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="End time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map(time => (
                    <SelectItem key={time} value={time}>{time}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={addSlot} className="bg-green-500 hover:bg-green-600">
                <Plus className="h-4 w-4 mr-2" />
                Add Slot
              </Button>
            </div>
          </div>

          {/* Display Existing Slots by Day */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Current Schedule ({value.length} slots)</h4>
            
            {DAYS.map(day => {
              const daySlots = slotsByDay[day];
              return (
                <div key={day} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{day}</h5>
                    <Badge variant="outline">
                      {daySlots.length} slot{daySlots.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  
                  {daySlots.length > 0 ? (
                    <div className="space-y-2">
                      {daySlots.map((slot, dayIndex) => {
                        const globalIndex = value.findIndex(s => 
                          s.day === slot.day && 
                          s.startTime === slot.startTime && 
                          s.endTime === slot.endTime
                        );
                        
                        return (
                          <div 
                            key={`${slot.day}-${slot.startTime}-${slot.endTime}`}
                            className="flex items-center justify-between bg-green-50 p-2 rounded border"
                          >
                            <span className="text-sm text-green-800">
                              {slot.startTime} - {slot.endTime}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeSlot(globalIndex)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No slots available</p>
                  )}
                </div>
              );
            })}
          </div>

          {value.length === 0 && (
            <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
              <Clock className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">
                No time slots added yet. Add your first slot above.
              </p>
            </div>
          )}

          {value.length > 0 && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-1">
                💡 Pro Tips:
              </h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Consider peak hours (evenings and weekends) for better bookings</li>
                <li>• Allow buffer time between slots for cleaning and setup</li>
                <li>• Different sports may need different slot durations</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}