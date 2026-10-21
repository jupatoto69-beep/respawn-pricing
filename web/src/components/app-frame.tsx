import Link from "next/link";
import type { ReactNode } from "react";

import { LogoutButton } from "@/components/logout-button";

import styles from "@/app/page.module.css";

type AppFrameProps = Readonly<{
  activePage: "new" | "history";
  children: ReactNode;
}>;

export function AppFrame({ activePage, children }: AppFrameProps) {
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

        <nav className={styles.appNav} aria-label="Cotizaciones">
          <Link href="/" aria-current={activePage === "new" ? "page" : undefined}>
            Nueva cotización
          </Link>
          <Link
            href="/cotizaciones"
            aria-current={activePage === "history" ? "page" : undefined}
          >
            Cotizaciones guardadas
          </Link>
        </nav>

        {children}

        <footer className={styles.footer}>
          <p>Precios expresados en pesos colombianos (COP).</p>
          <p>Digital Respawn · Uso interno</p>
        </footer>
      </div>
    </main>
  );
}
