import { useRef, useState, type ChangeEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Camera, Heart, MessageCircle, PlusSquare, Settings, Video } from 'lucide-react';
import { formatAttrValue } from '@vibra/shared';
import { VerifiedBadge } from '@/components/verified-badge';
import { BodyAttrIcon, attrKindFromKey } from '@/components/body-attr-icons';
import { meRequest } from '@/features/auth';
import { mediaSrc, uploadMediaFile } from '@/features/media/services/media-api';
import { PostCard, PostGridTile, fetchPostsByAuthor, type FeedPostDto } from '@/features/posts';
import {
  fetchModelByUsername,
  toggleFavoriteRequest,
} from '@/features/profiles/services/profiles-api';
import { useAuthStore } from '@/store';
import { cn, maskDisplayName } from '@/utils';

const femaleAttrOrder = [
  'breastSize',
  'buttType',
  'skinTone',
  'hair',
  'height',
  'bodyType',
  'bust',
  'waist',
  'hips',
  'tattoos',
  'vibe',
];

const maleAttrOrder = [
  'bodyBuild',
  'penisSize',
  'skinTone',
  'hair',
  'height',
  'bodyType',
  'penisGirth',
  'tattoos',
  'vibe',
];

const attrLabels: Record<string, string> = {
  height: 'Altura',
  bodyType: 'Complexión',
  bodyBuild: 'Complexión',
  skinTone: 'Tono de piel',
  breastSize: 'Senos',
  buttType: 'Glúteos',
  bust: 'Busto',
  waist: 'Cintura',
  hips: 'Cadera',
  tattoos: 'Tatuajes',
  hair: 'Cabello',
  vibe: 'Estilo',
  penisSize: 'Miembro',
  penisGirth: 'Grosor',
};

export function ProfilePage() {
  const { id: username } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const isModel = user?.role === 'MODEL';

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<'avatar' | 'banner' | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [openPost, setOpenPost] = useState<FeedPostDto | null>(null);

  const profileQuery = useQuery({
    queryKey: ['profile', username],
    queryFn: () => fetchModelByUsername(username!),
    enabled: Boolean(username),
  });

  const model = profileQuery.data;
  const isOwner = Boolean(model && user?.id === model.userId);

  const postsQuery = useQuery({
    queryKey: ['posts', 'by', model?.userId],
    queryFn: () => fetchPostsByAuthor(model!.userId),
    enabled: Boolean(model?.userId),
  });

  const favoriteMutation = useMutation({
    mutationFn: () => toggleFavoriteRequest(model!.userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['profile', username] });
      await queryClient.invalidateQueries({ queryKey: ['models'] });
    },
  });

  const order = model?.gender === 'MALE' ? maleAttrOrder : femaleAttrOrder;
  const attrs = (order ?? [])
    .filter((key) => model?.attributes?.[key] != null && model.attributes[key] !== '')
    .map((key) => ({
      key,
      label: attrLabels[key] ?? key,
      value: formatAttrValue(key, String(model!.attributes[key])),
    }));

  function startChat() {
    if (!model) return;
    navigate('/chats', {
      state: {
        peer: {
          userId: model.userId,
          displayName: model.displayName,
          username: model.username,
          avatarUrl: model.avatarUrl,
        },
      },
    });
  }

  async function refreshAfterMedia(kind: 'avatar' | 'banner', url: string) {
    queryClient.setQueryData(['profile', username], (prev: typeof model) =>
      prev
        ? {
            ...prev,
            ...(kind === 'avatar' ? { avatarUrl: url } : { bannerUrl: url }),
          }
        : prev,
    );
    await queryClient.invalidateQueries({ queryKey: ['profile', username] });
    try {
      const me = await meRequest();
      setUser(me);
    } catch {
      // ignore
    }
  }

  async function onMediaPicked(kind: 'avatar' | 'banner', e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Solo se permiten imágenes');
      return;
    }
    setUploadError(null);
    setUploading(kind);
    try {
      const result = await uploadMediaFile(file, kind === 'avatar' ? 'AVATAR' : 'BANNER');
      await refreshAfterMedia(kind, result.url);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message ?? 'No se pudo subir la imagen';
      setUploadError(Array.isArray(message) ? message.join(', ') : String(message));
    } finally {
      setUploading(null);
    }
  }

  if (profileQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 text-left">
        <p className="text-sm text-zinc-500">Cargando perfil...</p>
      </div>
    );
  }

  if (profileQuery.isError || !model) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 text-left">
        <Link
          to={isModel ? '/requests' : '/conocer'}
          className="text-sm text-vibra-pink hover:underline"
        >
          Volver
        </Link>
        <p className="mt-4 text-sm text-zinc-400">No se encontró este perfil.</p>
      </div>
    );
  }

  const initial = model.displayName.charAt(0).toUpperCase();
  const wallUrl = model.bannerUrl || model.avatarUrl;
  const backTo = isOwner ? '/requests' : isModel ? '/requests' : '/conocer';

  return (
    <div className="relative mx-auto w-full max-w-6xl pb-8 text-left">
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onMediaPicked('avatar', e)}
      />
      <input
        ref={bannerInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onMediaPicked('banner', e)}
      />

      {/* Hero / portada */}
      <div className="relative h-[26vh] min-h-[160px] max-h-[220px] overflow-hidden sm:h-[32vh] sm:max-h-[280px]">
        {wallUrl ? (
          <img
            src={mediaSrc(wallUrl)}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full scale-105 object-cover blur-2xl brightness-50"
            aria-hidden
          />
        ) : null}
        <div
          className={cn(
            'pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80',
            model.gender === 'MALE'
              ? 'from-zinc-900 via-sky-950/40 to-black'
              : 'from-zinc-900 via-rose-950/50 to-black',
          )}
        />
        {wallUrl ? (
          <img
            src={mediaSrc(wallUrl)}
            alt={model.displayName}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center opacity-90"
          />
        ) : null}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-transparent" />

        {!isOwner ? (
          <Link
            to={backTo}
            className="absolute left-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-md transition hover:bg-black/70"
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        ) : null}

        {isOwner ? (
          <button
            type="button"
            disabled={uploading !== null}
            onClick={() => bannerInputRef.current?.click()}
            className="absolute right-3 top-3 z-20 inline-flex items-center gap-2 rounded-full bg-black/70 px-3.5 py-2.5 text-xs font-semibold text-white shadow-lg ring-1 ring-white/20 backdrop-blur-md transition hover:bg-black/85 disabled:opacity-60"
          >
            <Camera className="h-4 w-4" />
            {uploading === 'banner' ? 'Subiendo…' : 'Cambiar portada'}
          </button>
        ) : (
          <div
            className={cn(
              'absolute right-3 top-3 z-20 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-md',
              model.isOnline
                ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30'
                : 'bg-black/45 text-zinc-300 ring-1 ring-white/10',
            )}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                model.isOnline ? 'bg-vibra-online shadow-[0_0_8px_#22c55e]' : 'bg-zinc-500',
              )}
            />
            {model.isOnline ? 'En línea' : 'Offline'}
          </div>
        )}
      </div>

      <div className="relative z-10 -mt-12 px-3 sm:-mt-14 sm:px-4">
        <div className="mx-auto max-w-4xl space-y-6 pb-4 sm:max-w-5xl">
          {uploadError ? <p className="text-sm text-red-400">{uploadError}</p> : null}

          <div className="rounded-3xl border border-white/10 bg-[#121212]/90 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-end sm:gap-5 sm:p-6">
              <div className="relative -mt-14 shrink-0 self-start sm:-mt-16">
                <div className="rounded-full bg-gradient-to-br from-vibra-pink to-rose-700 p-[3px]">
                  {model.avatarUrl ? (
                    <img
                      src={mediaSrc(model.avatarUrl)}
                      alt={model.displayName}
                      className="h-24 w-24 rounded-full object-cover object-center ring-4 ring-[#121212] sm:h-28 sm:w-28"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-zinc-800 text-3xl font-semibold ring-4 ring-[#121212] sm:h-28 sm:w-28">
                      {initial}
                    </div>
                  )}
                </div>
                {isOwner ? (
                  <button
                    type="button"
                    disabled={uploading !== null}
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-vibra-pink text-white shadow-lg ring-2 ring-[#121212] transition hover:bg-vibra-pink-hover disabled:opacity-60"
                    aria-label="Cambiar foto de perfil"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                  <span className="inline-flex max-w-full items-center gap-1.5">
                    <span className="truncate">{maskDisplayName(model.displayName)}</span>
                    {model.isVerified ? <VerifiedBadge className="h-5 w-5" /> : null}
                  </span>
                </h1>
                <p className="mt-1 text-sm text-zinc-400">
                  @{model.username}
                  {model.age ? ` · ${model.age} años` : ''}
                </p>
                {isOwner ? (
                  <p className="mt-2 text-sm text-zinc-300">
                    <span className="font-semibold text-white tabular-nums">
                      {model.followersCount ?? 0}
                    </span>{' '}
                    {(model.followersCount ?? 0) === 1 ? 'seguidor' : 'seguidores'}
                  </p>
                ) : null}
              </div>

              {isOwner ? (
                <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
                  <Link
                    to="/publish"
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-vibra-pink px-4 text-sm font-semibold text-white transition hover:bg-vibra-pink-hover sm:flex-none"
                  >
                    <PlusSquare className="h-4 w-4" />
                    Publicar
                  </Link>
                  <Link
                    to="/settings"
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-zinc-200 transition hover:bg-white/10 sm:flex-none"
                  >
                    <Settings className="h-4 w-4" />
                    Ajustes
                  </Link>
                </div>
              ) : (
                <div className="flex w-full gap-2 sm:w-auto sm:shrink-0">
                  <button
                    type="button"
                    disabled={favoriteMutation.isPending}
                    onClick={() => favoriteMutation.mutate()}
                    className={cn(
                      'inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition disabled:opacity-60 sm:flex-none sm:px-4',
                      model.isFavorited
                        ? 'border-vibra-pink/50 bg-vibra-pink/15 text-vibra-pink'
                        : 'border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10',
                    )}
                  >
                    <Heart className={cn('h-4 w-4', model.isFavorited && 'fill-current')} />
                    {model.isFavorited ? 'Siguiendo' : 'Seguir'}
                  </button>
                  <button
                    type="button"
                    onClick={startChat}
                    className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-vibra-pink px-4 text-sm font-semibold text-white transition hover:bg-vibra-pink-hover sm:flex-none"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Mensaje
                  </button>
                </div>
              )}
            </div>

            {model.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 border-t border-white/5 px-5 py-4 sm:px-6">
                {model.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-medium text-zinc-300 ring-1 ring-white/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>

          {model.bio ? (
            <section className="rounded-3xl border border-white/10 bg-vibra-elevated/80 p-5">
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Sobre mí
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-zinc-300">{model.bio}</p>
            </section>
          ) : null}

          {attrs.length > 0 ? (
            <section>
              <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Detalles
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {attrs.map((item) => {
                  const kind = attrKindFromKey(item.key);
                  const optionId = String(model.attributes[item.key] ?? '');
                  return (
                    <div
                      key={item.key}
                      className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent px-3.5 py-3"
                    >
                      <div className="flex items-center gap-2">
                        {kind ? (
                          <BodyAttrIcon
                            kind={kind}
                            optionId={optionId}
                            className="h-5 w-5 text-vibra-pink"
                          />
                        ) : null}
                        <p className="text-[11px] uppercase tracking-wide text-zinc-500">
                          {item.label}
                        </p>
                      </div>
                      <p className="mt-1 text-sm font-medium text-zinc-100">{item.value}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
              Precios
            </h2>
            <div className="grid gap-2">
              <div className="flex items-center justify-between rounded-2xl border border-vibra-pink/25 bg-vibra-pink/10 px-4 py-4">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-vibra-pink/20 text-vibra-pink">
                    <Video className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Videollamada</p>
                    <p className="text-xs text-zinc-400">Por minuto</p>
                  </div>
                </div>
                <p className="font-display text-lg font-bold text-vibra-gold">
                  {model.videoPricePerMin}
                  <span className="ml-1 text-xs font-medium text-zinc-400">créd</span>
                </p>
              </div>
              {model.services.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-vibra-elevated px-4 py-3.5"
                >
                  <span className="text-sm">{service.name}</span>
                  <span className="text-sm text-zinc-400">
                    {service.price} {service.unit ?? 'créditos'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-4 flex items-end justify-between gap-3">
              <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Publicaciones
              </h2>
              {(postsQuery.data ?? []).length > 0 ? (
                <span className="text-xs text-zinc-500">{postsQuery.data!.length} posts</span>
              ) : null}
            </div>

            {postsQuery.isLoading ? (
              <p className="text-sm text-zinc-500">Cargando...</p>
            ) : (postsQuery.data ?? []).length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/10 px-4 py-12 text-center">
                <p className="text-sm text-zinc-500">
                  {isOwner ? 'Aún no tienes publicaciones' : 'Aún no hay publicaciones'}
                </p>
                {isOwner ? (
                  <Link
                    to="/publish"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-vibra-pink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-vibra-pink-hover"
                  >
                    <PlusSquare className="h-4 w-4" />
                    Crear publicación
                  </Link>
                ) : null}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1 sm:gap-1.5">
                {(postsQuery.data ?? []).map((post) => (
                  <PostGridTile key={post.id} post={post} onOpen={setOpenPost} />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {openPost ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpenPost(null)}
        >
          <div
            className="relative max-h-[90dvh] w-full max-w-lg overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <PostCard post={openPost} hideFollow={isOwner} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
