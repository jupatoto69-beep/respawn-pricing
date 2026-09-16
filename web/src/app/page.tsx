import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/logout-button";
import { PricingCalculator } from "@/components/pricing-calculator";
import { LOGIN_PATH } from "@/lib/auth/route-access";
import { createClient } from "@/lib/supabase/server";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect(LOGIN_PATH);
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div>
            <p className={styles.brand}>Respawn Pricing</p>
            <p className={styles.brandContext}>Digital Respawn</p>
          </div>
          <div className={styles.headerActions}>
            <p className={styles.internalLabel}>Herramienta interna</p>
            <LogoutButton />
          </div>
        </header>

        <section className={styles.hero} aria-labelledby="page-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>Cálculos claros y consistentes</p>
            <h1 id="page-title">Respawn Pricing</h1>
            <p className={styles.lead}>
              Convierte dimensiones y tarifas en un precio comercial listo para
              usar, con las reglas de cálculo de Digital Respawn.
            </p>
          </div>

          <div className={styles.calculatorSection}>
            <div className={styles.sectionHeading}>
              <p className={styles.sectionNumber} aria-hidden="true">
                01
              </p>
              <div>
                <h2>Calculadora de precios</h2>
                <p>
                  Selecciona productos por área o servicios y completa los
                  datos correspondientes. El cálculo se ejecuta únicamente al
                  enviar el formulario.
                </p>
              </div>
            </div>

            <PricingCalculator />
          </div>
        </section>

        <footer className={styles.footer}>
          <p>Precios expresados en pesos colombianos (COP).</p>
          <p>Digital Respawn · Uso interno</p>
        </footer>
      </div>
    </main>
  );
}
