import { useMemo, useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
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
  type AttrOption,
} from '@vibra/shared';
import { meRequest } from '@/features/auth';
import { PhotoUploader } from '@/features/media/components/photo-uploader';
import { ModelPricingFields } from '@/features/profiles/components/model-pricing-fields';
import { completeProfileRequest } from '@/features/profiles/services/profile-setup-api';
import { useAuthStore } from '@/store';
import {
  BodyAttrIcon,
  type BodyAttrKind,
} from '@/components/body-attr-icons';
import { cn } from '@/utils';

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

function AttrIconPicker({
  kind,
  options,
  value,
  onChange,
}: {
  kind: BodyAttrKind;
  options: readonly AttrOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={cn(
              'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition',
              active
                ? 'border-vibra-pink bg-vibra-pink/20 text-vibra-pink'
                : 'border-vibra-border text-zinc-400 hover:border-vibra-pink/40 hover:text-white',
            )}
          >
            <BodyAttrIcon kind={kind} optionId={opt.id} className="h-10 w-10" />
            <span className={cn('text-xs font-medium', active ? 'text-white' : undefined)}>
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
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
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [breastSize, setBreastSize] = useState('medianos');
  const [buttType, setButtType] = useState('normal');
  const [bodyBuild, setBodyBuild] = useState('atletico');
  const [penisSize, setPenisSize] = useState('mediano');
  const [penisCm, setPenisCm] = useState('');
  const [usePenisCm, setUsePenisCm] = useState(false);
  const [skinTone, setSkinTone] = useState('media');
  const [hair, setHair] = useState('liso');
  const [videoPricePerMin, setVideoPricePerMin] = useState(80);
  const [idDocumentUrls, setIdDocumentUrls] = useState<string[]>([]);
  const [idDocumentBackUrls, setIdDocumentBackUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const username = user?.profile?.username;

  const availableTags = useMemo(
    () => [...(isFemale ? FEMALE_BODY_TAGS : MALE_BODY_TAGS)],
    [isFemale],
  );

  if (!accessToken) return <Navigate to="/login" replace />;
  if (user && !user.needsOnboarding && user.profile?.profileCompleted) {
    if (isModel && user.needsVerification) {
      return <Navigate to="/pending-verification" replace />;
    }
    return <Navigate to={isModel ? '/requests' : '/explore'} replace />;
  }

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const urls = photoUrls.map((u) => u.trim()).filter(Boolean);
    if (isModel && (urls.length < 1 || urls.length > 8)) {
      setError('Sube entre 1 y 8 fotos de perfil/galería');
      return;
    }
    if (isModel && (idDocumentUrls.length < 1 || idDocumentBackUrls.length < 1)) {
      setError('Sube el frente y el reverso de tu documento de identidad');
      return;
    }
    if (!isModel && urls.length < 1) {
      setError('Agrega 1 foto de perfil');
      return;
    }

    setLoading(true);
    try {
      if (!isFemale && usePenisCm) {
        const cm = Number(penisCm);
        if (!Number.isFinite(cm) || cm < 5 || cm > 40) {
          setError('Indica el tamaño del miembro entre 5 y 40 cm');
          setLoading(false);
          return;
        }
      }

      const attributes = isModel
        ? isFemale
          ? { breastSize, buttType, skinTone, hair }
          : {
              bodyBuild,
              penisSize: usePenisCm ? `${Number(penisCm)} cm` : penisSize,
              skinTone,
              hair,
            }
        : {};

      await completeProfileRequest({
        bio,
        tags: isModel ? tags : [],
        avatarUrl: urls[0],
        galleryUrls: isModel ? urls : [urls[0]],
        attributes,
        videoPricePerMin: isModel ? videoPricePerMin : undefined,
        idDocumentUrl: isModel ? idDocumentUrls[0] : undefined,
        idDocumentBackUrl: isModel ? idDocumentBackUrls[0] : undefined,
        markCompleted: true,
      });
      const me = await meRequest();
      setUser(me);
      navigate(isModel ? '/pending-verification' : '/explore', { replace: true });
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
            {isModel ? 'Fotos (1 a 8)' : 'Foto de perfil'}
          </h2>
          <PhotoUploader
            photos={photoUrls}
            onChange={setPhotoUrls}
            max={isModel ? 8 : 1}
            type="GALLERY"
            label={isModel ? 'Agregar foto' : 'Elegir foto'}
          />
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

            <section className="space-y-5">
              <h2 className="font-display text-lg font-semibold">Medidas / atributos</h2>
              {isFemale ? (
                <>
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-400">Tamaño de senos</p>
                    <AttrIconPicker
                      kind="breast"
                      options={FEMALE_BREAST_OPTIONS}
                      value={breastSize}
                      onChange={setBreastSize}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-400">Cadera / glúteos</p>
                    <AttrIconPicker
                      kind="butt"
                      options={FEMALE_BUTT_OPTIONS}
                      value={buttType}
                      onChange={setButtType}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-400">Complexión</p>
                    <AttrIconPicker
                      kind="body"
                      options={MALE_BODY_OPTIONS}
                      value={bodyBuild}
                      onChange={setBodyBuild}
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-zinc-400">Tamaño del miembro</p>
                    <div className="mb-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setUsePenisCm(false)}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          !usePenisCm
                            ? 'border-vibra-pink bg-vibra-pink/20 text-white'
                            : 'border-vibra-border text-zinc-400'
                        }`}
                      >
                        Categoría
                      </button>
                      <button
                        type="button"
                        onClick={() => setUsePenisCm(true)}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          usePenisCm
                            ? 'border-vibra-pink bg-vibra-pink/20 text-white'
                            : 'border-vibra-border text-zinc-400'
                        }`}
                      >
                        En cm
                      </button>
                    </div>
                    {usePenisCm ? (
                      <label className="block text-sm text-zinc-400">
                        Centímetros
                        <input
                          type="number"
                          min={5}
                          max={40}
                          step={0.5}
                          className={`${inputClass} mt-1`}
                          value={penisCm}
                          onChange={(e) => setPenisCm(e.target.value)}
                          placeholder="Ej: 18"
                        />
                      </label>
                    ) : (
                      <AttrIconPicker
                        kind="penis"
                        options={MALE_PENIS_OPTIONS}
                        value={penisSize}
                        onChange={setPenisSize}
                      />
                    )}
                  </div>
                </>
              )}
              <div className="space-y-2">
                <p className="text-sm text-zinc-400">Tono de piel</p>
                <AttrIconPicker options={SKIN_TONE_OPTIONS} value={skinTone} onChange={setSkinTone} kind="skin" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-zinc-400">Cabello</p>
                <AttrIconPicker
                  kind="hair"
                  options={isFemale ? FEMALE_HAIR_OPTIONS : MALE_HAIR_OPTIONS}
                  value={hair}
                  onChange={setHair}
                />
              </div>
            </section>

            <ModelPricingFields
              videoPricePerMin={videoPricePerMin}
              onVideoPricePerMin={setVideoPricePerMin}
            />

            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold">Documento de identidad</h2>
              <p className="text-sm text-zinc-400">
                Fotos claras del frente y el reverso de tu cédula. Solo se usan para verificación.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-zinc-400">Frente</p>
                  <PhotoUploader
                    photos={idDocumentUrls}
                    onChange={setIdDocumentUrls}
                    max={1}
                    type="ID_DOCUMENT"
                    label="Subir frente"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-zinc-400">Reverso</p>
                  <PhotoUploader
                    photos={idDocumentBackUrls}
                    onChange={setIdDocumentBackUrls}
                    max={1}
                    type="ID_DOCUMENT"
                    label="Subir reverso"
                  />
                </div>
              </div>
            </section>
          </>
        ) : null}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-vibra-pink py-3 text-sm font-semibold disabled:opacity-60"
        >
          {loading
            ? isModel
              ? 'Enviando solicitud...'
              : 'Guardando...'
            : isModel
              ? 'Enviar solicitud'
              : 'Terminar registro'}
        </button>
      </form>
    </div>
  );
}
