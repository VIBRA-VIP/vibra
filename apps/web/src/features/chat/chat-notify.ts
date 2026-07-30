let lastPlayedAt = 0;
let audioCtx: AudioContext | null = null;

/** Short soft ping for new chat messages (no asset file). */
export function playChatPing() {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  if (now - lastPlayedAt < 900) return;
  lastPlayedAt = now;

  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    audioCtx ??= new Ctx();
    const ctx = audioCtx;
    void ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    /* ignore autoplay / audio errors */
  }
}

const BASE_TITLE = 'Vibra';

export function setUnreadDocumentTitle(unreadTotal: number) {
  if (typeof document === 'undefined') return;
  if (unreadTotal > 0) {
    const n = unreadTotal > 99 ? '99+' : String(unreadTotal);
    document.title = `(${n}) Mensaje nuevo · ${BASE_TITLE}`;
  } else {
    document.title = BASE_TITLE;
  }
}
