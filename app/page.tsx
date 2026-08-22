"use client"
import React, { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { useQueryState } from 'nuqs'
import { useRouter } from 'next/navigation'
import { CardStorage } from '@/lib/card-storage'
import { Card } from '@/types/card'
import posthog from 'posthog-js'
import { Volume2, VolumeX } from 'lucide-react'
import { PixelBackground } from '@/components/pixel-background'
import { IntroScreen } from '@/components/intro-screen'
import { SandboxTransition } from '@/components/sandbox-transition'
import { RulesModal } from '@/components/rules-modal'

const Page = () => {
  const router = useRouter()
  const [selectedCardId, setSelectedCardId] = useQueryState('selectedImage')
  const [username, setUsername] = useQueryState('username')
  const [selectedFaculty, setSelectedFaculty] = useQueryState('selectedFaculty')
  const [selectedProdi, setSelectedProdi] = useQueryState('selectedProdi')
  const [cards, setCards] = useState<Card[]>([])
  const [activeLeaderboardTab, setActiveLeaderboardTab] = useState<'player' | 'faculty' | 'prodi'>('player')
  const [isMusicPlaying, setIsMusicPlaying] = useState(false)
  const [isTransitioningToSandbox, setIsTransitioningToSandbox] = useState(false)
  const [showRules, setShowRules] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const toggleMusic = () => {
    if (audioRef.current) {
      if (isMusicPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsMusicPlaying(!isMusicPlaying)
    }
  }

  const selectedCardIdNumber = selectedCardId ? parseInt(selectedCardId) : null

  // Initialize cards from localStorage on component mount
  useEffect(() => {
    const initializedCards = CardStorage.initializeDefaultCards()
    setCards(initializedCards)
  }, [])

  const faculties = [
    {
      name: "Fakultas Informatika",
      color: "bg-yellow-50 border-yellow-200 text-yellow-800",
      prodis: [
        "S1 Informatika",
        "S1 Teknologi Informasi",
        "S1 Rekayasa Perangkat Lunak",
        "S1 Sains Data",
      ]
    },
    {
      name: "Fakultas Teknik Elektro",
      color: "bg-blue-50 border-blue-200 text-blue-800",
      prodis: [
        "S1 Teknik Elektro",
        "S1 Teknik Telekomunikasi",
        "S1 Teknik Fisika",
        "S1 Teknik Komputer",
        "S1 Teknik Biomedis",
        "S1 Teknik Sistem Energi",
        "S1 Smart Science and Technology",
      ]
    },
    {
      name: "Fakultas Industri Kreatif",
      color: "bg-orange-50 border-orange-200 text-orange-800",
      prodis: [
        "S1 Desain Komunikasi Visual",
        "S1 Desain Produk",
        "S1 Desain Interior",
        "S1 Kriya Tekstil dan Mode",
        "S1 Seni Rupa",
      ]
    },
    {
      name: "Fakultas Rekayasa Industri",
      color: "bg-green-50 border-green-700 text-green-800",
      prodis: [
        "S1 Teknik Industri",
        "S1 Sistem Informasi",
        "S1 Teknik Logistik",
        "S1 Manajemen Rekayasa",
      ]
    },
    {
      name: "Fakultas Komunikasi dan Ilmu Sosial",
      color: "bg-indigo-50 border-indigo-200 text-indigo-800",
      prodis: [
        "S1 Ilmu Komunikasi",
        "S1 Psikologi",
        "S1 Hubungan Masyarakat Digital",
        "S1 Penyiaran Digital",
      ]
    },
    {
      name: "Fakultas Ekonomi dan Bisnis",
      color: "bg-cyan-50 border-cyan-200 text-cyan-800",
      prodis: [
        "S1 Manajemen Bisnis Telekomunikasi dan Informatika (MBTI)",
        "S1 Administrasi Bisnis",
        "S1 Akuntansi",
        "S1 Bisnis Digital",
        "S1 Manajemen Bisnis Rekreasi",
      ]
    },
    {
      name: "Fakultas Ilmu Terapan",
      color: "bg-emerald-50 border-emerald-200 text-emerald-800",
      prodis: [
        "D3 Teknik Telekomunikasi",
        "D3 Rekayasa Perangkat Lunak Aplikasi",
        "D3 Sistem Informasi",
        "D3 Sistem Informasi Akuntansi",
        "D3 Teknologi Komputer",
        "D3 Manajemen Pemasaran",
        "D3 Perhotelan",
        "S1 Terapan Teknologi Rekayasa Multimedia",
        "S1 Terapan Sistem Informasi Kota Cerdas",
      ]
    }
  ]

  // Helper to get a colour for score progress bar
  const scoreBarColor = (score: number) => {
    if (score >= 80) return 'bg-[#34A853]'
    if (score >= 60) return 'bg-[#FBBC05]'
    if (score >= 40) return 'bg-[#EA4335]'
    return 'bg-red-500'
  }

  // Build a leaderboard ranking individual users by total score across all cards
  const leaderboard = (() => {
    const userMap = new Map<string, {
      name: string;
      prodi: string;
      faculty: string;
      totalScore: number;
      cardCount: number;
    }>()

    cards.forEach((card) => {
      if (!card.best) return
      const key = `${card.best.name}__${card.best.prodi ?? card.best.faculty}`
      const existing = userMap.get(key)
      if (existing) {
        existing.totalScore += card.best.score
        existing.cardCount += 1
      } else {
        userMap.set(key, {
          name: card.best.name,
          prodi: card.best.prodi || card.best.faculty,
          faculty: card.best.faculty,
          totalScore: card.best.score,
          cardCount: 1,
        })
      }
    })

    return Array.from(userMap.values())
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
        return b.cardCount - a.cardCount
      })
      .slice(0, 10)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }))
  })()

  // Build leaderboard ranking for Faculties
  const facultyLeaderboard = (() => {
    const facultyMap = new Map<string, {
      name: string;
      totalScore: number;
      cardCount: number;
    }>()

    cards.forEach((card) => {
      if (!card.best) return
      const key = card.best.faculty
      const existing = facultyMap.get(key)
      if (existing) {
        existing.totalScore += card.best.score
        existing.cardCount += 1
      } else {
        facultyMap.set(key, {
          name: card.best.faculty,
          totalScore: card.best.score,
          cardCount: 1,
        })
      }
    })

    return Array.from(facultyMap.values())
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
        return b.cardCount - a.cardCount
      })
      .slice(0, 10)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }))
  })()

  // Build leaderboard ranking for Prodis
  const prodiLeaderboard = (() => {
    const prodiMap = new Map<string, {
      name: string;
      faculty: string;
      totalScore: number;
      cardCount: number;
    }>()

    cards.forEach((card) => {
      if (!card.best) return
      const key = card.best.prodi || card.best.faculty
      const existing = prodiMap.get(key)
      if (existing) {
        existing.totalScore += card.best.score
        existing.cardCount += 1
      } else {
        prodiMap.set(key, {
          name: card.best.prodi || card.best.faculty,
          faculty: card.best.faculty,
          totalScore: card.best.score,
          cardCount: 1,
        })
      }
    })

    return Array.from(prodiMap.values())
      .sort((a, b) => {
        if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore
        return b.cardCount - a.cardCount
      })
      .slice(0, 10)
      .map((entry, idx) => ({ ...entry, rank: idx + 1 }))
  })()

  const selectedFacultyData = faculties.find(f => f.name === selectedFaculty)

  const handleNavigationToSandbox = () => {
    const params = new URLSearchParams()
    if (selectedCardId) params.set('selectedImage', selectedCardId)
    if (username?.trim()) params.set('username', username.trim())
    if (selectedFaculty) params.set('selectedFaculty', selectedFaculty)
    if (selectedProdi) params.set('selectedProdi', selectedProdi)
    posthog.capture('started_challenge', {
      selectedCardId,
      username,
      selectedFaculty,
      selectedProdi,
    })
    router.push(`/sandbox?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-blue-50 py-8 relative overflow-hidden">
      <SandboxTransition isVisible={isTransitioningToSandbox} onComplete={handleNavigationToSandbox} />
      <RulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
      <IntroScreen onComplete={() => {}} />
      <PixelBackground />
      <div className="container mx-auto px-4 relative z-10">
        {/* Title */}
        <div className='text-center justify-center items-center mb-12 flex flex-col '>
          <Image src="/images/logo.png" alt="Logo" width={100} height={100} />
          <div className='flex flex-col gap-y-3 items-center'>
            <h1 className="text-5xl md:text-6xl font-pixelify font-bold text-center tracking-wider mb-2 pixel-title z-10 relative">
              GDGoC Prompting Challenge
            </h1>
            <p className='text-green-600 text-2xl font-pixelify'>Prompt your way to victory!</p>
          </div>
        </div>

        {/* Content Row: Cards left & Leaderboard right */}
        <div className="flex flex-col lg:flex-row gap-8 mb-12">
          {/* Cards Grid */}
          <div className="flex-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-4 gap-4">
              {cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => setSelectedCardId(card.id.toString())}
                  className={`text-left group relative bg-white border-2 border-slate-800 focus:outline-none w-full 
                    transform transition-all duration-200 
                    ${selectedCardIdNumber === card.id 
                      ? 'ring-4 ring-yellow-400 shadow-[2px_2px_0px_rgba(0,0,0,1)] translate-y-1' 
                      : 'shadow-[6px_6px_0px_rgba(0,0,0,1)] hover:shadow-[8px_8px_0px_rgba(0,0,0,1)] hover:-translate-y-1 active:shadow-[0px_0px_0px_rgba(0,0,0,1)] active:translate-y-2'
                    }`}
                >
                  {/* Card Image */}
                  <div className="relative h-36 bg-slate-100 border-b-2 border-slate-800 overflow-hidden">
                    <Image
                      src={card.image}
                      alt={`Item ${card.id}`}
                      fill
                      className="object-contain group-hover:scale-110 transition-transform duration-300"
                      style={{ imageRendering: 'pixelated' }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/300x200/e5e7eb/6b7280?text=Card+${card.id}`;
                      }}
                    />
                    {/* Pixel Corner Accents (Decorative) */}
                    <div className="absolute top-1 left-1 w-2 h-2 bg-slate-800/20"></div>
                    <div className="absolute top-1 right-1 w-2 h-2 bg-slate-800/20"></div>
                    <div className="absolute bottom-1 left-1 w-2 h-2 bg-slate-800/20"></div>
                    <div className="absolute bottom-1 right-1 w-2 h-2 bg-slate-800/20"></div>
                  </div>

                  {/* Card Content */}
                  <div className="p-3 space-y-2 relative bg-white">
                    <h3 className="text-lg font-bold text-gray-800 font-pixelify uppercase tracking-wide group-hover:text-blue-600 transition-colors">{card.name}</h3>
                    {card.best ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-pixelify">
                          <span className="text-gray-500 uppercase">Top Player:</span>
                          <span className="font-bold text-gray-800 truncate max-w-[100px]">{card.best.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs font-pixelify">
                          <span className="text-gray-500 uppercase">Prodi:</span>
                          <span
                            className={`font-bold text-[9px] px-1.5 py-0.5 border-2 border-slate-800 ${faculties.find((f) => f.name === card.best!.faculty)?.color || 'bg-gray-100'}`}
                          >
                            {card.best.prodi || card.best.faculty}
                          </span>
                        </div>
                        {/* Score Bar with Pixel Style */}
                        <div className="mt-3">
                          <div className="w-full bg-slate-200 border-2 border-slate-800 h-3 relative">
                            <div
                              className={`h-full border-r-2 border-slate-800 ${scoreBarColor(card.best.score)}`}
                              style={{ width: `${card.best.score}%` }}
                            />
                          </div>
                          <div className="text-right text-[10px] font-bold text-gray-800 mt-1 font-pixelify">SCORE: {card.best.score}/100</div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500 font-pixelify mt-4 py-4 text-center border-2 border-dashed border-gray-300 bg-gray-50">
                        ? UNCHALLENGED ?
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Leaderboard + Form */}
          <div className="w-full font-pixelify lg:w-80 xl:w-72 flex flex-col gap-4">
            <button 
              onClick={() => setShowRules(true)}
              className="w-full bg-yellow-400 text-slate-900 border-2 border-slate-900 px-4 py-2 font-pixelify font-bold hover:bg-yellow-300 transition-colors shadow-[4px_4px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-[0px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center gap-2"
            >
              <span>❓</span> CARA BERMAIN
            </button>
            
            <div className="flex items-center justify-between mb-3 lg:mb-4">
              <h2 className="text-lg lg:text-xl font-bold text-blue-500">
                🏆 Leaderboard
              </h2>
            </div>
            {/* Tabs */}
            <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
              <button
                onClick={() => setActiveLeaderboardTab('player')}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${activeLeaderboardTab === 'player' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Player
              </button>
              <button
                onClick={() => setActiveLeaderboardTab('faculty')}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${activeLeaderboardTab === 'faculty' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Faculty
              </button>
              <button
                onClick={() => setActiveLeaderboardTab('prodi')}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${activeLeaderboardTab === 'prodi' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Prodi
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border divide-y">
              {activeLeaderboardTab === 'player' && (
                leaderboard.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    No scores yet. Be the first!
                  </div>
                ) : (
                  leaderboard.map((entry) => {
                    const facultyData = faculties.find(f => f.name === entry.faculty)
                    return (
                      <div key={entry.rank} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-full text-sm font-semibold text-gray-700">
                            {entry.rank}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-gray-800 truncate">{entry.name}</span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border truncate max-w-[130px] ${facultyData?.color ?? 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                              {entry.prodi}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-sm font-semibold text-gray-800">{entry.totalScore} pts</div>
                          <div className="text-xs text-gray-500">{entry.cardCount} card{entry.cardCount > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    )
                  })
                )
              )}

              {activeLeaderboardTab === 'faculty' && (
                facultyLeaderboard.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    No scores yet. Be the first!
                  </div>
                ) : (
                  facultyLeaderboard.map((entry) => {
                    const facultyData = faculties.find(f => f.name === entry.name)
                    return (
                      <div key={entry.rank} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-full text-sm font-semibold text-gray-700">
                            {entry.rank}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-gray-800 truncate max-w-[140px]">{entry.name}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-sm font-semibold text-gray-800">{entry.totalScore} pts</div>
                          <div className="text-xs text-gray-500">{entry.cardCount} card{entry.cardCount > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    )
                  })
                )
              )}

              {activeLeaderboardTab === 'prodi' && (
                prodiLeaderboard.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 text-sm">
                    No scores yet. Be the first!
                  </div>
                ) : (
                  prodiLeaderboard.map((entry) => {
                    const facultyData = faculties.find(f => f.name === entry.faculty)
                    return (
                      <div key={entry.rank} className="flex items-center justify-between p-3 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-2">
                          <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded-full text-sm font-semibold text-gray-700">
                            {entry.rank}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-semibold text-gray-800 truncate max-w-[130px]">{entry.name}</span>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border truncate max-w-[130px] mt-0.5 ${facultyData?.color ?? 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                              {entry.faculty}
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <div className="text-sm font-semibold text-gray-800">{entry.totalScore} pts</div>
                          <div className="text-xs text-gray-500">{entry.cardCount} card{entry.cardCount > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    )
                  })
                )
              )}
            </div>

            {/* Form */}
            <div className="mt-6 flex flex-col gap-3">
              <input
                type="text"
                value={username || ""}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-3 py-2 border bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#4285F4]"
              />

              <select
                value={selectedFaculty || ''}
                onChange={(e) => {
                  const newFaculty = e.target.value;
                  setSelectedFaculty(newFaculty || null);
                  setSelectedProdi(null);
                }}
                className="px-3 py-1.5 text-sm w-full bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#36322F] focus:border-transparent"
              >
                <option value="">Select your faculty...</option>
                {faculties.map(faculty => (
                  <option key={faculty.name} value={faculty.name}>
                    {faculty.name}
                  </option>
                ))}
              </select>

              {selectedFacultyData && (
                <select
                  value={selectedProdi || ''}
                  onChange={(e) => setSelectedProdi(e.target.value || null)}
                  className="px-3 py-1.5 text-sm w-full bg-white border border-gray-300 rounded-[10px] focus:outline-none focus:ring-2 focus:ring-[#4285F4] focus:border-transparent"
                >
                  <option value="">Select your program studi...</option>
                  {selectedFacultyData.prodis.map(prodi => (
                    <option key={prodi} value={prodi}>
                      {prodi}
                    </option>
                  ))}
                </select>
              )}

              <button
                disabled={selectedCardId === null || !username?.trim() || !selectedFaculty || !selectedProdi || isTransitioningToSandbox}
                onClick={() => setIsTransitioningToSandbox(true)}
                className={`w-full cursor-pointer py-2 rounded-md font-semibold text-white transition-colors
                  ${selectedCardId === null || !username?.trim() || !selectedFaculty || !selectedProdi || isTransitioningToSandbox
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-[#4285F4] hover:bg-blue-600 shadow-md'}
                  `}
              >
                Play Now!
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Audio Element and Floating Button */}
      <audio ref={audioRef} src="/bgm.mp3" loop />
      <button
        onClick={toggleMusic}
        className="fixed bottom-6 right-6 p-3 bg-white rounded-full shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors z-50 group flex items-center justify-center"
        aria-label="Toggle Background Music"
      >
        {isMusicPlaying ? (
          <Volume2 className="w-6 h-6 text-blue-500" />
        ) : (
          <VolumeX className="w-6 h-6 text-gray-400" />
        )}
      </button>
    </div>
  )
}

export default Page
