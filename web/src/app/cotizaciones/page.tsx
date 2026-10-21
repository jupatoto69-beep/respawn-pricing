import { redirect } from "next/navigation";

import { AppFrame } from "@/components/app-frame";
import { QuotationHistory } from "@/components/quotation-history";
import { LOGIN_PATH } from "@/lib/auth/route-access";
import { createClient } from "@/lib/supabase/server";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function SavedQuotationsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims) {
    redirect(LOGIN_PATH);
  }

  return (
    <AppFrame activePage="history">
      <section className={styles.content} aria-labelledby="history-page-title">
        <p className={styles.eyebrow}>Archivo histórico</p>
        <h1 id="history-page-title">Cotizaciones guardadas</h1>
        <p className={styles.lead}>
          Consulta cotizaciones guardadas, actualiza su estado y descarga su PDF
          histórico.
        </p>
        <QuotationHistory refreshRevision={0} />
      </section>
    </AppFrame>
  );
}
