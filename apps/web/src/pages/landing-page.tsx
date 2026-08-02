import { Link } from 'react-router-dom';
import { Check, Play, Shield, MessageCircle, Video, CreditCard } from 'lucide-react';
import { VerifiedBadge } from '@/components/verified-badge';

const features = [
  {
    icon: Video,
    title: 'Videollamadas en vivo',
    description: 'Conecta cara a cara con modelos verificadas en tiempo real.',
  },
  {
    icon: MessageCircle,
    title: 'Chats privados',
    description: 'Conversaciones discretas con mensajes, fotos y emojis.',
  },
  {
    icon: CreditCard,
    title: 'Sistema de créditos',
    description: 'Paga solo por lo que usas con paquetes flexibles.',
  },
  {
    icon: Shield,
    title: 'Seguro y discreto',
    description: 'Privacidad primero: tu identidad y datos están protegidos.',
  },
];

const stats = [
  { value: '10K+', label: 'Modelos activas' },
  { value: '50K+', label: 'Videollamadas diarias' },
  { value: '100K+', label: 'Mensajes enviados' },
  { value: '100%', label: 'Privacidad garantizada' },
];

export function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,20,147,0.18),_transparent_55%)]" />
        <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-vibra-pink/30 bg-vibra-pink/10 px-3 py-1 text-xs font-semibold tracking-wide text-vibra-pink">
              PLATAFORMA PREMIUM
            </div>
            <h1 className="font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Conecta en vivo. Chats y videollamadas con{' '}
              <span className="text-vibra-pink">modelos increíbles.</span>
            </h1>
            <p className="mt-5 max-w-xl text-base text-zinc-400 sm:text-lg">
              Descubre perfiles verificados, chatea en privado y lanza videollamadas seguras con
              créditos. Experiencia premium, 100% discreta.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="rounded-lg bg-vibra-pink px-6 py-3 text-sm font-semibold transition hover:bg-vibra-pink-hover"
              >
                Únete gratis →
              </Link>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2 rounded-lg border border-vibra-border px-6 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500"
              >
                <Play className="h-4 w-4" />
                Ver cómo funciona
              </a>
            </div>
            <ul className="mt-8 flex flex-wrap gap-4 text-sm text-zinc-300">
              {['Registro rápido', '100% discreto', 'Seguro y privado'].map((item) => (
                <li key={item} className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-vibra-pink" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-vibra-border bg-vibra-elevated/80 p-5 shadow-2xl shadow-black/40">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Modelos en línea</h2>
              <span className="flex items-center gap-1.5 text-xs text-vibra-online">
                <span className="h-2 w-2 rounded-full bg-vibra-online" />
                En vivo
              </span>
            </div>
            <ul className="space-y-3">
              {[
                { name: 'Camila', service: 'Videollamada', price: '80 créditos/min' },
                { name: 'Valentina', service: 'Chat privado', price: '15 créditos/min' },
                { name: 'Isabella', service: 'Videollamada', price: '90 créditos/min' },
                { name: 'Daniela', service: 'Chat privado', price: '20 créditos/min' },
              ].map((model) => (
                <li
                  key={model.name}
                  className="flex items-center gap-3 rounded-xl border border-vibra-border/80 bg-vibra-muted/60 px-3 py-3"
                >
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-vibra-pink/40 to-zinc-700" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {model.name}{' '}
                      <VerifiedBadge className="ml-0.5 inline h-3.5 w-3.5" label="verificado" />
                    </p>
                    <p className="truncate text-xs text-zinc-400">
                      {model.service} · {model.price}
                    </p>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-vibra-online" />
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className="mt-4 block w-full rounded-lg border border-vibra-pink/40 py-2.5 text-center text-sm font-semibold text-vibra-pink transition hover:bg-vibra-pink/10"
            >
              Ver todas las modelos
            </Link>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="border-t border-vibra-border/60 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-vibra-border bg-vibra-elevated p-5">
              <feature.icon className="mb-4 h-6 w-6 text-vibra-pink" />
              <h3 className="font-display text-base font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="seguridad" className="border-t border-vibra-border/60 py-16">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Miles de modelos te están esperando
            </h2>
            <p className="mt-4 text-zinc-400">
              Explora perfiles verificados, filtra por disponibilidad y empieza a conversar en
              segundos.
            </p>
            <Link
              to="/register"
              className="mt-6 inline-flex rounded-lg border border-vibra-pink px-5 py-2.5 text-sm font-semibold text-vibra-pink transition hover:bg-vibra-pink/10"
            >
              Explorar modelos
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-vibra-border bg-vibra-elevated p-5"
              >
                <p className="font-display text-3xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-zinc-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
