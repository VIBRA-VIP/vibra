export function ChatsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="font-display text-2xl font-bold md:text-3xl">Chats</h1>
      <p className="mt-2 text-sm text-zinc-400">
        El chat en tiempo real se conectará en la fase de Socket.io.
      </p>
      <div className="mt-6 space-y-3">
        {['Camila', 'Valentina', 'Isabella'].map((name, i) => (
          <div
            key={name}
            className="flex items-center gap-3 rounded-xl border border-vibra-border bg-vibra-elevated px-4 py-3"
          >
            <div className="relative h-11 w-11 rounded-full bg-zinc-700">
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-vibra-elevated bg-vibra-online" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-semibold">
                  {name} <span className="text-vibra-pink">✓</span>
                </p>
                <span className="text-xs text-zinc-500">{i === 0 ? '2 min' : '10 min'}</span>
              </div>
              <p className="truncate text-sm text-zinc-400">Te envié una foto</p>
            </div>
            {i === 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-vibra-pink text-xs font-semibold">
                2
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
