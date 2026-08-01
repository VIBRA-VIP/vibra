let lastPlayedAt = 0;
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  audioCtx ??= new Ctx();
  return audioCtx;
}

/** Call after a user gesture so browsers allow notification sounds. */
export function unlockChatAudio() {
  const ctx = getAudioContext();
  if (!ctx) return;
  void ctx.resume().catch(() => undefined);
}

function tone(
  ctx: AudioContext,
  startAt: number,
  frequency: number,
  duration: number,
  peak = 0.14,
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(frequency, startAt);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(peak, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startAt);
  osc.stop(startAt + duration + 0.02);
}

/** Clear double-beep so models notice a new chat message. */
export function playChatPing() {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  if (now - lastPlayedAt < 700) return;
  lastPlayedAt = now;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    void ctx.resume();
    const t = ctx.currentTime;
    tone(ctx, t, 880, 0.14, 0.16);
    tone(ctx, t + 0.16, 1175, 0.18, 0.14);

    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate([40, 40, 60]);
    }
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
