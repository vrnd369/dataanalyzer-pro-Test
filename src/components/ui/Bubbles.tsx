import React from 'react';

const NUM_BUBBLES = 20;

const getRandom = (min: number, max: number) => Math.random() * (max - min) + min;

const Bubbles: React.FC = () => {
  return (
    <div className="bubbles-container pointer-events-none absolute inset-0 overflow-hidden z-0">
      {Array.from({ length: NUM_BUBBLES }).map((_, i) => {
        const size = getRandom(16, 48);
        const left = getRandom(0, 100);
        const delay = getRandom(0, 8);
        const duration = getRandom(14, 28);
        return (
          <span
            key={i}
            className="bubble"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              opacity: 0.3 + Math.random() * 0.4,
            }}
          />
        );
      })}
    </div>
  );
};

export default Bubbles; 