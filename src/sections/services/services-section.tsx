import Container from "@/components/layout/container";
import SectionHeading from "@/components/ui/section-heading";
import ServiceCard from "@/components/ui/service-card";

import {
  Workflow,
  Bot,
  Network,
  BriefcaseBusiness,
} from "lucide-react";

export default function ServicesSection() {
  return (
    <section
      id="leistungen"
      className="
        relative
        py-32
      "
    >
      <Container>

        {/* HEADER */}

        <div
          className="
            mb-12
          "
        >
          <SectionHeading
            eyebrow="LEISTUNGEN"
            title="Moderne Lösungen für strukturierte digitale Prozesse"
            description="
            Von KI gestützter Automatisierung
            bis hin zu professioneller
            IT-Projektsteuerung und
            Prozessoptimierung.
            "
          />
        </div>

        {/* GRID */}

        <div
          className="
            grid
            gap-8

            md:grid-cols-2
          "
        >

          {/* CARD 1 */}

          <ServiceCard
            icon={
              <Workflow size={28} />
            }
            title="Prozesse automatisieren"
            description="
            Weniger manuelle Arbeit,
            schnellere Abläufe und
            mehr Zeit für wertschöpfende Aufgaben.
            "
          />

          {/* CARD 2 */}

          <ServiceCard
            icon={
              <Bot size={28} />
            }
            title="KI sinnvoll einsetzen"
            description="
            Praktische KI-Lösungen,
            die Mitarbeiter unterstützen
            und Prozesse effizienter machen.
            "
          />

          {/* CARD 3 */}

          <ServiceCard
            icon={
              <Network size={28} />
            }
            title="Systeme verbinden"
            description="
            Daten und Anwendungen
            nahtlos verknüpfen statt
            doppelt erfassen und pflegen.
            "
          />

          {/* CARD 4 */}

          <ServiceCard
            icon={
              <BriefcaseBusiness size={28} />
            }
            title="Digitalisierung begleiten"
            description="
            Strukturierte Beratung,
            Projektsteuerung und
            strategische Unterstützung
            für moderne IT-Initiativen.
            "
          />

        </div>

      </Container>
    </section>
  );
}