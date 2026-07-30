import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '@/components';
import { loginRequest, meRequest, registerRequest } from '@/features/auth';
import { mediaSrc, uploadMediaFile } from '@/features/media/services/media-api';
import { setIdDocumentRequest } from '@/features/profiles/services/profile-setup-api';
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
  const setUser = useAuthStore((s) => s.setUser);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const [role, setRole] = useState<'CLIENT' | 'MODEL'>('CLIENT');
  const [gender, setGender] = useState<'FEMALE' | 'MALE'>('FEMALE');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [idPreview, setIdPreview] = useState<string | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (accessToken && user) {
    return <Navigate to={homeFor(user)} replace />;
  }

  function onIdPicked(file: File | null) {
    if (idPreview) URL.revokeObjectURL(idPreview);
    if (!file) {
      setIdFile(null);
      setIdPreview(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('El documento debe ser una imagen');
      return;
    }
    setError(null);
    setIdFile(file);
    setIdPreview(URL.createObjectURL(file));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!acceptedTerms) {
      setError('Debes aceptar términos y confirmar que eres mayor de 18 años');
      return;
    }
    if (role === 'MODEL' && !idFile) {
      setError('Sube una foto de tu documento de identidad');
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
        acceptedTerms: true,
      });
      setAuth(res.user, res.accessToken, res.refreshToken);

      if (role === 'MODEL' && idFile) {
        const uploaded = await uploadMediaFile(idFile, 'ID_DOCUMENT');
        await setIdDocumentRequest(uploaded.url);
        const me = await meRequest();
        setUser(me);
      }

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
          ? 'Las modelos deben verificarse con documento de identidad'
          : 'Solo correo, contraseña y tu nombre'
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
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña (mín. 8)"
          className={inputClass}
        />

        {role === 'MODEL' ? (
          <div className="space-y-2 rounded-xl border border-vibra-border bg-vibra-muted/40 p-3">
            <p className="text-sm font-medium text-zinc-200">Documento de identidad</p>
            <p className="text-xs text-zinc-500">
              Foto clara de tu cédula o documento (frente). Solo se usa para verificación.
            </p>
            {idPreview ? (
              <div className="relative overflow-hidden rounded-lg border border-vibra-border">
                <img
                  src={mediaSrc(idPreview)}
                  alt="Documento"
                  className="max-h-40 w-full object-contain bg-black/40"
                />
                <button
                  type="button"
                  onClick={() => onIdPicked(null)}
                  className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-0.5 text-xs"
                >
                  Quitar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => idInputRef.current?.click()}
                className="w-full rounded-xl border border-dashed border-vibra-border py-6 text-sm text-zinc-400 transition hover:border-vibra-pink/50 hover:text-white"
              >
                Subir foto del documento
              </button>
            )}
            <input
              ref={idInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => onIdPicked(e.target.files?.[0] ?? null)}
            />
          </div>
        ) : null}

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
          {loading
            ? role === 'MODEL'
              ? 'Enviando solicitud...'
              : 'Creando cuenta...'
            : role === 'MODEL'
              ? 'Enviar solicitud'
              : 'Registrarse'}
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
