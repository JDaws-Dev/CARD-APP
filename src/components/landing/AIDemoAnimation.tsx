'use client';

import { useEffect, useState, useRef } from 'react';
import { CameraIcon, SparklesIcon, CheckCircleIcon } from '@heroicons/react/24/solid';

/**
 * AIDemoAnimation - Animated mockup showing "Snap to Add" AI feature in action
 *
 * Animation sequence:
 * 1. Phone camera view with card in frame
 * 2. Camera flash/scan effect
 * 3. Card slides out and gets "identified"
 * 4. Success checkmark with card name
 * 5. Reset and loop
 */
export function AIDemoAnimation() {
  const [phase, setPhase] = useState<'camera' | 'scanning' | 'identified' | 'success'>('camera');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Animation timing sequence
    const runAnimation = () => {
      setPhase('camera');

      timeoutRef.current = setTimeout(() => {
        setPhase('scanning');

        timeoutRef.current = setTimeout(() => {
          setPhase('identified');

          timeoutRef.current = setTimeout(() => {
            setPhase('success');

            timeoutRef.current = setTimeout(() => {
              runAnimation(); // Loop
            }, 2000);
          }, 1200);
        }, 800);
      }, 1500);
    };

    runAnimation();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-sm">
      {/* Phone frame */}
      <div className="relative mx-auto aspect-[9/16] w-48 overflow-hidden rounded-3xl bg-gray-900 p-2 shadow-2xl sm:w-56">
        {/* Phone notch */}
        <div className="absolute left-1/2 top-2 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />

        {/* Screen content */}
        <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-b from-gray-800 to-gray-900">
          {/* Camera viewfinder */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Viewfinder corners */}
            <div className="absolute left-4 top-12 h-8 w-8 border-l-2 border-t-2 border-cyan-400/60" />
            <div className="absolute right-4 top-12 h-8 w-8 border-r-2 border-t-2 border-cyan-400/60" />
            <div className="absolute bottom-12 left-4 h-8 w-8 border-b-2 border-l-2 border-cyan-400/60" />
            <div className="absolute bottom-12 right-4 h-8 w-8 border-b-2 border-r-2 border-cyan-400/60" />

            {/* Card in frame */}
            <div
              className={`relative transition-all duration-500 ease-out ${
                phase === 'camera' ? 'scale-100 opacity-100' :
                phase === 'scanning' ? 'scale-105' :
                phase === 'identified' ? 'scale-90 -translate-y-4' :
                'scale-75 -translate-y-8 opacity-0'
              }`}
            >
              {/* Simulated card */}
              <div className="relative h-28 w-20 overflow-hidden rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 shadow-lg sm:h-32 sm:w-24">
                {/* Card inner design - represents Charizard-like card */}
                <div className="absolute inset-1 rounded-md bg-gradient-to-br from-amber-300 to-orange-400">
                  <div className="absolute inset-x-1 top-1 h-[60%] rounded-sm bg-white/20" />
                  <div className="absolute bottom-2 left-1 right-1 h-6 rounded-sm bg-white/10" />
                </div>

                {/* Scanning overlay */}
                {phase === 'scanning' && (
                  <div className="absolute inset-0 animate-pulse bg-cyan-400/30">
                    <div
                      className="absolute inset-x-0 h-1 bg-cyan-400"
                      style={{
                        animation: 'scan-line 0.8s ease-in-out infinite',
                        top: '0%',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Flash effect during scanning */}
          {phase === 'scanning' && (
            <div className="animate-flash absolute inset-0 bg-white/40" />
          )}

          {/* AI identification result */}
          <div
            className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-4 transition-all duration-500 ${
              phase === 'identified' || phase === 'success'
                ? 'translate-y-0 opacity-100'
                : 'translate-y-full opacity-0'
            }`}
          >
            <div className="flex items-center gap-2">
              {phase === 'success' ? (
                <CheckCircleIcon className="h-5 w-5 shrink-0 text-green-400" />
              ) : (
                <SparklesIcon className="h-5 w-5 shrink-0 animate-pulse text-cyan-400" />
              )}
              <div className="min-w-0 flex-1">
                <p className={`text-xs font-medium transition-colors ${
                  phase === 'success' ? 'text-green-400' : 'text-cyan-400'
                }`}>
                  {phase === 'success' ? 'Added to Collection!' : 'AI Identified'}
                </p>
                <p className="truncate text-sm font-bold text-white">
                  Charizard ex
                </p>
              </div>
            </div>
          </div>

          {/* Camera button */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-all ${
                phase === 'camera'
                  ? 'border-white/60 bg-white/10'
                  : 'border-cyan-400/60 bg-cyan-400/20'
              }`}
            >
              <CameraIcon className="h-5 w-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Floating sparkles decoration */}
      <div className="absolute -right-2 -top-2 animate-pulse">
        <SparklesIcon className="h-6 w-6 text-violet-400" />
      </div>
      <div className="absolute -bottom-1 -left-3 animate-pulse" style={{ animationDelay: '0.5s' }}>
        <SparklesIcon className="h-5 w-5 text-cyan-400" />
      </div>
    </div>
  );
}
