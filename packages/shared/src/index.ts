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
