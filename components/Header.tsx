"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Avatar from "@/components/Avatar";

export default function Header({
  displayName,
  avatarShape,
  avatarColor,
  avatarIcon,
  avatarUrl,
}: {
  displayName: string | null;
  avatarShape?: string | null;
  avatarColor?: string | null;
  avatarIcon?: string | null;
  avatarUrl?: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="mb-8 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <svg width="26" height="26" viewBox="0 0 38 38">
          <circle cx="19" cy="19" r="17" fill="url(#headerLogoGrad)" />
          <path d="M4 29 L9 22 L12 25.5 L14.5 20.5 L17.5 24 L19 19 Z" fill="white" opacity="0.95" />
          <path d="M34 29 L29 22 L26 25.5 L23.5 20.5 L20.5 24 L19 19 Z" fill="white" opacity="0.95" />
          <defs>
            <linearGradient id="headerLogoGrad" x1="2" y1="2" x2="36" y2="36" gradientUnits="userSpaceOnUse">
              <stop stopColor="#2f8ce0" />
              <stop offset="1" stopColor="#0b4384" />
            </linearGradient>
          </defs>
        </svg>
        <span className="font-serif text-lg font-extrabold text-navy">Game On</span>
      </Link>
      <div className="flex items-center gap-3">
        <button onClick={signOut} className="text-xs text-slate-500 underline hover:text-slate-800">
          Sign out
        </button>
        <Link href="/settings" title="Edit profile">
          <Avatar
            shape={(avatarShape as any) ?? "circle"}
            color={avatarColor}
            icon={avatarIcon}
            photoUrl={avatarUrl}
            name={displayName}
            size="sm"
          />
        </Link>
      </div>
    </header>
  );
}
