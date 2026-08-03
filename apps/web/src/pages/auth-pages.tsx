import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { COUNTRIES, getCountryFlagEmoji, getCountryFlagUrl, getCountryName } from '@vibra/shared';
import { Logo, PasswordField } from '@/components';
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

function homeFor(user: { role?: string; needsOnboarding?: boolean; needsVerification?: boolean }) {
  if (user.needsOnboarding) return '/onboarding';
  if (user.role === 'MODEL' && user.needsVerification) return '/pending-verification';
  return user.role === 'MODEL' ? '/requests' : '/explore';
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (accessToken && user) {
    return <Navigate to={homeFor(user)} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await loginRequest({ email, password });
      setAuth(res.user, res.accessToken, res.refreshToken);
      const fallback = homeFor(res.user);
      if (res.user.needsOnboarding || res.user.needsVerification) {
        navigate(fallback, { replace: true });
        return;
      }
      const from = (location.state as { from?: string } | null)?.from ?? fallback;
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
      <form className="space-y-4" method="post" onSubmit={onSubmit}>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo electrónico"
          className={inputClass}
        />
        <PasswordField
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          autoComplete="current-password"
          inputClassName={inputClass}
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
  const user = useAuthStore((s) => s.user);
  const [role, setRole] = useState<'CLIENT' | 'MODEL'>('CLIENT');
  const [gender, setGender] = useState<'FEMALE' | 'MALE'>('FEMALE');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('CO');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (accessToken && user) {
    return <Navigate to={homeFor(user)} replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!birthDate) {
      setError('Indica tu fecha de nacimiento');
      return;
    }
    if (!country) {
      setError('Indica tu país');
      return;
    }
    if (!acceptedTerms) {
      setError('Debes aceptar términos y confirmar que eres mayor de 18 años');
      return;
    }
    setLoading(true);
    try {
      const res = await registerRequest({
        email,
        password,
        displayName,
        role,
        gender,
        birthDate,
        country,
        acceptedTerms: true,
      });
      setAuth(res.user, res.accessToken, res.refreshToken);
      navigate('/onboarding', { replace: true });
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
    <AuthCard
      title="Crear cuenta"
      subtitle={
        role === 'MODEL'
          ? 'Crea tu cuenta; en el siguiente paso completarás tu perfil y verificación'
          : 'Correo, contraseña, nombre y fecha de nacimiento'
      }
    >
      <form className="space-y-4" method="post" onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { id: 'CLIENT' as const, label: 'Usuario' },
              { id: 'MODEL' as const, label: 'Modelo' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setRole(opt.id)}
              className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                role === opt.id
                  ? 'border-vibra-pink bg-vibra-pink/15 text-white'
                  : 'border-vibra-border text-zinc-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <select
          required
          value={gender}
          onChange={(e) => setGender(e.target.value as 'FEMALE' | 'MALE')}
          className={inputClass}
        >
          <option value="FEMALE">Femenino</option>
          <option value="MALE">Masculino</option>
        </select>

        <input
          type="text"
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Nombre completo"
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
        <PasswordField
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña (mín. 8)"
          autoComplete="new-password"
          inputClassName={inputClass}
        />

        <input
          type="date"
          required
          value={birthDate}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => setBirthDate(e.target.value)}
          aria-label="Fecha de nacimiento"
          className={inputClass}
        />

        <div className="space-y-2">
          <p className="text-sm text-zinc-400">País</p>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-vibra-border bg-vibra-muted">
              {getCountryFlagUrl(country, 80) ? (
                <img
                  src={getCountryFlagUrl(country, 80)!}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl" aria-hidden>
                  {getCountryFlagEmoji(country)}
                </span>
              )}
            </div>
            <select
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              aria-label="País"
              className={inputClass}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {getCountryFlagEmoji(c.code)} {c.name}
                </option>
              ))}
            </select>
          </div>
          <p className="text-xs text-zinc-500">
            {getCountryFlagEmoji(country)} {getCountryName(country)}
          </p>
        </div>

        <label className="flex items-start gap-3 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1"
          />
          <span>Acepto términos y condiciones y confirmo que soy mayor de 18 años.</span>
        </label>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-vibra-pink py-3 text-sm font-semibold transition hover:bg-vibra-pink-hover disabled:opacity-60"
        >
          {loading ? 'Creando cuenta...' : 'Continuar'}
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

