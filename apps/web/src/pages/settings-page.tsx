import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, LogOut } from 'lucide-react';
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
import { cn } from '@/utils';

const inputClass =
  'w-full rounded-xl border border-vibra-border bg-vibra-muted px-4 py-3 text-sm outline-none focus:border-vibra-pink/50';

function SettingsAccordion({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="max-w-2xl overflow-hidden rounded-2xl border border-vibra-border bg-vibra-elevated">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-white/[0.03]"
      >
        <span className="font-display text-base font-semibold text-white">{title}</span>
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 text-zinc-400 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>
      {open ? <div className="border-t border-vibra-border px-5 py-4">{children}</div> : null}
    </div>
  );
}

export function SettingsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const isModel = user?.role === 'MODEL';
  const [loggingOut, setLoggingOut] = useState(false);

  const [profileOpen, setProfileOpen] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);

  const [bio, setBio] = useState(user?.profile?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.profile?.avatarUrl ?? '');
  const [videoPricePerMin, setVideoPricePerMin] = useState(user?.profile?.videoPricePerMin ?? 80);
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
        setBio(String(profile.bio ?? ''));
        setAvatarUrl(String(profile.avatarUrl ?? ''));
        setVideoPricePerMin(Number(profile.videoPricePerMin ?? 80));
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
        bio,
        avatarUrl: avatarUrl || undefined,
        videoPricePerMin: isModel ? videoPricePerMin : undefined,
      });
      const me = await meRequest();
      setUser(me);
      setMessage('Perfil actualizado');
      setProfileOpen(false);
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
      setPayoutOpen(false);
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
    <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-8 text-left">
      <div className="min-w-0 pb-2 text-left">
        <h1 className="font-display text-2xl font-bold md:text-3xl">Configuración</h1>
        <p className="mt-1 text-sm text-zinc-400">
          @{user?.profile?.username} · {user?.role === 'MODEL' ? 'Modelo' : 'Usuario'}
        </p>
      </div>

      <SettingsAccordion
        title="Ajustar perfil"
        open={profileOpen}
        onToggle={() => {
          setProfileOpen((v) => !v);
          if (!profileOpen) setPayoutOpen(false);
        }}
      >
        <form className="space-y-4" onSubmit={saveProfile}>
          {isModel ? null : (
            <div className="space-y-2">
              <p className="text-center text-sm text-zinc-400">Foto de perfil</p>
              <PhotoUploader
                photos={avatarUrl ? [avatarUrl] : []}
                onChange={(urls) => setAvatarUrl(urls[0] ?? '')}
                max={1}
                type="AVATAR"
                variant="avatar"
                label="Elegir foto"
              />
            </div>
          )}
          <div>
            <p className="mb-1.5 text-sm font-medium text-zinc-300">Sobre mí</p>
            <textarea
              className={inputClass}
              rows={4}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuéntales quién eres..."
            />
          </div>

          {isModel ? (
            <ModelPricingFields
              videoPricePerMin={videoPricePerMin}
              onVideoPricePerMin={setVideoPricePerMin}
            />
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-vibra-pink px-4 py-2.5 text-sm font-semibold disabled:opacity-60 sm:w-auto"
          >
            Guardar perfil
          </button>
        </form>
      </SettingsAccordion>

      {isModel ? (
        <SettingsAccordion
          title="Cuenta bancaria"
          open={payoutOpen}
          onToggle={() => {
            setPayoutOpen((v) => !v);
            if (!payoutOpen) setProfileOpen(false);
          }}
        >
          <form className="space-y-4" onSubmit={savePayout}>
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
              className="w-full rounded-xl bg-vibra-pink px-4 py-2.5 text-sm font-semibold disabled:opacity-60 sm:w-auto"
            >
              Guardar cuenta
            </button>
          </form>
        </SettingsAccordion>
      ) : null}

      {message ? <p className="text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="button"
        onClick={() => void handleLogout()}
        disabled={loggingOut}
        className="flex w-full max-w-2xl items-center justify-center gap-2 rounded-xl border border-red-500/40 bg-red-500/10 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 md:hidden disabled:opacity-60"
      >
        <LogOut className="h-4 w-4" />
        {loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
      </button>
    </div>
  );
}
