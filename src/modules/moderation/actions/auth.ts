"use server";

import { redirect } from "next/navigation";

import { createAuthServerClient } from "@/shared/supabase/auth-server";

export type SignInResult = { formError: string } | null;

export async function signIn(
  _prevState: SignInResult,
  formData: FormData,
): Promise<SignInResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { formError: "Ingresa tu correo y tu contraseña." };
  }

  const supabase = await createAuthServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // Same generic message whether the account doesn't exist or the password
  // is wrong — distinguishing them would let this form be used to check
  // which staff emails are registered.
  if (error) {
    return { formError: "Correo o contraseña incorrectos." };
  }

  redirect("/moderacion");
}

export async function signOut(): Promise<void> {
  const supabase = await createAuthServerClient();
  await supabase.auth.signOut();
  redirect("/moderacion/login");
}
