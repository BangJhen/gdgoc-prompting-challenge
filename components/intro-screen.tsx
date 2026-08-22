"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { PixelBackground } from "./pixel-background";

interface Decoration {
  id: number;
  x: number;
  left: number;
  w: number;
  h: number;
  color: string;
  duration: number;
  delay: number;
  rotate: number;
}

export const IntroScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [phase, setPhase] = useState<"enter" | "zoom">("enter");
  const [decorations, setDecorations] = useState<Decoration[]>([]);

  useEffect(() => {
    // Generate decorations on client side only to avoid hydration mismatch
    const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'];
    const newDecorations = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 200 - 100,
      left: Math.random() * 100,
      w: Math.floor(Math.random() * 20) + 10,
      h: Math.floor(Math.random() * 20) + 10,
      color: colors[i % colors.length],
      duration: Math.random() * 2 + 1.5,
      delay: Math.random() * 1.5,
      rotate: Math.random() * 360
    }));
    setDecorations(newDecorations);

    // Start zoom after 2 seconds to let them enjoy the view
    const timer1 = setTimeout(() => {
      setPhase("zoom");
    }, 2000);

    // Unmount after zoom animation finishes
    const timer2 = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-[100] bg-slate-50 flex flex-col items-center justify-center overflow-hidden bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:24px_24px]"
          initial={{ opacity: 1 }}
          animate={{ opacity: phase === "zoom" ? 0 : 1 }}
          transition={{ duration: 0.8, delay: phase === "zoom" ? 0.3 : 0 }}
          exit={{ opacity: 0 }}
        >
          <PixelBackground />
          {decorations.map((d) => (
            <motion.div
              key={d.id}
              initial={{ y: "110vh", x: 0, rotate: 0 }}
              animate={{ 
                y: "-10vh",
                x: d.x,
                rotate: d.rotate
              }}
              transition={{ 
                duration: d.duration, 
                repeat: Infinity, 
                ease: "linear",
                delay: d.delay
              }}
              className="absolute shadow-sm"
              style={{
                left: `${d.left}vw`,
                width: `${d.w}px`,
                height: `${d.h}px`,
                backgroundColor: d.color,
                opacity: 0.8,
                imageRendering: 'pixelated'
              }}
            />
          ))}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: -50 }}
            animate={
              phase === "enter"
                ? { scale: 1, opacity: 1, y: 0 }
                : { scale: 50, opacity: 0 } // massive zoom in
            }
            transition={{
              duration: phase === "enter" ? 0.8 : 1.2,
              type: phase === "enter" ? "spring" : "tween",
              bounce: 0.6,
              ease: phase === "enter" ? undefined : "easeInOut",
            }}
            className="z-10"
          >
            <Image
              src="/images/logo.png"
              alt="GDGoC Logo"
              width={250}
              height={250}
              priority
              className="drop-shadow-xl"
            />
          </motion.div>
          {phase === "enter" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute bottom-24 text-blue-600 font-pixelify text-3xl font-bold tracking-[0.2em] animate-pulse z-10"
              style={{
                textShadow: '2px 2px 0px rgba(0,0,0,0.1)'
              }}
            >
              INITIALIZING...
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
