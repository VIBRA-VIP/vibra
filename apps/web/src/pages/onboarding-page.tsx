import { useMemo, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  BODY_TAGS,
  FEMALE_BREAST_SIZES,
  FEMALE_BUTT_TYPES,
  HAIR_STYLES,
  MALE_BODY_BUILDS,
  MALE_PENIS_SIZES,
  SKIN_TONES,
} from '@vibra/shared';
import { meRequest } from '@/features/auth';
import { completeProfileRequest } from '@/features/profiles/services/profile-setup-api';
import { useAuthStore } from '@/store';

const inputClass =
  'w-full rounded-xl border border-vibra-border bg-vibra-muted px-4 py-3 text-sm outline-none focus:border-vibra-pink/50';

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
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        active
          ? 'border-vibra-pink bg-vibra-pink/20 text-white'
          : 'border-vibra-border text-zinc-400 hover:text-white'
      }`}
    >
      #{label}
    </button>
  );
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const accessToken = useAuthStore((s) => s.accessToken);

  const isModel = user?.role === 'MODEL';
  const isFemale = user?.profile?.gender === 'FEMALE';

  const [bio, setBio] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>(['']);
  const [breastSize, setBreastSize] = useState('M');
  const [buttType, setButtType] = useState('normal');
  const [bodyBuild, setBodyBuild] = useState('atletico');
  const [penisSize, setPenisSize] = useState('promedio');
  const [skinTone, setSkinTone] = useState('media');
  const [hair, setHair] = useState('liso');
  const [messagePrice, setMessagePrice] = useState(10);
  const [chatPricePerMin, setChatPricePerMin] = useState(15);
  const [videoPricePerMin, setVideoPricePerMin] = useState(80);
  const [contentPrice, setContentPrice] = useState(100);
  const [acceptsEncounters, setAcceptsEncounters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const username = user?.profile?.username;

  const availableTags = useMemo(() => [...BODY_TAGS], []);

  if (!accessToken) return <Navigate to="/login" replace />;
  if (user && !user.needsOnboarding && user.profile?.profileCompleted) {
    return <Navigate to="/explore" replace />;
  }

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  function updatePhoto(index: number, value: string) {
    setPhotoUrls((prev) => prev.map((p, i) => (i === index ? value : p)));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const urls = photoUrls.map((u) => u.trim()).filter(Boolean);
    if (isModel && (urls.length < 1 || urls.length > 5)) {
      setError('Sube entre 1 y 5 URLs de fotos de perfil/galería');
      return;
    }
    if (!isModel && urls.length < 1) {
      setError('Agrega 1 foto de perfil');
      return;
    }

    setLoading(true);
    try {
      const attributes = isModel
        ? isFemale
          ? { breastSize, buttType, skinTone, hair }
          : { bodyBuild, penisSize, skinTone, hair }
        : {};

      await completeProfileRequest({
        bio,
        tags: isModel ? tags : [],
        avatarUrl: urls[0],
        galleryUrls: isModel ? urls : [urls[0]],
        attributes,
        messagePrice: isModel ? messagePrice : undefined,
        chatPricePerMin: isModel ? chatPricePerMin : undefined,
        videoPricePerMin: isModel ? videoPricePerMin : undefined,
        contentPrice: isModel ? contentPrice : undefined,
        acceptsEncounters: isModel ? acceptsEncounters : false,
        markCompleted: true,
      });
      const me = await meRequest();
      setUser(me);
      navigate('/explore', { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message ?? 'No se pudo completar el perfil';
      setError(Array.isArray(message) ? message.join(', ') : String(message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold">Completa tu perfil</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Primera sesión: define cómo te verán en Vibra.
        {username ? (
          <>
            {' '}
            Tu usuario público es <span className="text-vibra-pink">@{username}</span> (no revela tu
            identidad).
          </>
        ) : null}
      </p>

      <form className="mt-8 space-y-8" method="post" onSubmit={onSubmit}>
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">
            {isModel ? 'Fotos (1 a 5)' : 'Foto de perfil'}
          </h2>
          <p className="text-xs text-zinc-500">
            Por ahora pega URLs de imagen (S3/upload se conecta después).
          </p>
          {photoUrls.map((url, index) => (
            <input
              key={index}
              value={url}
              onChange={(e) => updatePhoto(index, e.target.value)}
              placeholder={`URL foto ${index + 1}`}
              className={inputClass}
            />
          ))}
          {isModel && photoUrls.length < 5 ? (
            <button
              type="button"
              onClick={() => setPhotoUrls((prev) => [...prev, ''])}
              className="text-sm text-vibra-pink"
            >
              + Agregar otra foto
            </button>
          ) : null}
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Sobre mí</h2>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Cuéntales quién eres..."
            className={inputClass}
          />
        </section>

        {isModel ? (
          <>
            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold">Tags de cuerpo / estilo</h2>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    active={tags.includes(tag)}
                    onClick={() => toggleTag(tag)}
                  />
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold">Medidas / atributos</h2>
              {isFemale ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm text-zinc-400">
                    Senos
                    <select
                      className={`${inputClass} mt-1`}
                      value={breastSize}
                      onChange={(e) => setBreastSize(e.target.value)}
                    >
                      {FEMALE_BREAST_SIZES.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm text-zinc-400">
                    Glúteos
                    <select
                      className={`${inputClass} mt-1`}
                      value={buttType}
                      onChange={(e) => setButtType(e.target.value)}
                    >
                      {FEMALE_BUTT_TYPES.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm text-zinc-400">
                    Complexión
                    <select
                      className={`${inputClass} mt-1`}
                      value={bodyBuild}
                      onChange={(e) => setBodyBuild(e.target.value)}
                    >
                      {MALE_BODY_BUILDS.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm text-zinc-400">
                    Tamaño
                    <select
                      className={`${inputClass} mt-1`}
                      value={penisSize}
                      onChange={(e) => setPenisSize(e.target.value)}
                    >
                      {MALE_PENIS_SIZES.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-zinc-400">
                  Ton de piel
                  <select
                    className={`${inputClass} mt-1`}
                    value={skinTone}
                    onChange={(e) => setSkinTone(e.target.value)}
                  >
                    {SKIN_TONES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm text-zinc-400">
                  Cabello
                  <select
                    className={`${inputClass} mt-1`}
                    value={hair}
                    onChange={(e) => setHair(e.target.value)}
                  >
                    {HAIR_STYLES.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold">Precios (créditos)</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-zinc-400">
                  Por mensaje
                  <input
                    type="number"
                    min={0}
                    className={`${inputClass} mt-1`}
                    value={messagePrice}
                    onChange={(e) => setMessagePrice(Number(e.target.value))}
                  />
                </label>
                <label className="text-sm text-zinc-400">
                  Chat / min
                  <input
                    type="number"
                    min={0}
                    className={`${inputClass} mt-1`}
                    value={chatPricePerMin}
                    onChange={(e) => setChatPricePerMin(Number(e.target.value))}
                  />
                </label>
                <label className="text-sm text-zinc-400">
                  Video / min
                  <input
                    type="number"
                    min={0}
                    className={`${inputClass} mt-1`}
                    value={videoPricePerMin}
                    onChange={(e) => setVideoPricePerMin(Number(e.target.value))}
                  />
                </label>
                <label className="text-sm text-zinc-400">
                  Contenido
                  <input
                    type="number"
                    min={0}
                    className={`${inputClass} mt-1`}
                    value={contentPrice}
                    onChange={(e) => setContentPrice(Number(e.target.value))}
                  />
                </label>
              </div>
              <label className="flex items-center gap-3 text-sm text-zinc-300">
                <input
                  type="checkbox"
                  checked={acceptsEncounters}
                  onChange={(e) => setAcceptsEncounters(e.target.checked)}
                />
                Acepto encuentros / citas
              </label>
            </section>
          </>
        ) : null}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-vibra-pink py-3 text-sm font-semibold disabled:opacity-60"
        >
          {loading ? 'Guardando...' : 'Terminar registro'}
        </button>
      </form>
    </div>
  );
}
