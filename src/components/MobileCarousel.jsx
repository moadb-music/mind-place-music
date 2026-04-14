import { useState, useRef, useCallback } from 'react';

export default function MobileCarousel({ children, className = '' }) {
  const [current, setCurrent] = useState(0);
  const ref = useRef(null);
  const items = Array.isArray(children) ? children : [children];

  const handleScroll = useCallback(() => {
    if (!ref.current) return;
    const { scrollLeft, clientWidth } = ref.current;
    setCurrent(Math.round(scrollLeft / clientWidth));
  }, []);

  const goTo = (i) => {
    ref.current?.scrollTo({ left: i * ref.current.clientWidth, behavior: 'smooth' });
  };

  return (
    <div className={`mob-carousel-wrap ${className}`}>
      <div className="mob-carousel" ref={ref} onScroll={handleScroll}>
        {items.map((child, i) => (
          <div className="mob-carousel-slide" key={i}>
            {child}
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div className="mob-carousel-dots">
          {items.map((_, i) => (
            <button
              key={i}
              className={`mob-carousel-dot${i === current ? ' mob-carousel-dot--active' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
