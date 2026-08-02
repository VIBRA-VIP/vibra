import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import {
  COLOMBIA_PAYOUT_OPTIONS,
  PAYOUT_ACCOUNT_TYPES,
  colombiaBanks,
  colombiaWallets,
} from '@vibra/shared';
import { logoutRequest, meRequest } from '@/features/auth';
import { setUnreadDocumentTitle } from '@/features/chat/chat-notify';
import { disconnectChatSocket } from '@/features/chat/chat-socket';
import { PhotoUploader } from '@/features/media/components/photo-uploader';
import { ModelPricingFields } from '@/features/profiles/components/model-pricing-fields';
import {
  getMyProfile,
  updatePayoutRequest,
  updateSettingsRequest,
} from '@/features/profiles/services/profile-setup-api';
import { useAuthStore } from '@/store';

const inputClass =
  'w-full rounded-xl border border-vibra-border bg-vibra-muted px-4 py-3 text-sm outline-none focus:border-vibra-pink/50';

export function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isModel = user?.role === 'MODEL';
  const [loggingOut, setLoggingOut] = useState(false);

  const [displayName, setDisplayName] = useState(user?.profile?.displayName ?? '');
  const [bio, setBio] = useState(user?.profile?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.profile?.avatarUrl ?? '');
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [videoPricePerMin, setVideoPricePerMin] = useState(user?.profile?.videoPricePerMin ?? 80);
  const [contentPrice, setContentPrice] = useState(user?.profile?.contentPrice ?? 100);
  const [acceptsEncounters, setAcceptsEncounters] = useState(
    user?.profile?.acceptsEncounters ?? false,
  );
  const [payoutBankId, setPayoutBankId] = useState<number>(user?.profile?.payoutBankId ?? 1);
  const [payoutAccountType, setPayoutAccountType] = useState<'AHORROS' | 'CORRIENTE'>(
    (user?.profile?.payoutAccountType as 'AHORROS' | 'CORRIENTE') ?? 'AHORROS',
  );
  const [payoutAccount, setPayoutAccount] = useState(user?.profile?.payoutAccount ?? '');
  const [payoutHolder, setPayoutHolder] = useState(user?.profile?.payoutHolder ?? '');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void getMyProfile()
      .then((profile: Record<string, unknown>) => {
        setDisplayName(String(profile.displayName ?? ''));
        setBio(String(profile.bio ?? ''));
        setAvatarUrl(String(profile.avatarUrl ?? ''));
        const gallery = Array.isArray(profile.gallery)
          ? (profile.gallery as { url?: string }[])
              .map((g) => g.url)
              .filter((u): u is string => Boolean(u))
          : [];
        // Si no hay galería aún, usa el avatar como primera foto visible.
        const photos =
          gallery.length > 0
            ? gallery
            : profile.avatarUrl
              ? [String(profile.avatarUrl)]
              : [];
        setGalleryUrls(photos);
        setVideoPricePerMin(Number(profile.videoPricePerMin ?? 80));
        setContentPrice(Number(profile.contentPrice ?? 100));
        setAcceptsEncounters(Boolean(profile.acceptsEncounters));
        setPayoutBankId(Number(profile.payoutBankId ?? 1));
        setPayoutAccountType(
          (profile.payoutAccountType as 'AHORROS' | 'CORRIENTE') ?? 'AHORROS',
        );
        setPayoutAccount(String(profile.payoutAccount ?? ''));
        setPayoutHolder(String(profile.payoutHolder ?? ''));
      })
      .catch(() => undefined);
  }, []);

  async function saveProfile(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await updateSettingsRequest({
        displayName,
        bio,
        avatarUrl: avatarUrl || undefined,
        galleryUrls: isModel ? galleryUrls : undefined,
        videoPricePerMin: isModel ? videoPricePerMin : undefined,
        contentPrice: isModel ? contentPrice : undefined,
        acceptsEncounters: isModel ? acceptsEncounters : undefined,
      });
      const me = await meRequest();
      setUser(me);
      setMessage('Perfil actualizado');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message ?? 'No se pudo guardar';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      const refreshToken = localStorage.getItem('vibra_refresh_token') ?? undefined;
      await logoutRequest(refreshToken);
    } catch {
      // ignore
    }
    setUnreadDocumentTitle(0);
    disconnectChatSocket();
    clearAuth();
    navigate('/login', { replace: true });
  }

  async function savePayout(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await updatePayoutRequest({
        payoutBankId,
        payoutAccountType,
        payoutAccount,
        payoutHolder,
      });
      const me = await meRequest();
      setUser(me);
      setMessage('Cuenta bancaria guardada');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message ?? 'No se pudo guardar la cuenta';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Configuración</h1>
          <p className="mt-1 text-sm text-zinc-400">
            @{user?.profile?.username} · {user?.role === 'MODEL' ? 'Modelo' : 'Usuario'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void handleLogout()}
          disabled={loggingOut}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300 md:hidden disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" />
          Salir
        </button>
      </div>

      <form
        className="space-y-4 rounded-2xl border border-vibra-border bg-vibra-elevated p-5"
        onSubmit={saveProfile}
      >
        <h2 className="font-display text-lg font-semibold">Perfil</h2>
        <input
          className={inputClass}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Nombre visible"
        />
        {isModel ? (
          <div className="space-y-2">
            <p className="text-sm text-zinc-400">Galería (hasta 8 fotos)</p>
            <PhotoUploader
              photos={galleryUrls}
              onChange={(urls) => {
                setGalleryUrls(urls);
                setAvatarUrl(urls[0] ?? '');
              }}
              max={8}
              type="GALLERY"
              label="Agregar foto"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-zinc-400">Foto de perfil</p>
            <PhotoUploader
              photos={avatarUrl ? [avatarUrl] : []}
              onChange={(urls) => setAvatarUrl(urls[0] ?? '')}
              max={1}
              type="AVATAR"
              label="Elegir foto"
            />
          </div>
        )}
        <textarea
          className={inputClass}
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Sobre mí"
        />

        {isModel ? (
          <ModelPricingFields
            videoPricePerMin={videoPricePerMin}
            contentPrice={contentPrice}
            acceptsEncounters={acceptsEncounters}
            onVideoPricePerMin={setVideoPricePerMin}
            onContentPrice={setContentPrice}
            onAcceptsEncounters={setAcceptsEncounters}
          />
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-vibra-pink px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          Guardar perfil
        </button>
      </form>

      {isModel ? (
        <form
          className="space-y-4 rounded-2xl border border-vibra-border bg-vibra-elevated p-5"
          onSubmit={savePayout}
        >
          <h2 className="font-display text-lg font-semibold">Cuenta bancaria / pagos</h2>
          <p className="text-xs text-zinc-500">Bancos y billeteras de Colombia</p>

          <label className="block text-sm text-zinc-400">
            Entidad
            <select
              className={`${inputClass} mt-1`}
              value={payoutBankId}
              onChange={(e) => setPayoutBankId(Number(e.target.value))}
              required
            >
              <optgroup label="Bancos">
                {colombiaBanks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Billeteras">
                {colombiaWallets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>

          <label className="block text-sm text-zinc-400">
            Tipo de cuenta
            <select
              className={`${inputClass} mt-1`}
              value={payoutAccountType}
              onChange={(e) => setPayoutAccountType(e.target.value as 'AHORROS' | 'CORRIENTE')}
              required
            >
              {PAYOUT_ACCOUNT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <input
            className={inputClass}
            value={payoutHolder}
            onChange={(e) => setPayoutHolder(e.target.value)}
            placeholder="Nombre del titular"
            required
          />
          <input
            className={inputClass}
            value={payoutAccount}
            onChange={(e) => setPayoutAccount(e.target.value)}
            placeholder="Número de cuenta"
            required
          />
          <p className="text-xs text-zinc-500">
            Seleccionado:{' '}
            {COLOMBIA_PAYOUT_OPTIONS.find((b) => b.id === payoutBankId)?.name ?? '—'} ·{' '}
            {payoutAccountType === 'AHORROS' ? 'Ahorros' : 'Corriente'}
          </p>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-vibra-pink px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
          >
            Guardar cuenta
          </button>
        </form>
      ) : null}

      {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="button"
        onClick={() => void handleLogout()}
        disabled={loggingOut}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 md:hidden disabled:opacity-60"
      >
        <LogOut className="h-4 w-4" />
        {loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
      </button>
    </div>
  );
}
