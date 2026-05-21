import Container from "@/components/layout/container";

import SectionHeading from "@/components/ui/section-heading";

import ProcessStep from "@/components/ui/process-step";

export default function ProcessSection() {

  return (

    <section
      className="
        relative
        overflow-hidden
        py-32
      "
    >

      {/* BACKGROUND GLOW */}

      <div
        className="
          absolute
          left-0
          top-1/2

          h-[400px]
          w-[400px]

          -translate-y-1/2

          rounded-full

          bg-cyan-500/10

          blur-[140px]
        "
      />

      <Container>

        {/* HEADER */}

        <div className="mb-20">

          <SectionHeading

            eyebrow="PROZESS"

            title="Strukturierte Umsetzung moderner digitaler Lösungen"

            description={`
            Von der Analyse bestehender Prozesse
            bis hin zur nachhaltigen Optimierung
            moderner AI- und Automatisierungssysteme.
            `}
          />

        </div>

        {/* PROCESS STEPS */}

        <div
          className="
            relative
            mx-auto
            flex
            max-w-4xl
            flex-col
            gap-10
          "
        >

          {/* STEP 1 */}

          <ProcessStep

            number="01"

            title="Analyse & Strategie"

            description={`
            Analyse bestehender Prozesse,
            technischer Systeme und
            Optimierungspotenziale als
            Grundlage für eine strukturierte
            digitale Strategie.
            `}
          />

          {/* STEP 2 */}

          <ProcessStep

            number="02"

            title="Konzeption & Architektur"

            description={`
            Entwicklung moderner
            Lösungsarchitekturen,
            Workflows und Integrationen
            für effiziente digitale Abläufe.
            `}
          />

          {/* STEP 3 */}

          <ProcessStep

            number="03"

            title="Automatisierung & Integration"

            description={`
            Umsetzung intelligenter
            Automatisierungsprozesse,
            API-Integrationen und
            AI-gestützter Systeme.
            `}
          />

          {/* STEP 4 */}

          <ProcessStep

            number="04"

            title="Optimierung & Skalierung"

            description={`
            Kontinuierliche Verbesserung,
            Monitoring und strategische
            Weiterentwicklung digitaler
            Prozesse und Systeme.
            `}
          />

        </div>

      </Container>

    </section>
  );
}