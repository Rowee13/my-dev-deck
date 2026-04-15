'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

function formatRemaining(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours >= 1) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  return `${minutes}m ${seconds}s`;
}

export function DemoBanner() {
  const { user } = useAuth();
  const [remaining, setRemaining] = useState<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const expiresAt = user?.expiresAt
    ? new Date(user.expiresAt as string | Date)
    : null;
  const expiresMs = expiresAt ? expiresAt.getTime() : null;

  useEffect(() => {
    if (!user?.isDemo || !expiresMs) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setRemaining(null);
      return;
    }

    const tick = () => {
      const ms = expiresMs - Date.now();
      if (ms <= 0) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setRemaining(0);
        window.location.href = '/login?expired=1';
        return;
      }
      setRemaining(ms);
    };

    tick();
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [user?.isDemo, expiresMs]);

  if (!user?.isDemo || remaining === null || remaining <= 0) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full bg-amber-300 text-amber-950 border-b border-amber-500 px-4 py-2 text-sm font-medium flex items-center justify-center gap-2 flex-wrap"
    >
      <span>
        Demo expires in{' '}
        <span className="font-mono font-semibold tabular-nums">
          {formatRemaining(remaining)}
        </span>
      </span>
      <span aria-hidden="true">—</span>
      <Link
        href="/login"
        className="underline underline-offset-2 font-semibold hover:text-amber-900"
      >
        Sign up to keep your data
      </Link>
    </div>
  );
}
