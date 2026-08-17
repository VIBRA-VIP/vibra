import { z } from 'zod';

const emptyToUndefined = (value: unknown) =>
  value === '' || value === null || value === undefined ? undefined : value;

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  API_PORT: z.coerce.number().default(3000),
  API_URL: z.string().url().default('http://localhost:3000'),
  WEB_URL: z
    .string()
    .min(1)
    .default('http://localhost:5173')
    .refine(
      (value) =>
        value.split(',').every((part) => {
          try {
            new URL(part.trim());
            return true;
          } catch {
            return part.trim() === '*';
          }
        }),
      { message: 'WEB_URL must be a URL or comma-separated URLs' },
    ),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('30d'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  S3_BUCKET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  S3_REGION: z.preprocess(emptyToUndefined, z.string().min(1).optional()).default('us-east-2'),
  S3_PUBLIC_BASE_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  AWS_ACCESS_KEY_ID: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  AWS_SECRET_ACCESS_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  /** Plaintext admin unlock key; hashed into DB on first boot if no secret exists. */
  ADMIN_ACCESS_KEY: z.preprocess(emptyToUndefined, z.string().min(8).optional()),
  SMTP_HOST: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SMTP_PORT: z.preprocess(emptyToUndefined, z.coerce.number().optional()),
  SMTP_USER: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SMTP_PASS: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  SMTP_FROM: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  /** Bold Botón/Link de pagos identity API key (Authorization: x-api-key …). */
  BOLD_API_KEY: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  /** coturn shared secret (use-auth-secret) for time-limited TURN credentials. */
  TURN_SECRET: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
  /** Comma-separated TURN URIs, e.g. "turn:1.2.3.4:3478?transport=udp". */
  TURN_URLS: z.preprocess(emptyToUndefined, z.string().min(1).optional()),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const message = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment variables: ${message}`);
  }
  return parsed.data;
}
