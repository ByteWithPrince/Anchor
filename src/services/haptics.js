let sharedAudioCtx = null;
let isAudioUnlocked = false;

export function getAudioContext() {
  if (!sharedAudioCtx && typeof window !== 'undefined') {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) sharedAudioCtx = new AudioCtx();
  }
  return sharedAudioCtx;
}

/**
 * Resumes shared AudioContext and plays a silent 1-frame buffer on first user gesture
 * (pointerdown / touchend) to bypass mobile browser audio autoplay restrictions.
 */
export function unlockAudio() {
  if (isAudioUnlocked) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  // Play silent 1-frame buffer to satisfy iOS Safari & mobile Chrome gesture requirements
  try {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
    isAudioUnlocked = true;
  } catch (err) {
    console.warn('[Audio] Silent audio unlock deferred:', err);
  }
}

// Backward-compatible alias
export const unlockAudioAndHaptics = unlockAudio;

export const haptics = {
  /** Subtle 15ms tick on set completion or staple tap */
  setComplete() {
    try {
      if (typeof navigator !== 'undefined') {
        navigator.vibrate?.(15);
      }
    } catch {}
  },

  /** Double pulse when rest interval timer reaches 0 */
  timerComplete() {
    try {
      if (typeof navigator !== 'undefined') {
        navigator.vibrate?.([50, 100, 50]);
      }
    } catch {}
  },

  /** Warning pulse for destructive delete confirmation */
  warning() {
    try {
      if (typeof navigator !== 'undefined') {
        navigator.vibrate?.([30, 60, 30]);
      }
    } catch {}
  },
};
