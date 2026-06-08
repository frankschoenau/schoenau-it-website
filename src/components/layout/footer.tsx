import Container from "./container";

export default function Footer() {
  return (
    <footer
      className="
        border-t
        border-white/5
        py-12
      "
    >
      <Container>

        <div
          className="
            flex
            flex-col
            gap-8

            md:flex-row
            md:items-center
            md:justify-between
          "
        >

          <div>
            <div className="font-semibold">
              Schönau IT
            </div>

            <p className="mt-2 text-sm text-slate-400">
              Digitalisierung, Automatisierung und KI für Unternehmen.
            </p>
          </div>

          <div
            className="
              flex
              flex-wrap
              gap-6
              text-sm
              text-slate-400
            "
          >
            <a href="#leistungen">Leistungen</a>
            <a href="#referenzen">Referenzen</a>
            <a href="#ueber-mich">Über mich</a>
            <a href="#kontakt">Kontakt</a>

            <a href="/impressum">Impressum</a>
            <a href="/datenschutz">Datenschutz</a>
          </div>

        </div>

      </Container>
    </footer>
  );
}