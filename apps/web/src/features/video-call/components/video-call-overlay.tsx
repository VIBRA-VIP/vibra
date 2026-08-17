import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Gift,
  MessageCircle,
  Mic,
  MicOff,
  PhoneOff,
  Video as VideoIcon,
  VideoOff,
} from 'lucide-react';
import { getChatSocket } from '@/features/chat/chat-socket';
import { mediaSrc } from '@/features/media/services/media-api';
import { useAuthStore } from '@/store';
import {
  endVideoCallRequest,
  extendVideoCallRequest,
  type VideoCallDto,
  type VideoCallExtendedEvent,
  type VideoCallGiftEvent,
} from '../services/video-call-api';
import { useVideoCallStore } from '../store/video-call-store';
import { VideoCallChatPanel } from './video-call-chat-panel';
import { VideoCallExtendPrompt } from './video-call-extend-prompt';
import { VideoCallGiftPanel } from './video-call-gift-panel';

type SignalPayload =
  | { type: 'offer'; sdp: string }
  | { type: 'answer'; sdp: string }
  | { type: 'candidate'; candidate: RTCIceCandidateInit };

function iceServers(): RTCIceServer[] {
  const servers: RTCIceServer[] = [
    { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  ];
  const turnUrl = import.meta.env.VITE_TURN_URL as string | undefined;
  if (turnUrl) {
    servers.push({
      urls: turnUrl,
      username: import.meta.env.VITE_TURN_USERNAME as string | undefined,
      credential: import.meta.env.VITE_TURN_CREDENTIAL as string | undefined,
    });
  }
  return servers;
}

function formatRemaining(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

type Props = {
  call: VideoCallDto;
  isCaller: boolean;
};

export function VideoCallOverlay({ call, isCaller }: Props) {
  const clearSession = useVideoCallStore((s) => s.clearSession);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const endingRef = useRef(false);

  const [connected, setConnected] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [giftsOpen, setGiftsOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [giftFlash, setGiftFlash] = useState<VideoCallGiftEvent | null>(null);
  const [chatBadge, setChatBadge] = useState(0);
  /** Credits the model has earned on this call (base block + gifts). */
  const [callEarnings, setCallEarnings] = useState(() =>
    isCaller ? 0 : Math.max(0, call.creditsSpent),
  );
  const [earnToast, setEarnToast] = useState<string | null>(null);
  const [endsAtMs, setEndsAtMs] = useState<number | null>(() =>
    call.endsAt ? new Date(call.endsAt).getTime() : null,
  );
  const [remaining, setRemaining] = useState(() =>
    endsAtMs != null
      ? Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000))
      : call.prepaidMinutes * 60,
  );
  const [extendPending, setExtendPending] = useState<number | null>(null);
  const [extendError, setExtendError] = useState<string | null>(null);
  const [extendDismissed, setExtendDismissed] = useState(false);

  const myUserId = useAuthStore((s) => s.user?.id);
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const walletBalance = user?.walletBalance ?? 0;
  const peer = isCaller ? call.model : call.client;
  const warn = remaining <= 60 && remaining > 0;
  const extendOptions = call.extendOptions?.length ? call.extendOptions : [3, 5, 10];
  const showExtendPrompt = isCaller && warn && !extendDismissed;

  const teardown = useCallback(() => {
    pcRef.current?.getSenders().forEach((sender) => {
      try {
        sender.track?.stop();
      } catch {
        /* ignore */
      }
    });
    try {
      pcRef.current?.close();
    } catch {
      /* ignore */
    }
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    pendingCandidatesRef.current = [];
  }, []);

  const hangUp = useCallback(async () => {
    if (endingRef.current) return;
    endingRef.current = true;
    try {
      await endVideoCallRequest(call.id);
    } catch {
      /* close UI anyway */
    } finally {
      teardown();
      clearSession();
    }
  }, [call.id, clearSession, teardown]);

  useEffect(() => {
    const socket = getChatSocket();
    if (!socket) {
      setError('Sin conexión en tiempo real. Vuelve a entrar.');
      return;
    }

    const sock = socket;
    let disposed = false;

    const sendSignal = (signal: SignalPayload) => {
      sock.emit('video-call:signal', { callId: call.id, signal });
    };

    const createPeer = (stream: MediaStream) => {
      const pc = new RTCPeerConnection({ iceServers: iceServers() });
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal({ type: 'candidate', candidate: event.candidate.toJSON() });
        }
      };

      pc.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteVideoRef.current && remoteStream) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
      };

      pc.onconnectionstatechange = () => {
        if (disposed) return;
        if (pc.connectionState === 'connected') setConnected(true);
        if (pc.connectionState === 'failed') {
          setError('No se pudo establecer la conexión de video.');
        }
      };

      return pc;
    };

    const flushCandidates = async (pc: RTCPeerConnection) => {
      const queued = pendingCandidatesRef.current;
      pendingCandidatesRef.current = [];
      for (const candidate of queued) {
        try {
          await pc.addIceCandidate(candidate);
        } catch {
          /* ignore */
        }
      }
    };

    const makeOffer = async () => {
      const pc = pcRef.current;
      if (!pc || pc.signalingState !== 'stable') return;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      if (offer.sdp) sendSignal({ type: 'offer', sdp: offer.sdp });
    };

    const onPeerReady = (payload: { callId?: string }) => {
      if (payload?.callId !== call.id || !isCaller) return;
      void makeOffer();
    };

    const onSignal = async (payload: { callId?: string; signal?: SignalPayload }) => {
      if (payload?.callId !== call.id || !payload.signal) return;
      const pc = pcRef.current;
      if (!pc) return;
      const signal = payload.signal;

      try {
        if (signal.type === 'offer' && !isCaller) {
          await pc.setRemoteDescription({ type: 'offer', sdp: signal.sdp });
          await flushCandidates(pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          if (answer.sdp) sendSignal({ type: 'answer', sdp: answer.sdp });
        } else if (signal.type === 'answer' && isCaller) {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription({ type: 'answer', sdp: signal.sdp });
            await flushCandidates(pc);
          }
        } else if (signal.type === 'candidate') {
          if (pc.remoteDescription) {
            await pc.addIceCandidate(signal.candidate);
          } else {
            pendingCandidatesRef.current.push(signal.candidate);
          }
        }
      } catch {
        /* ignore malformed signal */
      }
    };

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user' },
          audio: true,
        });
        if (disposed) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        createPeer(stream);

        sock.on('video-call:signal', onSignal);
        sock.on('video-call:peer-ready', onPeerReady);
        sock.emit('video-call:ready', { callId: call.id });

        if (isCaller) {
          // The other side may already be waiting; offer right away too.
          window.setTimeout(() => void makeOffer(), 400);
        }
      } catch (err) {
        if (!disposed) {
          const name = (err as DOMException)?.name;
          setError(
            name === 'NotAllowedError'
              ? 'Permite el acceso a cámara y micrófono para la videollamada.'
              : 'No se pudo acceder a la cámara o el micrófono.',
          );
        }
      }
    }

    void start();

    return () => {
      disposed = true;
      sock.off('video-call:signal', onSignal);
      sock.off('video-call:peer-ready', onPeerReady);
      teardown();
    };
  }, [call.id, isCaller, teardown]);

  useEffect(() => {
    if (endsAtMs == null) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((endsAtMs - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) void hangUp();
    };
    tick();
    const id = window.setInterval(tick, 500);
    return () => window.clearInterval(id);
  }, [endsAtMs, hangUp]);

  useEffect(() => {
    const sock = getChatSocket();
    if (!sock) return;

    const onExtended = (payload: VideoCallExtendedEvent) => {
      if (payload?.id !== call.id) return;
      if (payload.endsAt) setEndsAtMs(new Date(payload.endsAt).getTime());
      setExtendDismissed(false);
      setExtendPending(null);
      setExtendError(null);
      if (!isCaller) {
        setCallEarnings((n) => n + payload.addedCredits);
      }
      setEarnToast(
        isCaller
          ? `+${payload.addedMinutes} min agregados`
          : `+${payload.addedCredits} créd · ${payload.addedMinutes} min más`,
      );
      window.setTimeout(() => setEarnToast(null), 2800);
      if (user) {
        setUser({
          ...user,
          walletBalance: isCaller ? payload.clientBalance : payload.modelBalance,
        });
      }
    };

    sock.on('video-call:extended', onExtended);
    return () => {
      sock.off('video-call:extended', onExtended);
    };
  }, [call.id, isCaller, setUser, user]);

  const extendCall = useCallback(
    async (minutes: number) => {
      setExtendPending(minutes);
      setExtendError(null);
      try {
        const updated = await extendVideoCallRequest(call.id, minutes);
        if (updated.endsAt) setEndsAtMs(new Date(updated.endsAt).getTime());
      } catch (err) {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message;
        setExtendError(message ?? 'No se pudo extender la llamada');
      } finally {
        setExtendPending(null);
      }
    },
    [call.id],
  );

  useEffect(() => {
    const sock = getChatSocket();
    if (!sock) return;

    const onGift = (payload: VideoCallGiftEvent) => {
      if (payload?.callId !== call.id) return;
      setGiftFlash(payload);
      if (!isCaller) {
        setCallEarnings((n) => n + payload.gift.credits);
        setEarnToast(`+${payload.gift.credits} créd · ${payload.gift.label}`);
        window.setTimeout(() => setEarnToast(null), 2500);
      }
      if (user && payload.to.userId === user.id) {
        setUser({ ...user, walletBalance: payload.modelBalance });
      }
      if (user && payload.from.userId === user.id) {
        setUser({ ...user, walletBalance: payload.clientBalance });
      }
      window.setTimeout(() => {
        setGiftFlash((cur) => (cur?.createdAt === payload.createdAt ? null : cur));
      }, 3200);
    };

    const onChat = (payload: { conversationId?: string; senderId?: string }) => {
      if (!payload?.senderId || payload.senderId === myUserId) return;
      setChatBadge((n) => (chatOpen ? 0 : n + 1));
    };

    sock.on('video-call:gift', onGift);
    sock.on('chat:message', onChat);
    return () => {
      sock.off('video-call:gift', onGift);
      sock.off('chat:message', onChat);
    };
  }, [call.id, myUserId, chatOpen, setUser, user, isCaller]);

  useEffect(() => {
    if (isCaller || call.creditsSpent <= 0) return;
    setEarnToast(`+${call.creditsSpent} créd por aceptar`);
    const t = window.setTimeout(() => setEarnToast(null), 2800);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once when overlay opens
  }, []);

  function toggleMic() {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  }

  function toggleCam() {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  }

  return (
    <div className="fixed inset-0 z-[80] bg-vibra-bg">
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        className={`absolute inset-y-0 left-0 h-full bg-black object-cover transition-all ${
          chatOpen ? 'w-full sm:w-[calc(100%-20rem)]' : 'w-full'
        }`}
      />

      {!connected || error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-zinc-900 via-black to-black px-6 text-center">
          {peer.avatarUrl ? (
            <img
              src={mediaSrc(peer.avatarUrl)}
              alt=""
              className="h-24 w-24 rounded-full object-cover ring-2 ring-vibra-pink/40"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-800 text-3xl font-semibold text-white">
              {peer.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-display text-xl font-bold text-white">{peer.displayName}</p>
            <p className="mt-1 text-sm text-zinc-400">{error ?? 'Conectando videollamada…'}</p>
          </div>
        </div>
      ) : null}

      <div
        className={`absolute inset-x-0 top-0 flex items-start justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent px-4 pb-8 pt-4 transition-all ${
          chatOpen ? 'sm:right-80' : ''
        }`}
      >
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold text-white">
            {peer.displayName}
          </p>
          <p className={warn ? 'text-xs font-semibold text-amber-300' : 'text-xs text-zinc-300'}>
            {warn ? 'Queda menos de 1 minuto · ' : 'Tiempo restante · '}
            {formatRemaining(remaining)}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isCaller ? (
            <span className="rounded-full bg-black/50 px-3 py-1 text-[11px] font-medium text-zinc-200 backdrop-blur">
              {call.pricePerMin} créd/min
            </span>
          ) : (
            <>
              <span className="rounded-full bg-vibra-gold/90 px-3 py-1 text-[11px] font-bold text-black shadow">
                Esta llamada · +{callEarnings} créd
              </span>
              <span className="rounded-full bg-black/50 px-3 py-1 text-[11px] font-medium text-zinc-200 backdrop-blur">
                Total · {walletBalance.toLocaleString('es-ES')} créd
              </span>
            </>
          )}
        </div>
      </div>

      {earnToast ? (
        <div className="absolute inset-x-0 top-24 z-[86] mx-auto w-fit rounded-full bg-vibra-gold px-4 py-1.5 text-xs font-bold text-black shadow-lg">
          {earnToast}
        </div>
      ) : null}

      {warn && !showExtendPrompt ? (
        <div className="absolute inset-x-0 top-20 mx-auto w-fit rounded-full bg-amber-500/90 px-4 py-1.5 text-xs font-semibold text-black shadow-lg">
          La llamada termina en {formatRemaining(remaining)}
        </div>
      ) : null}

      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        className={`absolute right-4 top-24 h-40 w-28 rounded-2xl border border-white/20 bg-black object-cover shadow-xl transition-all sm:h-48 sm:w-36 ${
          chatOpen ? 'sm:right-[21rem]' : ''
        }`}
      />

      {giftFlash ? (
        <div className="pointer-events-none absolute inset-0 z-[85] flex items-center justify-center">
          <div className="animate-bounce rounded-3xl bg-black/60 px-8 py-6 text-center shadow-2xl ring-1 ring-vibra-gold/40 backdrop-blur">
            <p className="text-6xl" aria-hidden>
              {giftFlash.gift.emoji}
            </p>
            <p className="mt-3 font-display text-lg font-bold text-white">
              {giftFlash.from.displayName} envió {giftFlash.gift.label}
            </p>
            <p className="text-sm text-vibra-gold">
              {isCaller
                ? `${giftFlash.gift.credits} créditos`
                : `+${giftFlash.gift.credits} créd ganados`}
            </p>
          </div>
        </div>
      ) : null}

      {chatOpen && myUserId ? (
        <VideoCallChatPanel
          peerUserId={peer.userId}
          myUserId={myUserId}
          peerName={peer.displayName}
          onClose={() => setChatOpen(false)}
        />
      ) : null}

      {giftsOpen && isCaller ? (
        <VideoCallGiftPanel callId={call.id} onClose={() => setGiftsOpen(false)} />
      ) : null}

      {showExtendPrompt ? (
        <VideoCallExtendPrompt
          peerName={peer.displayName}
          pricePerMin={call.pricePerMin}
          options={extendOptions}
          balance={walletBalance}
          secondsLeft={remaining}
          pendingMinutes={extendPending}
          error={extendError}
          onExtend={(minutes) => void extendCall(minutes)}
          onDismiss={() => setExtendDismissed(true)}
        />
      ) : null}

      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 z-[95] flex items-center justify-center bg-gradient-to-t from-black/60 to-transparent pb-6 pt-10 transition-all ${
          chatOpen ? 'sm:right-80' : ''
        }`}
      >
        <div className="pointer-events-auto flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMic}
            aria-label={micOn ? 'Silenciar micrófono' : 'Activar micrófono'}
            className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur transition sm:h-14 sm:w-14 ${
              micOn ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white text-black'
            }`}
          >
            {micOn ? (
              <Mic className="h-5 w-5 sm:h-6 sm:w-6" />
            ) : (
              <MicOff className="h-5 w-5 sm:h-6 sm:w-6" />
            )}
          </button>

          <button
            type="button"
            onClick={() => {
              setChatOpen((open) => !open);
              setChatBadge(0);
            }}
            aria-label="Chat"
            className={`relative flex h-12 w-12 items-center justify-center rounded-full backdrop-blur transition sm:h-14 sm:w-14 ${
              chatOpen ? 'bg-vibra-pink text-white' : 'bg-white/15 text-white hover:bg-white/25'
            }`}
          >
            <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
            {chatBadge > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-vibra-gold px-1 text-[10px] font-bold text-black">
                {chatBadge > 9 ? '9+' : chatBadge}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => void hangUp()}
            aria-label="Colgar"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 text-white shadow-lg transition hover:bg-red-500 sm:h-16 sm:w-16"
          >
            <PhoneOff className="h-6 w-6 sm:h-7 sm:w-7" />
          </button>

          {isCaller ? (
            <>
              <button
                type="button"
                onClick={() => setGiftsOpen((open) => !open)}
                aria-label="Regalos"
                className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur transition sm:h-14 sm:w-14 ${
                  giftsOpen
                    ? 'bg-vibra-gold text-black'
                    : 'bg-white/15 text-vibra-gold hover:bg-white/25'
                }`}
              >
                <Gift className="h-5 w-5 sm:h-6 sm:w-6" />
              </button>

              <button
                type="button"
                onClick={toggleCam}
                aria-label={camOn ? 'Apagar cámara' : 'Encender cámara'}
                className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur transition sm:h-14 sm:w-14 ${
                  camOn ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-white text-black'
                }`}
              >
                {camOn ? (
                  <VideoIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                ) : (
                  <VideoOff className="h-5 w-5 sm:h-6 sm:w-6" />
                )}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
