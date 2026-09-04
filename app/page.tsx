"use client"
import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useQueryState } from 'nuqs'
import { useRouter } from 'next/navigation'
import { CardStorage } from '@/lib/card-storage'
import { Card } from '@/types/card'
import posthog from 'posthog-js'
import { Volume2, VolumeX, Trophy, User, Gamepad2, Scan, Shuffle, Star, ChevronDown, X } from 'lucide-react'
import { PixelBackground } from '@/components/pixel-background'
import { IntroScreen } from '@/components/intro-screen'
import { SandboxTransition } from '@/components/sandbox-transition'
import { KioskLockScreen } from '@/components/kiosk-lock-screen'
import { CardSelectionModal } from '@/components/card-selection-modal'

// ─── Step data ──────────────────────────────────────────────────────────────
const HOW_TO_PLAY_STEPS = [
  {
    number: "01",
    icon: User,
    color: "#4285F4",
    bg: "bg-blue-500",
    border: "border-blue-600",
    shadow: "shadow-[4px_4px_0px_#1d4ed8]",
    title: "Masukkan Nama",
    desc: "Ketik namamu, lalu tekan Play Now! Scan QR code Instagram & Bevy GDGoC untuk verifikasi.",
    badge: "START",
    badgeBg: "bg-blue-500",
    video: "/images/step1.webp"
  },
  {
    number: "02",
    icon: Shuffle,
    color: "#FBBC05",
    bg: "bg-yellow-400",
    border: "border-yellow-500",
    shadow: "shadow-[4px_4px_0px_#ca8a04]",
    title: "Pilih Gambarmu",
    desc: "Kamu akan diberi 3 gambar acak! Pilih salah satunya dalam 15 detik, atau sistem otomatis memilih.",
    badge: "PICK",
    badgeBg: "bg-yellow-400",
    video: "/images/step2.webp"
  },
  {
    number: "03",
    icon: Gamepad2,
    color: "#34A853",
    bg: "bg-green-500",
    border: "border-green-600",
    shadow: "shadow-[4px_4px_0px_#15803d]",
    title: "Prompt AI!",
    desc: "Deskripsikan gambar target dengan kata-katamu sendiri. Kamu punya 5 kali kesempatan prompting!",
    badge: "PROMPT",
    badgeBg: "bg-green-500",
    video: "/images/step3.webp"
  },
  {
    number: "04",
    icon: Star,
    color: "#EA4335",
    bg: "bg-red-500",
    border: "border-red-600",
    shadow: "shadow-[4px_4px_0px_#b91c1c]",
    title: "Cek Skor!",
    desc: "AI menilai hasil terbaikmu dari 5 percobaan. Skor makin tinggi makin mirip! Bisa kamu masuk top 10?",
    badge: "SCORE",
    badgeBg: "bg-red-500",
    video: "/images/step4.webp"
  },
]

// ─── Leaderboard medal helper ────────────────────────────────────────────────
const getMedalEmoji = (rank: number) => {
  if (rank === 1) return "🥇"
  if (rank === 2) return "🥈"
  if (rank === 3) return "🥉"
  return `#${rank}`
}

// ─── All-Cards Modal ─────────────────────────────────────────────────────────
function AllCardsModal({ cards, onClose }: { cards: Card[]; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 backdrop-blur-sm overflow-y-auto py-10 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-4xl bg-white border-4 border-slate-900 shadow-[8px_8px_0px_rgba(0,0,0,1)] relative">
        {/* Header */}
        <div className="flex items-center justify-between bg-slate-900 px-6 py-4">
          <h2 className="font-pixelify text-white text-xl font-bold tracking-wide">🎴 Semua Kemungkinan Gambar</h2>
          <button
            onClick={onClose}
            className="bg-white border-2 border-white text-slate-900 p-1.5 hover:bg-slate-200 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="px-6 pt-4 pb-2 font-pixelify text-slate-500 text-sm">
          Gambar-gambar ini adalah tantangan yang mungkin kamu dapat. Kamu akan diberikan 3 dari gambar-gambar di bawah ini secara acak saat bermain!
        </p>
        {/* Grid */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div key={card.id} className="relative bg-white border-2 border-slate-800 shadow-[3px_3px_0px_rgba(0,0,0,1)]">
              <div className="relative h-28 bg-slate-100 border-b-2 border-slate-800 overflow-hidden">
                <Image
                  src={card.image}
                  alt={card.name}
                  fill
                  className="object-contain"
                  style={{ imageRendering: 'pixelated' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://via.placeholder.com/300x200/e5e7eb/6b7280?text=${card.name}`
                  }}
                />
              </div>
              <div className="p-2">
                <p className="font-pixelify text-[11px] font-bold text-slate-800 uppercase truncate">{card.name}</p>
                {card.best ? (
                  <p className="font-bold text-[10px] text-[#4285F4]">⭐ {card.best.score}/100</p>
                ) : (
                  <p className="font-pixelify text-[10px] text-slate-400 italic">Unchallenged</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ───────────────────────────────────────────────────────────────
const PageContent = () => {
  const router = useRouter()
  const [username, setUsername] = useQueryState('username')
  const [cards, setCards] = useState<Card[]>([])
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [isTransitioningToSandbox, setIsTransitioningToSandbox] = useState(false)
  const [isLocked, setIsLocked] = useState(false)
  const [showCardSelector, setShowCardSelector] = useState(false)
  const [selectedCardForGame, setSelectedCardForGame] = useState<Card | null>(null)
  const [showAllCards, setShowAllCards] = useState(false)
  const [activeStep, setActiveStep] = useState<number | null>(null)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) audioRef.current.pause()
      else audioRef.current.play()
      setIsMusicPlaying(!isMusicPlaying)
    }
  }

  useEffect(() => {
    // Initial fetch and initialization
    CardStorage.initializeDefaultCards().then(setCards)

    // Poll for fresh scores every 5 seconds for real-time leaderboard
    const interval = setInterval(() => {
      CardStorage.getCards().then(fetchedCards => {
        if (fetchedCards.length > 0) {
          setCards(fetchedCards);
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [])

  const leaderboard = (() => {
    const userMap = new Map<string, { name: string; totalScore: number; cardCount: number }>()
    cards.forEach((card) => {
      if (!card.best) return
      const existing = userMap.get(card.best.name)
      if (existing) {
        existing.totalScore += card.best.score
        existing.cardCount += 1
      } else {
        userMap.set(card.best.name, { name: card.best.name, totalScore: card.best.score, cardCount: 1 })
      }
    })
    return Array.from(userMap.values())
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }))
  })()

  const handleCardSelected = (card: Card) => {
    setSelectedCardForGame(card)
    setShowCardSelector(false)
    setIsTransitioningToSandbox(true)
  }

  const handleNavigationToSandbox = () => {
    const params = new URLSearchParams()
    if (selectedCardForGame) params.set('selectedImage', selectedCardForGame.id.toString())
    if (username?.trim()) params.set('username', username.trim())
    posthog.capture('started_challenge', { selectedCardId: selectedCardForGame?.id, username })
    router.push(`/sandbox?${params.toString()}`)
  }

  const canPlay = !!(username?.trim()) && !isTransitioningToSandbox

  return (
    <div className="min-h-[100dvh] bg-[#EFF6FF] relative overflow-hidden">
      {/* Overlays & transitions */}
      <KioskLockScreen
        isLocked={isLocked}
        onUnlocked={() => { setIsLocked(false); setShowCardSelector(true) }}
        onCancel={() => setIsLocked(false)}
      />
      {showCardSelector && <CardSelectionModal cards={cards} onSelect={handleCardSelected} />}
      {showAllCards && <AllCardsModal cards={cards} onClose={() => setShowAllCards(false)} />}
      <SandboxTransition isVisible={isTransitioningToSandbox} onComplete={handleNavigationToSandbox} />
      <IntroScreen onComplete={() => {}} />
      <PixelBackground />

      {/* ─── Main layout ─────────────────────────────────────────── */}
      <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 py-8">

        {/* ── HERO HEADER ── */}
        <header className="flex flex-col items-center text-center mb-12 gap-3">
          <Image
            src="/images/logo.png"
            alt="GDGoC Telkom University"
            width={96} height={96}
            className="w-20 h-20 object-contain drop-shadow-md"
            priority
          />
          <div>
            <p className="font-pixelify text-[#4285F4] text-sm tracking-widest uppercase mb-1">GDGoC Telkom University Bandung</p>
            <h1 className="font-pixelify font-bold text-4xl sm:text-5xl lg:text-6xl tracking-wide text-slate-900 leading-tight">
              Prompting <span className="text-[#4285F4]">Challenge</span>
            </h1>
            <p className="font-pixelify text-[#34A853] text-lg mt-2">Prompt your way to victory!</p>
          </div>
        </header>

        {/* ── BODY: 2-col grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">

          {/* LEFT — How to Play + See All Cards button */}
          <div className="flex flex-col gap-6">
            {/* Section label */}
            <div className="flex items-center gap-3 mb-2">
              <div className="h-1 flex-1 bg-slate-200 rounded" />
              <span className="font-pixelify text-xs text-slate-500 tracking-widest uppercase">Cara Bermain</span>
              <div className="h-1 flex-1 bg-slate-200 rounded" />
            </div>

            {/* Steps grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {HOW_TO_PLAY_STEPS.map((step, i) => {
                const Icon = step.icon
                const isActive = activeStep === i
                return (
                  <button
                    key={i}
                    onClick={() => setActiveStep(isActive ? null : i)}
                    className={`
                      group text-left bg-white border-4 border-slate-900 p-5 relative
                      transition-all duration-150 cursor-pointer flex flex-col
                      ${isActive
                        ? `${step.shadow} translate-y-1`
                        : `shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:-translate-y-1`
                      }
                      active:translate-y-1 active:shadow-[2px_2px_0px_rgba(0,0,0,1)]
                    `}
                    style={{ animationDelay: `${i * 80}ms` }}
                  >
                    {/* Step number */}
                    <span className="absolute top-3 right-4 font-pixelify text-slate-200 text-4xl font-bold select-none leading-none">
                      {step.number}
                    </span>

                    {/* Icon */}
                    <div className={`w-11 h-11 ${step.bg} border-4 border-slate-900 flex items-center justify-center mb-4`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>

                    {/* Badge */}
                    <span className={`inline-block font-pixelify text-[10px] font-bold text-white px-2 py-0.5 ${step.badgeBg} border-2 border-slate-900 mb-2`}>
                      {step.badge}
                    </span>

                    {/* Title */}
                    <h3 className="font-pixelify font-bold text-slate-900 text-base uppercase tracking-wide mb-1 group-hover:text-[#4285F4] transition-colors">
                      {step.title}
                    </h3>

                    {/* Desc and Video */}
                    <div className={`transition-all duration-300 w-full overflow-hidden flex flex-col gap-3 ${isActive ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 sm:max-h-[500px] opacity-0 sm:opacity-100 sm:mt-2 sm:overflow-visible'}`}>
                      <p className="font-pixelify text-slate-500 text-xs leading-relaxed text-left">
                        {step.desc}
                      </p>
                      
                      <div className="relative aspect-video w-full border-2 border-slate-800 bg-slate-900 overflow-hidden flex items-center justify-center rounded shadow-inner">
                        <span className="absolute font-pixelify text-slate-500 text-[10px] animate-pulse">Memuat...</span>
                        <img src={step.video} alt={step.title} className="relative z-10 w-full h-full object-cover" />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* "See all cards" button */}
            <button
              onClick={() => setShowAllCards(true)}
              className="w-full flex items-center justify-center gap-2 font-pixelify text-sm font-bold text-slate-600 bg-white border-2 border-slate-300 py-3 hover:border-slate-500 hover:text-slate-900 transition-all shadow-[2px_2px_0px_rgba(0,0,0,0.15)] hover:shadow-[4px_4px_0px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 active:translate-y-0 active:shadow-none"
            >
              <ChevronDown className="w-4 h-4" />
              Lihat semua kemungkinan gambar ({cards.length} gambar)
            </button>
          </div>

          {/* RIGHT — Play form + Leaderboard */}
          <div className="flex flex-col gap-5">

            {/* ── PLAY FORM ── */}
            <div className="bg-white border-4 border-slate-900 shadow-[6px_6px_0px_rgba(0,0,0,1)] p-5">
              <div className="flex items-center gap-2 mb-4">
                <Gamepad2 className="w-5 h-5 text-[#4285F4]" />
                <h2 className="font-pixelify font-bold text-slate-900 text-base uppercase">Mulai Bermain</h2>
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <label className="block font-pixelify text-xs text-slate-500 uppercase mb-1.5">Namamu</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="username-input"
                      type="text"
                      value={username || ""}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Masukkan namamu..."
                      className="w-full pl-9 pr-3 py-2.5 border-2 border-slate-300 bg-white font-pixelify text-sm text-slate-800 focus:outline-none focus:border-[#4285F4] transition-colors placeholder:text-slate-400"
                      onKeyDown={(e) => { if (e.key === 'Enter' && canPlay) setIsLocked(true) }}
                    />
                  </div>
                </div>

                <button
                  id="play-now-button"
                  disabled={!canPlay}
                  onClick={() => setIsLocked(true)}
                  className={`
                    w-full py-3.5 font-pixelify font-bold text-lg uppercase tracking-wide
                    border-4 border-slate-900 transition-all duration-150
                    flex items-center justify-center gap-2
                    ${canPlay
                      ? 'bg-[#4285F4] text-white shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[0px_0px_0px_rgba(0,0,0,1)]'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    }
                  `}
                >
                  <Gamepad2 className="w-5 h-5" />
                  {canPlay ? 'Play Now!' : 'Masukkan Nama Dulu'}
                </button>

                {/* Scan hint */}
                <div className="flex items-start gap-2 bg-blue-50 border-2 border-blue-200 p-3">
                  <Scan className="w-4 h-4 text-[#4285F4] mt-0.5 shrink-0" />
                  <p className="font-pixelify text-[10px] text-blue-700 leading-relaxed">
                    Setelah klik Play, scan QR Code Instagram & Bevy GDGoC Telkom untuk verifikasi!
                  </p>
                </div>
              </div>
            </div>

            {/* ── LEADERBOARD ── */}
            <div className="bg-white border-4 border-slate-900 shadow-[6px_6px_0px_rgba(0,0,0,1)]">
              {/* Header */}
              <div className="flex items-center gap-2 px-5 py-4 border-b-4 border-slate-900 bg-yellow-400">
                <Trophy className="w-5 h-5 text-slate-900" />
                <h2 className="font-pixelify font-bold text-slate-900 text-base uppercase">Leaderboard</h2>
              </div>

              {leaderboard.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="font-pixelify text-slate-400 text-sm">Belum ada skor.</p>
                  <p className="font-pixelify text-slate-400 text-xs mt-1">Jadilah yang pertama!</p>
                </div>
              ) : (
                <ul className="divide-y-2 divide-slate-100">
                  {leaderboard.map((entry, idx) => (
                    <li
                      key={entry.rank}
                      className={`flex items-center justify-between px-4 py-3 transition-colors ${idx === 0 ? 'bg-yellow-50' : 'hover:bg-slate-50'}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-pixelify text-base w-7 text-center shrink-0">
                          {getMedalEmoji(entry.rank)}
                        </span>
                        <div className="min-w-0">
                          <p className="font-pixelify text-sm font-bold text-slate-800 truncate">{entry.name}</p>
                          <p className="font-pixelify text-[10px] text-slate-400">{entry.cardCount} card{entry.cardCount > 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className="shrink-0 ml-2 text-right">
                        <span className="font-bold text-sm text-[#4285F4]">{entry.totalScore}</span>
                        <span className="font-bold text-[10px] text-slate-400 ml-1">pts</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Music toggle ─────────────────────────────────────────── */}
      <audio ref={audioRef} src="/bgm.mp3" loop />
      <button
        onClick={toggleMusic}
        className="fixed bottom-5 right-5 p-3 bg-white rounded-full border-4 border-slate-900 shadow-[4px_4px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-all z-40 active:translate-y-0.5 active:shadow-none"
        aria-label="Toggle Background Music"
      >
        {isMusicPlaying
          ? <Volume2 className="w-5 h-5 text-[#4285F4]" />
          : <VolumeX className="w-5 h-5 text-slate-400" />
        }
      </button>
    </div>
  )
}

// ─── Suspense wrapper ─────────────────────────────────────────────────────────
const Page = () => (
  <React.Suspense fallback={
    <div className="min-h-[100dvh] bg-[#EFF6FF] flex items-center justify-center font-pixelify text-xl text-slate-700">
      Loading...
    </div>
  }>
    <PageContent />
  </React.Suspense>
)

export default Page
