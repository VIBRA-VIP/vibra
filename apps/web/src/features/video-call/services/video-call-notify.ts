let audioCtx: AudioContext | null = null;
let ringTimer: number | null = null;
let ringDeadlineTimer: number | null = null;
let notification: Notification | null = null;
let titleTimer: number | null = null;
/** Call IDs we already rang for (so poll refreshes don't re-spam the same request). */
const alertedCallIds = new Set<string>();

const BASE_TITLE = 'Vibra';
/** Ringtone length — short so a queue of callers doesn't spam the model. */
const RING_DURATION_MS = 10_000;
const RING_INTERVAL_MS = 2_500;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  audioCtx ??= new Ctx();
  return audioCtx;
}

/** Call after a user gesture so browsers allow the ringtone to play. */
export function unlockCallAudio() {
  const ctx = getAudioContext();
  if (!ctx) return;
  void ctx.resume().catch(() => undefined);
}

function ringOnce() {
  const ctx = getAudioContext();
  if (!ctx) return;
  void ctx.resume();
  const t = ctx.currentTime;
  const pattern: Array<[number, number]> = [
    [0, 660],
    [0.4, 660],
  ];
  for (const [offset, freq] of pattern) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t + offset);
    gain.gain.setValueAtTime(0.0001, t + offset);
    gain.gain.exponentialRampToValueAtTime(0.2, t + offset + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + offset + 0.32);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t + offset);
    osc.stop(t + offset + 0.35);
  }
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    navigator.vibrate([120, 80, 120]);
  }
}

function stopRingtone() {
  if (ringTimer != null) {
    window.clearInterval(ringTimer);
    ringTimer = null;
  }
  if (ringDeadlineTimer != null) {
    window.clearTimeout(ringDeadlineTimer);
    ringDeadlineTimer = null;
  }
}

function startRingtoneWindow() {
  stopRingtone();
  ringOnce();
  ringTimer = window.setInterval(ringOnce, RING_INTERVAL_MS);
  ringDeadlineTimer = window.setTimeout(() => {
    stopRingtone();
  }, RING_DURATION_MS);
}

/** Ask for browser notification permission (best-effort, after a gesture). */
export function ensureNotificationPermission() {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission === 'default') {
    void Notification.requestPermission().catch(() => undefined);
  }
}

function showNotification(callerName: string) {
  if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
  try {
    notification?.close();
    notification = new Notification('Videollamada entrante', {
      body: `${callerName} te está llamando`,
      tag: 'vibra-incoming-call',
      requireInteraction: true,
    });
    notification.onclick = () => {
      window.focus();
      notification?.close();
    };
  } catch {
    /* ignore */
  }
}

function startTitleBlink() {
  if (typeof document === 'undefined') return;
  if (titleTimer == null) {
    let on = true;
    document.title = 'Llamada entrante · Vibra';
    titleTimer = window.setInterval(() => {
      document.title = on ? 'Llamada entrante · Vibra' : `Contesta la videollamada · ${BASE_TITLE}`;
      on = !on;
    }, 1000);
  } else {
    document.title = 'Llamada entrante · Vibra';
  }
}

function stopTitleBlink() {
  if (titleTimer != null) {
    window.clearInterval(titleTimer);
    titleTimer = null;
  }
  if (typeof document !== 'undefined') {
    document.title = BASE_TITLE;
  }
}

/**
 * Ring for 10s when a *new* pending call appears for the model.
 * Same callId is ignored (polls / remounts won't re-ring).
 * A different callId always starts a fresh 10s ringtone.
 */
export function notifyNewIncomingCall(callId: string, callerName: string) {
  if (!callId) return;
  if (alertedCallIds.has(callId)) return;
  alertedCallIds.add(callId);
  startRingtoneWindow();
  startTitleBlink();
  showNotification(callerName);
}

/** @deprecated prefer notifyNewIncomingCall(callId, name) */
export function startIncomingCallAlert(callerName: string) {
  startRingtoneWindow();
  startTitleBlink();
  showNotification(callerName);
}

/** Drop alerted ids that are no longer in the queue; stop UI if queue empty. */
export function syncIncomingCallQueue(pendingIds: string[]) {
  for (const id of [...alertedCallIds]) {
    if (!pendingIds.includes(id)) alertedCallIds.delete(id);
  }
  if (pendingIds.length === 0) {
    stopIncomingCallAlert();
  }
}

/** Stop sound/title/notification (keeps alerted ids unless clearAlerted). */
export function stopIncomingCallAlert(opts?: { clearAlerted?: boolean }) {
  stopRingtone();
  stopTitleBlink();
  notification?.close();
  notification = null;
  if (opts?.clearAlerted) alertedCallIds.clear();
}
