'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAction } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useCurrentProfile } from '@/hooks/useCurrentProfile';
import { cn } from '@/lib/utils';
import {
  CameraIcon,
  XMarkIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import type { Id } from '../../../convex/_generated/dataModel';

type GameSlug = 'pokemon' | 'yugioh' | 'onepiece' | 'lorcana';

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

interface CardScannerProps {
  /** The game to scan cards for */
  gameSlug?: GameSlug;
  /** Callback when a card is successfully identified */
  onCardIdentified?: (result: CardScanResult) => void;
  /** Callback when the scanner is closed */
  onClose?: () => void;
  /** Additional className for the container */
  className?: string;
}

type ScannerState = 'camera' | 'preview' | 'scanning' | 'result';

export function CardScanner({
  gameSlug = 'pokemon',
  onCardIdentified,
  onClose,
  className,
}: CardScannerProps) {
  const { profileId, family } = useCurrentProfile();
  const scanCard = useAction(api.ai.cardScanner.scanCard);

  const [state, setState] = useState<ScannerState>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<CardScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize camera with fallback constraints
  const startCamera = useCallback(async () => {
    setCameraError(null);

    // Try progressively simpler constraints
    const constraintOptions = [
      // First try: preferred constraints for mobile back camera
      {
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      // Second try: simpler constraints without facingMode
      {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      // Third try: minimal constraints - just video
      {
        video: true,
        audio: false,
      },
    ];

    let lastError: Error | null = null;

    for (let i = 0; i < constraintOptions.length; i++) {
      const constraints = constraintOptions[i];
      try {
        console.log(`Camera attempt ${i + 1}/${constraintOptions.length}:`, constraints);
        const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Camera started successfully with constraints:', constraints);

        setStream(mediaStream);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        return; // Success - exit the function
      } catch (err) {
        console.error(`Camera attempt ${i + 1} failed:`, {
          errorName: err instanceof Error ? err.name : 'Unknown',
          errorMessage: err instanceof Error ? err.message : String(err),
          constraints,
        });
        lastError = err instanceof Error ? err : new Error(String(err));

        // If permission denied or no camera, don't try other constraints
        if (err instanceof Error && (err.name === 'NotAllowedError' || err.name === 'NotFoundError')) {
          break;
        }
      }
    }

    // All attempts failed - set appropriate error message
    if (lastError) {
      console.error('All camera attempts failed. Last error:', {
        name: lastError.name,
        message: lastError.message,
      });

      if (lastError.name === 'NotAllowedError') {
        setCameraError(
          'Camera access was denied. Please allow camera access in your browser settings to scan cards.'
        );
      } else if (lastError.name === 'NotFoundError') {
        setCameraError('No camera found. Please connect a camera to scan cards.');
      } else if (lastError.name === 'NotReadableError') {
        setCameraError(
          'Camera is in use by another application. Please close other apps using the camera and try again.'
        );
      } else if (lastError.name === 'OverconstrainedError') {
        setCameraError(
          'Camera does not support the required settings. Please try a different browser or device.'
        );
      } else {
        setCameraError(
          `Could not start camera: ${lastError.name} - ${lastError.message}. Please try again or check your device settings.`
        );
      }
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  }, [stream]);

  // Start camera when component mounts
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Capture photo from video stream
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data as base64
    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageData);
    setState('preview');

    // Stop the camera stream after capturing
    stopCamera();
  }, [stopCamera]);

  // Reset to camera view
  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setScanResult(null);
    setState('camera');
    startCamera();
  }, [startCamera]);

  // Scan the captured card
  const scanCapturedCard = useCallback(async () => {
    console.log('scanCapturedCard called:', { capturedImage: !!capturedImage, profileId, familyId: family?.id });

    if (!capturedImage) {
      console.error('No captured image');
      return;
    }

    if (!profileId) {
      console.error('No profileId - user may not be authenticated');
      setScanResult({
        identified: false,
        error: 'Please sign in to scan cards!',
      });
      setState('result');
      return;
    }

    if (!family?.id) {
      console.error('No family ID - user may not have a family account');
      setScanResult({
        identified: false,
        error: 'Please set up your family account to scan cards!',
      });
      setState('result');
      return;
    }

    setState('scanning');

    try {
      // Extract base64 data (remove data:image/jpeg;base64, prefix)
      const base64Data = capturedImage.split(',')[1];

      const result = await scanCard({
        profileId: profileId as Id<'profiles'>,
        familyId: family.id as Id<'families'>,
        imageBase64: base64Data,
        imageType: 'jpeg',
        gameSlug,
      });

      setScanResult(result);
      setState('result');

      if (result.identified && onCardIdentified) {
        onCardIdentified(result);
      }
    } catch (err) {
      console.error('Scan error:', err);
      setScanResult({
        identified: false,
        error: 'Something went wrong while scanning. Please try again!',
      });
      setState('result');
    }
  }, [capturedImage, profileId, family?.id, scanCard, gameSlug, onCardIdentified]);

  // Handle close
  const handleClose = useCallback(() => {
    stopCamera();
    onClose?.();
  }, [stopCamera, onClose]);

  // Confidence badge color
  const getConfidenceColor = (confidence?: string) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div
      className={cn(
        'relative flex flex-col overflow-hidden rounded-2xl bg-gray-900',
        className
      )}
      role="region"
      aria-label="Card Scanner"
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <CameraIcon className="h-5 w-5 text-white" />
          <h2 className="font-semibold text-white">Scan Your Card</h2>
        </div>
        <button
          onClick={handleClose}
          className="rounded-full p-1 text-gray-400 transition hover:bg-gray-700 hover:text-white"
          aria-label="Close scanner"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Camera/Preview Area */}
      <div className="relative aspect-[3/4] w-full bg-black">
        {/* Camera Error */}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <ExclamationCircleIcon className="mb-4 h-12 w-12 text-red-400" />
            <p className="text-white">{cameraError}</p>
            <button
              onClick={startCamera}
              className="mt-4 rounded-lg bg-kid-primary px-4 py-2 font-medium text-white transition hover:bg-kid-primary/90"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Live Camera View */}
        {state === 'camera' && !cameraError && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
              aria-label="Camera preview"
            />
            {/* Card alignment guide */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="h-[85%] w-[70%] rounded-xl border-2 border-dashed border-white/50" />
            </div>
            <p className="absolute bottom-4 left-0 right-0 text-center text-sm text-white/80">
              Position your card within the frame
            </p>
          </>
        )}

        {/* Captured Image Preview - using img for base64 data URLs from canvas capture */}
        {(state === 'preview' || state === 'scanning' || state === 'result') &&
          capturedImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={capturedImage}
              alt="Captured card"
              className="h-full w-full object-cover"
            />
          )}

        {/* Scanning Overlay with Progress Indicator */}
        {state === 'scanning' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
            {/* Animated scanning icon */}
            <div className="relative mb-6">
              <div className="absolute inset-0 animate-ping">
                <div className="h-20 w-20 rounded-full bg-yellow-400/20" />
              </div>
              <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-orange-500">
                <SparklesIcon className="h-10 w-10 animate-pulse text-white" />
              </div>
            </div>

            {/* Progress bar */}
            <div className="mb-4 w-48 overflow-hidden rounded-full bg-white/20">
              <div className="h-2 animate-progress rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400 bg-[length:200%_100%]" />
            </div>

            <p className="text-lg font-medium text-white">Scanning your card...</p>
            <p className="mt-1 text-sm text-white/70">Identifying card details</p>
          </div>
        )}

        {/* Hidden canvas for capturing */}
        <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
      </div>

      {/* Result Panel */}
      {state === 'result' && scanResult && (
        <div className="bg-white p-4">
          {scanResult.identified ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircleIcon className="h-6 w-6 flex-shrink-0 text-green-500" />
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{scanResult.cardName}</h3>
                  {scanResult.setName && (
                    <p className="text-sm text-gray-600">{scanResult.setName}</p>
                  )}
                  {scanResult.cardNumber && (
                    <p className="text-xs text-gray-500">#{scanResult.cardNumber}</p>
                  )}
                </div>
                {scanResult.confidence && (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-xs font-medium',
                      getConfidenceColor(scanResult.confidence)
                    )}
                  >
                    {scanResult.confidence} confidence
                  </span>
                )}
              </div>

              {/* Rarity and special features */}
              {(scanResult.rarity || scanResult.specialFeatures?.length) && (
                <div className="flex flex-wrap gap-2">
                  {scanResult.rarity && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800">
                      {scanResult.rarity}
                    </span>
                  )}
                  {scanResult.specialFeatures?.map((feature) => (
                    <span
                      key={feature}
                      className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              )}

              {/* Fun fact */}
              {scanResult.funFact && (
                <div className="rounded-lg bg-yellow-50 p-3">
                  <p className="flex items-start gap-2 text-sm text-yellow-800">
                    <SparklesIcon className="h-4 w-4 flex-shrink-0 text-yellow-500" />
                    {scanResult.funFact}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-3">
              <ExclamationCircleIcon className="h-6 w-6 flex-shrink-0 text-orange-500" />
              <div>
                <h3 className="font-bold text-gray-900">Could not identify card</h3>
                <p className="mt-1 text-sm text-gray-600">
                  {scanResult.error ||
                    'Try taking a clearer photo with better lighting.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 bg-gray-100 p-4">
        {state === 'camera' && !cameraError && (
          <button
            onClick={capturePhoto}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-kid-primary py-3 font-semibold text-white shadow-lg transition hover:bg-kid-primary/90 focus:outline-none focus:ring-2 focus:ring-kid-primary focus:ring-offset-2"
            aria-label="Take photo"
          >
            <CameraIcon className="h-5 w-5" />
            Take Photo
          </button>
        )}

        {state === 'preview' && (
          <>
            <button
              onClick={retakePhoto}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-200 py-3 font-semibold text-gray-700 transition hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
              aria-label="Retake photo"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Retake
            </button>
            <button
              onClick={scanCapturedCard}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-kid-primary py-3 font-semibold text-white shadow-lg transition hover:bg-kid-primary/90 focus:outline-none focus:ring-2 focus:ring-kid-primary focus:ring-offset-2"
              aria-label="Scan card"
            >
              <SparklesIcon className="h-5 w-5" />
              Scan Card
            </button>
          </>
        )}

        {state === 'result' && (
          <button
            onClick={retakePhoto}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-kid-primary py-3 font-semibold text-white shadow-lg transition hover:bg-kid-primary/90 focus:outline-none focus:ring-2 focus:ring-kid-primary focus:ring-offset-2"
            aria-label="Scan another card"
          >
            <CameraIcon className="h-5 w-5" />
            Scan Another Card
          </button>
        )}
      </div>
    </div>
  );
}
