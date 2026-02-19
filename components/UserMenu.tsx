"use client";

import { useState } from 'react';

interface UserMenuProps {
  userEmail: string | undefined;
  onSignOut: () => void;
}

export function UserMenu({ userEmail, onSignOut }: UserMenuProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      {/* User Avatar Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="w-8 h-8 rounded-full bg-[var(--accent-steady)] text-white text-xs font-semibold flex items-center justify-center hover:opacity-80 transition-opacity"
        title={userEmail}
      >
        {userEmail?.[0].toUpperCase() || 'U'}
      </button>
      
      {/* Dropdown Menu */}
      {showMenu && (
        <>
          {/* Backdrop to close menu */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu */}
          <div className="absolute top-full right-0 mt-2 w-48 bg-[var(--bg-card)] rounded-lg shadow-lg border border-[var(--bg-cell-empty)] z-20 py-2">
            <div className="px-4 py-2 border-b border-[var(--bg-cell-empty)]">
              <p className="text-xs text-[var(--text-muted)] uppercase tracking-wide">Account</p>
              <p className="text-sm truncate mt-0.5">{userEmail}</p>
            </div>
            <button
              onClick={() => {
                setShowMenu(false);
                onSignOut();
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-cell-empty)] transition-colors"
            >
              Sign out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
