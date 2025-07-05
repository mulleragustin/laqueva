import { useState, useEffect } from 'react';

export default function PizzaImage({ src, alt, className }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
    img.onerror = () => setError(true);
  }, [src]);

  return (
    <div className={`relative transition-opacity duration-300 ${className}`}>
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-gray-300 animate-pulse rounded-lg"></div>
      )}
      {error ? (
        <div className="flex items-center justify-center h-full bg-gray-200 rounded-lg">
          <span>Error al cargar imagen</span>
        </div>
      ) : (
        <img 
          src={src} 
          alt={alt} 
          className={`w-full h-full object-cover ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}