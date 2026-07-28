import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Heart, Video, MessageCircle, Gift } from 'lucide-react';

export function ProfilePage() {
  const { id } = useParams();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative aspect-[4/5] max-h-[70vh] overflow-hidden bg-zinc-800 sm:aspect-[16/9] sm:max-h-[420px] sm:rounded-b-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-600 to-zinc-950" />
        <Link
          to="/explore"
          className="absolute left-4 top-4 rounded-full bg-black/50 p-2 backdrop-blur"
          aria-label="Volver"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <span className="absolute bottom-4 right-4 rounded-full bg-black/60 px-2 py-1 text-xs">
          1/6
        </span>
      </div>

      <div className="space-y-6 px-4 py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">
              Camila <span className="text-vibra-pink">✓</span>
            </h1>
            <p className="mt-1 text-sm text-zinc-400">★ 4.9 (120) · @{id ?? 'camila'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-vibra-border p-3 text-zinc-300"
              aria-label="Seguir"
            >
              <Heart className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-vibra-pink px-4 py-3 text-sm font-semibold"
            >
              <Video className="h-4 w-4" />
              Video llamada
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {['Latina', 'Curvy', 'Coqueta', 'Tatuajes'].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-vibra-border bg-vibra-muted px-3 py-1 text-xs text-zinc-300"
            >
              {tag}
            </span>
          ))}
        </div>

        <section>
          <h2 className="font-display text-lg font-semibold">Sobre mí</h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Hola, soy Camila. Me encanta conversar y conectar de forma auténtica. Reserva un chat o
            una videollamada cuando quieras.
          </p>
        </section>

        <section>
          <h2 className="font-display text-lg font-semibold">Servicios</h2>
          <ul className="mt-3 space-y-2">
            {[
              { name: 'Chat privado', price: '15 créditos/min' },
              { name: 'Video llamada', price: '80 créditos/min' },
              { name: 'Mensaje prioritario', price: '30 créditos' },
              { name: 'Contenido exclusivo', price: 'Desde 100 créditos' },
            ].map((service) => (
              <li
                key={service.name}
                className="flex items-center justify-between rounded-xl border border-vibra-border bg-vibra-elevated px-4 py-3 text-sm"
              >
                <span>{service.name}</span>
                <span className="text-zinc-400">{service.price}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="flex gap-3 pb-8">
          <button
            type="button"
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-vibra-pink py-3 text-sm font-semibold"
          >
            <MessageCircle className="h-4 w-4" />
            Enviar mensaje
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-vibra-pink px-4 py-3 text-sm font-semibold text-vibra-pink"
          >
            <Gift className="h-4 w-4" />
            Regalar
          </button>
        </div>
      </div>
    </div>
  );
}
