import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';

// Placeholder hasta que se conecte Socket.io — sin conversaciones reales todavía.
const conversations: never[] = [];

export function ChatsPage() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="font-display text-2xl font-bold md:text-3xl">Chats</h1>

      {conversations.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border border-dashed border-vibra-border bg-vibra-elevated/60 px-6 py-16 text-center">
          <div className="mb-5 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-vibra-pink/30 via-zinc-800 to-zinc-950 text-6xl shadow-inner">
            💬
          </div>
          <p className="font-display text-xl font-semibold">Sin conversaciones aún</p>
          <p className="mt-2 max-w-xs text-sm text-zinc-400">
            ¡Rompe el hielo! Explora perfiles y empieza a chatear con alguien que te llame la
            atención.
          </p>
          <button
            type="button"
            onClick={() => navigate('/explore')}
            className="mt-6 flex items-center gap-2 rounded-xl bg-vibra-pink px-5 py-2.5 text-sm font-semibold transition hover:bg-vibra-pink-hover"
          >
            <MessageCircle className="h-4 w-4" />
            Explorar perfiles
          </button>
          <div className="mt-8 flex gap-4 text-3xl" aria-hidden>
            <span>😍</span>
            <span>🔥</span>
            <span>💫</span>
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {conversations.map((c) => (
            <div key={(c as { id: string }).id} />
          ))}
        </div>
      )}
    </div>
  );
}
