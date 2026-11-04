import type { Metadata } from "next";
import Link from "next/link";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Container from "@/components/layout/container";
import CredentialsForm from "@/components/health-check/credentials-form";

import "@/styles/health-check.css";

export const metadata: Metadata = {
  title: "Konto anlegen | AI Automation Health Check",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-blue-500/15 blur-[130px]"
        />
        <Container>
          <section className="relative z-10 mx-auto max-w-md pb-24 pt-16">
            <p className="hc-eyebrow">Konto</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">Konto anlegen</h1>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Damit Ihr Ergebnis gespeichert bleibt und nur Sie es sehen. Sie
              erhalten eine Mail zur Bestätigung Ihrer Adresse.
            </p>

            <CredentialsForm mode="register" />

            <p className="hc-hint mt-6">
              Bereits registriert? <Link href="/anmelden" className="underline">Zur Anmeldung</Link>
            </p>

            <p className="hc-hint mt-8 leading-relaxed">
              Ihre Angaben werden auf Servern in Deutschland gespeichert und nur
              zur Erstellung Ihrer Auswertung verwendet. Sie können Ihr Konto
              jederzeit löschen; damit werden alle zugehörigen Daten entfernt.
            </p>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
