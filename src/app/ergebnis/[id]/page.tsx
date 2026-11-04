import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Container from "@/components/layout/container";
import { currentAccount } from "@/lib/auth/session";
import { getCheck } from "@/lib/health-check/checks";
import {
  assessmentLabel,
  automationTypeLabel,
  nextActionLabel,
  priorityLabel,
  priorityShort,
  priorityTone,
  warningHint,
} from "@/lib/health-check/labels";
import { SCENARIO_LABELS } from "@/lib/health-check/result";

import "@/styles/health-check.css";

export const metadata: Metadata = {
  title: "Ergebnis | AI Automation Health Check",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const eur = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const num = new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 });

const DIMENSIONS: Array<{ key: keyof Result["scores"]; label: string; meaning: (value: number) => string }> = [
  { key: "automation_score", label: "Automatisierbarkeit", meaning: (v) => (v >= 70 ? "überwiegend regelbasiert" : v >= 40 ? "teils regelbasiert" : "kaum regelbasiert") },
  { key: "ai_opportunity_score", label: "KI-Potenzial", meaning: (v) => (v >= 70 ? "viel Verstehen und Deuten" : v >= 40 ? "einzelne Deutungsschritte" : "kaum Deutung nötig") },
  { key: "complexity_score", label: "Komplexität", meaning: (v) => (v >= 70 ? "hoch — viele Systeme und Varianten" : v >= 40 ? "mittel" : "überschaubar") },
  { key: "risk_score", label: "Risiko", meaning: (v) => (v >= 70 ? "hoch — braucht Kontrolle" : v >= 40 ? "mittel" : "gering") },
];

type Result = {
  scores: Record<string, number> & {
    automation_score: number;
    ai_opportunity_score: number;
    complexity_score: number;
    risk_score: number;
    confidence_score: number;
    economic_potential_score: number;
  };
  economics: {
    primary_scenario: string;
    payback_months: number;
    roi_12m_percent: number;
    scenarios: Record<string, { annual_net_effect: number; saved_hours_monthly: number; automation_percentage: number; roi_12m_percent: number; payback_months: number }>;
  };
  decision: {
    automation_type: string;
    priority: string;
    reason_codes: string[];
    block_reasons: string[];
    warnings: string[];
    next_action: string;
  };
};

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const account = await currentAccount();
  if (!account) redirect("/anmelden");

  const { id } = await params;
  const check = await getCheck(account.id, id);
  if (!check) notFound();

  const result = check.result as unknown as Result;
  const primary = result.economics.scenarios[result.economics.primary_scenario];
  const tone = priorityTone(result.decision.priority);
  const annual = primary?.annual_net_effect ?? 0;
  const monthly = annual / 12;
  const hours = (primary?.saved_hours_monthly ?? 0) * 12;
  const maxScenario = Math.max(
    ...Object.values(result.economics.scenarios).map((scenario) => Math.abs(scenario.annual_net_effect)),
    1,
  );

  const flags = [...result.decision.reason_codes, ...result.decision.block_reasons];

  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[140px]"
        />
        <Container>
          <section className="relative z-10 mx-auto max-w-3xl pb-24 pt-12">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`hc-prio hc-prio--${tone}`}>
                {priorityShort(result.decision.priority)} · {priorityLabel(result.decision.priority)}
              </span>
              <span className="hc-hint">{automationTypeLabel(result.decision.automation_type)}</span>
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight">{check.processName}</h1>
            <p className="hc-hint mt-1">
              Erstellt am {check.createdAt.toLocaleDateString("de-DE")} · Zuversicht der Angaben{" "}
              {num.format(result.scores.confidence_score)} von 100
            </p>

            <div className="hc-surface mt-8 p-8">
              <p className="hc-eyebrow">Wirtschaftlicher Hebel</p>
              <p className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
                <span className="hc-gradient">{eur.format(annual)}</span>
              </p>
              <p className="hc-hint mt-1">pro Jahr, im erwarteten Szenario</p>

              <div className="mt-7 grid gap-6 sm:grid-cols-3">
                <div className="hc-kpi">
                  <span className="hc-kpi__label">Entlastung je Monat</span>
                  <span className="hc-kpi__value">{eur.format(monthly)}</span>
                </div>
                <div className="hc-kpi">
                  <span className="hc-kpi__label">Gesparte Zeit je Jahr</span>
                  <span className="hc-kpi__value">{num.format(hours)} h</span>
                </div>
                <div className="hc-kpi">
                  <span className="hc-kpi__label">Amortisation</span>
                  <span className="hc-kpi__value">
                    {Number.isFinite(result.economics.payback_months)
                      ? `${num.format(result.economics.payback_months)} Mon.`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="hc-glass mt-6 p-6">
              <h2 className="font-medium">Was jetzt zu tun ist</h2>
              <p className="mt-2 text-lg">{nextActionLabel(result.decision.next_action)}</p>
            </div>

            <h2 className="mt-12 text-xl font-semibold tracking-tight">Die vier Dimensionen</h2>
            <div className="mt-5 space-y-4">
              {DIMENSIONS.map((dimension) => {
                const value = result.scores[dimension.key];
                return (
                  <div key={dimension.key}>
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="text-sm">{dimension.label}</span>
                      <span className="hc-hint">{Math.round(value)} / 100</span>
                    </div>
                    <div className="hc-progress mt-2">
                      <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
                    </div>
                    <p className="hc-hint mt-1">{dimension.meaning(value)}</p>
                  </div>
                );
              })}
            </div>

            <h2 className="mt-12 text-xl font-semibold tracking-tight">Wirtschaftlichkeit</h2>
            <p className="hc-hint mt-1">
              Drei Szenarien, gerechnet mit 60 € je Stunde, 12.000 € Einführung und
              180 € laufenden Kosten im Monat.
            </p>
            <div className="mt-5 space-y-4">
              {Object.entries(result.economics.scenarios).map(([key, scenario]) => (
                <div key={key}>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="text-sm">
                      {SCENARIO_LABELS[key] ?? key}
                      <span className="hc-muted"> · {Math.round(scenario.automation_percentage)} % automatisiert</span>
                    </span>
                    <span className="text-sm">{eur.format(scenario.annual_net_effect)} / Jahr</span>
                  </div>
                  <div className="hc-progress mt-2">
                    <span
                      style={{
                        width: `${Math.max(2, (Math.abs(scenario.annual_net_effect) / maxScenario) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {flags.length > 0 && (
              <>
                <h2 className="mt-12 text-xl font-semibold tracking-tight">Was aufgefallen ist</h2>
                <ul className="mt-4 space-y-2">
                  {flags.map((code) => (
                    <li key={code} className="text-sm text-slate-300">
                      {assessmentLabel(code)}
                      {warningHint(code) ? `. ${warningHint(code)}` : ""}
                    </li>
                  ))}
                </ul>
              </>
            )}

            <div className="hc-glass mt-12 p-7">
              <p className="hc-eyebrow">Im Bericht enthalten</p>
              <h2 className="mt-2 text-xl font-semibold">Bericht und KI-Analyse</h2>
              <p className="hc-hint mt-2">
                Zwölf Seiten für Ihre Geschäftsführung: Methodik, offengelegte
                Annahmen, die sprachliche Analyse des Prozesses und die
                Empfehlungen mit Belegen. Als PDF zum Weitergeben.
              </p>
              <a
                className="hc-btn hc-btn--secondary mt-5 inline-flex"
                href={`mailto:kontakt@schoenau-it.de?subject=${encodeURIComponent(`Health Check: ${check.processName} (${check.id.slice(0, 8)})`)}`}
              >
                Bericht anfragen
              </a>
            </div>

            <p className="hc-hint mt-8">
              <Link href="/meine-checks" className="underline">
                Zu meinen Checks
              </Link>
            </p>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
