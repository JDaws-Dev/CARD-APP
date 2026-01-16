/**
 * Pack Effects Library
 *
 * Provides sound effects and haptic feedback for the virtual pack opening experience.
 * Sounds and haptics can be individually toggled by the user.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PackEffectsSettings {
  /** Whether sound effects are enabled */
  soundEnabled: boolean;
  /** Whether haptic feedback is enabled */
  hapticsEnabled: boolean;
  /** Sound volume (0-1) */
  soundVolume: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const PACK_EFFECTS_STORAGE_KEY = 'carddex_pack_effects';

export const DEFAULT_PACK_EFFECTS_SETTINGS: PackEffectsSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  soundVolume: 0.5,
};

// Sound effect types
export type PackSoundEffect =
  | 'packTear' // Opening the pack wrapper
  | 'cardWhoosh' // Card being revealed
  | 'sparkle' // Rare card reveal
  | 'ultraSparkle' // Ultra rare card reveal
  | 'complete'; // All cards revealed

// Haptic feedback types
export type PackHapticEffect =
  | 'light' // Card reveal
  | 'medium' // Rare card
  | 'heavy' // Ultra rare card
  | 'success'; // Pack complete

// ============================================================================
// PERSISTENCE
// ============================================================================

export function loadPackEffectsSettings(): PackEffectsSettings {
  if (typeof localStorage === 'undefined') return DEFAULT_PACK_EFFECTS_SETTINGS;
  try {
    const saved = localStorage.getItem(PACK_EFFECTS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        soundEnabled: parsed.soundEnabled ?? DEFAULT_PACK_EFFECTS_SETTINGS.soundEnabled,
        hapticsEnabled: parsed.hapticsEnabled ?? DEFAULT_PACK_EFFECTS_SETTINGS.hapticsEnabled,
        soundVolume: parsed.soundVolume ?? DEFAULT_PACK_EFFECTS_SETTINGS.soundVolume,
      };
    }
  } catch {
    // localStorage might not be available
  }
  return DEFAULT_PACK_EFFECTS_SETTINGS;
}

export function savePackEffectsSettings(settings: PackEffectsSettings): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PACK_EFFECTS_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage might not be available
  }
}

// ============================================================================
// SOUND EFFECTS
// ============================================================================

// Audio context for playing sounds
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return audioContext;
}

// Generate synthesized sounds (no external files needed)
function createOscillatorSound(
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType = 'sine',
  fadeOut: boolean = true
): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Resume audio context if suspended (required by browsers)
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  if (fadeOut) {
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
  }

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

function createNoiseSound(duration: number, volume: number): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  // Generate white noise
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  filter.type = 'highpass';
  filter.frequency.value = 1000;

  gainNode.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  source.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  source.start();
}

export function playPackSound(effect: PackSoundEffect, volume: number = 0.5): void {
  switch (effect) {
    case 'packTear':
      // Paper tearing sound - noise burst
      createNoiseSound(0.15, volume);
      break;

    case 'cardWhoosh':
      // Whoosh sound - descending tone
      createOscillatorSound(800, 0.15, volume * 0.3, 'sine');
      setTimeout(() => createOscillatorSound(400, 0.1, volume * 0.2, 'sine'), 50);
      break;

    case 'sparkle':
      // Sparkle sound - ascending chime
      createOscillatorSound(1200, 0.1, volume * 0.4, 'sine');
      setTimeout(() => createOscillatorSound(1600, 0.1, volume * 0.3, 'sine'), 50);
      setTimeout(() => createOscillatorSound(2000, 0.15, volume * 0.2, 'sine'), 100);
      break;

    case 'ultraSparkle':
      // Ultra sparkle - more dramatic ascending tones
      createOscillatorSound(800, 0.1, volume * 0.4, 'sine');
      setTimeout(() => createOscillatorSound(1200, 0.1, volume * 0.4, 'sine'), 80);
      setTimeout(() => createOscillatorSound(1600, 0.1, volume * 0.3, 'sine'), 160);
      setTimeout(() => createOscillatorSound(2000, 0.15, volume * 0.3, 'sine'), 240);
      setTimeout(() => createOscillatorSound(2400, 0.2, volume * 0.2, 'sine'), 320);
      break;

    case 'complete':
      // Completion fanfare - chord
      createOscillatorSound(523, 0.3, volume * 0.3, 'sine'); // C5
      createOscillatorSound(659, 0.3, volume * 0.25, 'sine'); // E5
      createOscillatorSound(784, 0.3, volume * 0.2, 'sine'); // G5
      break;
  }
}

// ============================================================================
// HAPTIC FEEDBACK
// ============================================================================

export function playPackHaptic(effect: PackHapticEffect): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;

  try {
    switch (effect) {
      case 'light':
        navigator.vibrate(10);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'heavy':
        navigator.vibrate([30, 20, 50]);
        break;
      case 'success':
        navigator.vibrate([20, 50, 20, 50, 40]);
        break;
    }
  } catch {
    // Vibration not supported or blocked
  }
}

// ============================================================================
// COMBINED EFFECTS
// ============================================================================

export function playPackOpenEffect(settings: PackEffectsSettings): void {
  if (settings.soundEnabled) {
    playPackSound('packTear', settings.soundVolume);
  }
  if (settings.hapticsEnabled) {
    playPackHaptic('medium');
  }
}

export function playCardRevealEffect(settings: PackEffectsSettings, isRare: boolean = false): void {
  if (settings.soundEnabled) {
    playPackSound('cardWhoosh', settings.soundVolume);
    if (isRare) {
      setTimeout(() => playPackSound('sparkle', settings.soundVolume), 150);
    }
  }
  if (settings.hapticsEnabled) {
    playPackHaptic(isRare ? 'medium' : 'light');
  }
}

export function playRareRevealEffect(settings: PackEffectsSettings, isUltraRare: boolean = false): void {
  if (settings.soundEnabled) {
    playPackSound(isUltraRare ? 'ultraSparkle' : 'sparkle', settings.soundVolume);
  }
  if (settings.hapticsEnabled) {
    playPackHaptic(isUltraRare ? 'heavy' : 'medium');
  }
}

export function playPackCompleteEffect(settings: PackEffectsSettings): void {
  if (settings.soundEnabled) {
    playPackSound('complete', settings.soundVolume);
  }
  if (settings.hapticsEnabled) {
    playPackHaptic('success');
  }
}
