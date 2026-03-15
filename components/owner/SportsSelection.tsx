'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Trophy } from 'lucide-react';
import { useState } from 'react';

const PREDEFINED_SPORTS = ['Football', 'Cricket', 'Badminton', 'Tennis', 'Basketball'];

interface SportsSelectionProps {
  value: string[];
  customSport: string;
  onSportsChange: (sports: string[]) => void;
  onCustomSportChange: (sport: string) => void;
}

export function SportsSelection({ 
  value, 
  customSport, 
  onSportsChange, 
  onCustomSportChange 
}: SportsSelectionProps) {
  const [showCustomInput, setShowCustomInput] = useState(value.includes('Other'));

  const toggleSport = (sport: string) => {
    if (sport === 'Other') {
      if (value.includes('Other')) {
        // Remove 'Other' and hide custom input
        onSportsChange(value.filter(s => s !== 'Other'));
        onCustomSportChange('');
        setShowCustomInput(false);
      } else {
        // Add 'Other' and show custom input
        onSportsChange([...value, 'Other']);
        setShowCustomInput(true);
      }
    } else {
      if (value.includes(sport)) {
        onSportsChange(value.filter(s => s !== sport));
      } else {
        onSportsChange([...value, sport]);
      }
    }
  };

  const isSelected = (sport: string) => value.includes(sport);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Sports Offered
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select the sports available at your turf. You must select at least one sport.
          </p>
          
          {/* Predefined Sports */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Available Sports:</h4>
            <div className="flex flex-wrap gap-2">
              {PREDEFINED_SPORTS.map((sport) => (
                <Button
                  key={sport}
                  variant={isSelected(sport) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleSport(sport)}
                  className={isSelected(sport) ? "bg-green-500 hover:bg-green-600" : ""}
                >
                  {sport}
                  {isSelected(sport) && (
                    <X className="h-3 w-3 ml-1" />
                  )}
                </Button>
              ))}
              
              {/* Other Option */}
              <Button
                variant={isSelected('Other') ? "default" : "outline"}
                size="sm"
                onClick={() => toggleSport('Other')}
                className={isSelected('Other') ? "bg-blue-500 hover:bg-blue-600" : ""}
              >
                Other
                {isSelected('Other') ? (
                  <X className="h-3 w-3 ml-1" />
                ) : (
                  <Plus className="h-3 w-3 ml-1" />
                )}
              </Button>
            </div>
          </div>

          {/* Custom Sport Input */}
          {showCustomInput && (
            <div className="space-y-2">
              <label htmlFor="customSport" className="text-sm font-medium text-gray-700">
                Custom Sport Name:
              </label>
              <Input
                id="customSport"
                placeholder="Enter custom sport name"
                value={customSport}
                onChange={(e) => onCustomSportChange(e.target.value)}
                className="max-w-sm"
              />
              {value.includes('Other') && !customSport.trim() && (
                <p className="text-sm text-red-500">
                  Please enter a custom sport name when "Other" is selected
                </p>
              )}
            </div>
          )}

          {/* Selected Sports Display */}
          {value.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Selected Sports:</h4>
              <div className="flex flex-wrap gap-2">
                {value.map((sport) => (
                  <Badge 
                    key={sport} 
                    variant="secondary" 
                    className="bg-green-100 text-green-800"
                  >
                    {sport === 'Other' && customSport ? customSport : sport}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {value.length === 0 && (
            <p className="text-sm text-red-500">
              Please select at least one sport
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}