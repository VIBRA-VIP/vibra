import { Navigate, useNavigate } from 'react-router-dom';
import { Logo } from '@/components';
import { useAuthStore } from '@/store';
import { logoutRequest } from '@/features/auth';

export function PendingVerificationPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  if (!accessToken) return <Navigate to="/login" replace />;
  if (user?.role !== 'MODEL') {
    return <Navigate to="/explore" replace />;
  }
  if (user.needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  if (!user.needsVerification) {
    return <Navigate to="/requests" replace />;
  }

  const rejected = user.verificationStatus === 'REJECTED';
  const email = user.email;

  async function handleAccept() {
    try {
      await logoutRequest(localStorage.getItem('vibra_refresh_token') ?? undefined);
    } catch {
      /* ignore */
    }
    clearAuth();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-vibra-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-vibra-border bg-vibra-elevated p-8 text-center">
        <Logo className="mb-8 justify-center" />
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-vibra-pink/15 text-3xl">
          {rejected ? '!' : '✓'}
        </div>
        <h1 className="font-display text-2xl font-bold">
          {rejected ? 'Solicitud no aprobada' : 'Solicitud enviada'}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
          {rejected
            ? 'Tu perfil no fue aprobado. Si crees que es un error, escribe a soporte con tu correo de registro.'
            : `Tu solicitud se ha enviado. Debes estar pendiente a tu correo${
                email ? ` (${email})` : ''
              }: ahí te avisaremos si tu perfil fue verificado. Puede tomar hasta 24 horas. Gracias.`}
        </p>
        <p className="mt-4 text-xs text-zinc-500">
          Las modelos deben verificarse antes de aparecer en Explorar y recibir chats.
        </p>
        <button
          type="button"
          onClick={() => {
            void handleAccept();
          }}
          className="mt-8 w-full rounded-xl bg-vibra-pink py-3 text-sm font-semibold transition hover:bg-vibra-pink-hover"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
}
