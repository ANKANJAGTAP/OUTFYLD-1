'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface TurfImageGalleryProps {
  images: Array<{ url: string; public_id: string }>;
  altFallback: string;
}

export default function TurfImageGallery({ images, altFallback }: TurfImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (!images || images.length <= 1 || isHovered) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, 4000); // Auto-scroll every 4 seconds

    return () => clearInterval(interval);
  }, [images, isHovered]);

  if (!images || images.length === 0) {
    return (
      <Card>
        <CardContent className="p-0">
          <div className="relative h-64 md:h-96 bg-gray-200 rounded-xl flex items-center justify-center">
            <span className="text-gray-400">No images available</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <Card className="overflow-hidden border-none shadow-lg">
      <CardContent 
        className="p-0 relative group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Main Image Viewport */}
        <div className="relative h-[300px] md:h-[500px] w-full overflow-hidden bg-black rounded-xl">
          {images.map((image, idx) => (
            <div
              key={idx}
              className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${
                idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
              }`}
            >
              <Image
                src={image.url}
                alt={`${altFallback} - Image ${idx + 1}`}
                fill
                sizes="(max-width: 768px) 100vw, 80vw"
                priority={idx === 0}
                className="object-contain"
              />
              {/* Optional blurred background so portrait pictures don't look weird */}
              <div 
                className="absolute inset-0 -z-10 opacity-40 blur-xl"
                style={{
                  backgroundImage: `url('${image.url}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            </div>
          ))}
        </div>

        {/* Carousel Controls */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full z-20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Previous Image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full z-20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
              aria-label="Next Image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-20 bg-black/30 px-3 py-2 rounded-full backdrop-blur-sm">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`transition-all rounded-full ${
                    idx === currentIndex 
                      ? 'w-3 h-3 bg-white' 
                      : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Go to image ${idx + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
