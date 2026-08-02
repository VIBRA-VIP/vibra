/** Public display: keep first 3 chars, hide the rest (e.g. Juanita → Jua***). */
export function maskDisplayName(name: string): string {
  const clean = name.trim();
  if (!clean) return '***';
  const visible = clean.slice(0, Math.min(3, clean.length));
  return `${visible}***`;
}
