"use client";

import Image from "next/image";
import localFont from "next/font/local";
import onboardImg from "../assets/onboard.jpg";
import type { OnboardingProps } from "./types";

const canopee = localFont({
  src: "../assets/Canopee Regular.otf",
  display: "swap",
});

export function Onboarding({ onAddProcess }: OnboardingProps) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="flex justify-between items-start p-6 pb-4">
        <h1 className="text-xl font-bold">Trajectorr</h1>
        <button
          onClick={onAddProcess}
          className="w-10 h-10 rounded-lg bg-[var(--bg-cell-empty)] flex items-center justify-center text-xl hover:bg-[var(--bg-card)] transition-colors"
          aria-label="Add your first process"
        >
          +
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-16">
        <div className="w-full max-w-3xl rounded-xl shadow-lg outline-2 outline-dashed outline-offset-8 outline-green overflow-hidden">
          <Image
            src={onboardImg}
            alt="Your life is a canvas"
            className="w-full h-auto object-cover"
            priority
          />
        </div>

        <h2 className={`text-4xl tracking-tight text-center mt-8 ${canopee.className}`}>
          Your Life is a CANVAS
        </h2>

        <p className="text-center text-sm text-[var(--text-muted)] mt-4">
          Tap <span className="font-semibold text-[var(--text-secondary)]">+</span> to add your first process and start painting.
        </p>
      </div>
    </div>
  );
}
