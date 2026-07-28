import { NavLink, Outlet } from 'react-router-dom';
import { AppVersion, Logo } from '@/components';

export function MarketingLayout() {
  return (
    <div className="relative min-h-screen bg-vibra-bg text-white">
      <header className="sticky top-0 z-40 border-b border-vibra-border/60 bg-vibra-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-3">
            <NavLink to="/login" className="hidden text-sm text-zinc-300 hover:text-white sm:inline">
              Iniciar sesión
            </NavLink>
            <NavLink
              to="/register"
              className="rounded-lg bg-vibra-pink px-4 py-2 text-sm font-semibold text-white transition hover:bg-vibra-pink-hover"
            >
              Registrarse
            </NavLink>
          </div>
        </div>
      </header>
      <Outlet />
      <AppVersion className="pointer-events-none absolute bottom-3 right-4 z-30" />
    </div>
  );
}
