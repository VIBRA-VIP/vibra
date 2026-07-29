export const APP_NAME = 'Vibra';

export function formatCredits(amount: number): string {
  return new Intl.NumberFormat('es-ES').format(amount);
}

export function generateVideoRoomName(id?: string): string {
  const suffix = id ?? Math.floor(Math.random() * 1_000_000).toString();
  return `vibra_${suffix}`;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Fantasy-style username — not derived from real name (privacy). */
const USERNAME_PREFIXES = [
  'luna',
  'nova',
  'rose',
  'kira',
  'axel',
  'mila',
  'zion',
  'nyx',
  'aria',
  'leo',
  'vega',
  'iris',
  'knox',
  'sage',
  'remy',
  'cleo',
  'jade',
  'orin',
  'skyl',
  'valo',
] as const;

const USERNAME_SUFFIXES = [
  'fox',
  'star',
  'bloom',
  'wave',
  'spark',
  'mist',
  'fire',
  'soul',
  'haze',
  'glow',
  'dusk',
  'dawn',
  'moon',
  'rain',
  'wild',
  'soft',
] as const;

export function inventUsername(seed?: string): string {
  const rnd = seed
    ? [...seed].reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    : Math.floor(Math.random() * 10_000);
  const prefix = USERNAME_PREFIXES[rnd % USERNAME_PREFIXES.length];
  const suffix = USERNAME_SUFFIXES[(rnd * 7) % USERNAME_SUFFIXES.length];
  const num = 100 + ((rnd * 13) % 900);
  return `${prefix}${suffix}${num}`.toLowerCase();
}

export const BODY_TAGS = [
  'curvy',
  'morena',
  'blanquita',
  'fitness',
  'delgada',
  'tatuajes',
  'latina',
  'rubia',
  'pelirroja',
  'alta',
  'petite',
  'musculoso',
  'barba',
  'atletico',
] as const;

export const FEMALE_BREAST_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;
export const FEMALE_BUTT_TYPES = ['normal', 'nalgona', 'caderona', 'firmes'] as const;

export const MALE_BODY_BUILDS = ['delgado', 'atletico', 'musculoso', 'normal'] as const;
export const MALE_PENIS_SIZES = ['promedio', 'grande', 'extra_grande'] as const;
export const SKIN_TONES = ['clara', 'media', 'morena', 'oscura'] as const;
export const HAIR_STYLES = [
  'corto',
  'largo',
  'rizado',
  'liso',
  'rapado',
  'con_barba',
  'sin_barba',
] as const;

export const PAYOUT_PROVIDERS = [
  { id: 'NEQUI', label: 'Nequi' },
  { id: 'BANCOLOMBIA', label: 'Bancolombia' },
  { id: 'DAVIVIENDA', label: 'Davivienda' },
  { id: 'BBVA', label: 'BBVA' },
  { id: 'OTRO', label: 'Otro banco' },
] as const;

export type PayoutProviderId = (typeof PAYOUT_PROVIDERS)[number]['id'];
