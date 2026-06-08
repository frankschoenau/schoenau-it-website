import Container from "@/components/layout/container";
import Button from "@/components/ui/button";

export default function HeroSection() {

  return (

    <section
      className="
        relative
        overflow-hidden
        pt-12
        pb-20
      "
    >

      {/* BACKGROUND GLOW */}

      <div
        className="
          absolute
          left-1/2
          top-0
          h-125
          w-125
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
          h-75
          w-75
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
                text-4xl
                font-semibold
                leading-[1]
                tracking-tight

                sm:text-5xl
                md:text-7xl
              "
            >
            Business-Prozesse
            <br />

            <span className="text-gradient">
              automatisieren
            </span>

            <br />

            und mit KI weiterentwickeln.
          </h1>

          {/* SUBTEXT */}

          <p
            className="
              mt-6
              max-w-2xl
              text-lg
              leading-relaxed
              text-slate-400
              md:text-xl
            "
          >
            Schönau IT unterstützt Unternehmen dabei,
            manuelle Abläufe zu reduzieren, Systeme zu
            verbinden und KI dort einzusetzen, wo sie
            echten Mehrwert schafft.
          </p>

          {/* CTA */}

          <div
            className="
              mt-6
              flex
              flex-col
              gap-3
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

          {/* VALUE CARDS */}

<div
  className="
    mt-8
    grid
    w-full
    grid-cols-1
    gap-6

    md:mt-12
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
      Weniger manuelle Arbeit
    </div>

    <div
      className="
        mt-3
        text-sm
        leading-relaxed
        text-slate-400
      "
    >
      Digitale Prozesse reduzieren
      Routineaufgaben und sparen Zeit.
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
      Systeme verbinden
    </div>

    <div
      className="
        mt-3
        text-sm
        leading-relaxed
        text-slate-400
      "
    >
      Daten und Anwendungen arbeiten
      nahtlos zusammen.
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
     Bessere Entscheidungen
    </div>

    <div
      className="
        mt-3
        text-sm
        leading-relaxed
        text-slate-400
      "
    >
     Relevante Informationen schneller
     finden und gezielt nutzen.
    </div>
  </div>

</div>

        </div>

      </Container>

    </section>
  );
}