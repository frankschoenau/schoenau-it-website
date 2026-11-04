import type { Metadata } from "next";
import Link from "next/link";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Container from "@/components/layout/container";
import ApiStatus from "@/components/health-check/api-status";

import "@/styles/health-check.css";

export const metadata: Metadata = {
  title: "AI Automation Health Check | Welcher Prozess lohnt sich zuerst?",
  description:
    "Prüfen Sie kostenlos, welche Prozesse sich automatisieren lassen, was es bringt und was zuerst dran ist. Ergebnis in wenigen Minuten, ohne Vorbereitung.",
  alternates: { canonical: "https://www.schoenau-it.de/health-check" },
  robots: { index: true, follow: true },
};

const PILLARS = [
  {
    title: "Was es bringt",
    body: "Jahresbetrag, gesparte Stunden und Amortisation — gerechnet, nicht geschätzt, mit offengelegten Annahmen.",
  },
  {
    title: "Was zuerst dran ist",
    body: "Eine Priorität statt einer Liste. Sie erfahren, welcher Schritt sich zuerst lohnt und welcher warten kann.",
  },
  {
    title: "Was schiefgehen kann",
    body: "Risiken, Datenlage und die Stellen, an denen ein Mensch im Ablauf bleiben muss.",
  },
];

export default function HealthCheckPage() {
  return (
    <>
      <Navbar />

      <main className="relative overflow-hidden">
        {/* Der Lichtschein der Startseite, damit der Übergang kein Bruch ist. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-500/20 blur-[140px]"
        />

        <Container>
          <section className="relative z-10 mx-auto max-w-3xl pb-16 pt-16 text-center md:pt-24">
            <p className="hc-eyebrow">AI Automation Health Check</p>

            <h1 className="mt-6 text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
              Welcher Prozess
              <br />
              <span className="hc-gradient">lohnt sich zuerst?</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400">
              Beschreiben Sie einen Prozess aus Ihrem Alltag. Sie erhalten eine
              Bewertung mit Jahresbetrag, Priorität und dem nächsten Schritt —
              kostenlos und ohne Vorbereitung.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/health-check/start" className="hc-btn hc-btn--primary">
                Kostenlos starten
              </Link>
              <a href="#ablauf" className="hc-btn hc-btn--secondary">
                Wie es abläuft
              </a>
            </div>

            <p className="hc-hint mt-4">Ein Prozess, etwa zehn Minuten, keine Anmeldung nötig zum Ansehen.</p>
          </section>

          <section className="relative z-10 grid gap-6 pb-16 md:grid-cols-3" aria-label="Was Sie erhalten">
            {PILLARS.map((pillar) => (
              <article key={pillar.title} className="hc-glass p-7">
                <h2 className="text-lg font-semibold">{pillar.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">{pillar.body}</p>
              </article>
            ))}
          </section>

          <section id="ablauf" className="relative z-10 mx-auto max-w-3xl pb-20">
            <h2 className="text-2xl font-semibold tracking-tight">Wie es abläuft</h2>

            <ol className="mt-6 space-y-5">
              {[
                ["Prozess beschreiben", "Sie führen durch den Ablauf — in Kapiteln, nicht in einem Formular."],
                ["Bewertung erhalten", "Die Auswertung rechnet regelbasiert, nicht das Sprachmodell. Deshalb ist sie reproduzierbar."],
                ["Ergebnis lesen", "Jahresbetrag, Stunden, Priorität, Risiken und die nächsten drei Schritte."],
              ].map(([title, body], index) => (
                <li key={title} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="hc-muted shrink-0 font-mono text-sm"
                    style={{ paddingTop: "0.15rem" }}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="font-medium">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">{body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="hc-glass mt-10 p-6">
              <h2 className="font-medium">Was mit Ihren Angaben passiert</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">
                Ihre Angaben werden auf Servern in Deutschland gespeichert und nur
                zur Erstellung Ihrer Auswertung verwendet. Sie können jederzeit
                gelöscht werden. Für die sprachliche Analyse wird ein Sprachmodell
                beauftragt; Ihre Daten werden nicht zum Training verwendet.
              </p>
            </div>

            <ApiStatus />
          </section>
        </Container>
      </main>

      <Footer />
    </>
  );
}
