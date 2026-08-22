"use client";
import React, { useEffect } from "react";
import { motion } from "framer-motion";

export const SandboxTransition = ({ isVisible, onComplete }: { isVisible: boolean; onComplete: () => void }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onComplete();
      }, 2000); // Navigate after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [isVisible, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[200] pointer-events-auto flex flex-col">
      {/* Top half closing down */}
      <motion.div
        initial={{ y: "-100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
        className="w-full h-1/2 bg-slate-900 border-b-8 border-yellow-400"
      />
      {/* Bottom half closing up */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", bounce: 0.2, duration: 0.8 }}
        className="w-full h-1/2 bg-slate-900 border-t-8 border-yellow-400"
      />

      {/* Retro Text Box Popping Up */}
      <motion.div
         initial={{ opacity: 0, scale: 0 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ delay: 0.7, type: "spring", bounce: 0.6, duration: 0.6 }}
         className="absolute inset-0 flex items-center justify-center z-10"
      >
        <div className="text-white font-pixelify text-4xl md:text-6xl tracking-widest bg-slate-800 px-8 py-6 border-4 border-white shadow-[8px_8px_0px_rgba(251,188,5,1)] animate-pulse">
          READY?
        </div>
      </motion.div>
    </div>
  );
};
