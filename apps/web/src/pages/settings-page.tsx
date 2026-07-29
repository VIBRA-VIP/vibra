import { useEffect, useState, type FormEvent } from 'react';
import {
  COLOMBIA_PAYOUT_OPTIONS,
  PAYOUT_ACCOUNT_TYPES,
  colombiaBanks,
  colombiaWallets,
} from '@vibra/shared';
import { meRequest } from '@/features/auth';
import {
  getMyProfile,
  updatePayoutRequest,
  updateSettingsRequest,
} from '@/features/profiles/services/profile-setup-api';
import { useAuthStore } from '@/store';

const inputClass =
  'w-full rounded-xl border border-vibra-border bg-vibra-muted px-4 py-3 text-sm outline-none focus:border-vibra-pink/50';

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const isModel = user?.role === 'MODEL';

  const [displayName, setDisplayName] = useState(user?.profile?.displayName ?? '');
  const [bio, setBio] = useState(user?.profile?.bio ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.profile?.avatarUrl ?? '');
  const [messagePrice, setMessagePrice] = useState(user?.profile?.messagePrice ?? 10);
  const [chatPricePerMin, setChatPricePerMin] = useState(user?.profile?.chatPricePerMin ?? 15);
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
        setMessagePrice(Number(profile.messagePrice ?? 10));
        setChatPricePerMin(Number(profile.chatPricePerMin ?? 15));
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
        messagePrice: isModel ? messagePrice : undefined,
        chatPricePerMin: isModel ? chatPricePerMin : undefined,
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
      <div>
        <h1 className="font-display text-3xl font-bold">Configuración</h1>
        <p className="mt-1 text-sm text-zinc-400">
          @{user?.profile?.username} · {user?.role === 'MODEL' ? 'Modelo' : 'Usuario'}
        </p>
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
        <input
          className={inputClass}
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="URL foto de perfil"
        />
        <textarea
          className={inputClass}
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Sobre mí"
        />

        {isModel ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm text-zinc-400">
              Mensaje
              <input
                type="number"
                className={`${inputClass} mt-1`}
                value={messagePrice}
                onChange={(e) => setMessagePrice(Number(e.target.value))}
              />
            </label>
            <label className="text-sm text-zinc-400">
              Chat / min
              <input
                type="number"
                className={`${inputClass} mt-1`}
                value={chatPricePerMin}
                onChange={(e) => setChatPricePerMin(Number(e.target.value))}
              />
            </label>
            <label className="text-sm text-zinc-400">
              Video / min
              <input
                type="number"
                className={`${inputClass} mt-1`}
                value={videoPricePerMin}
                onChange={(e) => setVideoPricePerMin(Number(e.target.value))}
              />
            </label>
            <label className="text-sm text-zinc-400">
              Contenido
              <input
                type="number"
                className={`${inputClass} mt-1`}
                value={contentPrice}
                onChange={(e) => setContentPrice(Number(e.target.value))}
              />
            </label>
            <label className="col-span-full flex items-center gap-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={acceptsEncounters}
                onChange={(e) => setAcceptsEncounters(e.target.checked)}
              />
              Acepta encuentros
            </label>
          </div>
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
    </div>
  );
}
