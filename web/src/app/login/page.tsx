import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { PRICING_APP_PATH } from "@/lib/auth/route-access";
import { createClient } from "@/lib/supabase/server";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (data?.claims) {
    redirect(PRICING_APP_PATH);
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.brand}>Respawn Pricing</p>
            <p className={styles.brandContext}>Digital Respawn</p>
          </div>
          <p className={styles.internalLabel}>Acceso interno</p>
        </header>

        <section className={styles.content} aria-labelledby="login-title">
          <div className={styles.introduction}>
            <p className={styles.eyebrow}>Herramienta para empleados</p>
            <h1 id="login-title">Iniciar sesión</h1>
            <p className={styles.lead}>
              Ingresa con la cuenta autorizada por Digital Respawn para acceder
              a las calculadoras de precios.
            </p>
          </div>

          <div className={styles.card}>
            <LoginForm />
          </div>
        </section>

        <footer className={styles.footer}>
          <p>Digital Respawn · Uso interno</p>
        </footer>
      </div>
    </main>
  );
}
