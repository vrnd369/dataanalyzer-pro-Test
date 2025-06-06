import React, { useEffect, useRef } from 'react';

const BackgroundAnimation: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    if (!containerRef.current) return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    if (mediaQuery.matches) return;

    const createBubble = () => {
      const bubble = document.createElement('div');
      const size = Math.random() * 80 + 40;
      const startX = Math.random() * window.innerWidth;
      const tx = (Math.random() - 0.5) * 300;
      const ty = -Math.random() * 300;
      const hue = Math.random() * 60 - 30;
      
      bubble.style.cssText = `
        position: absolute;
        left: ${startX}px;
        bottom: -100px;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: linear-gradient(
          45deg,
          hsl(${220 + hue}, 100%, 97%),
          hsl(${240 + hue}, 100%, 97%)
        );
        backdrop-filter: blur(8px);
        --tx: ${tx}px;
        --ty: ${ty}px;
        animation: floatingBubble ${8 + Math.random() * 4}s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      `;

      containerRef.current?.appendChild(bubble);

      setTimeout(() => {
        bubble.remove();
      }, 12000);
    };

    const animate = () => {
      createBubble();
      animationFrameRef.current = requestAnimationFrame(() => {
        setTimeout(animate, 3000);
      });
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return <div ref={containerRef} className="floating-elements" />;
};

export default BackgroundAnimation; 