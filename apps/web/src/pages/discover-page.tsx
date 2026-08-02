import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, Heart, X, Sparkles } from 'lucide-react';
import {
  FEMALE_BODY_TAGS,
  FEMALE_BREAST_OPTIONS,
  FEMALE_BUTT_OPTIONS,
  FEMALE_HAIR_OPTIONS,
  MALE_BODY_OPTIONS,
  MALE_BODY_TAGS,
  MALE_HAIR_OPTIONS,
  MALE_PENIS_OPTIONS,
  SKIN_TONE_OPTIONS,
} from '@vibra/shared';
import { BodyAttrIcon, type BodyAttrKind } from '@/components/body-attr-icons';
import { VerifiedBadge } from '@/components/verified-badge';
import { mediaSrc } from '@/features/media/services/media-api';
import { fetchModels, type ModelProfile } from '@/features/profiles';
import { useAuthStore } from '@/store';
import { cn, maskDisplayName } from '@/utils';

const filters = [
  { id: 'all', label: 'Todas' },
  { id: 'popular', label: 'Populares' },
  { id: 'online', label: 'En línea' },
  { id: 'favorites', label: 'Favoritas' },
  { id: 'new', label: 'Nuevas' },
];

type AdvancedFilters = {
  gender: 'FEMALE' | 'MALE';
  tag: string;
  breastSize: string;
  buttType: string;
  bodyBuild: string;
  penisSize: string;
  skinTone: string;
  hair: string;
};

const emptyAdvanced: AdvancedFilters = {
  gender: 'FEMALE',
  tag: '',
  breastSize: '',
  buttType: '',
  bodyBuild: '',
  penisSize: '',
  skinTone: '',
  hair: '',
};

function FilterTile({
  active,
  label,
  onClick,
  icon,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 rounded-2xl border px-2 py-3.5 text-center transition',
        active
          ? 'border-vibra-pink bg-vibra-pink/20 text-vibra-pink shadow-[0_0_24px_rgba(236,72,153,0.3)]'
          : 'border-vibra-border bg-white/[0.03] text-zinc-300 hover:border-vibra-pink/50 hover:bg-white/[0.05] hover:text-white',
      )}
    >
      <span
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl',
          active ? 'bg-vibra-pink/15 text-vibra-pink' : 'bg-black/25 text-zinc-200',
        )}
      >
        {icon}
      </span>
      <span className={cn('text-[11px] font-semibold leading-tight', active && 'text-white')}>
        {label}
      </span>
    </button>
  );
}

function AttrFilterGrid({
  kind,
  options,
  value,
  onToggle,
}: {
  kind: BodyAttrKind;
  options: readonly { id: string; label: string }[];
  value: string;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {options.map((opt) => (
        <FilterTile
          key={opt.id}
          label={opt.label}
          active={value === opt.id}
          onClick={() => onToggle(opt.id)}
          icon={<BodyAttrIcon kind={kind} optionId={opt.id} className="h-10 w-10" />}
        />
      ))}
    </div>
  );
}

function Chip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium capitalize transition',
        active
          ? 'bg-vibra-pink text-white'
          : 'border border-vibra-border text-zinc-400 hover:text-white',
      )}
    >
      <Sparkles className="h-3 w-3 opacity-70" />
      {label}
    </button>
  );
}

function DiscoverFiltersModal({
  initial,
  onClose,
  onApply,
}: {
  initial: AdvancedFilters;
  onClose: () => void;
  onApply: (next: AdvancedFilters) => void;
}) {
  const [draft, setDraft] = useState<AdvancedFilters>(initial);

  useEffect(() => {
    setDraft(initial);
  }, [initial]);

  const styleTags = draft.gender === 'MALE' ? MALE_BODY_TAGS : FEMALE_BODY_TAGS;
  const hairOptions = draft.gender === 'MALE' ? MALE_HAIR_OPTIONS : FEMALE_HAIR_OPTIONS;
  const showFemaleAttrs = draft.gender === 'FEMALE';
  const showMaleAttrs = draft.gender === 'MALE';

  function setGender(gender: AdvancedFilters['gender']) {
    setDraft((prev) => ({
      ...prev,
      gender,
      breastSize: gender === 'MALE' ? '' : prev.breastSize,
      buttType: gender === 'MALE' ? '' : prev.buttType,
      bodyBuild: gender === 'FEMALE' ? '' : prev.bodyBuild,
      penisSize: gender === 'FEMALE' ? '' : prev.penisSize,
      hair: '',
      tag: '',
    }));
  }

  function toggleField<K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) {
    setDraft((p) => ({
      ...p,
      [key]: p[key] === value ? ('' as AdvancedFilters[K]) : value,
    }));
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-vibra-border bg-vibra-elevated sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Filtros"
      >
        <div className="flex items-center justify-between border-b border-vibra-border px-4 py-3">
          <h3 className="font-display text-lg font-semibold">Filtros</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-4 py-4">
          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Género</p>
            <div className="grid grid-cols-2 gap-2">
              <FilterTile
                label="Mujeres"
                active={draft.gender === 'FEMALE'}
                onClick={() => setGender('FEMALE')}
                icon={<BodyAttrIcon kind="breast" optionId="medianos" className="h-11 w-11" />}
              />
              <FilterTile
                label="Hombres"
                active={draft.gender === 'MALE'}
                onClick={() => setGender('MALE')}
                icon={<BodyAttrIcon kind="penis" optionId="mediano" className="h-11 w-11" />}
              />
            </div>
          </section>

          {showFemaleAttrs ? (
            <>
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Senos
                </p>
                <AttrFilterGrid
                  kind="breast"
                  options={FEMALE_BREAST_OPTIONS}
                  value={draft.breastSize}
                  onToggle={(id) => toggleField('breastSize', id)}
                />
              </section>

              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Glúteos
                </p>
                <AttrFilterGrid
                  kind="butt"
                  options={FEMALE_BUTT_OPTIONS}
                  value={draft.buttType}
                  onToggle={(id) => toggleField('buttType', id)}
                />
              </section>
            </>
          ) : null}

          {showMaleAttrs ? (
            <>
              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Complexión
                </p>
                <AttrFilterGrid
                  kind="body"
                  options={MALE_BODY_OPTIONS}
                  value={draft.bodyBuild}
                  onToggle={(id) => toggleField('bodyBuild', id)}
                />
              </section>

              <section className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Miembro
                </p>
                <AttrFilterGrid
                  kind="penis"
                  options={MALE_PENIS_OPTIONS}
                  value={draft.penisSize}
                  onToggle={(id) => toggleField('penisSize', id)}
                />
              </section>
            </>
          ) : null}

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Tono de piel
            </p>
            <AttrFilterGrid
              kind="skin"
              options={SKIN_TONE_OPTIONS}
              value={draft.skinTone}
              onToggle={(id) => toggleField('skinTone', id)}
            />
          </section>

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Cabello</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {hairOptions.map((opt) => (
                <FilterTile
                  key={`${opt.id}-${opt.label}`}
                  label={opt.label}
                  active={draft.hair === opt.id}
                  onClick={() => toggleField('hair', opt.id)}
                  icon={<BodyAttrIcon kind="hair" optionId={opt.id} className="h-10 w-10" />}
                />
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Estilo</p>
            <div className="flex flex-wrap gap-2">
              {styleTags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  active={draft.tag === tag}
                  onClick={() => toggleField('tag', tag)}
                />
              ))}
            </div>
          </section>
        </div>

        <div className="flex gap-2 border-t border-vibra-border p-4">
          <button
            type="button"
            onClick={() => {
              setDraft(emptyAdvanced);
              onApply(emptyAdvanced);
            }}
            className="flex-1 rounded-xl border border-vibra-border py-3 text-sm font-semibold text-zinc-300"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={() => onApply(draft)}
            className="flex-[1.4] rounded-xl bg-vibra-pink py-3 text-sm font-semibold text-white"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isModel = user?.role === 'MODEL';
  const [activeFilter, setActiveFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [advanced, setAdvanced] = useState<AdvancedFilters>(emptyAdvanced);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['models', activeFilter, query, advanced],
    queryFn: () =>
      fetchModels({
        filter: activeFilter === 'all' ? undefined : activeFilter,
        q: query || undefined,
        gender: advanced.gender,
        tag: advanced.tag || undefined,
        breastSize: advanced.breastSize || undefined,
        buttType: advanced.buttType || undefined,
        bodyBuild: advanced.bodyBuild || undefined,
        penisSize: advanced.penisSize || undefined,
        skinTone: advanced.skinTone || undefined,
        hair: advanced.hair || undefined,
      }),
    enabled: !isModel,
  });

  const models = useMemo(() => data, [data]);

  const activeAdvancedCount = useMemo(() => {
    let n = 0;
    if (advanced.tag) n += 1;
    if (advanced.breastSize) n += 1;
    if (advanced.buttType) n += 1;
    if (advanced.bodyBuild) n += 1;
    if (advanced.penisSize) n += 1;
    if (advanced.skinTone) n += 1;
    if (advanced.hair) n += 1;
    return n;
  }, [advanced]);

  const hasCustomFilters = activeAdvancedCount > 0 || advanced.gender === 'MALE';

  if (isModel) {
    return <Navigate to="/requests" replace />;
  }

  function openProfile(model: ModelProfile) {
    navigate(`/profile/${model.username}`);
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
            onClick={() => setFiltersOpen(true)}
            className={cn(
              'relative rounded-xl border p-2.5 transition',
              hasCustomFilters
                ? 'border-vibra-pink/50 bg-vibra-pink/15 text-vibra-pink'
                : 'border-vibra-border text-zinc-400 hover:text-white',
            )}
            aria-label="Filtros avanzados"
          >
            <SlidersHorizontal className="h-4 w-4" />
            {hasCustomFilters ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-vibra-pink px-1 text-[10px] font-bold text-white">
                {activeAdvancedCount + (advanced.gender === 'MALE' ? 1 : 0)}
              </span>
            ) : null}
          </button>
        </div>
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

      {hasCustomFilters ? (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-200">
            {advanced.gender === 'FEMALE' ? 'Mujeres' : 'Hombres'}
          </span>
          {advanced.breastSize ? (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-200">
              {FEMALE_BREAST_OPTIONS.find((o) => o.id === advanced.breastSize)?.label}
            </span>
          ) : null}
          {advanced.buttType ? (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-200">
              {FEMALE_BUTT_OPTIONS.find((o) => o.id === advanced.buttType)?.label}
            </span>
          ) : null}
          {advanced.bodyBuild ? (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-200">
              {MALE_BODY_OPTIONS.find((o) => o.id === advanced.bodyBuild)?.label}
            </span>
          ) : null}
          {advanced.penisSize ? (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-200">
              {MALE_PENIS_OPTIONS.find((o) => o.id === advanced.penisSize)?.label}
            </span>
          ) : null}
          {advanced.skinTone ? (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-200">
              {SKIN_TONE_OPTIONS.find((o) => o.id === advanced.skinTone)?.label}
            </span>
          ) : null}
          {advanced.hair ? (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-200">
              {[...FEMALE_HAIR_OPTIONS, ...MALE_HAIR_OPTIONS].find((o) => o.id === advanced.hair)
                ?.label ?? advanced.hair}
            </span>
          ) : null}
          {advanced.tag ? (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs capitalize text-zinc-200">
              {advanced.tag}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => setAdvanced(emptyAdvanced)}
            className="text-xs text-vibra-pink hover:underline"
          >
            Quitar filtros
          </button>
        </div>
      ) : null}

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
            {activeFilter === 'favorites' ? 'Sin favoritos aún' : 'Sin resultados'}
          </p>
          <p className="mt-2 max-w-sm text-sm text-zinc-400">
            {activeFilter === 'favorites'
              ? 'Toca el corazón en un perfil para guardarlo aquí.'
              : 'Prueba otros filtros o limpia la búsqueda.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {models.map((model) => (
            <ModelCard key={model.id} model={model} onSelect={openProfile} />
          ))}
        </div>
      )}

      {filtersOpen ? (
        <DiscoverFiltersModal
          initial={advanced}
          onClose={() => setFiltersOpen(false)}
          onApply={(next) => {
            setAdvanced(next);
            setFiltersOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}
