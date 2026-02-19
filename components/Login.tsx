// components/Login.tsx
"use client";

import React, { useState } from 'react';
import { LoginProps } from './types';

export function Login({ onSignIn, onSignUp }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const { error } = isSignUp 
      ? await onSignUp(email, password)
      : await onSignIn(email, password);

    if (error) {
      setError(error.message);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-dvh flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center mb-2">Trajectorr</h1>
        <p className="text-[var(--text-muted)] text-center text-sm mb-8">
          {isSignUp ? 'Create your account' : 'Sign in to continue'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[var(--bg-card)] border border-[var(--bg-cell-empty)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-steady)]"
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-[var(--bg-card)] border border-[var(--bg-cell-empty)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-steady)]"
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-[var(--accent-steady)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : (isSignUp ? 'Sign Up' : 'Sign In')}
          </button>
        </form>

        <p className="text-center text-sm mt-6 text-[var(--text-muted)]">
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-[var(--accent-steady)] hover:underline"
          >
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </button>
        </p>
      </div>
    </div>
  );
}