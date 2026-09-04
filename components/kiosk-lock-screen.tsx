"use client";

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Smartphone, CheckCircle2, Gamepad2, Loader2 } from 'lucide-react';

interface KioskLockScreenProps {
  isLocked: boolean;
  onUnlocked: () => void;
  onCancel?: () => void;
}

export function KioskLockScreen({ isLocked, onUnlocked, onCancel }: KioskLockScreenProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string>('');
  const [pollingError, setPollingError] = useState<boolean>(false);
  const [isVerified, setIsVerified] = useState(false);

  // Initialize session and origin
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin);
    }
  }, []);

  // Fetch a new session when locked
  useEffect(() => {
    if (isLocked) {
      setPollingError(false);
      setIsVerified(false);
      fetch('/api/kiosk', { method: 'POST' })
        .then(res => res.json())
        .then(data => {
          if (data.sessionId) setSessionId(data.sessionId);
        })
        .catch(err => {
          console.error('Failed to create kiosk session', err);
        });
    }
  }, [isLocked]);

  // Poll for unlock status
  useEffect(() => {
    if (!isLocked || !sessionId || isVerified) return;

    const pollStatus = async () => {
      try {
        const res = await fetch(`/api/kiosk?session=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setPollingError(false);
          if (data.unlocked) {
            setIsVerified(true);
          }
        }
      } catch (err) {
        console.error('Failed to poll kiosk status', err);
        setPollingError(true);
      }
    };

    const intervalId = setInterval(pollStatus, 2000); // Poll every 2 seconds

    return () => clearInterval(intervalId);
  }, [isLocked, sessionId, isVerified]);

  if (!isLocked) return null;

  const verifyUrl = `${origin}/verify?session=${sessionId}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full flex flex-col items-center text-center shadow-[10px_10px_0px_rgba(0,0,0,1)] border-4 border-slate-900 relative my-auto">
        
        {/* Tombol Exit / Close di Pojok Kanan Atas */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 w-10 h-10 bg-slate-100 hover:bg-red-500 hover:text-white text-slate-700 rounded-full border-2 border-slate-900 flex items-center justify-center font-bold transition-all shadow-[2px_2px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none z-10"
            title="Tutup"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Icon Status */}
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-md border-2 border-slate-900 transition-colors ${
          isVerified ? 'bg-green-500 text-white' : 'bg-amber-400 text-slate-900'
        }`}>
          {isVerified ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : (
            <Smartphone className="w-7 h-7" />
          )}
        </div>

        {/* Judul & Deskripsi Mudah Dipahami */}
        <h2 className="text-2xl sm:text-3xl font-bold font-pixelify text-slate-800 mb-2 uppercase tracking-wide">
          {isVerified ? "Yeay, Berhasil! 🎉" : "Scan Untuk Main"}
        </h2>

        <p className="text-slate-600 text-sm sm:text-base mb-4 font-medium leading-relaxed">
          {isVerified ? (
            <span className="text-green-700 font-bold">
              Akun kamu sudah terverifikasi! Tekan tombol di bawah untuk mulai bermain.
            </span>
          ) : (
            <span>
              1. Buka <b>kamera HP</b> & scan QR Code di bawah.<br />
              2. <b>Follow IG & Join Bevy</b> GDGOC di HP kamu.
            </span>
          )}
        </p>

        {/* QR Code Box (Tetap Dipertahankan) */}
        <div className="bg-slate-50 p-4 rounded-2xl border-4 border-slate-900 mb-3 shadow-inner relative flex flex-col justify-center items-center">
          {sessionId ? (
            <div className="bg-white p-2 rounded-xl border-2 border-slate-200">
              <QRCodeSVG value={verifyUrl} size={210} level="H" />
            </div>
          ) : (
            <div className="w-[210px] h-[210px] flex flex-col items-center justify-center bg-slate-100 rounded-lg gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              <span className="text-slate-400 font-medium text-xs">Memuat QR Code...</span>
            </div>
          )}

          {pollingError && (
            <div className="absolute inset-0 bg-white/90 rounded-xl flex items-center justify-center p-4">
              <span className="text-red-500 font-bold text-xs bg-red-50 p-2 rounded-lg border border-red-200">
                Koneksi terputus. Mencoba ulang...
              </span>
            </div>
          )}
        </div>


        {/* Tombol Start Game (Muncul di Bawah QR Code Ketika Verified) */}
        {isVerified && (
          <button
            onClick={onUnlocked}
            className="w-full mt-2 py-3.5 px-6 bg-green-500 hover:bg-green-400 text-white font-pixelify text-2xl font-bold rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,1)] border-4 border-slate-900 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <Gamepad2 className="w-7 h-7" />
            START GAME
          </button>
        )}
      </div>
    </div>
  );
}
