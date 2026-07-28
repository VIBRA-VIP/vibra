import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '@/components';
import { loginRequest, registerRequest } from '@/features/auth';
import { useAuthStore } from '@/store';

function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-vibra-bg px-4">
      <div className="w-full max-w-md rounded-2xl border border-vibra-border bg-vibra-elevated p-8">
        <Logo className="mb-8 justify-center" />
        <h1 className="font-display text-center text-2xl font-bold">{title}</h1>
        <p className="mt-2 text-center text-sm text-zinc-400">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}

const inputClass =
  'w-full rounded-xl border border-vibra-border bg-vibra-muted px-4 py-3 text-sm outline-none focus:border-vibra-pink/50';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (accessToken) {
    return <Navigate to="/explore" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await loginRequest({ email, password });
      setAuth(res.user, res.accessToken, res.refreshToken);
      const from = (location.state as { from?: string } | null)?.from ?? '/explore';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message ?? 'No se pudo iniciar sesión';
      setError(Array.isArray(message) ? message.join(', ') : String(message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Iniciar sesión" subtitle="Accede a tu cuenta Vibra">
      <form className="space-y-4" onSubmit={onSubmit}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo electrónico"
          className={inputClass}
        />
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          className={inputClass}
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-vibra-pink py-3 text-sm font-semibold transition hover:bg-vibra-pink-hover disabled:opacity-60"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-400">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="text-vibra-pink hover:underline">
          Regístrate
        </Link>
      </p>
    </AuthCard>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (accessToken) {
    return <Navigate to="/explore" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await registerRequest({
        email,
        password,
        username,
        displayName: displayName || username,
      });
      setAuth(res.user, res.accessToken, res.refreshToken);
      navigate('/explore', { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data
          ?.message ?? 'No se pudo registrar';
      setError(Array.isArray(message) ? message.join(', ') : String(message));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Crear cuenta" subtitle="Únete a Vibra en segundos">
      <form className="space-y-4" onSubmit={onSubmit}>
        <input
          type="text"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Nombre"
          className={inputClass}
        />
        <input
          type="text"
          required
          pattern="[a-zA-Z0-9_]+"
          minLength={3}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Usuario"
          className={inputClass}
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo electrónico"
          className={inputClass}
        />
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña (mín. 8)"
          className={inputClass}
        />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-vibra-pink py-3 text-sm font-semibold transition hover:bg-vibra-pink-hover disabled:opacity-60"
        >
          {loading ? 'Creando cuenta...' : 'Registrarse'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-zinc-400">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="text-vibra-pink hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthCard>
  );
}
