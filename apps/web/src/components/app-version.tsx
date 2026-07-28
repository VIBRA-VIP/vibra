export function AppVersion({ className = '' }: { className?: string }) {
  const version = import.meta.env.VITE_APP_VERSION;

  if (!version) return null;

  return (
    <p
      className={`select-none font-mono text-[10px] tracking-wide text-zinc-600 ${className}`}
      title={`Vibra web ${version}`}
    >
      v{version}
    </p>
  );
}
