import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Heart, MessageCircle, Video } from 'lucide-react';
import { formatAttrValue } from '@vibra/shared';
import { mediaSrc } from '@/features/media/services/media-api';
import { PostCard, PostCommentsSheet, fetchPostsByAuthor } from '@/features/posts';
import {
  fetchModelByUsername,
  toggleFavoriteRequest,
} from '@/features/profiles/services/profiles-api';
import { cn } from '@/utils';

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
  const [commentsPostId, setCommentsPostId] = useState<string | null>(null);

  const profileQuery = useQuery({
    queryKey: ['profile', username],
    queryFn: () => fetchModelByUsername(username!),
    enabled: Boolean(username),
  });

  const model = profileQuery.data;

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
        <Link to="/conocer" className="text-sm text-vibra-pink hover:underline">
          Volver a Conocer
        </Link>
        <p className="mt-4 text-sm text-zinc-400">No se encontró este perfil.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl text-left">
      <div className="relative aspect-[4/5] max-h-[70vh] overflow-hidden bg-zinc-800 sm:aspect-[16/9] sm:max-h-[420px] sm:rounded-b-2xl">
        {model.avatarUrl ? (
          <img
            src={mediaSrc(model.avatarUrl)}
            alt={model.displayName}
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className={`absolute inset-0 bg-gradient-to-br ${
              model.gender === 'MALE'
                ? 'from-sky-800 via-zinc-800 to-zinc-950'
                : 'from-rose-800 via-zinc-800 to-zinc-950'
            }`}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-vibra-bg via-transparent to-transparent" />
        <Link
          to="/conocer"
          className="absolute left-4 top-4 rounded-full bg-black/50 p-2 backdrop-blur"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span
          className={cn(
            'absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium backdrop-blur',
            model.isOnline ? 'bg-black/50 text-white' : 'bg-black/50 text-zinc-300',
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
      </div>

      <div className="space-y-6 px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold md:text-3xl">
              {model.displayName}{' '}
              {model.isVerified ? <span className="text-vibra-pink">✓</span> : null}
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              {model.age ? `${model.age} años · ` : ''}@{model.username}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={favoriteMutation.isPending}
              onClick={() => favoriteMutation.mutate()}
              className={cn(
                'rounded-xl border p-3 transition disabled:opacity-60',
                model.isFavorited
                  ? 'border-vibra-pink bg-vibra-pink/20 text-vibra-pink'
                  : 'border-vibra-border text-zinc-300',
              )}
              aria-label="Seguir"
            >
              <Heart className={cn('h-5 w-5', model.isFavorited && 'fill-current')} />
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-vibra-pink px-4 py-3 text-sm font-semibold"
            >
              <Video className="h-4 w-4" />
              Video llamada
            </button>
          </div>
        </div>

        {model.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {model.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-vibra-border bg-vibra-muted px-3 py-1 text-xs text-zinc-300"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {model.bio ? (
          <section>
            <h2 className="font-display text-lg font-semibold">Sobre mí</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{model.bio}</p>
          </section>
        ) : null}

        {attrs.length > 0 ? (
          <section>
            <h2 className="font-display text-lg font-semibold">Detalles</h2>
            <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {attrs.map((item) => (
                <div
                  key={item.key}
                  className="rounded-xl border border-vibra-border bg-vibra-elevated px-3 py-2"
                >
                  <dt className="text-[11px] uppercase tracking-wide text-zinc-500">{item.label}</dt>
                  <dd className="mt-0.5 text-sm text-zinc-200">{item.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ) : null}

        <section>
          <h2 className="font-display text-lg font-semibold">Servicios</h2>
          <ul className="mt-3 space-y-2">
            <li className="flex items-center justify-between rounded-xl border border-vibra-border bg-vibra-elevated px-4 py-3 text-sm">
              <span>Videollamada</span>
              <span className="text-zinc-400">{model.videoPricePerMin} créd/min</span>
            </li>
            <li className="flex items-center justify-between rounded-xl border border-vibra-border bg-vibra-elevated px-4 py-3 text-sm">
              <span>Contenido exclusivo</span>
              <span className="text-zinc-400">{model.contentPrice ?? 100} créditos</span>
            </li>
            {model.services.map((service) => (
              <li
                key={service.name}
                className="flex items-center justify-between rounded-xl border border-vibra-border bg-vibra-elevated px-4 py-3 text-sm"
              >
                <span>{service.name}</span>
                <span className="text-zinc-400">
                  {service.price} {service.unit ?? 'créditos'}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <button
          type="button"
          onClick={startChat}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-vibra-pink py-3 text-sm font-semibold"
        >
          <MessageCircle className="h-4 w-4" />
          Enviar mensaje
        </button>

        <section className="space-y-3 border-t border-vibra-border pt-6">
          <h2 className="font-display text-lg font-semibold">Publicaciones</h2>
          {postsQuery.isLoading ? (
            <p className="text-sm text-zinc-500">Cargando...</p>
          ) : (postsQuery.data ?? []).length === 0 ? (
            <p className="rounded-2xl border border-dashed border-vibra-border px-4 py-8 text-center text-sm text-zinc-500">
              Esta modelo aún no tiene publicaciones.
            </p>
          ) : (
            <div className="mx-auto max-w-lg space-y-4">
              {(postsQuery.data ?? []).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onOpenComments={setCommentsPostId}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {commentsPostId ? (
        <PostCommentsSheet postId={commentsPostId} onClose={() => setCommentsPostId(null)} />
      ) : null}
    </div>
  );
}
