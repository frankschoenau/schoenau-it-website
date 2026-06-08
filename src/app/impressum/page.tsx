export default function ImpressumPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-32">

      <h1 className="mb-10 text-5xl font-bold">
        Impressum
      </h1>

      <div className="space-y-6 text-slate-300 leading-relaxed">

        <div>
          <h2 className="mb-2 text-xl font-semibold">
            Angaben gemäß § 5 TMG
          </h2>

          <p>
            Schönau IT<br />
            Frank Schönau<br />
            Otzbergring 56<br />
            64846 Groß-Zimmern
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">
            Kontakt
          </h2>

          <p>
            Telefon: 0151 / 52450742<br />
            E-Mail: frank@schoenau-it.de
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">
            Umsatzsteuer
          </h2>

          <p>
            Gemäß § 19 UStG wird keine Umsatzsteuer ausgewiesen.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-xl font-semibold">
            Verantwortlich für den Inhalt
          </h2>

          <p>
            Frank Schönau<br />
            Otzbergring 56<br />
            64846 Groß-Zimmern
          </p>
        </div>

      </div>

    </main>
  );
}