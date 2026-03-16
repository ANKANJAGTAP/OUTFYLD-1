'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Crown, Plus, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-toastify';
import Image from 'next/image';

interface BannerImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
}

export function BannerImageUploader({ value, onChange }: BannerImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // We want to force the owner to confirm it looks good
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [tempFile, setTempFile] = useState<File | null>(null);

  const handleFileSelect = (files: FileList) => {
    const file = files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image is too large (max 5MB)');
      return;
    }

    // Load preview to let owner validate aspect ratio
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setTempFile(file);
  };

  const uploadToCloudinary = async () => {
    if (!tempFile) return;
    
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', tempFile);
      formData.append('folder', 'turf_booking/turf_banners'); // Keep them separate

      const response = await fetch('/api/upload/cloudinary', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Rewrite to high-quality constraints right at save
      let finalUrl = data.url;
      if (finalUrl.includes('cloudinary.com')) {
         finalUrl = finalUrl.replace(/\/upload\/(?:[a-zA-Z0-9_]+,\w+_[0-9]+\/)?/, '/upload/q_100,w_1920,f_auto/');
      }

      onChange(finalUrl);
      setPreviewUrl(null);
      setTempFile(null);
      toast.success('Banner image uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const cancelPreview = () => {
    setPreviewUrl(null);
    setTempFile(null);
  };

  const removeImage = () => {
    onChange('');
  };

  return (
    <Card className="border-yellow-500/50 bg-yellow-50/10 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-600">
          <Crown className="h-5 w-5 fill-current" />
          Premium Banner Photo
        </CardTitle>
        <CardDescription>
          Your turf appears on the main homepage! Upload a high-quality, horizontal (16:9) photo for the best clarity.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          
          {/* Instructions Box */}
          <div className="bg-yellow-100/50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800 space-y-2 mb-6">
            <p className="font-semibold">Guidelines for the perfect banner photo:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Format & Size:</strong> JPEG, PNG, or WebP. Maximum size is 5MB.</li>
              <li><strong>How to take it:</strong> Hold your phone or camera <span className="font-bold underline">horizontally (Landscape mode)</span>. Ensure the field is well-lit and the whole turf width is visible.</li>
              <li><strong>Stock/Downloaded Images:</strong> High-resolution downloaded images (e.g., from browser search, 1920x1080) work perfectly as long as they don't have watermarks. However, clear photos of your <i>actual</i> turf build more trust!</li>
            </ul>
          </div>

          {/* Active Existing Image */}
          {value && !previewUrl && (
            <div className="relative group w-full aspect-video rounded-xl overflow-hidden border-2 border-yellow-200">
              <Image 
                src={value}
                alt="Banner Image"
                fill
                quality={100}
                className="object-cover"
                unoptimized
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="destructive" onClick={removeImage}>
                  Remove Banner
                </Button>
              </div>
            </div>
          )}

          {/* Validation Preview Mode */}
          {previewUrl && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-gray-700 bg-gray-100 p-2 rounded text-center">
                Preview: Does this look good horizontally? This is how it will appear on desktop screens.
              </div>
              <div className="relative w-full aspect-video rounded-xl overflow-hidden border-2 border-blue-400 shadow-inner">
                <Image 
                   src={previewUrl}
                   alt="Preview"
                   fill
                   className="object-cover"
                   unoptimized
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={cancelPreview} disabled={uploading}>
                  Cancel
                </Button>
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-white" onClick={uploadToCloudinary} disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Confirm & Upload'}
                </Button>
              </div>
            </div>
          )}

          {/* Upload Area */}
          {!value && !previewUrl && (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver
                  ? 'border-yellow-500 bg-yellow-50'
                  : 'border-yellow-300 hover:border-yellow-400'
              }`}
              onDrop={(e) => {
                 e.preventDefault();
                 setDragOver(false);
                 if (e.dataTransfer.files.length > 0) {
                   handleFileSelect(e.dataTransfer.files);
                 }
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
            >
              <ImageIcon className="h-12 w-12 mx-auto text-yellow-400 mb-4" />
              <p className="text-gray-600 mb-4">
                Drag and drop a wide landscape photo here
              </p>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files);
                  }
                }}
                className="hidden"
                id="banner-upload"
              />
              <Button
                variant="outline"
                asChild
                className="cursor-pointer border-yellow-500 text-yellow-700 hover:bg-yellow-50"
              >
                <label htmlFor="banner-upload">
                  <Upload className="h-4 w-4 mr-2" />
                  Select File
                </label>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
