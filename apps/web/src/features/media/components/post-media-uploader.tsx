import { useRef, useState, type ChangeEvent } from 'react';
import { Play } from 'lucide-react';
import { mediaSrc, uploadMediaFile } from '../services/media-api';

export type PostMediaItem = {
  url: string;
  kind: 'IMAGE' | 'VIDEO';
};

type Props = {
  items: PostMediaItem[];
  onChange: (items: PostMediaItem[]) => void;
  max?: number;
  disabled?: boolean;
};

export function PostMediaUploader({ items, onChange, max = 8, disabled = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length || disabled) return;
    setError(null);

    const remaining = max - items.length;
    if (remaining <= 0) {
      setError(`Máximo ${max} archivos`);
      return;
    }

    const picked = Array.from(files).slice(0, remaining);
    const next = [...items];

    for (const file of picked) {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type === 'video/mp4' || file.type === 'video/webm';
      if (!isImage && !isVideo) {
        setError('Solo fotos (JPG, PNG, WEBP, GIF) o videos (MP4, WEBM)');
        continue;
      }

      setBusy(true);
      try {
        const result = await uploadMediaFile(file, isVideo ? 'VIDEO' : 'GALLERY');
        next.push({ url: result.url, kind: isVideo ? 'VIDEO' : 'IMAGE' });
        onChange([...next]);
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
            ?.message ?? 'No se pudo subir el archivo';
        setError(Array.isArray(message) ? message.join(', ') : String(message));
      } finally {
        setBusy(false);
      }
    }

    if (inputRef.current) inputRef.current.value = '';
  }

  function removeAt(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item, index) => (
          <div
            key={`${item.url}-${index}`}
            className="relative aspect-square overflow-hidden rounded-xl border border-vibra-border bg-vibra-muted"
          >
            {item.kind === 'VIDEO' ? (
              <>
                <video
                  src={mediaSrc(item.url)}
                  className="h-full w-full object-cover"
                  muted
                  playsInline
                  preload="metadata"
                />
                <span className="absolute left-2 top-2 rounded-md bg-black/60 p-1 text-white backdrop-blur-sm">
                  <Play className="h-3.5 w-3.5 fill-current" />
                </span>
              </>
            ) : (
              <img
                src={mediaSrc(item.url)}
                alt={`Contenido ${index + 1}`}
                className="h-full w-full object-cover"
              />
            )}
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white"
            >
              Quitar
            </button>
          </div>
        ))}

        {items.length < max ? (
          <button
            type="button"
            disabled={busy || disabled}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-vibra-border bg-vibra-muted/50 text-sm text-zinc-300 transition hover:border-vibra-pink/50 hover:text-white disabled:opacity-60"
          >
            <span className="text-2xl leading-none">+</span>
            <span className="px-2 text-center text-xs">
              {busy ? 'Subiendo...' : 'Foto o video'}
            </span>
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
        multiple
        className="hidden"
        disabled={busy || disabled}
        onChange={(e: ChangeEvent<HTMLInputElement>) => void handleFiles(e.target.files)}
      />

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <p className="text-xs text-zinc-500">
        Fotos y videos en un solo álbum · máximo {max} · JPG/PNG/WEBP/GIF o MP4/WEBM
      </p>
    </div>
  );
}
