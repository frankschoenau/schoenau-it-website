"use client";

import { useMemo, useRef, useState } from "react";
import { newSubmissionId } from "@/lib/health-check/submission";
import { createSubmitGuard } from "@/lib/health-check/submit-guard";
import {
  SECTIONS,
  CHAPTERS,
  isVisible,
  defaultEconomic,
  type Answers,
  type Question,
} from "@/lib/health-check/questionnaire";

/**
 * Der Dialog.
 *
 * Eine Frage zur Zeit, Antworten als Klickflächen wo möglich. Was beantwortet
 * ist, bleibt oben als Verlauf stehen und lässt sich antippen, um zurückzugehen.
 *
 * Gerechnet wird hier nichts. Der Client sammelt Antworten und schickt sie an
 * den Server; was sie bedeuten, entscheidet die Engine.
 *
 * Vorgangs-ID (AP-04.34): Ein Vorgang beginnt mit dem ersten Absenden und
 * behält seine ID über alle Wiederholungen — Doppelklick, Timeout, erneutes
 * Senden nach einem Fehler. Aendert der Kunde seine Antworten und sendet
 * erneut, ist das ein neuer Vorgang und bekommt eine neue ID; ebenso ein neuer
 * Dialog, ein Reload oder ein zweiter Tab.
 */

const PFLICHT_HINWEIS = "Diese Angabe wird für die Bewertung gebraucht.";

function chapterOf(question: Question): number {
  const section = SECTIONS.find((candidate) =>
    candidate.questions.some((candidateQuestion) => candidateQuestion.id === question.id),
  );
  return section?.chapter ?? 1;
}

export default function Dialogue() {
  const [answers, setAnswers] = useState<Answers>({});
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Eine ID je Vorgang. Sie ueberlebt Wiederholungen mit unveraenderten
  // Antworten; sobald sich die Antworten aendern, ist es ein neuer Vorgang und
  // bekommt eine neue ID. Der Vergleich haengt an der Objektidentitaet, die
  // `setAnswers` bei jeder Aenderung erneuert.
  const submission = useRef<{ id: string; answers: Answers } | null>(null);
  // Zweiter Riegel gegen zwei Aufrufe im selben Ereignis-Zyklus: `busy` wirkt
  // erst mit dem naechsten Rendern, dieser Riegel sofort.
  const guard = useRef(createSubmitGuard());
  const economic = useMemo(() => defaultEconomic(), []);

  const visible = useMemo(
    () =>
      SECTIONS.filter((section) => !section.economic).flatMap((section) =>
        section.questions.filter((question) => isVisible(question, answers)),
      ),
    [answers],
  );

  const atEnd = index >= visible.length;
  const current = atEnd ? null : visible[index];
  const chapter = current ? CHAPTERS[chapterOf(current)] : null;
  const percent = Math.round((Math.min(index, visible.length) / Math.max(visible.length, 1)) * 100);

  function answer(question: Question, value: string | number) {
    setAnswers((previous) => ({ ...previous, [question.id]: value }));
    setDraft("");
    setHint(null);
    setIndex((previous) => previous + 1);
  }

  function submitText(question: Question) {
    if (!question.required && draft.trim() === "") {
      // Ein optionales Feld darf leer weitergehen — aber nur ausdrücklich.
      setAnswers((previous) => ({ ...previous, [question.id]: "" }));
      setIndex((previous) => previous + 1);
      return;
    }
    if (question.required && draft.trim() === "") {
      setHint(PFLICHT_HINWEIS);
      return;
    }
    if (question.type === "number") {
      const numeric = Number(draft.replace(",", "."));
      if (!Number.isFinite(numeric)) {
        setHint("Bitte eine Zahl eingeben.");
        return;
      }
      if (question.min !== undefined && numeric < question.min) {
        setHint(`Der Wert muss mindestens ${question.min} sein.`);
        return;
      }
      if (question.max !== undefined && numeric > question.max) {
        setHint(`Der Wert darf höchstens ${question.max} sein.`);
        return;
      }
      answer(question, numeric);
      return;
    }
    answer(question, draft.trim());
  }

  async function finish() {
    if (!guard.current.tryAcquire(busy)) return;
    setBusy(true);
    setError(null);
    try {
      if (submission.current === null || submission.current.answers !== answers) {
        submission.current = { id: newSubmissionId(), answers };
      }
      const submissionId = submission.current.id;
      const response = await fetch("/api/health-check/assess", {
        method: "POST",
        headers: { "content-type": "application/json" },
        // Dieselbe Vorgangs-ID bei jedem Versuch: der Schluessel, an dem die
        // API eine Wiederholung erkennt.
        body: JSON.stringify({ answers, economic, submissionId }),
      });
      const payload = (await response.json()) as { ok?: boolean; code?: string; checkId?: string };
      if (payload.ok && payload.checkId) {
        window.location.href = `/ergebnis/${payload.checkId}`;
        return;
      }
      setError(
        payload.code === "EMAIL_NOT_VERIFIED"
          ? "Bitte bestätigen Sie zuerst Ihre E-Mail-Adresse."
          : payload.code === "SIGN_IN_REQUIRED"
            ? "Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an."
            : "Die Bewertung konnte nicht erstellt werden. Bitte versuchen Sie es erneut.",
      );
    } catch {
      setError("Der Server antwortet nicht. Bitte versuchen Sie es erneut.");
    } finally {
      guard.current.release();
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="hc-eyebrow">{chapter ? chapter.title : "Abschluss"}</p>
        <p className="hc-hint">
          {atEnd ? "Alle Angaben" : `Frage ${index + 1} von ${visible.length}`}
        </p>
      </div>
      <div className="hc-progress mt-3">
        <span style={{ width: `${percent}%` }} />
      </div>

      {chapter && !atEnd && <p className="hc-hint mt-4">{chapter.intro}</p>}

      {/* Verlauf: beantwortete Fragen, antippbar zum Korrigieren. */}
      {index > 0 && (
        <ol className="mt-8 space-y-2">
          {visible.slice(0, index).map((question, position) => (
            <li key={question.id}>
              <button
                type="button"
                onClick={() => {
                  setIndex(position);
                  setDraft(String(answers[question.id] ?? ""));
                  setHint(null);
                }}
                className="w-full text-left"
              >
                <span className="block text-sm text-slate-400">{question.label}</span>
                <span className="block text-sm text-slate-200">
                  {labelFor(question, answers[question.id])}
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}

      {current && (
        <div className="hc-surface mt-8 p-7">
          <h2 className="text-xl font-medium leading-snug">{current.label}</h2>
          {current.help && <p className="hc-hint mt-2">{current.help}</p>}

          {current.type === "select" ? (
            <div className="mt-5 space-y-2">
              {current.options?.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="hc-choice"
                  aria-pressed={answers[current.id] === option.value}
                  onClick={() => answer(current, option.value)}
                >
                  {option.label}
                  {meaningOf(current, option.value) && (
                    <span className="hc-muted"> — {meaningOf(current, option.value)}</span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="mt-5">
              {current.type === "textarea" || current.type === "list" ? (
                <textarea
                  className="hc-field"
                  rows={3}
                  value={draft}
                  placeholder={current.hint ?? ""}
                  onChange={(event) => setDraft(event.target.value)}
                />
              ) : (
                <input
                  className="hc-field"
                  type={current.type === "number" ? "number" : "text"}
                  inputMode={current.type === "number" ? "decimal" : undefined}
                  min={current.min}
                  max={current.max}
                  step={current.step}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      submitText(current);
                    }
                  }}
                />
              )}

              {hint && (
                <p className="mt-2 text-sm" style={{ color: "#F59E0B" }}>
                  {hint}
                </p>
              )}

              <div className="mt-4 flex items-center gap-3">
                <button type="button" className="hc-btn hc-btn--primary" onClick={() => submitText(current)}>
                  Weiter
                </button>
                {!current.required && (
                  <button
                    type="button"
                    className="hc-btn hc-btn--quiet"
                    onClick={() => {
                      setAnswers((previous) => ({ ...previous, [current.id]: "" }));
                      setDraft("");
                      setHint(null);
                      setIndex((previous) => previous + 1);
                    }}
                  >
                    Überspringen
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {atEnd && (
        <div className="hc-surface mt-8 p-7">
          <h2 className="text-xl font-medium">Fertig — Bewertung erstellen</h2>
          <p className="hc-hint mt-2">
            {visible.length} Angaben liegen vor. Die Bewertung rechnet regelbasiert;
            das Sprachmodell ergänzt später die Analyse im Bericht.
          </p>

          {error && (
            <p role="alert" className="mt-4 text-sm" style={{ color: "#F87171" }}>
              {error}
            </p>
          )}

          <button type="button" className="hc-btn hc-btn--primary mt-6" onClick={finish} disabled={busy}>
            {busy ? "Wird berechnet …" : "Bewertung erstellen"}
          </button>
        </div>
      )}
    </div>
  );
}

/** Der Text, der im Verlauf unter einer Frage steht. */
function labelFor(question: Question, value: string | number | undefined): string {
  if (value === undefined || value === "") return "—";
  const option = question.options?.find((candidate) => candidate.value === value);
  return option ? option.label : String(value);
}

/** Die Stufenbedeutung zu einem Auswahlwert, für die Zeile hinter dem Label. */
function meaningOf(question: Question, value: string): string | undefined {
  if (!question.scaleHelp) return undefined;
  const position = question.options?.findIndex((option) => option.value === value) ?? -1;
  return position >= 0 ? question.scaleHelp[position]?.[1] : undefined;
}
