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

export const colombiaBanks = [
  { id: 1, name: 'Bancolombia' },
  { id: 2, name: 'Banco de Bogotá' },
  { id: 3, name: 'Davivienda' },
  { id: 4, name: 'BBVA Colombia' },
  { id: 5, name: 'Banco de Occidente' },
  { id: 6, name: 'Banco Popular' },
  { id: 7, name: 'Banco AV Villas' },
  { id: 8, name: 'Banco Caja Social' },
  { id: 9, name: 'Banco Agrario' },
  { id: 10, name: 'Banco Itaú' },
  { id: 11, name: 'Scotiabank Colpatria' },
  { id: 12, name: 'Banco GNB Sudameris' },
  { id: 13, name: 'Banco Falabella' },
  { id: 14, name: 'Banco Pichincha' },
  { id: 15, name: 'Banco Finandina' },
  { id: 16, name: 'Banco Serfinanza' },
  { id: 17, name: 'Banco Cooperativo Coopcentral' },
  { id: 18, name: 'Bancamía' },
  { id: 19, name: 'Ban100' },
  { id: 20, name: 'Banco Contactar' },
  { id: 21, name: 'Banco Mundo Mujer' },
  { id: 22, name: 'Banco W' },
  { id: 23, name: 'Banco BTG Pactual Colombia' },
  { id: 24, name: 'Lulo Bank' },
  { id: 25, name: 'Nu Colombia' },
] as const;

export const colombiaWallets = [
  { id: 26, name: 'Nequi' },
  { id: 27, name: 'Daviplata' },
  { id: 28, name: 'Dale!' },
  { id: 29, name: 'Ualá' },
  { id: 30, name: 'RappiPay' },
] as const;

export const COLOMBIA_PAYOUT_OPTIONS = [...colombiaBanks, ...colombiaWallets] as const;

export const PAYOUT_ACCOUNT_TYPES = [
  { id: 'AHORROS', label: 'Ahorros' },
  { id: 'CORRIENTE', label: 'Corriente' },
] as const;

export type ColombiaPayoutOptionId = (typeof COLOMBIA_PAYOUT_OPTIONS)[number]['id'];
export type PayoutAccountTypeId = (typeof PAYOUT_ACCOUNT_TYPES)[number]['id'];

export function getPayoutOptionName(id: number | null | undefined): string | null {
  if (id == null) return null;
  return COLOMBIA_PAYOUT_OPTIONS.find((b) => b.id === id)?.name ?? null;
}
