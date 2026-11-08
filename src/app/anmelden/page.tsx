import type { Metadata } from "next";
import Link from "next/link";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Container from "@/components/layout/container";
import CredentialsForm from "@/components/health-check/credentials-form";
import ResendForm from "@/components/health-check/resend-form";

import "@/styles/health-check.css";

export const metadata: Metadata = {
  title: "Anmelden | AI Automation Health Check",
  robots: { index: false, follow: false },
};

const NOTICES: Record<string, { tone: "ok" | "warn"; text: string }> = {
  neu: {
    tone: "ok",
    text: "Konto angelegt. Bitte bestätigen Sie die Adresse über den Link in der Mail, die wir Ihnen geschickt haben.",
  },
  bestaetigt: { tone: "ok", text: "Adresse bestätigt. Sie können sich jetzt anmelden." },
  token: {
    tone: "warn",
    text: "Der Bestätigungslink ist abgelaufen oder wurde bereits verwendet. Fordern Sie einen neuen an.",
  },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const key = ["neu", "bestaetigt", "token"].find((name) => params[name] !== undefined);
  const notice = key ? NOTICES[key] ?? NOTICES.token : null;

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
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">Anmelden</h1>

            {notice && (
              <div
                role="status"
                className="mt-6 rounded-2xl border px-4 py-3 text-sm"
                style={{
                  borderColor: notice.tone === "ok" ? "rgba(34,197,94,0.35)" : "rgba(245,158,11,0.35)",
                  background: notice.tone === "ok" ? "rgba(34,197,94,0.08)" : "rgba(245,158,11,0.08)",
                  color: "#F8FAFC",
                }}
              >
                {notice.text}
              </div>
            )}

            <CredentialsForm mode="login" />

            <ResendForm />

            <p className="hc-hint mt-6">
              Noch kein Konto? <Link href="/registrieren" className="underline">Jetzt anlegen</Link>
            </p>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
