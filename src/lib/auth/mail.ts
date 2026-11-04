/**
 * Versand von Bestätigungs- und Rücksetzmails.
 *
 * Solange kein Versanddienst eingerichtet ist, landet die Mail im Log. Das ist
 * kein Notbehelf, sondern die ehrliche Zwischenstufe: die Strecke ist damit
 * vollständig prüfbar, und es gibt keinen Zustand, in dem die Anwendung
 * glaubt, sie habe etwas verschickt.
 *
 * Für echten Versand genügt `SMTP_URL` (z. B. smtps://user:pass@host:465).
 * Der Transport wird dann ergänzt, sobald die Absenderdomain feststeht.
 */

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export function isMailConfigured(): boolean {
  return Boolean(process.env.SMTP_URL);
}

export async function sendMail(mail: Mail): Promise<void> {
  if (!isMailConfigured()) {
    // Bewusst vollständig: ohne den Link im Log lässt sich die Bestätigung
    // nicht prüfen, und ein Log, das den Vorgang nur erwähnt, hilft niemandem.
    console.log(
      `\n[mail:log-transport] an=${mail.to}\n  betreff=${mail.subject}\n` +
        mail.text.split("\n").map((line) => `  | ${line}`).join("\n") +
        "\n",
    );
    return;
  }
  // Wird ergänzt, sobald SMTP_URL gesetzt ist (AP-03, Abschnitt Mailversand).
  throw new Error("SMTP-Versand ist noch nicht implementiert");
}
