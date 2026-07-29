import { useRef, useState, type ChangeEvent } from 'react';
import { mediaSrc, uploadMediaFile, type UploadMediaType } from '../services/media-api';

type PhotoSlot = {
  url: string;
  uploading?: boolean;
  error?: string | null;
};

type Props = {
  photos: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  type?: UploadMediaType;
  label?: string;
};

export function PhotoUploader({
  photos,
  onChange,
  max = 1,
  type = 'GALLERY',
  label = 'Subir fotos',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busyIndex, setBusyIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const slots: PhotoSlot[] = photos.length
    ? photos.map((url) => ({ url }))
    : [];

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);

    const remaining = max - photos.filter(Boolean).length;
    if (remaining <= 0) {
      setError(`Máximo ${max} foto${max > 1 ? 's' : ''}`);
      return;
    }

    const picked = Array.from(files).slice(0, remaining);
    const next = [...photos.filter(Boolean)];

    for (let i = 0; i < picked.length; i += 1) {
      const file = picked[i];
      if (!file) continue;
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten imágenes');
        continue;
      }
      setBusyIndex(next.length);
      try {
        const result = await uploadMediaFile(file, next.length === 0 ? 'AVATAR' : type);
        next.push(result.url);
        onChange([...next]);
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
            ?.message ?? 'No se pudo subir la foto';
        setError(Array.isArray(message) ? message.join(', ') : String(message));
      } finally {
        setBusyIndex(null);
      }
    }

    if (inputRef.current) inputRef.current.value = '';
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    void handleFiles(e.target.files);
  }

  function removeAt(index: number) {
    onChange(photos.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {slots.map((slot, index) => (
          <div
            key={`${slot.url}-${index}`}
            className="relative aspect-square overflow-hidden rounded-xl border border-vibra-border bg-vibra-muted"
          >
            <img
              src={mediaSrc(slot.url)}
              alt={`Foto ${index + 1}`}
              className="h-full w-full object-cover"
            />
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white"
            >
              Quitar
            </button>
            {busyIndex === index ? (
              <div className="absolute inset-0 grid place-items-center bg-black/50 text-xs">
                Subiendo...
              </div>
            ) : null}
          </div>
        ))}

        {photos.filter(Boolean).length < max ? (
          <button
            type="button"
            disabled={busyIndex !== null}
            onClick={() => inputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-vibra-border bg-vibra-muted/50 text-sm text-zinc-300 transition hover:border-vibra-pink/50 hover:text-white disabled:opacity-60"
          >
            <span className="text-2xl leading-none">+</span>
            <span className="px-2 text-center text-xs">{label}</span>
            {busyIndex !== null ? <span className="text-xs text-zinc-500">Subiendo...</span> : null}
          </button>
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple={max > 1}
        className="hidden"
        onChange={onInputChange}
      />

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <p className="text-xs text-zinc-500">
        Elige fotos desde tu computador o celular (JPG, PNG, WEBP o GIF · máx. 8 MB).
      </p>
    </div>
  );
}
