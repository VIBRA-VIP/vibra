import { useEffect, useRef, useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import {
  listMessagesRequest,
  openChatWithRequest,
  sendMessageRequest,
  type ChatMessageDto,
} from '@/features/chat/chat-api';
import { getChatSocket } from '@/features/chat/chat-socket';
import { cn } from '@/utils';

type Props = {
  peerUserId: string;
  myUserId: string;
  peerName: string;
  onClose: () => void;
};

export function VideoCallChatPanel({ peerUserId, myUserId, peerName, onClose }: Props) {
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageDto[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
        const conv = await openChatWithRequest(peerUserId);
        if (cancelled) return;
        setConversationId(conv.id);
        const msgs = await listMessagesRequest(conv.id);
        if (cancelled) return;
        setMessages(msgs.slice(-40));
      } catch {
        if (!cancelled) setError('No se pudo abrir el chat');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [peerUserId]);

  useEffect(() => {
    const sock = getChatSocket();
    if (!sock || !conversationId) return;

    const onMessage = (payload: {
      conversationId?: string;
      id?: string;
      senderId?: string;
      content?: string;
      type?: string;
      createdAt?: string;
    }) => {
      if (payload.conversationId !== conversationId || !payload.id || !payload.content) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === payload.id)) return prev;
        return [
          ...prev,
          {
            id: payload.id!,
            conversationId: payload.conversationId!,
            senderId: payload.senderId ?? '',
            content: payload.content!,
            type: payload.type ?? 'TEXT',
            createdAt: payload.createdAt ?? new Date().toISOString(),
            fromMe: payload.senderId === myUserId,
          },
        ].slice(-60);
      });
    };

    sock.on('chat:message', onMessage);
    return () => {
      sock.off('chat:message', onMessage);
    };
  }, [conversationId, myUserId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function send() {
    const content = draft.trim();
    if (!content || !conversationId || sending) return;
    setSending(true);
    setError(null);
    try {
      const msg = await sendMessageRequest(conversationId, content);
      setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      setDraft('');
    } catch {
      setError('No se pudo enviar');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-[90] flex max-h-[55%] flex-col rounded-t-3xl border border-vibra-border bg-vibra-elevated/95 backdrop-blur-md sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-80 sm:rounded-none sm:border-y-0 sm:border-r-0 sm:border-l">
      <div className="flex items-center justify-between gap-2 border-b border-vibra-border bg-vibra-muted/60 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-vibra-pink/15 text-vibra-pink">
            <MessageCircle className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold text-white">{peerName}</p>
            <p className="text-[11px] text-zinc-400">Chat de la llamada</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
          aria-label="Cerrar chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto bg-gradient-to-b from-white/[0.04] to-transparent px-3 py-3">
        {loading ? <p className="text-center text-xs text-zinc-500">Cargando…</p> : null}
        {!loading && messages.length === 0 ? (
          <p className="text-center text-xs text-zinc-500">Escribe el primer mensaje</p>
        ) : null}
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn('flex', m.fromMe || m.senderId === myUserId ? 'justify-end' : 'justify-start')}
          >
            <div
              className={cn(
                'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                m.fromMe || m.senderId === myUserId
                  ? 'bg-vibra-pink text-white'
                  : 'bg-white/10 text-zinc-100',
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error ? <p className="px-3 pb-1 text-xs text-red-400">{error}</p> : null}

      <form
        className="flex gap-2 border-t border-white/10 p-3 pb-28 sm:pb-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Escribe un mensaje…"
          maxLength={500}
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-vibra-pink/50"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-vibra-pink text-white disabled:opacity-40"
          aria-label="Enviar"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
