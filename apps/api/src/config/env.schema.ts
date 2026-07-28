import { z } from 'zod';

export const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  API_PORT: z.coerce.number().default(3000),
  API_URL: z.string().url().default('http://localhost:3000'),
  WEB_URL: z.string().url().default('http://localhost:5173'),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
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
