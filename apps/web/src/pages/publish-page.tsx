import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { PhotoUploader } from '@/features/media/components/photo-uploader';
import { mediaSrc, uploadMediaFile } from '@/features/media/services/media-api';
import { createPostRequest } from '@/features/posts';
import { useAuthStore } from '@/store';

const inputClass =
  'w-full rounded-xl border border-vibra-border bg-vibra-muted px-4 py-3 text-sm outline-none focus:border-vibra-pink/50';

export function PublishPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const isModel = user?.role === 'MODEL';
  const verified = user?.profile?.isVerified || user?.verificationStatus === 'APPROVED';

  const [text, setText] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<'FREE' | 'PAID'>('FREE');
  const [priceCredits, setPriceCredits] = useState(user?.profile?.contentPrice ?? 100);
  const [error, setError] = useState<string | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  const publishMutation = useMutation({
    mutationFn: () =>
      createPostRequest({
        text,
        visibility,
        priceCredits: visibility === 'PAID' ? priceCredits : undefined,
        media: [
          ...images.map((url) => ({ url, kind: 'IMAGE' as const })),
          ...(videoUrl ? [{ url: videoUrl, kind: 'VIDEO' as const }] : []),
        ],
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['posts'] });
      setText('');
      setImages([]);
      setVideoUrl(null);
      setVisibility('FREE');
      setError(null);
      navigate('/requests', { replace: true });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message ?? 'No se pudo publicar';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    },
  });

  if (!isModel) return <Navigate to="/explore" replace />;

  async function onVideoPick(file: File | null) {
    if (!file) return;
    setError(null);
    setUploadingVideo(true);
    try {
      const res = await uploadMediaFile(file, 'VIDEO');
      setVideoUrl(res.url);
    } catch {
      setError('No se pudo subir el video (MP4/WEBM, máx. 40 MB)');
    } finally {
      setUploadingVideo(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (images.length < 1) {
      setError('Agrega al menos 1 imagen');
      return;
    }
    publishMutation.mutate();
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-display text-3xl font-bold">Publicar</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Comparte fotos y un video opcional. El contenido de pago se muestra borroso.
        </p>
      </div>

      {!verified ? (
        <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Debes estar verificada para publicar contenido.
        </p>
      ) : null}

      <form className="space-y-5" onSubmit={onSubmit}>
        <textarea
          className={inputClass}
          rows={4}
          maxLength={2000}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe algo..."
        />

        <div className="space-y-2">
          <p className="text-sm text-zinc-400">Imágenes (hasta 10)</p>
          <PhotoUploader
            photos={images}
            onChange={setImages}
            max={10}
            type="GALLERY"
            label="Agregar foto"
          />
        </div>

        <div className="space-y-2">
          <p className="text-sm text-zinc-400">Video opcional</p>
          {videoUrl ? (
            <div className="space-y-2">
              <video
                src={mediaSrc(videoUrl)}
                controls
                className="max-h-56 w-full rounded-xl bg-black object-contain"
              />
              <button
                type="button"
                onClick={() => setVideoUrl(null)}
                className="text-sm text-zinc-400 underline"
              >
                Quitar video
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-vibra-border bg-vibra-muted/40 px-4 py-6 text-sm text-zinc-400">
              {uploadingVideo ? 'Subiendo...' : 'Elegir video (MP4/WEBM)'}
              <input
                type="file"
                accept="video/mp4,video/webm"
                className="hidden"
                disabled={uploadingVideo || !verified}
                onChange={(e) => void onVideoPick(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
        </div>

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
          <label className="block text-sm text-zinc-400">
            Precio (créditos)
            <input
              type="number"
              min={1}
              className={`${inputClass} mt-1`}
              value={priceCredits}
              onChange={(e) => setPriceCredits(Number(e.target.value))}
            />
          </label>
        ) : null}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={!verified || publishMutation.isPending || uploadingVideo}
          className="w-full rounded-xl bg-vibra-pink py-3 text-sm font-semibold disabled:opacity-60"
        >
          {publishMutation.isPending ? 'Publicando...' : 'Publicar'}
        </button>
      </form>
    </div>
  );
}
