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
      className="
        relative
        py-32
      "
    >

      <Container>

        {/* HEADER */}

        <div
          className="
            mb-20
          "
        >

          <SectionHeading

            eyebrow="LEISTUNGEN"

            title="Moderne Lösungen für strukturierte digitale Prozesse"

            description="
            Von AI-gestützter Automatisierung
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

            title="Prozessautomatisierung"

            description="
            Automatisierung repetitiver
            Geschäftsprozesse durch
            moderne Workflow-Systeme
            und intelligente Integrationen.
            "
          />

          {/* CARD 2 */}

          <ServiceCard

            icon={
              <Bot size={28} />
            }

            title="AI-gestützte Lösungen"

            description="
            Moderne AI-Systeme zur
            Optimierung von Abläufen,
            Datenverarbeitung und
            Entscheidungsprozessen.
            "
          />

          {/* CARD 3 */}

          <ServiceCard

            icon={
              <Network size={28} />
            }

            title="Systemintegration"

            description="
            Verbindung bestehender
            Systeme, APIs und Plattformen
            für effiziente digitale Prozesse.
            "
          />

          {/* CARD 4 */}

          <ServiceCard

            icon={
              <BriefcaseBusiness size={28} />
            }

            title="IT-Consulting"

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