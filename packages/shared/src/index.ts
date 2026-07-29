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

export const FEMALE_BODY_TAGS = [
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
] as const;

export const MALE_BODY_TAGS = [
  'musculoso',
  'atletico',
  'fitness',
  'delgado',
  'tatuajes',
  'barba',
  'latino',
  'moreno',
  'rubio',
  'pelirrojo',
  'alto',
  'velludo',
] as const;

/** @deprecated Prefer FEMALE_BODY_TAGS / MALE_BODY_TAGS */
export const BODY_TAGS = [...FEMALE_BODY_TAGS, ...MALE_BODY_TAGS] as const;

export type AttrOption = {
  id: string;
  label: string;
  emoji: string;
};

export const FEMALE_BREAST_OPTIONS: readonly AttrOption[] = [
  { id: 'pequenos', label: 'Pequeños', emoji: '🌱' },
  { id: 'medianos', label: 'Medianos', emoji: '🍈' },
  { id: 'grandes', label: 'Grandes', emoji: '🍈🍈' },
  { id: 'tetona', label: 'Tetona', emoji: '🍈🍈🍈' },
] as const;

export const FEMALE_BUTT_OPTIONS: readonly AttrOption[] = [
  { id: 'plana', label: 'Plana', emoji: '✨' },
  { id: 'normal', label: 'Normal', emoji: '🍑' },
  { id: 'nalgona', label: 'Nalgona', emoji: '🍑🍑' },
  { id: 'muy_nalgona', label: 'Muy nalgona', emoji: '🍑🍑🍑' },
] as const;

export const MALE_BODY_OPTIONS: readonly AttrOption[] = [
  { id: 'flaco', label: 'Flaco', emoji: '🦴' },
  { id: 'delgado', label: 'Delgado', emoji: '🧍' },
  { id: 'normal', label: 'Normal', emoji: '🙂' },
  { id: 'atletico', label: 'Atlético', emoji: '🏃' },
  { id: 'musculoso', label: 'Musculoso', emoji: '💪' },
] as const;

export const MALE_PENIS_OPTIONS: readonly AttrOption[] = [
  { id: 'pequeno', label: 'Pequeño', emoji: '🔸' },
  { id: 'mediano', label: 'Mediano', emoji: '🔶' },
  { id: 'grande', label: 'Grande', emoji: '🔥' },
  { id: 'extra_grande', label: 'Extra grande', emoji: '💥' },
] as const;

export const SKIN_TONE_OPTIONS: readonly AttrOption[] = [
  { id: 'clara', label: 'Clara', emoji: '🏻' },
  { id: 'media', label: 'Media', emoji: '🏼' },
  { id: 'morena', label: 'Morena', emoji: '🏽' },
  { id: 'oscura', label: 'Oscura', emoji: '🏿' },
] as const;

export const FEMALE_HAIR_OPTIONS: readonly AttrOption[] = [
  { id: 'corto', label: 'Corto', emoji: '✂️' },
  { id: 'medio', label: 'Medio', emoji: '💇' },
  { id: 'largo', label: 'Largo', emoji: '👩‍🦱' },
  { id: 'liso', label: 'Liso', emoji: '✨' },
  { id: 'rizado', label: 'Rizado', emoji: '🌀' },
  { id: 'ondulado', label: 'Ondulado', emoji: '🌊' },
] as const;

export const MALE_HAIR_OPTIONS: readonly AttrOption[] = [
  { id: 'rapado', label: 'Rapado', emoji: '🪒' },
  { id: 'corto', label: 'Corto', emoji: '✂️' },
  { id: 'medio', label: 'Medio', emoji: '💇‍♂️' },
  { id: 'largo', label: 'Largo', emoji: '🧑‍🦱' },
  { id: 'liso', label: 'Liso', emoji: '✨' },
  { id: 'rizado', label: 'Rizado', emoji: '🌀' },
  { id: 'con_barba', label: 'Con barba', emoji: '🧔' },
  { id: 'sin_barba', label: 'Sin barba', emoji: '😊' },
] as const;

/** @deprecated use FEMALE_BREAST_OPTIONS */
export const FEMALE_BREAST_SIZES = FEMALE_BREAST_OPTIONS.map((o) => o.id);
/** @deprecated use FEMALE_BUTT_OPTIONS */
export const FEMALE_BUTT_TYPES = FEMALE_BUTT_OPTIONS.map((o) => o.id);
/** @deprecated use MALE_BODY_OPTIONS */
export const MALE_BODY_BUILDS = MALE_BODY_OPTIONS.map((o) => o.id);
/** @deprecated use MALE_PENIS_OPTIONS */
export const MALE_PENIS_SIZES = MALE_PENIS_OPTIONS.map((o) => o.id);
/** @deprecated use SKIN_TONE_OPTIONS */
export const SKIN_TONES = SKIN_TONE_OPTIONS.map((o) => o.id);
/** @deprecated use FEMALE_HAIR_OPTIONS / MALE_HAIR_OPTIONS */
export const HAIR_STYLES = [
  ...new Set([...FEMALE_HAIR_OPTIONS, ...MALE_HAIR_OPTIONS].map((o) => o.id)),
] as string[];

const ATTR_LOOKUPS: Record<string, readonly AttrOption[]> = {
  breastSize: FEMALE_BREAST_OPTIONS,
  buttType: FEMALE_BUTT_OPTIONS,
  bodyBuild: MALE_BODY_OPTIONS,
  penisSize: MALE_PENIS_OPTIONS,
  skinTone: SKIN_TONE_OPTIONS,
  hair: [...FEMALE_HAIR_OPTIONS, ...MALE_HAIR_OPTIONS],
};

export function formatAttrValue(key: string, raw: string): string {
  if (/^\d+(\.\d+)?\s*cm$/i.test(raw.trim())) return raw.trim();
  const opt = ATTR_LOOKUPS[key]?.find((o) => o.id === raw);
  return opt ? `${opt.emoji} ${opt.label}` : raw;
}

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
