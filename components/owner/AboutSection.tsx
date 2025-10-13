'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { FileText } from 'lucide-react';

interface AboutSectionProps {
  value: string;
  onChange: (about: string) => void;
}

export function AboutSection({ value, onChange }: AboutSectionProps) {
  const maxLength = 1000;
  const remainingChars = maxLength - value.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          About Your Turf
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Describe your turf facility, its features, location advantages, and what makes it special. 
            This helps customers understand what to expect.
          </p>
          
          <div className="space-y-2">
            <Textarea
              placeholder="Tell customers about your turf... (e.g., Professional-grade football field with FIFA-standard grass, located in the heart of Sangli with easy access from main roads. Features modern changing rooms, ample parking, and a cafeteria on-site. Perfect for tournaments and casual games alike.)"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="min-h-[120px] resize-y"
              maxLength={maxLength}
            />
            
            <div className="flex justify-between items-center text-sm">
              <span className={`${remainingChars < 100 ? 'text-orange-500' : 'text-gray-500'}`}>
                {value.length}/{maxLength} characters
              </span>
              {remainingChars < 0 && (
                <span className="text-red-500">
                  {Math.abs(remainingChars)} characters over limit
                </span>
              )}
            </div>
          </div>

          {!value.trim() && (
            <p className="text-sm text-red-500">
              Please provide a description of your turf
            </p>
          )}

          <div className="bg-gray-50 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-2">
              Tips for a great description:
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Mention the type of surface (grass, artificial turf, etc.)</li>
              <li>• Highlight unique features and amenities</li>
              <li>• Include location advantages</li>
              <li>• Mention capacity and suitability for different group sizes</li>
              <li>• Add any special services you offer</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}