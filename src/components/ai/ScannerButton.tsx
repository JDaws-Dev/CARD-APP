'use client';

import { useState, useCallback } from 'react';
import { CameraIcon } from '@heroicons/react/24/outline';
import { CardScanner } from './CardScanner';
import { SnapToAddFlow } from './SnapToAddFlow';
import { cn } from '@/lib/utils';
import { useGameSelector } from '@/components/providers/GameSelectorProvider';

interface CardScanResult {
  identified: boolean;
  cardName?: string;
  setName?: string | null;
  setCode?: string | null;
  cardNumber?: string;
  cardType?: string;
  rarity?: string | null;
  specialFeatures?: string[];
  edition?: string | null;
  inkColor?: string;
  confidence?: 'high' | 'medium' | 'low';
  funFact?: string;
  suggestedCardId?: string | null;
  error?: string;
}

interface ScannerButtonProps {
  /** Button variant: 'primary' for gradient button, 'icon' for icon-only floating button */
  variant?: 'primary' | 'icon';
  /** Additional className for the button */
  className?: string;
  /** Label for the button (only shown in 'primary' variant) */
  label?: string;
}

type ModalState = 'closed' | 'scanning' | 'result';

export function ScannerButton({
  variant = 'primary',
  className,
  label = 'Scan Card',
}: ScannerButtonProps) {
  const { primaryGame } = useGameSelector();
  const [modalState, setModalState] = useState<ModalState>('closed');
  const [scanResult, setScanResult] = useState<CardScanResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const handleOpenScanner = useCallback(() => {
    setModalState('scanning');
    setScanResult(null);
    setCapturedImage(null);
  }, []);

  const handleCardIdentified = useCallback((result: CardScanResult) => {
    setScanResult(result);
    setModalState('result');
  }, []);

  const handleScanAnother = useCallback(() => {
    setScanResult(null);
    setCapturedImage(null);
    setModalState('scanning');
  }, []);

  const handleClose = useCallback(() => {
    setModalState('closed');
    setScanResult(null);
    setCapturedImage(null);
  }, []);

  return (
    <>
      {/* Scanner Button - uses game theme colors */}
      {variant === 'primary' ? (
        <button
          onClick={handleOpenScanner}
          className={cn(
            'inline-flex items-center gap-2 rounded-lg bg-game-gradient px-4 py-2 text-sm font-medium text-white shadow-sm shadow-game transition hover:opacity-90',
            className
          )}
          aria-label={label}
        >
          <CameraIcon className="h-5 w-5" />
          {label}
        </button>
      ) : (
        <button
          onClick={handleOpenScanner}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full bg-game-gradient text-white shadow-lg shadow-game transition hover:opacity-90 hover:shadow-xl',
            className
          )}
          aria-label={label}
        >
          <CameraIcon className="h-6 w-6" />
        </button>
      )}

      {/* Scanner Modal */}
      {modalState !== 'closed' && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label="Card Scanner"
        >
          <div
            className="relative mx-4 w-full max-w-md overflow-hidden rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {modalState === 'scanning' && (
              <CardScanner
                gameSlug={primaryGame.id}
                onCardIdentified={handleCardIdentified}
                onClose={handleClose}
              />
            )}

            {modalState === 'result' && scanResult && (
              <SnapToAddFlow
                scanResult={scanResult}
                capturedImage={capturedImage || undefined}
                onScanAnother={handleScanAnother}
                onClose={handleClose}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
