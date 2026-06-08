import Container from "@/components/layout/container";

export default function CaseStudiesSection() {
  return (
    <section
  id="referenzen"
  className="relative overflow-hidden py-32"
>

      <div
        className="
          absolute
          top-0
          left-1/2
          -translate-x-1/2
          h-125
          w-125
          rounded-full
          bg-cyan-500/5
          blur-3xl
          pointer-events-none
        "
      />

      <Container>

        {/* HEADER */}

        <div className="mb-10">
          <p className="font-medium text-cyan-400">
            REFERENZEN
          </p>

          <h2 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">
            Praxisbeispiele aus Digitalisierung und Automatisierung
          </h2>

          <p className="mt-6 max-w-3xl text-slate-400">
            Anonymisierte Beispiele aus Projekten rund um Prozessoptimierung, Automatisierung und digitale Transformation.
          </p>

          <p className="mt-4 text-sm text-slate-500">
            Aus Vertraulichkeitsgründen werden Kunden und Unternehmensnamen nicht veröffentlicht.
            </p>
        </div>

        {/* CASES */}

        <div className="grid gap-8 lg:grid-cols-3">

          {/* CARD 1 */}

          <div
            className="
            flex
            flex-col
            rounded-3xl
            border
              border-white/10
              bg-white/3
              p-8
              transition-all
              duration-300
              hover:-translate-y-1
              hover:border-cyan-500/20
            "
          >

            <div className="mb-8">

              <div className="text-5xl font-bold text-cyan-400">
                80%
              </div>

              <p
                className="
                  mt-2
                  text-sm
                  uppercase
                  tracking-wider
                  text-slate-400
                "
              >
                WENIGER MANUELLER AUFWAND
              </p>

            </div>

            <div
              className="
                mb-6
                inline-flex
                w-fit
                rounded-full
                border
                border-cyan-500/20
                px-4
                py-1
                text-sm
                text-cyan-400
              "
            >
              Industrieunternehmen
            </div>

            <div className="flex flex-1 flex-col">

              <div className="min-h-[130px]">
                <h3 className="font-semibold text-white">
                    Herausforderung
                </h3>

                <p className="mt-2 text-slate-400">
                  Manuelle Datenerfassung und Medienbrüche
                  zwischen mehreren Systemen.
                </p>
              </div>

              <div className="min-h-[140px]">
                <h3 className="font-semibold text-white">
                    Umsetzung
                </h3>

                <p className="mt-2 text-slate-400">
                  Mehrere manuelle Arbeitsschritte wurden
                  automatisiert und bestehende Systeme
                  nahtlos miteinander verbunden.
                </p>
              </div>
            
            <div
                className="
                    mt-4
                    rounded-2xl
                    border
                    border-cyan-500/10
                    bg-cyan-500/5
                    p-4
                "
                >
                <h3 className="font-semibold text-white">
                    Ergebnis
                </h3>

                <p className="mt-2 font-medium text-cyan-400">
                    Über 80 % weniger manueller Aufwand und
                    deutlich weniger Fehlerquellen im Prozess.
                </p>
                </div>


            </div>

          </div>

          {/* CARD 2 */}

          <div
            className="
            flex
            flex-col
            rounded-3xl
            border
              border-white/10
              bg-white/3
              p-8
              transition-all
              duration-300
              hover:-translate-y-1
              hover:border-cyan-500/20
            "
          >

            <div className="mb-8">

              <div className="text-5xl font-bold text-cyan-400">
                12h+
              </div>

              <p
                className="
                  mt-2
                  text-sm
                  uppercase
                  tracking-wider
                  text-slate-400
                "
              >
                ZEITERSPARNIS PRO WOCHE
              </p>

            </div>

            <div
              className="
                mb-6
                inline-flex
                w-fit
                rounded-full
                border
                border-cyan-500/20
                px-4
                py-1
                text-sm
                text-cyan-400
              "
            >
              Finanzdienstleister
            </div>

            <div className="flex flex-1 flex-col">

              <div className="min-h-[130px]">
                <h3 className="font-semibold text-white">
                    Herausforderung
                </h3>

                <p className="mt-2 text-slate-400">
                  Hoher Zeitaufwand bei Reporting-
                  und Analyseprozessen.
                </p>
              </div>

              <div className="min-h-[140px]">
                <h3 className="font-semibold text-white">
                    Umsetzung
                </h3>

                <p className="mt-2 text-slate-400">
                  Zentrale Prozesse wurden miteinander
                  verknüpft und medienbruchfrei digitalisiert.
                </p>
              </div>
              <div
                className="
                    mt-4
                    rounded-2xl
                    border
                    border-cyan-500/10
                    bg-cyan-500/5
                    p-4
                "
                >

            <h3 className="font-semibold text-white">
                Ergebnis
            </h3>

            <p className="mt-2 font-medium text-cyan-400">
                Mehrere Stunden Zeitersparnis pro Woche
                und deutlich schnellere Auswertungen.
            </p>
            </div>

            </div>

          </div>

          {/* CARD 3 */}

          <div
            className="
              flex
              flex-col
              rounded-3xl
              border
              border-white/10
              bg-white/3
              p-8
              transition-all
              duration-300
              hover:-translate-y-1
              hover:border-cyan-500/20
            "
          >

            <div className="mb-8">

              <div className="text-5xl font-bold text-cyan-400">
                100%
              </div>

              <p
                className="
                  mt-2
                  text-sm
                  uppercase
                  tracking-wider
                  text-slate-400
                "
              >
                INDIVIDUELLE LÖSUNGEN
              </p>

            </div>

            <div
              className="
                mb-6
                inline-flex
                w-fit
                rounded-full
                border
                border-cyan-500/20
                px-4
                py-1
                text-sm
                text-cyan-400
              "
            >
              Mittelstand
            </div>

            <div className="flex flex-1 flex-col">

              <div className="min-h-[130px]">
                <h3 className="font-semibold text-white">
                    Herausforderung
                </h3>

                <p className="mt-2 text-slate-400">
                  Verteilte Prozesse ohne zentrale
                  Steuerung.
                </p>
              </div>

              <div className="min-h-[140px]">
                <h3 className="font-semibold text-white">
                    Umsetzung
                </h3>

                <p className="mt-2 text-slate-400">
                  Einführung automatisierter
                  Prozessketten und API-Anbindungen.
                </p>
              </div>
                <div
                    className="
                        mt-4
                        rounded-2xl
                        border
                        border-cyan-500/10
                        bg-cyan-500/5
                        p-4
                    "
                    >
                <h3 className="font-semibold text-white">
                    Ergebnis
                </h3>

                <p className="mt-2 font-medium text-cyan-400">
                    Höhere Transparenz, weniger Abstimmungsaufwand
                    und deutlich schnellere Bearbeitungszeiten.
                </p>
                </div>
            </div>

          </div>

        </div>

      </Container>

    </section>
  );
}