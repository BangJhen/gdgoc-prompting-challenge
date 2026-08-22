"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export const RulesModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm cursor-pointer"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-slate-50 border-4 border-slate-800 shadow-[12px_12px_0px_rgba(0,0,0,1)] w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="bg-slate-800 text-white p-4 border-b-4 border-slate-800 flex justify-between items-center sticky top-0 z-10">
              <h2 className="text-2xl md:text-3xl font-pixelify tracking-wider text-yellow-400 drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                📜 CARA BERMAIN
              </h2>
              <button 
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center bg-red-500 hover:bg-red-400 border-2 border-white text-white font-pixelify text-xl shadow-[2px_2px_0px_rgba(255,255,255,1)] active:translate-y-0.5 active:shadow-[0px_0px_0px_rgba(255,255,255,1)]"
              >
                X
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 font-pixelify text-slate-800">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 shrink-0 bg-yellow-400 border-2 border-slate-800 flex items-center justify-center text-xl font-bold shadow-[3px_3px_0px_rgba(0,0,0,1)]">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1 uppercase text-slate-800">Pilih Target Gambar</h3>
                  <p className="text-sm md:text-base leading-relaxed text-slate-600 font-sans font-medium">
                    Lihat galeri kartu yang tersedia. Pilih salah satu gambar pixel yang menurutmu paling menarik untuk kamu buat ulang.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 shrink-0 bg-green-400 border-2 border-slate-800 flex items-center justify-center text-xl font-bold shadow-[3px_3px_0px_rgba(0,0,0,1)]">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1 uppercase text-slate-800">Isi Data Player</h3>
                  <p className="text-sm md:text-base leading-relaxed text-slate-600 font-sans font-medium">
                    Masukkan nama kerenmu (Username), lalu pilih asal Fakultas dan Program Studi (Khusus mahasiswa Telkom University). Banggakan jurusanmu di Leaderboard!
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 shrink-0 bg-blue-400 border-2 border-slate-800 flex items-center justify-center text-xl font-bold text-white shadow-[3px_3px_0px_rgba(0,0,0,1)]">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1 uppercase text-slate-800">Waktunya Nge-Prompt!</h3>
                  <p className="text-sm md:text-base leading-relaxed text-slate-600 font-sans font-medium">
                    Tuliskan <strong>prompt</strong> (instruksi gambar dalam bahasa Inggris) yang sejelas mungkin ke AI agar ia bisa menghasilkan gambar yang mirip dengan targetmu.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 shrink-0 bg-red-400 border-2 border-slate-800 flex items-center justify-center text-xl font-bold text-white shadow-[3px_3px_0px_rgba(0,0,0,1)]">
                  4
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1 uppercase text-slate-800">Raih Skor Tertinggi</h3>
                  <p className="text-sm md:text-base leading-relaxed text-slate-600 font-sans font-medium">
                    Hasil gambarmu akan dinilai AI berdasarkan tingkat kemiripannya! Semakin akurat prompt-mu, semakin tinggi skormu. Capai skor 100/100!
                  </p>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
