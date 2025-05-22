
import React, { useEffect, useRef, useState } from 'react';

interface AudioVisualizerProps {
  isActive: boolean;
  color?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ 
  isActive, 
  color = '#3b82f6' 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [bars, setBars] = useState<number[]>(Array(20).fill(2));
  const [animationActive, setAnimationActive] = useState(false);

  // Effect to handle animation state with a slight delay when isActive changes
  useEffect(() => {
    if (isActive) {
      setAnimationActive(true);
    } else {
      // Small delay before stopping animation to allow for smooth transition
      const timeout = setTimeout(() => {
        setAnimationActive(false);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isActive]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let now = Date.now();

    const render = () => {
      if (!canvas) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const currentTime = Date.now();
      const timeDiff = currentTime - now;
      now = currentTime;

      // Only animate when active
      if (animationActive) {
        // Update bars
        setBars(prevBars => 
          prevBars.map(height => {
            // Random movement but with smooth transitions
            const randomFactor = Math.random() * 0.5 - 0.25;
            const newHeight = Math.max(2, Math.min(40, height + randomFactor * timeDiff * 0.1));
            return newHeight;
          })
        );
      } else {
        // When not active, make bars return to resting state
        setBars(prevBars => 
          prevBars.map(height => {
            return Math.max(2, height * 0.95);
          })
        );
      }

      // Draw bars
      const barWidth = canvas.width / (bars.length * 2);
      bars.forEach((height, index) => {
        const x = index * barWidth * 2 + barWidth/2;
        
        ctx.beginPath();
        ctx.roundRect(
          x - barWidth/2,
          canvas.height / 2 - height / 2,
          barWidth,
          height,
          3
        );
        ctx.fillStyle = color;
        ctx.fill();
      });

      animationFrameId = window.requestAnimationFrame(render);
    };

    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [animationActive, color, bars]);

  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={60}
      className="inline-block"
    />
  );
};
