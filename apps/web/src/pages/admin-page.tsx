export function AdminPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold">Administración</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Dashboard sencillo — se implementará en la fase administrativa.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['Usuarios', 'Modelos', 'Reportes', 'Créditos'].map((item) => (
          <div
            key={item}
            className="rounded-2xl border border-vibra-border bg-vibra-elevated p-5"
          >
            <p className="text-sm text-zinc-400">{item}</p>
            <p className="mt-2 font-display text-2xl font-bold">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
