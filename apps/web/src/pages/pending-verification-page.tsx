import { Navigate } from 'react-router-dom';
import { Logo } from '@/components';
import { useAuthStore } from '@/store';
import { logoutRequest } from '@/features/auth';

export function PendingVerificationPage() {
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

  async function handleLogout() {
    try {
      await logoutRequest(localStorage.getItem('vibra_refresh_token') ?? undefined);
    } catch {
      /* ignore */
    }
    clearAuth();
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
            : 'Tu solicitud se ha enviado. Espera hasta 24 horas y te avisaremos si aprobamos o no tu perfil. Gracias.'}
        </p>
        <p className="mt-4 text-xs text-zinc-500">
          Las modelos deben verificarse antes de aparecer en Explorar y recibir chats.
        </p>
        <button
          type="button"
          onClick={() => {
            void handleLogout();
          }}
          className="mt-8 w-full rounded-xl border border-vibra-border py-3 text-sm font-medium text-zinc-300 transition hover:border-vibra-pink/40 hover:text-white"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
