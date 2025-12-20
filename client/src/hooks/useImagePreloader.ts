import { useState, useEffect } from 'react';

export const useImagePreloader = (imageUrls: string[]) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (imageUrls.length === 0) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const preloadImages = async () => {
      const promises = imageUrls.map((url) => {
        return new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve(); // ממשיכים גם אם תמונה נכשלה
          img.src = url;
        });
      });

      await Promise.all(promises);

      if (isMounted) {
        setIsLoading(false);
      }
    };

    preloadImages();

    return () => {
      isMounted = false;
    };
  }, [imageUrls]);

  return { isLoading };
};
