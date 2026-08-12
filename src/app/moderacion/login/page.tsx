import type { Metadata } from "next";

import { LoginForm } from "@/modules/moderation/components/login-form";

export const metadata: Metadata = {
  title: "Acceso del equipo | Centro de Ayuda Manizales",
  robots: { index: false, follow: false },
};

// No signup route exists anywhere in this app — see the doc's own warning:
// Supabase Auth allows email signup by default, and a "has a session" check
// alone would let anyone who registered into the inbox. Staff accounts are
// provisioned out of band (Supabase dashboard / admin API), never from a
// page like this one.
export default function ModerationLoginPage() {
  return (
    <main className="bg-background text-foreground min-h-screen px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
        <header>
          <p className="label-caps text-muted-foreground">
            Centro de Ayuda Manizales
          </p>
          <h1 className="mt-2 text-2xl">Acceso del equipo</h1>
        </header>

        <LoginForm />
      </div>
    </main>
  );
}
