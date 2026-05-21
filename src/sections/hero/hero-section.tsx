import Container from "@/components/layout/container";
import Button from "@/components/ui/button";

export default function HeroSection() {

  return (

    <section
      className="
        relative
        overflow-hidden
        pt-32
        pb-28
      "
    >

      {/* BACKGROUND GLOW */}

      <div
        className="
          absolute
          left-1/2
          top-0
          h-[500px]
          w-[500px]
          -translate-x-1/2
          rounded-full
          bg-blue-500/20
          blur-[140px]
        "
      />

      {/* SECONDARY GLOW */}

      <div
        className="
          absolute
          right-0
          top-40
          h-[300px]
          w-[300px]
          rounded-full
          bg-cyan-500/10
          blur-[120px]
        "
      />

      <Container>

        <div
          className="
            relative
            z-10
            mx-auto
            flex
            max-w-5xl
            flex-col
            items-center
            text-center
          "
        >

          {/* EYEBROW */}

          <div
            className="
              mb-6
              text-sm
              font-medium
              uppercase
              tracking-[0.3em]
              text-cyan-400
            "
          >
            SCHÖNAU IT
          </div>

          {/* HEADLINE */}

          <h1
            className="
              max-w-5xl
              text-5xl
              font-semibold
              leading-[1]
              tracking-tight

              sm:text-6xl
              md:text-7xl
            "
          >
            Moderne IT-Beratung
            <br />

            <span className="text-gradient">
              & AI-gestützte
            </span>

            <br />

            Prozessoptimierung
          </h1>

          {/* SUBTEXT */}

          <p
            className="
              mt-10
              max-w-2xl
              text-lg
              leading-relaxed
              text-slate-400
              md:text-xl
            "
          >
            Strukturierte IT-Projekte,
            intelligente Automatisierung
            und moderne AI-Lösungen
            für Unternehmen.
          </p>

          {/* CTA */}

          <div
            className="
              mt-12
              flex
              flex-col
              gap-4
              sm:flex-row
            "
          >
            <Button>
              Kostenloses Erstgespräch
            </Button>

            <Button variant="secondary">
              Leistungen ansehen
            </Button>
          </div>

          {/* TRUST BAR */}

          <div
            className="
              mt-20
              grid
              w-full
              grid-cols-1
              gap-6

              md:grid-cols-3
            "
          >

            {/* CARD 1 */}

            <div
              className="
                card-blur
                border-subtle
                rounded-2xl
                p-6
              "
            >
              <div
                className="
                  text-3xl
                  font-semibold
                "
              >
                Enterprise
              </div>

              <div
                className="
                  mt-2
                  text-sm
                  text-slate-400
                "
              >
                Strukturierte Projektsteuerung
                und professionelle Umsetzung
              </div>
            </div>

            {/* CARD 2 */}

            <div
              className="
                card-blur
                border-subtle
                rounded-2xl
                p-6
              "
            >
              <div
                className="
                  text-3xl
                  font-semibold
                "
              >
                AI & Automation
              </div>

              <div
                className="
                  mt-2
                  text-sm
                  text-slate-400
                "
              >
                Moderne Prozessoptimierung
                mit intelligenten Workflows
              </div>
            </div>

            {/* CARD 3 */}

            <div
              className="
                card-blur
                border-subtle
                rounded-2xl
                p-6
              "
            >
              <div
                className="
                  text-3xl
                  font-semibold
                "
              >
                Consulting
              </div>

              <div
                className="
                  mt-2
                  text-sm
                  text-slate-400
                "
              >
                Business-orientierte Lösungen
                mit technischem Fokus
              </div>
            </div>

          </div>

        </div>

      </Container>

    </section>
  );
}