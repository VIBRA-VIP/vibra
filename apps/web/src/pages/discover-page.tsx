import { useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, Heart } from 'lucide-react';
import { VerifiedBadge } from '@/components/verified-badge';
import { mediaSrc } from '@/features/media/services/media-api';
import { fetchModels, ModelProfileModal, type ModelProfile } from '@/features/profiles';
import { useAuthStore } from '@/store';
import { cn, maskDisplayName } from '@/utils';

const filters = [
  { id: 'all', label: 'Todas' },
  { id: 'popular', label: 'Populares' },
  { id: 'online', label: 'En línea' },
  { id: 'favorites', label: 'Favoritas' },
  { id: 'new', label: 'Nuevas' },
];

const genders = [
  { id: '', label: 'Todos' },
  { id: 'FEMALE', label: 'Mujeres' },
  { id: 'MALE', label: 'Hombres' },
];

function ModelCard({
  model,
  onSelect,
}: {
  model: ModelProfile;
  onSelect: (model: ModelProfile) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(model)}
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
      {model.avatarUrl ? (
        <img
          src={mediaSrc(model.avatarUrl)}
          alt={model.displayName}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-80">
          {model.gender === 'MALE' ? '😎' : '💃'}
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
      <span
        className={cn(
          'absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] font-medium backdrop-blur',
          model.isOnline ? 'bg-black/50 text-white' : 'bg-black/60 text-zinc-300',
        )}
      >
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            model.isOnline ? 'bg-vibra-online' : 'bg-zinc-500',
          )}
        />
        {model.isOnline ? 'En línea' : 'Offline'}
      </span>
      {model.isFavorited ? (
        <span className="absolute right-3 top-3 rounded-full bg-black/50 p-1.5 text-vibra-pink backdrop-blur">
          <Heart className="h-3.5 w-3.5 fill-current" />
        </span>
      ) : null}
      <div className="absolute inset-x-0 bottom-0 p-3">
        <p className="font-display text-base font-semibold">
          <span className="inline-flex max-w-full items-center gap-1">
            <span className="truncate">{maskDisplayName(model.displayName)}</span>
            {model.isVerified ? <VerifiedBadge className="h-3.5 w-3.5" /> : null}
          </span>
        </p>
        <p className="text-xs text-zinc-300">{model.age} años</p>
        <p className="mt-1 text-[11px] text-zinc-400">
          Video {model.videoPricePerMin} créd/min
        </p>
      </div>
    </button>
  );
}

export function DiscoverPage() {
  const user = useAuthStore((s) => s.user);
  const isModel = user?.role === 'MODEL';
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
    enabled: !isModel,
  });

  const models = useMemo(() => data, [data]);

  if (isModel) {
    return <Navigate to="/requests" replace />;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 text-left">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1 text-left">
          <h1 className="font-display text-2xl font-bold md:text-3xl">Conocer</h1>
          <p className="mt-1 text-sm text-zinc-400">Descubre modelos por filtros</p>
        </div>
        <div className="flex flex-1 items-center gap-2 sm:max-w-md sm:justify-end">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar..."
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

      {isLoading ? <p className="text-sm text-zinc-400">Cargando perfiles...</p> : null}
      {isError ? (
        <p className="text-sm text-red-400">No se pudieron cargar los perfiles.</p>
      ) : null}

      {!isLoading && !isError && models.length === 0 ? (
        <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-3xl border border-dashed border-vibra-border bg-vibra-elevated/60 px-6 py-16 text-center">
          <div
            className="mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-vibra-pink/30 via-zinc-800 to-zinc-950 text-6xl shadow-inner"
            aria-hidden
          >
            🔥
          </div>
          <p className="font-display text-xl font-semibold">
            {activeFilter === 'favorites' ? 'Sin favoritos aún' : 'Aún no hay modelos'}
          </p>
          <p className="mt-2 max-w-sm text-sm text-zinc-400">
            {activeFilter === 'favorites'
              ? 'Toca el corazón en un perfil para guardarlo aquí.'
              : 'Pronto verás perfiles aquí. Mientras tanto, vuelve más tarde o ajusta los filtros.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {models.map((model) => (
            <ModelCard key={model.id} model={model} onSelect={setSelected} />
          ))}
        </div>
      )}

      {selected ? (
        <ModelProfileModal
          model={selected}
          onClose={() => setSelected(null)}
          onFavoriteChange={(modelUserId, favorited) => {
            setSelected((prev) =>
              prev && prev.userId === modelUserId ? { ...prev, isFavorited: favorited } : prev,
            );
          }}
        />
      ) : null}
    </div>
  );
}
