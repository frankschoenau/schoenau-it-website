import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Container from "@/components/layout/container";
import Dialogue from "@/components/health-check/dialogue";
import { currentAccount } from "@/lib/auth/session";

import "@/styles/health-check.css";

export const metadata: Metadata = {
  title: "Prozess beschreiben | AI Automation Health Check",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function StartPage() {
  const account = await currentAccount();
  if (!account) redirect("/anmelden");

  if (account.emailVerifiedAt === null) {
    return (
      <>
        <Navbar />
        <main>
          <Container>
            <section className="mx-auto max-w-xl pb-24 pt-16">
              <p className="hc-eyebrow">Fast so weit</p>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight">
                Bitte zuerst die Adresse bestätigen
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Wir haben Ihnen eine Mail an {account.email} geschickt. Sobald Sie
                den Link darin geöffnet haben, können Sie den Check durchführen
                und das Ergebnis bleibt gespeichert.
              </p>
              <Link href="/meine-checks" className="hc-btn hc-btn--secondary mt-6 inline-flex">
                Zum Konto
              </Link>
            </section>
          </Container>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main>
        <Container>
          <section className="mx-auto max-w-2xl pb-24 pt-12">
            <h1 className="text-3xl font-semibold tracking-tight">
              Ein Prozess, Schritt für Schritt
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">
              Antworten Sie so, wie es in Ihrem Alltag tatsächlich läuft — nicht
              wie es sein sollte. Jede Angabe lässt sich später korrigieren.
            </p>
            <div className="mt-10">
              <Dialogue />
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
