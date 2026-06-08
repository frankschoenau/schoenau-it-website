export default function DatenschutzPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-32">

      <h1 className="mb-10 text-5xl font-bold">
        Datenschutzerklärung
      </h1>

      <div className="space-y-8 text-slate-300 leading-relaxed">

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            1. Verantwortlicher
          </h2>

          <p>
            Frank Schönau<br />
            Schönau IT<br />
            Otzbergring 56<br />
            64846 Groß-Zimmern<br />
            E-Mail: frank@schoenau-it.de<br />
            Telefon: 0151 / 52450742
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            2. Allgemeine Hinweise
          </h2>

          <p>
            Der Schutz Ihrer persönlichen Daten ist mir wichtig.
            Personenbezogene Daten werden vertraulich und entsprechend
            der gesetzlichen Datenschutzvorschriften behandelt.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            3. Server-Logfiles
          </h2>

          <p>
            Beim Besuch dieser Website werden durch den Hosting-Anbieter
            automatisch Informationen erfasst und in sogenannten
            Server-Logfiles gespeichert. Dies sind beispielsweise:
          </p>

          <ul className="mt-3 list-disc pl-6">
            <li>IP-Adresse</li>
            <li>Datum und Uhrzeit des Zugriffs</li>
            <li>Browsertyp und Browserversion</li>
            <li>Verwendetes Betriebssystem</li>
            <li>Referrer-URL</li>
          </ul>

          <p className="mt-3">
            Diese Daten dienen ausschließlich der technischen
            Bereitstellung und Sicherheit der Website.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            4. Kontaktaufnahme
          </h2>

          <p>
            Wenn Sie per E-Mail Kontakt aufnehmen, werden die von Ihnen
            übermittelten Daten ausschließlich zur Bearbeitung Ihrer
            Anfrage verwendet.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-2xl font-semibold">
            5. Ihre Rechte
          </h2>

          <p>
            Sie haben das Recht auf Auskunft, Berichtigung, Löschung,
            Einschränkung der Verarbeitung sowie Widerspruch gegen die
            Verarbeitung Ihrer personenbezogenen Daten im Rahmen der
            gesetzlichen Bestimmungen.
          </p>
        </section>

      </div>

    </main>
  );
}