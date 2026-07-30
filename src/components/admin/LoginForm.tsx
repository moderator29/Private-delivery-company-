"use client";

import { useActionState } from "react";

import { signInAction, type LoginFormState } from "@/app/admin/login/actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, TextInput } from "@/components/ui/Field";

/** Declared here: a "use server" module may only export async functions. */
const INITIAL_STATE: LoginFormState = { status: "idle", message: null, email: "" };

export function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState(signInAction, INITIAL_STATE);

  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {state.status === "error" && state.message ? (
        <Alert tone="error">{state.message}</Alert>
      ) : null}

      <Field id="email" label="Email address" required>
        {(props) => (
          <TextInput
            {...props}
            name="email"
            type="email"
            autoComplete="username"
            defaultValue={state.email}
            invalid={state.status === "error"}
            required
          />
        )}
      </Field>

      <Field id="password" label="Password" required>
        {(props) => (
          <TextInput
            {...props}
            name="password"
            type="password"
            autoComplete="current-password"
            invalid={state.status === "error"}
            required
          />
        )}
      </Field>

      <Button type="submit" size="lg" fullWidth disabled={pending}>
        {pending ? "Signing in" : "Sign in"}
      </Button>
    </form>
  );
}
