"use client";

import { useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import Image from 'next/image';

function VerifyContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session');
  
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = async () => {
    if (!sessionId) {
      setError('Session ID tidak ditemukan. Pastikan Anda men-scan QR code dengan benar.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/kiosk/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!res.ok) {
        throw new Error('Gagal membuka Kiosk. Sesi mungkin sudah kedaluwarsa.');
      }

      setUnlocked(true);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setLoading(false);
    }
  };

  if (unlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg border-4 border-slate-900">
          <span className="text-4xl text-white">✓</span>
        </div>
        <h2 className="text-2xl font-bold font-pixelify text-slate-800 mb-2">Akses Terbuka!</h2>
        <p className="text-slate-600 mb-8 font-medium">Silakan lihat layar laptop panitia untuk mulai bermain.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center max-w-md mx-auto py-10 px-4 min-h-screen">
      <div className="mb-8">
        <Image src="/images/logo.png" alt="GDGoC Logo" width={120} height={120} />
      </div>

      <div className="bg-white rounded-xl shadow-[6px_6px_0px_rgba(0,0,0,1)] border-2 border-slate-900 p-6 w-full text-center">
        <h1 className="text-2xl font-bold font-pixelify text-blue-600 mb-4">Verifikasi Player</h1>
        <p className="text-sm text-slate-600 mb-6 font-medium">
          Sebelum bermain <strong>Prompting Challenge</strong>, pastikan kamu sudah melakukan 2 langkah wajib ini:
        </p>

        <div className="flex flex-col gap-4 mb-8">
          <a
            href="https://www.instagram.com/gdgoc.telkomunivbdg/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 bg-pink-50 hover:bg-pink-100 border-2 border-pink-500 p-3 rounded-lg transition-colors"
          >
            <div className="text-2xl">📸</div>
            <div className="text-left">
              <div className="font-bold text-pink-700 text-sm">Follow Instagram</div>
              <div className="text-xs text-pink-600">@gdgoctelkomunivbdg</div>
            </div>
          </a>

          <a
            href="https://gdg.community.dev/gdg-on-campus-telkom-university-bandung-indonesia/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 bg-blue-50 hover:bg-blue-100 border-2 border-blue-500 p-3 rounded-lg transition-colors"
          >
            <div className="text-2xl">🤝</div>
            <div className="text-left">
              <div className="font-bold text-blue-700 text-sm">Join Bevy Chapter</div>
              <div className="text-xs text-blue-600">Telkom University Bandung</div>
            </div>
          </a>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-500 text-red-600 text-sm p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <button
          onClick={handleUnlock}
          disabled={loading}
          className={`w-full py-3 rounded-xl font-bold text-white transition-all border-2 border-slate-900 shadow-[4px_4px_0px_rgba(0,0,0,1)] 
            ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-green-500 hover:bg-green-400 active:translate-y-1 active:shadow-[0px_0px_0px_rgba(0,0,0,1)]'}
          `}
        >
          {loading ? 'Membuka...' : 'SAYA SUDAH FOLLOW & JOIN'}
        </button>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen bg-blue-50 relative overflow-hidden">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <VerifyContent />
      </Suspense>
    </div>
  );
}
