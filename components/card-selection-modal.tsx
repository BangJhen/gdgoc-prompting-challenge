"use client"
import React, { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Card } from '@/types/card'
import { Gamepad2, Timer, Shuffle } from 'lucide-react'

interface CardSelectionModalProps {
  cards: Card[]
  onSelect: (card: Card) => void
}

const TIMER_DURATION = 15

export function CardSelectionModal({ cards, onSelect }: CardSelectionModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<Card[]>([])
  const [timeLeft, setTimeLeft] = useState(TIMER_DURATION)
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  // Pick 3 unique random cards on mount
  useEffect(() => {
    const shuffled = [...cards].sort(() => Math.random() - 0.5)
    setSelectedOptions(shuffled.slice(0, 3))
  }, [cards])

  const handleTimeout = useCallback(() => {
    if (selectedOptions.length === 0) return
    const randomCard = selectedOptions[Math.floor(Math.random() * selectedOptions.length)]
    onSelect(randomCard)
  }, [selectedOptions, onSelect])

  // Countdown timer
  useEffect(() => {
    if (selectedOptions.length === 0) return
    if (timeLeft <= 0) {
      handleTimeout()
      return
    }
    const tick = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    return () => clearTimeout(tick)
  }, [timeLeft, selectedOptions, handleTimeout])

  const timerPercent = (timeLeft / TIMER_DURATION) * 100
  const timerColor =
    timeLeft > 9 ? '#34A853' :
    timeLeft > 5 ? '#FBBC05' :
    '#EA4335'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Modal Panel */}
      <div className="relative w-full max-w-2xl mx-4 bg-white border-4 border-slate-900 shadow-[8px_8px_0px_rgba(0,0,0,1)] overflow-hidden">
        {/* Header */}
        <div className="bg-[#4285F4] border-b-4 border-slate-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shuffle className="w-6 h-6 text-white" />
            <h2 className="font-pixelify text-white text-2xl font-bold tracking-wide">
              PILIH GAMBARMU!
            </h2>
          </div>
          <div className="flex items-center gap-2 bg-white border-2 border-slate-900 px-3 py-1.5 shadow-[2px_2px_0px_rgba(0,0,0,1)]">
            <Timer className="w-5 h-5 text-slate-700" />
            <span
              className="font-pixelify text-2xl font-bold tabular-nums min-w-[2ch] text-center"
              style={{ color: timerColor }}
            >
              {timeLeft}
            </span>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="h-3 bg-slate-200 border-b-2 border-slate-900">
          <div
            className="h-full transition-all duration-1000 ease-linear"
            style={{ width: `${timerPercent}%`, backgroundColor: timerColor }}
          />
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="font-pixelify text-slate-600 text-sm text-center mb-6">
            Kamu punya <span className="font-bold text-slate-900">{timeLeft} detik</span> untuk memilih salah satu gambar di bawah ini.
            Jika waktu habis, sistem akan memilihkan secara acak!
          </p>

          {/* 3 Card Options */}
          <div className="grid grid-cols-3 gap-4">
            {selectedOptions.map((card) => (
              <button
                key={card.id}
                onClick={() => onSelect(card)}
                onMouseEnter={() => setHoveredId(card.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`group relative bg-white border-4 border-slate-900 focus:outline-none w-full text-left 
                  transform transition-all duration-150
                  ${hoveredId === card.id
                    ? 'shadow-[6px_6px_0px_rgba(0,0,0,1)] -translate-y-1 ring-4 ring-yellow-400'
                    : 'shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-1'
                  }
                  active:translate-y-1 active:shadow-[0px_0px_0px_rgba(0,0,0,1)]`}
              >
                {/* Card image */}
                <div className="relative h-32 bg-slate-100 border-b-4 border-slate-900 overflow-hidden">
                  <Image
                    src={card.image}
                    alt={card.name}
                    fill
                    className="object-contain transition-transform duration-200 group-hover:scale-110"
                    style={{ imageRendering: 'pixelated' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://via.placeholder.com/300x200/e5e7eb/6b7280?text=${card.name}`
                    }}
                  />
                  {/* Pixel corner decorations */}
                  <div className="absolute top-1 left-1 w-2 h-2 bg-slate-800/20" />
                  <div className="absolute top-1 right-1 w-2 h-2 bg-slate-800/20" />
                  <div className="absolute bottom-1 left-1 w-2 h-2 bg-slate-800/20" />
                  <div className="absolute bottom-1 right-1 w-2 h-2 bg-slate-800/20" />

                  {/* Hover overlay */}
                  {hoveredId === card.id && (
                    <div className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center">
                      <Gamepad2 className="w-8 h-8 text-yellow-600 drop-shadow-md" />
                    </div>
                  )}
                </div>

                {/* Card label */}
                <div className="px-3 py-2.5 bg-white">
                  <p className="font-pixelify font-bold text-slate-800 text-sm uppercase tracking-wide truncate">
                    {card.name}
                  </p>
                  {card.best ? (
                    <p className="text-[10px] text-slate-500 mt-0.5 font-sans font-medium tracking-wide">
                      Top: <span className="text-[#4285F4] font-bold">{card.best.score}/100</span>
                    </p>
                  ) : (
                    <p className="font-pixelify text-[10px] text-slate-400 mt-0.5 italic">Belum ada skor</p>
                  )}
                </div>

                {/* Select indicator */}
                <div className={`absolute top-2 left-2 bg-yellow-400 border-2 border-slate-900 px-2 py-0.5 font-pixelify text-[10px] font-bold text-slate-900 transition-opacity duration-150 ${hoveredId === card.id ? 'opacity-100' : 'opacity-0'}`}>
                  PILIH!
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer hint */}
        <div className="border-t-4 border-slate-900 bg-slate-100 px-6 py-3 flex items-center justify-center gap-2">
          <span className="font-pixelify text-xs text-slate-500">
            ⚡ Klik salah satu gambar untuk langsung mulai bermain!
          </span>
        </div>
      </div>
    </div>
  )
}
