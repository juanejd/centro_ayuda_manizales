"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { signIn } from "@/modules/moderation/actions/auth";
import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="min-h-12 px-6">
      {pending ? "Entrando..." : "Entrar"}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(signIn, null);

  return (
    // No explicit method: signIn is a real Server Action, so React infers
    // method="POST" for both SSR and the JS-enabled path. A hand-written
    // method="post" here previously caused a hydration mismatch (server
    // "post" vs React's inferred "POST") — see publish-form.tsx's longer
    // note on the same issue.
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4"
    >
      {state?.formError ? (
        <Alert variant="destructive">
          <AlertTitle>No se pudo entrar</AlertTitle>
          <AlertDescription>{state.formError}</AlertDescription>
        </Alert>
      ) : null}

      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="email">Correo</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            className="min-h-12"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="password">Contraseña</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="min-h-12"
          />
        </Field>

        <SubmitButton />
      </FieldGroup>
    </form>
  );
}
