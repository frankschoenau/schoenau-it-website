import Link from "next/link";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Container from "@/components/layout/container";

/**
 * Hinweisseite für Zustände, die kein Fehler des Kunden sind (AP-04.32).
 *
 * Gedacht für „Dienst vorübergehend nicht erreichbar" — der Kunde bleibt
 * angemeldet, seine Sitzung wird nicht verworfen, und die Seite sagt ihm, dass
 * es nicht an ihm liegt.
 */
export default function ServiceNotice({
  title,
  message,
  detail,
}: {
  title: string;
  message: string;
  detail?: string;
}) {
  return (
    <>
      <Navbar />
      <main className="relative overflow-hidden">
        <Container>
          <section className="relative z-10 mx-auto max-w-xl pb-24 pt-16">
            <p className="hc-eyebrow">Hinweis</p>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h1>
            <div className="hc-glass mt-6 p-7">
              <p className="hc-hint leading-relaxed">{message}</p>
              {detail ? <p className="hc-hint mt-3 text-sm">{detail}</p> : null}
              <Link href="/" className="hc-btn hc-btn--secondary mt-6 inline-flex">
                Zur Startseite
              </Link>
            </div>
          </section>
        </Container>
      </main>
      <Footer />
    </>
  );
}
