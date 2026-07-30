import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store';

export function ProtectedRoute() {
  const location = useLocation();
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s.hydrated);
  const user = useAuthStore((s) => s.user);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vibra-bg text-zinc-400">
        Cargando...
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const onOnboarding = location.pathname.startsWith('/onboarding');
  const onPending = location.pathname.startsWith('/pending-verification');

  if (user?.needsOnboarding && !onOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  if (
    !user?.needsOnboarding &&
    user?.needsVerification &&
    user.role === 'MODEL' &&
    !onPending &&
    !onOnboarding
  ) {
    return <Navigate to="/pending-verification" replace />;
  }

  return <Outlet />;
}
