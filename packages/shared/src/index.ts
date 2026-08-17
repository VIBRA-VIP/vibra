export const APP_NAME = 'Vibra';

export function formatCredits(amount: number): string {
  return new Intl.NumberFormat('es-ES').format(amount);
}

export function generateVideoRoomName(id?: string): string {
  const suffix = id ?? Math.floor(Math.random() * 1_000_000).toString();
  return `vibra_${suffix}`;
}

/** Minimum prepaid block for video calls (credits charged = pricePerMin × this). */
export const MIN_VIDEO_CALL_MINUTES = 3;

export function videoCallPrepaidCredits(pricePerMin: number): number {
  const price = Number.isFinite(pricePerMin) ? Math.max(1, Math.round(pricePerMin)) : 1;
  return price * MIN_VIDEO_CALL_MINUTES;
}

/** Extra minute blocks a client can add to a call that is about to end. */
export const VIDEO_CALL_EXTEND_OPTIONS = [3, 5, 10] as const;

/** Seconds left at which the client is offered to keep the call going. */
export const VIDEO_CALL_EXTEND_WINDOW_SECONDS = 60;

export function videoCallExtendCredits(pricePerMin: number, minutes: number): number {
  const price = Number.isFinite(pricePerMin) ? Math.max(1, Math.round(pricePerMin)) : 1;
  const mins = Number.isFinite(minutes) ? Math.max(1, Math.round(minutes)) : 1;
  return price * mins;
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
  return opt ? opt.label : raw;
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

/** 1 crédito ≈ este valor en pesos colombianos (referencia para modelos y usuarios). */
export const CREDIT_VALUE_COP = 1500;

export function creditsToCop(credits: number): number {
  const n = Number.isFinite(credits) ? Math.max(0, credits) : 0;
  return Math.round(n * CREDIT_VALUE_COP);
}

/** Platform fee on model payouts (15%). */
export const PLATFORM_PAYOUT_FEE_RATE = 0.15;

/** Minimum credits a model can withdraw in one request. */
export const MIN_PAYOUT_CREDITS = 50;

export function calcPayoutBreakdown(credits: number) {
  const gross = Math.max(0, Math.floor(Number(credits) || 0));
  const feeCredits = Math.round(gross * PLATFORM_PAYOUT_FEE_RATE);
  const netCredits = Math.max(0, gross - feeCredits);
  return {
    creditsGross: gross,
    feeCredits,
    netCredits,
    feeRate: PLATFORM_PAYOUT_FEE_RATE,
    amountCop: creditsToCop(netCredits),
    feeCop: creditsToCop(feeCredits),
  };
}

export function formatCop(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCreditsCopHint(credits: number): string {
  return `≈ ${formatCop(creditsToCop(credits))}`;
}

export function maxVideoPricePerMin(followersCount: number): number {
  const n = Number.isFinite(followersCount) ? Math.max(0, Math.floor(followersCount)) : 0;
  return 5 * (1 + Math.floor(n / 1000));
}

export function clampVideoPricePerMin(price: number, followersCount: number): number {
  const max = maxVideoPricePerMin(followersCount);
  const n = Number.isFinite(price) ? Math.round(price) : 0;
  return Math.min(max, Math.max(1, n));
}

export const COUNTRIES = [
  { code: 'CO', name: 'Colombia' },
  { code: 'MX', name: 'México' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'PE', name: 'Perú' },
  { code: 'EC', name: 'Ecuador' },
  { code: 'VE', name: 'Venezuela' },
  { code: 'BO', name: 'Bolivia' },
  { code: 'PY', name: 'Paraguay' },
  { code: 'UY', name: 'Uruguay' },
  { code: 'BR', name: 'Brasil' },
  { code: 'PA', name: 'Panamá' },
  { code: 'CR', name: 'Costa Rica' },
  { code: 'GT', name: 'Guatemala' },
  { code: 'HN', name: 'Honduras' },
  { code: 'SV', name: 'El Salvador' },
  { code: 'NI', name: 'Nicaragua' },
  { code: 'DO', name: 'República Dominicana' },
  { code: 'CU', name: 'Cuba' },
  { code: 'PR', name: 'Puerto Rico' },
  { code: 'US', name: 'Estados Unidos' },
  { code: 'ES', name: 'España' }
] as const;

export type CountryCode = (typeof COUNTRIES)[number]['code'];

export function getCountryName(code: string | null | undefined): string | null {
  if (!code) return null;
  return COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

/** Regional-indicator emoji flag (e.g. CO → 🇨🇴). */
export function getCountryFlagEmoji(code: string | null | undefined): string {
  if (!code || code === 'OTHER') return '🌍';
  const upper = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return '🌍';
  return String.fromCodePoint(
    ...[...upper].map((ch) => 0x1f1e6 - 65 + ch.charCodeAt(0)),
  );
}

/** Flag image URL (flagcdn). `OTHER` returns null. */
export function getCountryFlagUrl(
  code: string | null | undefined,
  width: 20 | 40 | 80 | 160 = 40,
): string | null {
  if (!code || code === 'OTHER') return null;
  const lower = code.trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(lower)) return null;
  return `https://flagcdn.com/w${width}/${lower}.png`;
}

