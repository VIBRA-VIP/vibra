import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, Video } from 'lucide-react';
import { fetchModels, ModelProfileModal, type ModelProfile } from '@/features/profiles';
import { cn } from '@/utils';

const filters = [
  { id: 'all', label: 'Todas' },
  { id: 'popular', label: 'Populares' },
  { id: 'online', label: 'En línea' },
  { id: 'new', label: 'Nuevas' },
];

const genders = [
  { id: '', label: 'Todos' },
  { id: 'FEMALE', label: 'Mujeres' },
  { id: 'MALE', label: 'Hombres' },
];

export function ExplorePage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [gender, setGender] = useState('');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<ModelProfile | null>(null);

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['models', activeFilter, gender, query],
    queryFn: () =>
      fetchModels({
        filter: activeFilter === 'all' ? undefined : activeFilter,
        gender: gender || undefined,
        q: query || undefined,
      }),
  });

  const models = useMemo(() => data, [data]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Explorar personas</h1>
        <div className="flex flex-1 items-center gap-2 sm:max-w-md sm:justify-end">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar personas..."
              className="w-full rounded-xl border border-vibra-border bg-vibra-elevated py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-zinc-500 focus:border-vibra-pink/50"
            />
          </div>
          <button
            type="button"
            className="rounded-xl border border-vibra-border p-2.5 text-zinc-400 hover:text-white"
            aria-label="Filtros avanzados"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {genders.map((item) => (
          <button
            key={item.id || 'all-g'}
            type="button"
            onClick={() => setGender(item.id)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition',
              gender === item.id
                ? 'bg-white text-black'
                : 'border border-vibra-border text-zinc-400 hover:text-white',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => setActiveFilter(filter.id)}
            className={cn(
              'rounded-full px-4 py-1.5 text-sm font-medium transition',
              activeFilter === filter.id
                ? 'bg-vibra-pink text-white'
                : 'border border-vibra-border bg-transparent text-zinc-400 hover:text-white',
            )}
          >
            {filter.id === 'online' ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-vibra-online" />
                {filter.label}
              </span>
            ) : (
              filter.label
            )}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-zinc-400">Cargando perfiles...</p>
      ) : null}
      {isError ? (
        <p className="text-sm text-red-400">No se pudieron cargar los perfiles.</p>
      ) : null}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {models.map((model) => (
          <button
            key={model.id}
            type="button"
            onClick={() => setSelected(model)}
            className="group relative aspect-[3/4] overflow-hidden rounded-2xl border border-vibra-border bg-vibra-muted text-left transition hover:border-vibra-pink"
          >
            <div
              className={cn(
                'absolute inset-0 bg-gradient-to-br',
                model.gender === 'MALE'
                  ? 'from-sky-800 via-zinc-800 to-zinc-950'
                  : 'from-rose-800 via-zinc-800 to-zinc-950',
              )}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            {model.isOnline ? (
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/50 px-2 py-1 text-[11px] font-medium backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-vibra-online" />
                En línea
              </span>
            ) : null}
            <span
              className="absolute bottom-16 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-vibra-pink text-white shadow-lg"
              aria-hidden
            >
              <Video className="h-4 w-4" />
            </span>
            <div className="absolute inset-x-0 bottom-0 p-3">
              <p className="font-display text-base font-semibold">
                {model.displayName}{' '}
                {model.isVerified ? <span className="text-vibra-pink">✓</span> : null}
              </p>
              <p className="text-xs text-zinc-300">
                {model.age} · ★ {model.rating.toFixed(1)}
              </p>
              <p className="mt-1 text-[11px] text-zinc-400">
                Chat {model.chatPricePerMin} · Video {model.videoPricePerMin} créd/min
              </p>
            </div>
          </button>
        ))}
      </div>

      {selected ? (
        <ModelProfileModal model={selected} onClose={() => setSelected(null)} />
      ) : null}
    </div>
  );
}
