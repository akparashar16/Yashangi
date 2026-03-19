/**
 * Image With Fallback Component
 * Handles image loading errors gracefully
 */

'use client';

import React, { useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  fallbackSrc?: string;
  width?: number;
  height?: number;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className,
  style,
  fallbackSrc,
  width = 300,
  height = 300,
}) => {
  const [imgSrc, setImgSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  const defaultFallback = `data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"%3E%3Crect fill="%23f0f0f0" width="${width}" height="${height}"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="16" dy="10.5" x="50%25" y="50%25" text-anchor="middle"%3E${encodeURIComponent(alt)}%3C/text%3E%3C/svg%3E`;

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc || defaultFallback);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      loading="lazy"
    />
  );
};

export default ImageWithFallback;

