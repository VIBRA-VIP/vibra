import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircle, X } from 'lucide-react';
import {
  listConversationsRequest,
  listMessagesRequest,
  openChatWithRequest,
  sendMessageRequest,
  type ChatConversationDto,
  type ChatPeer,
} from '@/features/chat/chat-api';
import {
  connectChatSocket,
  getChatSocket,
} from '@/features/chat/chat-socket';
import { purgeLegacySharedChatStorage } from '@/features/chat/local-chat-storage';
import { mediaSrc } from '@/features/media/services/media-api';
import { useAuthStore } from '@/store';
import { maskDisplayName } from '@/utils';

export function ChatsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const myId = user?.id;
  const isModel = user?.role === 'MODEL';

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activePeer, setActivePeer] = useState<ChatPeer | null>(null);
  const [draft, setDraft] = useState('');
  const [peerTyping, setPeerTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const openingPeerRef = useRef<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmitRef = useRef(0);
  const peerTypingClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    purgeLegacySharedChatStorage();
  }, []);

  useEffect(() => {
    const sock = connectChatSocket(accessToken) ?? getChatSocket();
    if (!sock) return;

    const onMessage = (payload: { conversationId?: string }) => {
      void queryClient.invalidateQueries({ queryKey: ['chat', 'conversations', myId] });
      if (payload.conversationId) {
        void queryClient.invalidateQueries({
          queryKey: ['chat', 'messages', payload.conversationId],
        });
      }
      if (payload.conversationId && payload.conversationId === activeConversationId) {
        setPeerTyping(false);
      }
    };

    const onTyping = (payload: {
      conversationId?: string;
      userId?: string;
      isTyping?: boolean;
    }) => {
      if (!payload.conversationId || payload.conversationId !== activeConversationId) return;
      if (payload.userId === myId) return;
      setPeerTyping(Boolean(payload.isTyping));
      if (peerTypingClearRef.current) clearTimeout(peerTypingClearRef.current);
      if (payload.isTyping) {
        peerTypingClearRef.current = setTimeout(() => setPeerTyping(false), 3000);
      }
    };

    sock.on('chat:message', onMessage);
    sock.on('chat:typing', onTyping);
    return () => {
      sock.off('chat:message', onMessage);
      sock.off('chat:typing', onTyping);
      if (peerTypingClearRef.current) clearTimeout(peerTypingClearRef.current);
    };
  }, [accessToken, myId, queryClient, activeConversationId]);

  useEffect(() => {
    setPeerTyping(false);
  }, [activeConversationId]);

  function emitTyping(isTyping: boolean) {
    const sock = getChatSocket();
    if (!sock || !activeConversationId || !activePeer?.userId) return;
    sock.emit('chat:typing', {
      conversationId: activeConversationId,
      peerUserId: activePeer.userId,
      isTyping,
    });
  }

  function onDraftChange(value: string) {
    setDraft(value);
    if (!activeConversationId || !activePeer?.userId) return;

    const now = Date.now();
    if (value.trim()) {
      if (now - lastTypingEmitRef.current > 1200) {
        lastTypingEmitRef.current = now;
        emitTyping(true);
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => emitTyping(false), 1800);
    } else {
      emitTyping(false);
    }
  }
  const conversationsQuery = useQuery({
    queryKey: ['chat', 'conversations', myId],
    queryFn: listConversationsRequest,
    enabled: Boolean(myId),
    refetchInterval: 3000,
  });

  const messagesQuery = useQuery({
    queryKey: ['chat', 'messages', activeConversationId],
    queryFn: () => listMessagesRequest(activeConversationId!),
    enabled: Boolean(activeConversationId),
    refetchInterval: 1500,
  });

  useEffect(() => {
    const peer = (location.state as { peer?: ChatPeer } | null)?.peer;
    if (!peer?.userId || !myId) return;
    if (peer.userId === myId) {
      navigate(location.pathname, { replace: true, state: null });
      return;
    }
    if (openingPeerRef.current === peer.userId) return;
    openingPeerRef.current = peer.userId;

    void openChatWithRequest(peer.userId)
      .then((conversation) => {
        setActiveConversationId(conversation.id);
        setActivePeer(conversation.peer ?? peer);
        setError(null);
        void queryClient.invalidateQueries({ queryKey: ['chat', 'conversations', myId] });
      })
      .catch(() => {
        setError('No se pudo abrir el chat con esa persona');
        openingPeerRef.current = null;
      })
      .finally(() => {
        navigate(location.pathname, { replace: true, state: null });
      });
  }, [location.pathname, location.state, navigate, myId, queryClient]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesQuery.data?.length, activeConversationId, peerTyping]);

  const sendMutation = useMutation({
    mutationFn: (content: string) => sendMessageRequest(activeConversationId!, content),
    onSuccess: async () => {
      setDraft('');
      setError(null);
      emitTyping(false);
      await queryClient.invalidateQueries({ queryKey: ['chat', 'messages', activeConversationId] });
      await queryClient.invalidateQueries({ queryKey: ['chat', 'conversations', myId] });
    },
    onError: () => {
      setError('No se pudo enviar el mensaje. Intenta de nuevo.');
    },
  });

  function openExploreOrRequests() {
    navigate(isModel ? '/requests' : '/explore');
  }

  function openConversation(conversation: ChatConversationDto) {
    if (!conversation.peer) return;
    setActiveConversationId(conversation.id);
    setActivePeer(conversation.peer);
    setError(null);
  }

  function closeConversation() {
    setActiveConversationId(null);
    setActivePeer(null);
    setDraft('');
    openingPeerRef.current = null;
    void queryClient.invalidateQueries({ queryKey: ['chat', 'conversations', myId] });
  }

  function sendMessage() {
    const text = draft.trim();
    if (!text || !activeConversationId || sendMutation.isPending) return;
    sendMutation.mutate(text);
  }

  if (!myId) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-6 text-left">
        <p className="text-sm text-zinc-400">Inicia sesión para ver tus chats.</p>
      </div>
    );
  }

  const conversations = conversationsQuery.data ?? [];
  const messages = messagesQuery.data ?? [];

  if (activeConversationId && activePeer) {
    return (
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col px-4 py-4 text-left">
        <div className="mb-4 flex shrink-0 items-center gap-3 border-b border-vibra-border pb-3">
          <button
            type="button"
            onClick={closeConversation}
            className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
            aria-label="Volver"
          >
            <X className="h-4 w-4" />
          </button>
          {activePeer.avatarUrl ? (
            <img
              src={mediaSrc(activePeer.avatarUrl)}
              alt={activePeer.displayName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold">
              {activePeer.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">
              {isModel ? activePeer.displayName : maskDisplayName(activePeer.displayName)}
            </p>
            <p className="text-xs text-zinc-400">
              {peerTyping ? (
                <span className="text-vibra-pink">escribiendo...</span>
              ) : (
                <>
                  @{activePeer.username}
                  {activePeer.isOnline ? ' · En línea' : ''}
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto rounded-2xl border border-vibra-border bg-vibra-elevated/40 p-4">
          {messagesQuery.isLoading ? (
            <p className="m-auto text-sm text-zinc-400">Cargando mensajes...</p>
          ) : messages.length === 0 ? (
            <div className="m-auto px-4 text-center">
              <p className="text-4xl" aria-hidden>
                💬
              </p>
              <p className="mt-3 font-display text-lg font-semibold">
                Chat con{' '}
                {isModel ? activePeer.displayName : maskDisplayName(activePeer.displayName)}
              </p>
              <p className="mt-1 text-sm text-zinc-400">Escribe el primer mensaje abajo.</p>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.fromMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${
                    m.fromMe
                      ? 'rounded-br-md bg-vibra-pink text-white'
                      : 'rounded-bl-md bg-vibra-muted text-zinc-100'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                  <p
                    className={`mt-1 text-[10px] ${m.fromMe ? 'text-white/70' : 'text-zinc-500'}`}
                  >
                    {new Date(m.createdAt).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          {peerTyping ? (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-vibra-muted px-3.5 py-2 text-sm text-zinc-400">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce [animation-delay:0ms]">.</span>
                  <span className="animate-bounce [animation-delay:150ms]">.</span>
                  <span className="animate-bounce [animation-delay:300ms]">.</span>
                </span>
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}

        <form
          className="mt-4 flex shrink-0 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <input
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 rounded-xl border border-vibra-border bg-vibra-muted px-4 py-3 text-sm outline-none focus:border-vibra-pink/50"
          />
          <button
            type="submit"
            className="rounded-xl bg-vibra-pink px-4 py-3 text-sm font-semibold disabled:opacity-50"
            disabled={!draft.trim() || sendMutation.isPending}
          >
            {sendMutation.isPending ? '...' : 'Enviar'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 text-left">
      <h1 className="font-display text-2xl font-bold md:text-3xl">Chats</h1>

      {conversationsQuery.isLoading ? (
        <p className="mt-6 text-sm text-zinc-400">Cargando conversaciones...</p>
      ) : null}
      {conversationsQuery.isError ? (
        <p className="mt-6 text-sm text-red-400">No se pudieron cargar los chats.</p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

      {!conversationsQuery.isLoading && !conversationsQuery.isError && conversations.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-vibra-border bg-vibra-elevated/60 px-6 py-16 text-center">
          <div className="mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-vibra-pink/30 via-zinc-800 to-zinc-950 text-6xl shadow-inner">
            💬
          </div>
          <p className="font-display text-xl font-semibold">Sin conversaciones aún</p>
          <p className="mt-2 max-w-xs text-sm text-zinc-400">
            {isModel
              ? 'Ve a Usuarios en Solicitudes y escribe a alguien para empezar.'
              : '¡Rompe el hielo! Explora perfiles y empieza a chatear.'}
          </p>
          <button
            type="button"
            onClick={openExploreOrRequests}
            className="mt-6 flex items-center gap-2 rounded-xl bg-vibra-pink px-5 py-2.5 text-sm font-semibold transition hover:bg-vibra-pink-hover"
          >
            <MessageCircle className="h-4 w-4" />
            {isModel ? 'Ver usuarios' : 'Explorar perfiles'}
          </button>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {conversations.map((c) => {
            if (!c.peer) return null;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => openConversation(c)}
                className="flex w-full items-center gap-3 rounded-xl border border-vibra-border bg-vibra-elevated px-4 py-3 text-left transition hover:border-vibra-pink/40"
              >
                <div className="relative shrink-0">
                  {c.peer.avatarUrl ? (
                    <img
                      src={mediaSrc(c.peer.avatarUrl)}
                      alt={c.peer.displayName}
                      className="h-11 w-11 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-700 text-sm font-semibold">
                      {c.peer.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {c.peer.isOnline ? (
                    <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-vibra-elevated bg-vibra-online" />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">
                    {isModel ? c.peer.displayName : maskDisplayName(c.peer.displayName)}
                  </p>
                  <p className="truncate text-sm text-zinc-400">
                    {c.lastMessage?.content ?? 'Nueva conversación'}
                  </p>
                </div>
                {(c.unreadCount ?? 0) > 0 ? (
                  <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-vibra-pink px-1.5 text-[11px] font-semibold text-white">
                    {(c.unreadCount ?? 0) > 99 ? '99+' : c.unreadCount}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
