import Container from "@/components/layout/container";
import SectionHeading from "@/components/ui/section-heading";
import ProcessStep from "@/components/ui/process-step";

export default function ProcessSection() {
  return (
    <section
      id="prozess"
      className="
        relative
        overflow-hidden

        py-20
        md:py-32
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

        <div
          className="
            mb-12
            md:mb-20
          "
        >
          <SectionHeading
            eyebrow="PROZESS"
            title="So entsteht aus einer Idee eine funktionierende Lösung"
            description={`
            Ein klarer Ablauf von der ersten Analyse bis zur erfolgreichen Umsetzung und kontinuierlichen Weiterentwicklung.
            `}
          />
        </div>

        {/* PROCESS STEPS */}

        <div
          className="
            relative
            mx-auto

            max-w-4xl

            px-2
            sm:px-4
            md:px-0

            flex
            flex-col

            gap-8
            md:gap-10
          "
        >
          <ProcessStep
            number="01"
            title="Verstehen & Analysieren"
            description={`
            Gemeinsam identifizieren wir Engpässe, manuelle Aufwände und Verbesserungspotenziale in Ihren bestehenden Prozessen.
            `}
          />

          <ProcessStep
            number="02"
            title="Lösung entwickeln"
            description={`
            Auf Basis der Analyse entsteht ein praxisnahes Konzept, das zu Ihren Prozessen und Zielen passt.
            `}
          />

          <ProcessStep
            number="03"
            title="Umsetzen & Automatisieren"
            description={`
            Die Lösung wird strukturiert umgesetzt – von Automatisierungen über Systemintegration bis hin zu KI-Anwendungen.
            `}
          />

          <ProcessStep
            number="04"
            title="Optimieren & Weiterentwickeln"
            description={`
            Nach dem Go-Live werden Prozesse weiter verbessert, angepasst und gemeinsam nachhaltig weiterentwickelt.
            `}
          />
        </div>
      </Container>
    </section>
  );
}