'use client';

import { useState } from 'react';
import Cookies from 'js-cookie';
import { tryDemo } from '../../lib/api';

const DEMO_MODE_ENABLED = process.env.NEXT_PUBLIC_DEMO_MODE_ENABLED === 'true';

type Variant = 'primary' | 'secondary' | 'nav';

interface Props {
  variant?: Variant;
  className?: string;
}

const VARIANT_CLASSES: Record<Variant, string> = {
  primary:
    'px-6 py-3 text-base bg-blue-600 text-white rounded-md hover:bg-blue-700 hover:scale-105 transition-all disabled:opacity-50',
  secondary:
    'px-5 py-2.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50',
  nav: 'px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50',
};

export function TryDemoButton({ variant = 'primary', className = '' }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!DEMO_MODE_ENABLED) return null;

  const handleClick = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await tryDemo();
      if (res.status === 201 || res.ok) {
        Cookies.set('session', 'active', { path: '/', expires: 1 });
        window.location.href = '/dashboard';
        return;
      }
      if (res.status === 429) {
        setError('Demo limit reached, try again later.');
        return;
      }
      if (res.status === 404) {
        setError('Demo is not available right now.');
        return;
      }
      let message = 'Could not start demo. Please try again.';
      try {
        const body = await res.json();
        if (body?.message) message = body.message;
      } catch {
        // ignore
      }
      setError(message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start demo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={VARIANT_CLASSES[variant]}
      >
        {loading ? 'Starting demo...' : 'Try Demo'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
