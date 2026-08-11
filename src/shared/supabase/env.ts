import "server-only";

import { z } from "zod";

const publicPrefix = "NEXT_PUBLIC_";
const credentialNamePattern =
  /supabase|(^|_)sb_|anon[_-]?key|service[_-]?role|publishable[_-]?key|secret[_-]?key/i;

const credentialVariables = [
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
] as const;

function assertNoPublicCredentials(
  environment: Record<string, unknown>,
  context: z.RefinementCtx,
): void {
  const secrets = new Set(
    credentialVariables
      .map((name) => environment[name])
      .filter(
        (value): value is string => typeof value === "string" && value !== "",
      ),
  );

  for (const [name, value] of Object.entries(environment)) {
    if (!name.startsWith(publicPrefix)) {
      continue;
    }

    const leaksByName = credentialNamePattern.test(name);
    const leaksByValue = typeof value === "string" && secrets.has(value);

    if (leaksByName || leaksByValue) {
      context.addIssue({
        code: "custom",
        message: `${name} is forbidden: Supabase credentials must remain server-only.`,
        path: [name],
      });
    }
  }
}

export const publicSupabaseEnvSchema = z
  .object({
    SUPABASE_URL: z.string().url(),
    SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  })
  .passthrough()
  .superRefine(assertNoPublicCredentials)
  .transform(({ SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY }) => ({
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY,
  }));

export const serviceRoleSupabaseEnvSchema = z
  .object({
    SUPABASE_URL: z.string().url(),
    SUPABASE_SECRET_KEY: z.string().min(1),
  })
  .passthrough()
  .superRefine(assertNoPublicCredentials)
  .transform(({ SUPABASE_URL, SUPABASE_SECRET_KEY }) => ({
    SUPABASE_URL,
    SUPABASE_SECRET_KEY,
  }));

export type PublicSupabaseEnv = z.infer<typeof publicSupabaseEnvSchema>;
export type ServiceRoleSupabaseEnv = z.infer<
  typeof serviceRoleSupabaseEnvSchema
>;

export function parsePublicSupabaseEnv(
  environment: NodeJS.ProcessEnv,
): PublicSupabaseEnv {
  return publicSupabaseEnvSchema.parse(environment);
}

export function parseServiceRoleSupabaseEnv(
  environment: NodeJS.ProcessEnv,
): ServiceRoleSupabaseEnv {
  return serviceRoleSupabaseEnvSchema.parse(environment);
}

export function getPublicSupabaseEnv(): PublicSupabaseEnv {
  return parsePublicSupabaseEnv(process.env);
}

export function getServiceRoleSupabaseEnv(): ServiceRoleSupabaseEnv {
  return parseServiceRoleSupabaseEnv(process.env);
}
