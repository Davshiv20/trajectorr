"use client";

import React, { useState} from "react";
import { AddProcessModalProps } from './types';

const DEFAULT_COLOR_KEY = 'code';
export function AddProcessModal({ isOpen, onClose, onAdd }: AddProcessModalProps) {
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
  
    if (!isOpen) return null;
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!name.trim()) return;
  
      setIsSubmitting(true);
      await onAdd(name.trim(), category.trim(), DEFAULT_COLOR_KEY);
      setIsSubmitting(false);
      
      // Reset form
      setName('');
      setCategory('');
      onClose();
    };
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black/30 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <div className="relative bg-[var(--bg-card)] rounded-xl p-6 w-full max-w-sm mx-4 shadow-xl">
          <h2 className="text-lg font-semibold mb-4">Add Process</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Code, Run, Read"
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg-base)] border border-[var(--bg-cell-empty)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-steady)]"
                autoFocus
                required
              />
            </div>
  
            {/* Category */}
            <div>
              <label className="block text-xs text-[var(--text-muted)] uppercase tracking-wide mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Deep Work, Health, Growth"
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg-base)] border border-[var(--bg-cell-empty)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-steady)]"
              />
            </div>
  
  
            {/* Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-lg bg-[var(--bg-cell-empty)] text-[var(--text-secondary)] font-medium hover:bg-[var(--bg-base)] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !name.trim()}
                className="flex-1 py-3 rounded-lg bg-[var(--accent-steady)] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? 'Adding...' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }