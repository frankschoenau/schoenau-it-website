import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Container from "@/components/layout/container";
import AccountActions from "@/components/health-check/account-actions";
import { currentAccount } from "@/lib/auth/session";
import { listChecks } from "@/lib/health-check/checks";
import { priorityLabel } from "@/lib/health-check/labels";

import "@/styles/health-check.css";

export const metadata: Metadata = {
  title: "Meine Checks | AI Automation Health Check",
  robots: { index: false, follow: false },
};

// Die Seite hängt an der Sitzung und darf nicht vorgerendert werden.
export const dynamic = "force-dynamic";

export default async function MyChecksPage() {
  const account = await currentAccount();
  if (!account) redirect("/anmelden");

  const verified = account.emailVerifiedAt !== null;
  const checks = await listChecks(account.id);
  const eur = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden">
        <Container>
          <section className="relative z-10 mx-auto max-w-2xl pb-24 pt-16">
            <p className="hc-eyebrow">Konto</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">Meine Checks</h1>
            <p className="mt-2 text-sm text-slate-400">{account.email}</p>

            {!verified && (
              <div
                role="status"
                className="mt-6 rounded-2xl border px-4 py-3 text-sm"
                style={{ borderColor: "rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.08)" }}
              >
                Ihre Adresse ist noch nicht bestätigt. Sie können den Check
                ansehen, aber noch nicht abschließen — prüfen Sie Ihr Postfach.
              </div>
            )}

            {checks.length === 0 ? (
              <div className="hc-glass mt-8 p-7">
                <h2 className="font-medium">Noch kein Check gespeichert</h2>
                <p className="hc-hint mt-2">
                  Sobald Sie einen Prozess beschrieben haben, erscheint er hier —
                  mit Datum, Priorität und dem Bericht.
                </p>
                <Link href="/health-check/start" className="hc-btn hc-btn--primary mt-5 inline-flex">
                  Ersten Check starten
                </Link>
              </div>
            ) : (
              <div className="mt-8">
                <ul className="space-y-3">
                  {checks.map((check) => (
                    <li key={check.id}>
                      <Link
                        href={`/ergebnis/${check.id}`}
                        className="hc-glass flex items-center justify-between gap-4 p-5"
                      >
                        <span>
                          <span className="block font-medium">{check.processName}</span>
                          <span className="hc-hint">
                            {check.createdAt.toLocaleDateString("de-DE")} ·{" "}
                            {priorityLabel(check.priority)}
                          </span>
                        </span>
                        <span className="text-sm">{eur.format(check.annualNetEffect)} / Jahr</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link href="/health-check/start" className="hc-btn hc-btn--secondary mt-5 inline-flex">
                  Weiteren Prozess prüfen
                </Link>
              </div>
            )}

            <AccountActions />
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
