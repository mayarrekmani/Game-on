"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const BALL_EMOJIS = ["⚽", "🏀", "🎾", "🏐", "🏈", "⚾"];

type Ball = {
  emoji: string;
  top: number;
  left: number;
  size: number;
  opacity: number;
};

export default function LoginPage() {
  const supabase = createClient();
  const [balls, setBalls] = useState<Ball[]>([]);

  useEffect(() => {
    const count = window.innerWidth < 600 ? 8 : 14;
    setBalls(
      Array.from({ length: count }).map((_, i) => ({
        emoji: BALL_EMOJIS[i % BALL_EMOJIS.length],
        top: Math.random() * 90,
        left: Math.random() * 90,
        size: 28 + Math.random() * 28,
        opacity: 0.35 + Math.random() * 0.35,
      }))
    );
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-navy to-navy-deep p-6">
      <div className="pointer-events-none absolute inset-0">
        {balls.map((b, i) => (
          <div
            key={i}
            className="absolute animate-pulse"
            style={{
              top: `${b.top}%`,
              left: `${b.left}%`,
              fontSize: `${b.size}px`,
              opacity: b.opacity,
            }}
          >
            {b.emoji}
          </div>
        ))}
      </div>

      <div className="relative z-10 w-full max-w-sm rounded-3xl bg-slate-50/95 p-9 shadow-2xl">
        <div className="mb-5 flex items-center gap-2.5">
          <svg width="34" height="34" viewBox="0 0 38 38">
            <circle cx="19" cy="19" r="17" fill="url(#logoGrad)" />
            <path
              d="M4 29 L9 22 L12 25.5 L14.5 20.5 L17.5 24 L19 19 Z"
              fill="white"
              opacity="0.95"
            />
            <path
              d="M34 29 L29 22 L26 25.5 L23.5 20.5 L20.5 24 L19 19 Z"
              fill="white"
              opacity="0.95"
            />
            <defs>
              <linearGradient id="logoGrad" x1="2" y1="2" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#2f8ce0" />
                <stop offset="1" stopColor="#0b4384" />
              </linearGradient>
            </defs>
          </svg>
          <span className="font-serif text-2xl font-extrabold">GAME ON</span>
        </div>
        <h1 className="mb-6 font-serif text-sm font-semibold text-slate-500">
          Get your crew on the field. Sign in to create or join a group.
        </h1>
        <button
          onClick={signInWithGoogle}
          className="w-full rounded-xl bg-navy py-3.5 text-sm font-bold text-white hover:bg-navy-deep"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
