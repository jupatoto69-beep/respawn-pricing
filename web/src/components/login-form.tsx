"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { authenticateWithPassword } from "@/lib/auth/auth-operations";
import { PRICING_APP_PATH } from "@/lib/auth/route-access";
import { createClient } from "@/lib/supabase/client";

import styles from "./login-form.module.css";

export function LoginForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    try {
      const supabase = createClient();
      const result = await authenticateWithPassword(
        supabase.auth,
        email,
        password,
      );

      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }

      router.replace(PRICING_APP_PATH);
      router.refresh();
    } catch {
      setErrorMessage(
        "No pudimos iniciar sesión en este momento. Inténtalo de nuevo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.field}>
        <label htmlFor="email">Correo electrónico</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={isSubmitting}
        />
      </div>

      {errorMessage ? (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      ) : null}

      <button className={styles.submitButton} type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Iniciando sesión…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
