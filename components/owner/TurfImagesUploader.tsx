'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Images, Plus } from 'lucide-react';

interface CloudinaryImage {
  url: string;
  public_id: string;
}

interface TurfImagesUploaderProps {
  value: CloudinaryImage[];
  onChange: (images: CloudinaryImage[]) => void;
}

export function TurfImagesUploader({ value, onChange }: TurfImagesUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadToCloudinary = async (file: File): Promise<CloudinaryImage> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'turf_booking/turf_images');

      const response = await fetch('/api/upload/cloudinary', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
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

  const handleFileSelect = async (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    if (value.length + validFiles.length > 10) {
      alert('Maximum 10 images allowed');
      return;
    }

    setUploading(true);
    try {
      const uploadPromises = validFiles.map(file => uploadToCloudinary(file));
      const uploadedImages = await Promise.all(uploadPromises);
      onChange([...value, ...uploadedImages]);
    } catch (error) {
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files);
    }
  };

  const removeImage = (index: number) => {
    const newImages = value.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Images className="h-5 w-5" />
          Turf Images ({value.length}/10)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Image Grid */}
          {value.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {value.map((image, index) => (
                <div key={image.public_id} className="relative group">
                  <img
                    src={image.url}
                    alt={`Turf image ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Area */}
          {value.length < 10 && (
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
                {value.length === 0
                  ? 'Drag and drop turf images here, or click to select'
                  : 'Add more turf images'}
              </p>
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleInputChange}
                className="hidden"
                id="turf-upload"
                disabled={uploading}
              />
              <Button
                variant="outline"
                asChild
                disabled={uploading}
                className="cursor-pointer"
              >
                <label htmlFor="turf-upload">
                  <Plus className="h-4 w-4 mr-2" />
                  {uploading ? 'Uploading...' : 'Select Images'}
                </label>
              </Button>
            </div>
          )}

          <p className="text-sm text-gray-500">
            Upload high-quality images of your turf. You can upload up to 10 images. Max size per image: 5MB
          </p>
        </div>
      </CardContent>
    </Card>
  );
}