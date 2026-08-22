"use client"
import React, { useEffect, useState } from 'react';

interface Pixel {
  id: number;
  x: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

export const PixelBackground = () => {
  const [pixels, setPixels] = useState<Pixel[]>([]);

  useEffect(() => {
    // GDG colors (Google colors) + some neutral gray to blend in
    const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#d1d5db', '#e5e7eb'];
    const newPixels: Pixel[] = [];
    
    // Generate 50 random pixels
    for (let i = 0; i < 50; i++) {
      newPixels.push({
        id: i,
        x: Math.random() * 100, // horizontal position 0-100vw
        size: Math.floor(Math.random() * 8) + 4, // 4px to 11px size
        color: colors[Math.floor(Math.random() * colors.length)],
        duration: Math.random() * 15 + 10, // 10s to 25s floating duration
        delay: Math.random() * 10, // 0s to 10s delay before starting
      });
    }
    setPixels(newPixels);
  }, []);

  // Return nothing during SSR to prevent hydration errors
  if (pixels.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes float-pixel {
          0% {
            transform: translateY(10vh) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          90% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(-110vh) translateX(30px);
            opacity: 0;
          }
        }
      `}} />
      {pixels.map((p) => (
        <div
          key={p.id}
          className="absolute shadow-sm rounded-sm"
          style={{
            left: `${p.x}vw`,
            bottom: 0,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            animation: `float-pixel ${p.duration}s linear ${p.delay}s infinite`,
            imageRendering: 'pixelated'
          }}
        />
      ))}
    </div>
  );
};
