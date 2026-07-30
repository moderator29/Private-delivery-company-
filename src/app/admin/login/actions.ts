"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { rateLimit, requestIdentifier } from "@/lib/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export interface LoginFormState {
  status: "idle" | "error";
  message: string | null;
  email: string;
}

const loginSchema = z.object({
  email: z.string().trim().min(1).email(),
  password: z.string().min(1),
});

/** Only relative paths, so ?next= cannot be used as an open redirect. */
function safeRedirectPath(value: string | null): string {
  if (!value) return "/admin";
  if (!value.startsWith("/") || value.startsWith("//")) return "/admin";
  return value.startsWith("/admin") ? value : "/admin";
}

export async function signInAction(
  _previous: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeRedirectPath(
    typeof formData.get("next") === "string" ? String(formData.get("next")) : null,
  );

  const parsed = loginSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { status: "error", message: "Enter your email address and password.", email };
  }

  // Throttled per address, so this endpoint cannot be used to brute force a
  // password or to enumerate which accounts exist.
  const requestHeaders = await headers();
  const limit = rateLimit(requestIdentifier(requestHeaders), {
    bucket: "signin",
    limit: 8,
    windowMs: 10 * 60_000,
  });

  if (!limit.allowed) {
    return {
      status: "error",
      message: "Too many sign-in attempts. Please wait a few minutes and try again.",
      email,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    // One message for every failure mode. Distinguishing "no such account" from
    // "wrong password" would tell an attacker which addresses are real.
    return { status: "error", message: "Those credentials were not recognised.", email };
  }

  revalidatePath("/admin", "layout");
  redirect(next);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath("/admin", "layout");
  redirect("/admin/login");
}
