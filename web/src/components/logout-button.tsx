"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { endCurrentSession } from "@/lib/auth/auth-operations";
import { LOGIN_PATH } from "@/lib/auth/route-access";
import { createClient } from "@/lib/supabase/client";

import styles from "./logout-button.module.css";

export function LogoutButton() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSignOut() {
    setIsSigningOut(true);
    setErrorMessage(null);

    try {
      const supabase = createClient();
      const result = await endCurrentSession(supabase.auth);

      if (!result.ok) {
        setErrorMessage(result.message);
        return;
      }

      router.replace(LOGIN_PATH);
      router.refresh();
    } catch {
      setErrorMessage("No pudimos cerrar la sesión. Inténtalo de nuevo.");
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <div className={styles.container}>
      <button
        className={styles.button}
        type="button"
        onClick={handleSignOut}
        disabled={isSigningOut}
      >
        {isSigningOut ? "Cerrando sesión…" : "Cerrar sesión"}
      </button>
      {errorMessage ? (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
