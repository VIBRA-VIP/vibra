import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Banknote, Coins } from 'lucide-react';
import { formatCop } from '@vibra/shared';
import { meRequest } from '@/features/auth';
import {
  createPayoutRequest,
  fetchPayoutHistory,
  fetchPayoutSummary,
  type PayoutRequestDto,
} from '@/features/payouts/services/payouts-api';
import { useAuthStore } from '@/store';
import { cn } from '@/utils';

function statusLabel(status: PayoutRequestDto['status']) {
  switch (status) {
    case 'PENDING':
      return 'Pendiente';
    case 'PROCESSING':
      return 'En proceso';
    case 'PAID':
      return 'Pagado';
    case 'REJECTED':
      return 'Rechazado';
    case 'CANCELLED':
      return 'Cancelado';
    default:
      return status;
  }
}

function statusClass(status: PayoutRequestDto['status']) {
  switch (status) {
    case 'PAID':
      return 'text-vibra-online';
    case 'PENDING':
    case 'PROCESSING':
      return 'text-vibra-gold';
    case 'REJECTED':
    case 'CANCELLED':
      return 'text-red-400';
    default:
      return 'text-zinc-400';
  }
}

export function EarningsPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [creditsInput, setCreditsInput] = useState<string>('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const summaryQuery = useQuery({
    queryKey: ['payouts', 'summary'],
    queryFn: fetchPayoutSummary,
    enabled: user?.role === 'MODEL',
  });

  const historyQuery = useQuery({
    queryKey: ['payouts', 'history'],
    queryFn: fetchPayoutHistory,
    enabled: user?.role === 'MODEL',
  });

  const summary = summaryQuery.data;
  const balance = summary?.balance ?? user?.walletBalance ?? 0;

  const selectedCredits = useMemo(() => {
    const n = Math.floor(Number(creditsInput));
    if (!Number.isFinite(n) || n <= 0) return balance;
    return Math.min(n, balance);
  }, [creditsInput, balance]);

  const preview = useMemo(() => {
    const feeRate = summary?.feeRate ?? 0.15;
    const gross = selectedCredits;
    const feeCredits = Math.round(gross * feeRate);
    const netCredits = Math.max(0, gross - feeCredits);
    const creditValueCop = summary?.creditValueCop ?? 1500;
    return {
      creditsGross: gross,
      feeCredits,
      netCredits,
      amountCop: Math.round(netCredits * creditValueCop),
      feeCop: Math.round(feeCredits * creditValueCop),
    };
  }, [selectedCredits, summary]);

  const createMutation = useMutation({
    mutationFn: () => createPayoutRequest(preview.creditsGross),
    onSuccess: async () => {
      setConfirmOpen(false);
      setCreditsInput('');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['payouts'] }),
        meRequest().then(setUser).catch(() => undefined),
      ]);
    },
  });

  if (user?.role !== 'MODEL') {
    return <Navigate to="/explore" replace />;
  }

  const minCredits = summary?.minCredits ?? 50;
  const canRequest =
    Boolean(summary?.hasPayoutAccount) &&
    !summary?.pendingRequest &&
    preview.creditsGross >= minCredits &&
    preview.creditsGross <= balance;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-6 text-left">
      <Link
        to="/requests"
        className="mb-4 inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </Link>

      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold md:text-3xl">Mis ganancias</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Solicita retiro · comisión plataforma 15%
          </p>
        </div>
        <div className="rounded-2xl border border-vibra-gold/30 bg-vibra-gold/10 px-4 py-3 text-right">
          <p className="text-[11px] uppercase tracking-wide text-zinc-400">Disponible</p>
          <p className="font-display text-2xl font-bold text-vibra-gold">
            {balance.toLocaleString('es-ES')}{' '}
            <span className="text-xs font-medium text-zinc-400">créd</span>
          </p>
        </div>
      </div>

      {summaryQuery.isLoading ? (
        <p className="text-sm text-zinc-400">Cargando…</p>
      ) : null}

      {!summary?.hasPayoutAccount ? (
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
          Configura tu cuenta bancaria en{' '}
          <Link to="/settings" className="font-semibold underline">
            Ajustes
          </Link>{' '}
          antes de solicitar un retiro.
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-white/10 bg-vibra-elevated p-4 text-sm text-zinc-300">
          <p className="flex items-center gap-2 font-medium text-white">
            <Banknote className="h-4 w-4 text-vibra-pink" />
            Cuenta de cobro
          </p>
          <p className="mt-2">
            {summary.payoutAccount?.bankName} ·{' '}
            {summary.payoutAccount?.accountType === 'AHORROS' ? 'Ahorros' : 'Corriente'}
          </p>
          <p className="text-zinc-400">
            {summary.payoutAccount?.holder} · {summary.payoutAccount?.account}
          </p>
        </div>
      )}

      {summary?.pendingRequest ? (
        <div className="mb-6 rounded-2xl border border-vibra-gold/40 bg-vibra-gold/10 p-4">
          <p className="text-sm font-semibold text-vibra-gold">Retiro en curso</p>
          <p className="mt-1 text-sm text-zinc-300">
            {summary.pendingRequest.netCredits} créd netos (
            {formatCop(summary.pendingRequest.amountCop)}) · estado:{' '}
            {statusLabel(summary.pendingRequest.status)}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            No puedes solicitar otro hasta que este se pague o rechace.
          </p>
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-white/10 bg-vibra-elevated p-4">
          <label className="text-sm font-medium text-white" htmlFor="payout-credits">
            ¿Cuántos créditos retirar?
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="payout-credits"
              type="number"
              min={minCredits}
              max={balance}
              placeholder={String(balance || minCredits)}
              value={creditsInput}
              onChange={(e) => setCreditsInput(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-vibra-pink/50"
            />
            <button
              type="button"
              onClick={() => setCreditsInput(String(balance))}
              className="rounded-xl border border-white/10 px-3 text-xs font-semibold text-zinc-300 hover:bg-white/5"
            >
              Todo
            </button>
          </div>
          <p className="mt-2 text-xs text-zinc-500">Mínimo {minCredits} créditos</p>

          <dl className="mt-4 space-y-2 rounded-xl border border-white/5 bg-black/20 p-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-400">Solicitas</dt>
              <dd className="font-semibold">{preview.creditsGross} créd</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-zinc-400">Comisión plataforma (15%)</dt>
              <dd className="text-red-300">
                −{preview.feeCredits} créd ({formatCop(preview.feeCop)})
              </dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-white/10 pt-2">
              <dt className="text-zinc-200">Recibirás</dt>
              <dd className="font-display text-lg font-bold text-vibra-gold">
                {preview.netCredits} créd · {formatCop(preview.amountCop)}
              </dd>
            </div>
          </dl>

          <button
            type="button"
            disabled={!canRequest}
            onClick={() => setConfirmOpen(true)}
            className="mt-4 w-full rounded-xl bg-vibra-pink py-3 text-sm font-semibold text-white transition hover:bg-vibra-pink-hover disabled:opacity-40"
          >
            Solicitar retiro
          </button>
        </div>
      )}

      <section>
        <h2 className="mb-3 font-display text-sm font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Historial de retiros
        </h2>
        {historyQuery.isLoading ? (
          <p className="text-sm text-zinc-400">Cargando historial…</p>
        ) : (historyQuery.data ?? []).length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-zinc-500">
            Aún no has solicitado retiros
          </div>
        ) : (
          <ul className="space-y-2">
            {(historyQuery.data ?? []).map((row) => (
              <li
                key={row.id}
                className="rounded-2xl border border-white/10 bg-vibra-elevated px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">
                      {row.netCredits} créd · {formatCop(row.amountCop)}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      Bruto {row.creditsGross} − comisión {row.feeCredits} · {row.bankName}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-500">
                      Solicitado{' '}
                      {new Date(row.createdAt).toLocaleDateString('es-CO')}
                      {row.paidAt
                        ? ` · pagado ${new Date(row.paidAt).toLocaleDateString('es-CO')}`
                        : ''}
                    </p>
                  </div>
                  <span className={cn('shrink-0 text-xs font-semibold', statusClass(row.status))}>
                    {statusLabel(row.status)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
          onClick={() => !createMutation.isPending && setConfirmOpen(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-t-3xl border border-white/10 bg-vibra-elevated p-5 sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Confirmar retiro"
          >
            <div className="mb-3 flex items-center gap-2 text-vibra-gold">
              <Coins className="h-5 w-5" />
              <h3 className="font-display text-lg font-bold text-white">Confirmar retiro</h3>
            </div>
            <p className="text-sm text-zinc-300">
              Se descontarán <strong>{preview.creditsGross} créditos</strong> de tu saldo. La
              plataforma retiene el <strong>15%</strong> ({preview.feeCredits} créd). Recibirás{' '}
              <strong className="text-vibra-gold">
                {preview.netCredits} créd ≈ {formatCop(preview.amountCop)}
              </strong>{' '}
              cuando se procese el pago.
            </p>

            {createMutation.isError ? (
              <p className="mt-3 text-sm text-red-400">
                {(createMutation.error as { response?: { data?: { message?: string } } })?.response
                  ?.data?.message ?? 'No se pudo crear el retiro'}
              </p>
            ) : null}

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                disabled={createMutation.isPending}
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm font-semibold text-zinc-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={createMutation.isPending}
                onClick={() => createMutation.mutate()}
                className="flex-1 rounded-xl bg-vibra-pink py-3 text-sm font-semibold text-white hover:bg-vibra-pink-hover disabled:opacity-50"
              >
                {createMutation.isPending ? 'Enviando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
