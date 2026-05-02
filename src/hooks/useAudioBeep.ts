import { useEffect, useRef, useCallback } from "react";

/**
 * Web Audio beep with autoplay-policy unlock.
 * Call returned `beep()` to play a short tone.
 * AudioContext is created/unlocked on the FIRST user click anywhere.
 */
export function useAudioBeep() {
  const ctxRef = useRef<AudioContext | null>(null);
  const unlockedRef = useRef(false);

  useEffect(() => {
    const unlock = () => {
      if (unlockedRef.current) return;
      try {
        const Ctx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new Ctx();
        ctxRef.current = ctx;
        // play silent buffer to unlock on iOS
        const buf = ctx.createBuffer(1, 1, 22050);
        const src = ctx.createBufferSource();
        src.buffer = buf;
        src.connect(ctx.destination);
        src.start(0);
        unlockedRef.current = true;
      } catch {
        // ignore
      }
    };
    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  return useCallback(() => {
    const ctx = ctxRef.current;
    if (!ctx || !unlockedRef.current) return;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = 880;
    g.gain.value = 0.0001;
    o.connect(g).connect(ctx.destination);
    const t = ctx.currentTime;
    g.gain.exponentialRampToValueAtTime(0.2, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.start(t);
    o.stop(t + 0.26);
  }, []);
}
