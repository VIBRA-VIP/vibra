import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CREDIT_VALUE_COP, formatCop, formatCreditsCopHint } from '@vibra/shared';
import {
  PostMediaUploader,
  type PostMediaItem,
} from '@/features/media/components/post-media-uploader';
import { createPostRequest } from '@/features/posts';
import { useAuthStore } from '@/store';

const inputClass =
  'w-full rounded-xl border border-vibra-border bg-vibra-muted px-4 py-3 text-sm outline-none focus:border-vibra-pink/50';

const MAX_MEDIA = 8;

export function PublishPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isModel = user?.role === 'MODEL';
  const verified = user?.profile?.isVerified || user?.verificationStatus === 'APPROVED';

  const [text, setText] = useState('');
  const [media, setMedia] = useState<PostMediaItem[]>([]);
  const [visibility, setVisibility] = useState<'FREE' | 'PAID'>('FREE');
  const [priceCredits, setPriceCredits] = useState(user?.profile?.contentPrice ?? 100);
  const [error, setError] = useState<string | null>(null);

  const safeCredits = Number.isFinite(priceCredits) ? Math.max(0, priceCredits) : 0;

  const publishMutation = useMutation({
    mutationFn: () =>
      createPostRequest({
        text,
        visibility,
        priceCredits: visibility === 'PAID' ? priceCredits : undefined,
        media: media.map((m) => ({ url: m.url, kind: m.kind })),
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      setText('');
      setMedia([]);
      setVisibility('FREE');
      setError(null);
      navigate('/me', { replace: true });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message ?? 'No se pudo publicar';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    },
  });

  if (!isModel) return <Navigate to="/explore" replace />;

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (media.length < 1) {
      setError('Agrega al menos 1 foto o video');
      return;
    }
    if (media.length > MAX_MEDIA) {
      setError(`Máximo ${MAX_MEDIA} archivos`);
      return;
    }
    if (visibility === 'PAID' && safeCredits < 1) {
      setError('Indica un precio en créditos mayor a 0');
      return;
    }
    publishMutation.mutate();
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 text-left">
      <div className="text-left">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Publicar</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Hasta {MAX_MEDIA} fotos o videos en una sola publicación. El contenido de pago se muestra
          borroso.
        </p>
      </div>

      {!verified ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Debes estar verificada para publicar contenido.
        </p>
      ) : null}

      <form className="max-w-xl space-y-5" onSubmit={onSubmit}>
        <div className="space-y-2">
          <p className="text-sm text-zinc-400">
            Contenido ({media.length}/{MAX_MEDIA})
          </p>
          <PostMediaUploader
            items={media}
            onChange={setMedia}
            max={MAX_MEDIA}
            disabled={!verified}
          />
        </div>

        <textarea
          className={inputClass}
          rows={4}
          maxLength={2000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe algo..."
        />

        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { id: 'FREE' as const, label: 'Gratis' },
              { id: 'PAID' as const, label: 'De pago' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setVisibility(opt.id)}
              className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                visibility === opt.id
                  ? 'border-vibra-pink bg-vibra-pink/15 text-white'
                  : 'border-vibra-border text-zinc-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {visibility === 'PAID' ? (
          <div>
            <label className="block text-sm text-zinc-400">
              Precio (créditos)
              <input
                type="number"
                min={1}
                className={`${inputClass} mt-1`}
                value={Number.isFinite(priceCredits) ? priceCredits : 0}
                onChange={(e) => setPriceCredits(Number(e.target.value))}
              />
            </label>
            <p className="mt-1.5 text-sm font-medium text-vibra-gold">
              {safeCredits} créditos · {formatCreditsCopHint(safeCredits)}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              1 crédito ≈ {formatCop(CREDIT_VALUE_COP)} · lo que ganarías por desbloqueo
            </p>
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={!verified || publishMutation.isPending}
          className="w-full rounded-xl bg-vibra-pink py-3 text-sm font-semibold disabled:opacity-60"
        >
          {publishMutation.isPending ? 'Publicando...' : 'Publicar'}
        </button>
      </form>
    </div>
  );
}
