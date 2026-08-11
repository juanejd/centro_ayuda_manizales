import { z } from "zod";

const forbiddenPublicPrefix = "NEXT_PUBLIC_SUPABASE_";

export const supabaseEnvSchema = z
  .object({
    SUPABASE_URL: z.string().url(),
    SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
    SUPABASE_SECRET_KEY: z.string().min(1),
  })
  .passthrough()
  .superRefine((environment, context) => {
    for (const name of Object.keys(environment)) {
      if (name.startsWith(forbiddenPublicPrefix)) {
        context.addIssue({
          code: "custom",
          message: `${name} is forbidden: Supabase credentials must remain server-only.`,
          path: [name],
        });
      }
    }
  })
  .transform(
    ({ SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY }) => ({
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      SUPABASE_SECRET_KEY,
    }),
  );

export type SupabaseEnv = z.infer<typeof supabaseEnvSchema>;

export function parseSupabaseEnv(environment: NodeJS.ProcessEnv): SupabaseEnv {
  return supabaseEnvSchema.parse(environment);
}

export function getSupabaseEnv(): SupabaseEnv {
  return parseSupabaseEnv(process.env);
}
