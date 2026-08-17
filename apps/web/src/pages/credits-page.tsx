import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Coins, Loader2 } from 'lucide-react';
import { formatCop } from '@vibra/shared';
import { meRequest } from '@/features/auth';
import {
  createCreditPurchase,
  listCreditPackages,
  syncCreditPurchase,
  type CreditPackage,
} from '@/features/credits';
import { useAuthStore } from '@/store';
import { cn } from '@/utils';

export function CreditsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const balance = user?.walletBalance ?? 0;

  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [paymentsEnabled, setPaymentsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    if (user?.role === 'MODEL') {
      navigate('/requests', { replace: true });
    }
  }, [user?.role, navigate]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await listCreditPackages();
        if (cancelled) return;
        setPackages(data.packages);
        setPaymentsEnabled(data.paymentsEnabled);
      } catch {
        if (!cancelled) setError('No se pudieron cargar los paquetes.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const purchaseId = searchParams.get('purchase');
    if (!purchaseId) return;

    let cancelled = false;
    (async () => {
      setSyncing(true);
      setError(null);
      try {
        // Poll a few times — PSE/Nequi can take a moment to settle.
        for (let i = 0; i < 5; i++) {
          const purchase = await syncCreditPurchase(purchaseId);
          if (cancelled) return;
          if (purchase.status === 'PAID') {
            const me = await meRequest();
            if (cancelled) return;
            setUser(me);
            setSuccessMsg(`¡Listo! Se acreditaron ${purchase.credits.toLocaleString('es-CO')} créditos.`);
            break;
          }
          if (purchase.status !== 'PENDING') {
            setError(
              purchase.status === 'FAILED'
                ? 'El pago fue rechazado. Puedes intentar de nuevo.'
                : `El pago quedó en estado ${purchase.status}.`,
            );
            break;
          }
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch {
        if (!cancelled) {
          setError(
            'Estamos confirmando tu pago. Si ya pagaste, los créditos aparecerán en unos minutos.',
          );
        }
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, setUser]);

  async function handleBuy(pack: CreditPackage) {
    setError(null);
    setSuccessMsg(null);
    setBuyingId(pack.id);
    try {
      const purchase = await createCreditPurchase(pack.id);
      if (!purchase.paymentUrl) {
        throw new Error('Sin URL de pago');
      }
      window.location.href = purchase.paymentUrl;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message ?? 'No se pudo iniciar el pago.';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
      setBuyingId(null);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <Link
        to="/explore"
        className="mb-6 inline-flex items-center gap-2 text-sm text-zinc-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      <h1 className="font-display text-2xl font-semibold text-white">Comprar créditos</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Los clientes nuevos reciben 50 créditos de bienvenida. Recarga con Bold (tarjeta, PSE,
        Nequi o Bancolombia).
      </p>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-vibra-border bg-vibra-elevated px-4 py-3">
        <Coins className="h-5 w-5 text-vibra-gold" />
        <div>
          <p className="text-xs text-zinc-400">Saldo actual</p>
          <p className="font-display text-lg font-semibold text-vibra-gold">
            {balance.toLocaleString('es-CO')} créditos
          </p>
        </div>
      </div>

      {syncing ? (
        <p className="mt-4 flex items-center gap-2 text-sm text-zinc-300">
          <Loader2 className="h-4 w-4 animate-spin" />
          Confirmando tu pago…
        </p>
      ) : null}

      {successMsg ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          {successMsg}
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {!paymentsEnabled && !loading ? (
        <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
          Los pagos aún no están habilitados en el servidor. Configura la llave de Bold (Link de
          pagos).
        </p>
      ) : null}

      <div className="mt-6 space-y-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-2xl border border-vibra-border bg-vibra-muted"
              />
            ))
          : packages.map((pack) => {
              const busy = buyingId === pack.id;
              const starter = pack.credits === 30;
              return (
                <button
                  key={pack.id}
                  type="button"
                  disabled={!paymentsEnabled || buyingId != null}
                  onClick={() => void handleBuy(pack)}
                  className={cn(
                    'flex w-full items-center justify-between gap-4 rounded-2xl border bg-vibra-elevated px-5 py-4 text-left transition',
                    starter ? 'border-vibra-gold/40' : 'border-vibra-border',
                    paymentsEnabled && buyingId == null
                      ? 'hover:border-vibra-pink/50 hover:bg-white/[0.03]'
                      : 'opacity-60',
                  )}
                >
                  <div>
                    {starter ? (
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-vibra-gold">
                        Más asequible
                      </p>
                    ) : null}
                    <p className="font-display text-lg font-semibold text-white">
                      {pack.credits.toLocaleString('es-CO')} créditos
                    </p>
                    <p className="mt-0.5 text-sm text-zinc-400">{formatCop(pack.amountCop)}</p>
                  </div>
                  <span className="rounded-lg bg-vibra-pink px-3 py-2 text-sm font-semibold text-white">
                    {busy ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Abriendo…
                      </span>
                    ) : (
                      'Pagar'
                    )}
                  </span>
                </button>
              );
            })}
      </div>

      <p className="mt-6 text-xs leading-relaxed text-zinc-500">
        Serás redirigido al checkout seguro de Bold. Al terminar, vuelve a Vibra y tus créditos se
        acreditarán automáticamente.
      </p>
    </div>
  );
}
