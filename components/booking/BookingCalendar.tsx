'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { useMemo } from 'react';

interface BookingCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  selectedSlots: string[];
  onSlotsChange: (slots: string[]) => void;
  turf: any;
}

export function BookingCalendar({ 
  selectedDate, 
  onDateChange, 
  selectedSlots, 
  onSlotsChange,
  turf
}: BookingCalendarProps) {
  
  // Get available slots for the selected date
  const availableSlotsForSelectedDate = useMemo(() => {
    if (!selectedDate || !turf?.availableSlots) {
      return [];
    }
    
    const selectedDateStr = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
    const dayName = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });
    
    // Check if selected date is today
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const isToday = selectedDateStr === todayStr;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Filter slots that match the selected date and day
    const slotsForThisDate = turf.availableSlots.filter((slot: any) => {
      if (slot.day !== dayName || slot.date !== selectedDateStr) {
        return false;
      }
      
      // If it's today, filter out past time slots
      if (isToday) {
        // Parse the slot start time (format: "HH:MM")
        const [slotHour, slotMinute] = slot.startTime.split(':').map(Number);
        
        // Convert to minutes for easier comparison
        const currentTimeInMinutes = currentHour * 60 + currentMinute;
        const slotTimeInMinutes = slotHour * 60 + slotMinute;
        
        // Only show slots that haven't started yet (or starting within next 30 mins as buffer)
        return slotTimeInMinutes > currentTimeInMinutes;
      }
      
      return true;
    });
    
    // Sort slots by start time
    return slotsForThisDate.sort((a: any, b: any) => {
      const timeA = a.startTime.replace(':', '');
      const timeB = b.startTime.replace(':', '');
      return parseInt(timeA) - parseInt(timeB);
    });
  }, [selectedDate, turf?.availableSlots]);

  // Check if a slot is selected
  const isSlotSelected = (slot: any) => {
    const slotString = `${slot.startTime} - ${slot.endTime}`;
    return selectedSlots.includes(slotString);
  };

  // Handle slot selection
  const handleSlotClick = (slot: any) => {
    if (slot.isBooked) return; // Don't allow selection of booked slots
    
    const slotString = `${slot.startTime} - ${slot.endTime}`;
    
    if (isSlotSelected(slot)) {
      // Remove slot from selection
      onSlotsChange(selectedSlots.filter(s => s !== slotString));
    } else {
      // Add slot to selection
      onSlotsChange([...selectedSlots, slotString]);
    }
  };

  // Get button style based on slot status
  const getSlotButtonStyle = (slot: any) => {
    const isSelected = isSlotSelected(slot);
    const isBooked = slot.isBooked;
    
    if (isBooked) {
      return {
        variant: 'outline' as const,
        className: 'opacity-50 cursor-not-allowed bg-gray-100 text-gray-500 border-gray-300',
        disabled: true
      };
    }
    
    if (isSelected) {
      return {
        variant: 'default' as const,
        className: 'bg-green-500 hover:bg-green-600 text-white border-green-500',
        disabled: false
      };
    }
    
    return {
      variant: 'outline' as const,
      className: 'hover:bg-green-50 hover:border-green-300 border-gray-300',
      disabled: false
    };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="h-5 w-5 mr-2 text-green-500" />
          Select Date & Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold mb-4">Choose Date</h3>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateChange(date)}
              disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
              className="rounded-md border"
            />
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Available Time Slots</h3>
            <p className="text-sm text-gray-600 mb-4">
              Selected date: {selectedDate.toLocaleDateString()} ({selectedDate.toLocaleDateString('en-US', { weekday: 'long' })})
            </p>
            
            {availableSlotsForSelectedDate.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No slots available</p>
                <p className="text-sm">This turf doesn't operate on this day</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {availableSlotsForSelectedDate.map((slot: any, index: number) => {
                  const buttonStyle = getSlotButtonStyle(slot);
                  const slotString = `${slot.startTime} - ${slot.endTime}`;
                  // Create a unique key that includes date to avoid conflicts
                  const uniqueKey = `${slot.day}-${slot.startTime}-${slot.endTime}-${slot.date}-${index}`;
                  
                  return (
                    <Button
                      key={uniqueKey}
                      variant={buttonStyle.variant}
                      size="sm"
                      className={`text-left justify-start ${buttonStyle.className}`}
                      onClick={() => handleSlotClick(slot)}
                      disabled={buttonStyle.disabled}
                    >
                      <div className="w-full">
                        <div className="font-medium">{slotString}</div>
                        {slot.isBooked && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Booked
                          </Badge>
                        )}
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Legend</h4>
              <div className="space-y-1 text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 border border-gray-300 rounded mr-2"></div>
                  <span className="text-gray-600">Available</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
                  <span className="text-gray-600">Selected</span>
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
                  <span className="text-gray-600">Unavailable</span>
                </div>
              </div>
            </div>

            {selectedSlots.length > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">
                  Selected Slots ({selectedSlots.length})
                </h4>
                <div className="text-sm text-green-800">
                  {selectedSlots.join(', ')}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}