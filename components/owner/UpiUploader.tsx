'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface CloudinaryImage {
  url: string;
  public_id: string;
}

interface UpiUploaderProps {
  value: CloudinaryImage | null;
  onChange: (image: CloudinaryImage | null) => void;
}

export function UpiUploader({ value, onChange }: UpiUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadToCloudinary = async (file: File) => {
    try {
      // Create FormData for the file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'turf_booking/upi_qr_codes');

      // Upload through our API endpoint which handles Cloudinary authentication
      const response = await fetch('/api/upload/cloudinary', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload API error:', errorData);
        throw new Error(`Upload failed: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      return {
        url: data.url,
        public_id: data.public_id,
      };
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const uploadedImage = await uploadToCloudinary(file);
      onChange(uploadedImage);
    } catch (error) {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          UPI QR Code
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {value ? (
            <div className="relative">
              <img
                src={value.url}
                alt="UPI QR Code"
                className="w-full max-w-sm mx-auto rounded-lg border"
              />
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => onChange(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
            >
              <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">
                Drag and drop your UPI QR code image here, or click to select
              </p>
              <Input
                type="file"
                accept="image/*"
                onChange={handleInputChange}
                className="hidden"
                id="upi-upload"
                disabled={uploading}
              />
              <Button
                variant="outline"
                asChild
                disabled={uploading}
                className="cursor-pointer"
              >
                <label htmlFor="upi-upload">
                  {uploading ? 'Uploading...' : 'Select Image'}
                </label>
              </Button>
            </div>
          )}
          <p className="text-sm text-gray-500">
            Upload a clear image of your UPI QR code for payments. Max size: 5MB
          </p>
        </div>
      </CardContent>
    </Card>
  );
}