'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Settings, Lightbulb, Car, Droplets, Wrench } from 'lucide-react';

const AMENITIES = [
  { 
    value: 'Floodlights', 
    label: 'Floodlights', 
    icon: Lightbulb,
    description: 'Night time lighting for evening games'
  },
  { 
    value: 'Parking', 
    label: 'Parking', 
    icon: Car,
    description: 'Dedicated parking space for visitors'
  },
  { 
    value: 'Washroom', 
    label: 'Washroom', 
    icon: Droplets,
    description: 'Clean washroom facilities'
  },
  { 
    value: 'Equipment', 
    label: 'Equipment', 
    icon: Wrench,
    description: 'Sports equipment rental available'
  }
];

interface AmenitiesSelectorProps {
  value: string[];
  onChange: (amenities: string[]) => void;
}

export function AmenitiesSelector({ value, onChange }: AmenitiesSelectorProps) {
  const handleAmenityChange = (amenity: string, checked: boolean) => {
    if (checked) {
      onChange([...value, amenity]);
    } else {
      onChange(value.filter(a => a !== amenity));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Amenities
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select the amenities available at your turf to help customers make informed decisions.
          </p>
          
          <div className="space-y-4">
            {AMENITIES.map((amenity) => {
              const Icon = amenity.icon;
              const isChecked = value.includes(amenity.value);
              
              return (
                <div key={amenity.value} className="flex items-start space-x-3">
                  <Checkbox
                    id={amenity.value}
                    checked={isChecked}
                    onCheckedChange={(checked) => 
                      handleAmenityChange(amenity.value, checked as boolean)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-gray-500" />
                      <label 
                        htmlFor={amenity.value}
                        className="text-sm font-medium text-gray-900 cursor-pointer"
                      >
                        {amenity.label}
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {amenity.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Amenities Display */}
          {value.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700">Selected Amenities:</h4>
              <div className="flex flex-wrap gap-2">
                {value.map((amenity) => (
                  <Badge 
                    key={amenity} 
                    variant="secondary"
                    className="bg-blue-100 text-blue-800"
                  >
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {value.length === 0 && (
            <div className="text-center py-4 border-t">
              <p className="text-sm text-gray-500">
                No amenities selected. Consider adding amenities to attract more customers.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}