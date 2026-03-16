'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TurfCardCarouselProps {
  images: Array<{ url: string; public_id?: string }>;
  featuredImage?: string;
  alt: string;
}

export default function TurfCardCarousel({ images, featuredImage, alt }: TurfCardCarouselProps) {
  // Combine featured image with other images if available
  const allImages = React.useMemo(() => {
    let imgList = images?.map(img => img.url) || [];
    if (featuredImage && !imgList.includes(featuredImage)) {
      imgList = [featuredImage, ...imgList];
    }
    if (imgList.length === 0) {
      imgList = ['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=300&fit=crop'];
    }
    return imgList;
  }, [images, featuredImage]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (allImages.length <= 1 || isHovered) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === allImages.length - 1 ? 0 : prevIndex + 1
      );
    }, 3500); // Auto-scroll every 3.5 seconds

    return () => clearInterval(interval);
  }, [allImages.length, isHovered]);

  const goToPrevious = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? allImages.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isLastSlide = currentIndex === allImages.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (e: React.MouseEvent, slideIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex(slideIndex);
  };

  return (
    <div 
      className="relative w-full h-full group/carousel overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-80" />
      
      {allImages.map((src, idx) => (
        <img
          key={idx}
          src={src}
          alt={`${alt} - ${idx + 1}`}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out group-hover:scale-110 ${
            idx === currentIndex ? 'opacity-100 z-[5]' : 'opacity-0 z-0'
          }`}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=500&h=300&fit=crop';
          }}
        />
      ))}

      {/* Navigation Arrows */}
      {allImages.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute top-1/2 left-2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full z-20 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <button
            onClick={goToNext}
            className="absolute top-1/2 right-2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full z-20 opacity-0 group-hover/carousel:opacity-100 transition-opacity"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex space-x-1.5 z-20">
            {allImages.map((_, slideIndex) => (
              <div
                key={slideIndex}
                onClick={(e) => goToSlide(e, slideIndex)}
                className={`cursor-pointer transition-all rounded-full ${
                  currentIndex === slideIndex 
                    ? 'w-2 h-2 bg-white' 
                    : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
