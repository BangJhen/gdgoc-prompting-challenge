"use client"
import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { useQueryState } from 'nuqs'
import { useRouter } from 'next/navigation'
import { CardStorage } from '@/lib/card-storage'
import { Card } from '@/types/card'
import posthog from 'posthog-js'

const Page = () => {
  const router = useRouter()
  const [selectedCardId, setSelectedCardId] = useQueryState('selectedImage')
  const [username, setUsername] = useQueryState('username')
  const [selectedFaculty, setSelectedFaculty] = useQueryState('selectedFaculty')
  const [selectedProdi, setSelectedProdi] = useQueryState('selectedProdi')
  const [cards, setCards] = useState<Card[]>([])

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
        "S1 Sistem Informasi",
        "S1 Teknik Komputer",
        "S1 Ilmu Komputasi",
        "D3 Rekayasa Perangkat Lunak Aplikasi",
      ]
    },
    {
      name: "Fakultas Teknik Elektro",
      color: "bg-blue-50 border-blue-200 text-blue-800",
      prodis: [
        "S1 Teknik Elektro",
        "S1 Teknik Telekomunikasi",
        "S1 Teknik Fisika",
        "S2 Teknik Elektro",
      ]
    },
    {
      name: "Fakultas Industri Kreatif",
      color: "bg-orange-50 border-orange-200 text-orange-800",
      prodis: [
        "S1 Desain Komunikasi Visual",
        "S1 Desain Produk Inovasi",
        "S1 Kriya",
        "S1 Seni Rupa",
        "S1 Film dan Televisi",
        "S1 Fashion & Textile Design",
      ]
    },
    {
      name: "Fakultas Rekayasa Industri",
      color: "bg-green-50 border-green-700 text-green-800",
      prodis: [
        "S1 Teknik Industri",
        "S1 Sistem Informasi Industri Otomotif",
        "S1 International ICT Business",
        "S2 Teknik Industri",
      ]
    },
    {
      name: "Fakultas Komunikasi Sosial",
      color: "bg-indigo-50 border-indigo-200 text-indigo-800",
      prodis: [
        "S1 Ilmu Komunikasi",
        "S1 Administrasi Bisnis",
        "S1 Manajemen",
        "S2 Ilmu Komunikasi",
      ]
    },
    {
      name: "Fakultas Ekonomi Bisnis",
      color: "bg-cyan-50 border-cyan-200 text-cyan-800",
      prodis: [
        "S1 Akuntansi",
        "S1 Manajemen Bisnis Telekomunikasi dan Informatika",
        "S1 Bisnis Digital",
        "S2 Manajemen",
      ]
    },
    {
      name: "Fakultas Industri Terapan",
      color: "bg-emerald-50 border-emerald-200 text-emerald-800",
      prodis: [
        "D3 Teknik Telekomunikasi",
        "D3 Teknologi Komputer",
        "D3 Komputerisasi Akuntansi",
        "D3 Manajemen Informatika",
        "D4 Teknologi Rekayasa Multimedia",
        "D4 Teknologi Rekayasa Sistem Elektronika",
      ]
    },
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

  const selectedFacultyData = faculties.find(f => f.name === selectedFaculty)

  return (
    <div className="min-h-screen bg-blue-50 py-8">
      <div className="container mx-auto px-4">
        {/* Title */}
        <div className='text-center justify-center items-center mb-12 flex flex-col '>
          <Image src="/images/logo.png" alt="Logo" width={100} height={100} />
          <div className='flex flex-col gap-y-3'>
            <h1 className="text-5xl font-pixelify font-bold text-center text-yellow-500">
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
                  className={`text-left cursor-pointer bg-white rounded-lg border transition-shadow duration-300 focus:outline-none w-full 
                    ${selectedCardIdNumber === card.id ? 'ring-4 ring-[#4285F4] shadow-lg' : 'shadow-sm hover:shadow-md hover:-translate-y-0.5'}
                    transform transition-transform`}
                >
                  {/* Card Image */}
                  <div className="relative h-36 bg-slate-50 rounded-t-lg overflow-hidden">
                    <Image
                      src={card.image}
                      alt={`Item ${card.id}`}
                      fill
                      className="object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/300x200/e5e7eb/6b7280?text=Card+${card.id}`;
                      }}
                    />
                  </div>

                  {/* Card Content */}
                  <div className="p-3 space-y-1">
                    <h3 className="text-base font-semibold text-gray-800 font-pixelify">{card.name}</h3>
                    {card.best ? (
                      <>
                        <div className="flex items-center justify-between text-sm font-pixelify">
                          <span className="text-gray-600">Best:</span>
                          <span className="font-medium text-gray-800">{card.best.name}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm font-pixelify">
                          <span className="text-gray-600">Prodi:</span>
                          <span
                            className={`font-medium text-[10px] px-1.5 py-0.5 rounded border ${faculties.find((f) => f.name === card.best!.faculty)?.color}`}
                          >
                            {card.best.prodi || card.best.faculty}
                          </span>
                        </div>
                        {/* Score Bar */}
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className={`h-1 rounded-full ${scoreBarColor(card.best.score)}`}
                              style={{ width: `${card.best.score}%` }}
                            />
                          </div>
                          <div className="text-right text-[10px] text-gray-500 mt-1">{card.best.score}/100</div>
                        </div>
                      </>
                    ) : (
                      <div className="text-sm text-gray-500 font-pixelify mt-2">
                        No one has taken this challenge yet!
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Leaderboard + Form */}
          <div className="w-full font-pixelify lg:w-80 xl:w-72">
            <h2 className="text-xl font-bold mb-4 text-blue-500 text-center lg:text-left">
              🏆 Player Leaderboard
            </h2>
            <div className="bg-white rounded-lg shadow-sm border divide-y">
              {leaderboard.length === 0 ? (
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
                disabled={selectedCardId === null || !username?.trim() || !selectedFaculty || !selectedProdi}
                onClick={() => {
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
                }}
                className={`w-full cursor-pointer py-2 rounded-md font-semibold text-white transition-colors
                  ${selectedCardId === null || !username?.trim() || !selectedFaculty || !selectedProdi
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
    </div>
  )
}

export default Page
