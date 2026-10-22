import React, { useState } from 'react';

const FALLBACK_FOOD_IMAGE =
  'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80';

export default function ImageWithFallback({ src, alt, className, ...props }) {
  const [imgSrc, setImgSrc] = useState(src || FALLBACK_FOOD_IMAGE);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(FALLBACK_FOOD_IMAGE);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt || 'Canteen Item'}
      onError={handleError}
      className={className}
      loading="lazy"
      {...props}
    />
  );
}
