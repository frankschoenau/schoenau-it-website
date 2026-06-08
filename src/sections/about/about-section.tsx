import Image from "next/image";
import Container from "@/components/layout/container";

export default function AboutSection() {
  return (
    <section   id="ueber-mich"   className="py-32"
>
      <Container>

        <div
          className="
            grid
            gap-16
            items-center
            lg:grid-cols-[1.2fr_0.8fr]
          "
        >

          {/* TEXT */}

          <div>

            <p className="font-medium text-cyan-400">
              ÜBER SCHÖNAU IT
            </p>

            <h2 className="mt-4 text-5xl font-bold">
              Frank Schönau
            </h2>
            <p
                className="
                mt-4
                text-xl
                 text-slate-300
                "
             >
                Business-orientierte IT-Beratung mit Fokus auf Automatisierung und KI
            </p>
            <div
              className="
                mt-8
                inline-flex
                rounded-full
                border
                border-cyan-500/20
                bg-cyan-500/10
                px-5
                py-2
                text-sm
                font-medium
                text-cyan-400
              "
            >
              20+ Jahre IT-Erfahrung
            </div> 
            <div className="
                mt-8
                inline-flex
                rounded-full
                border
                border-cyan-500/20
                bg-cyan-500/10
                px-5
                py-2
                text-sm
                font-medium
                text-cyan-400
              ">
            Business • IT • Automatisierung • KI
            </div>      

            <p className="mt-8 text-lg leading-relaxed text-slate-400">
              Mit über 20 Jahren Erfahrung in IT,
              Digitalisierung und Prozessoptimierung
              unterstütze ich Unternehmen dabei,
              Geschäftsprozesse effizienter,
              transparenter und zukunftssicher
              zu gestalten.
            </p>

            <p className="mt-6 text-lg leading-relaxed text-slate-400">
              Mein Schwerpunkt liegt auf der Verbindung
              von Business-Anforderungen, moderner
              Automatisierung und künstlicher Intelligenz.
              Ziel ist nicht der Einsatz neuer Technologien
              um ihrer selbst willen, sondern die Entwicklung
              praktikabler Lösungen mit messbarem Mehrwert.
            </p>

          </div>

          {/* FOTO */}

          <div
            className="
              relative
              mx-auto
              w-full
              max-w-md
            "
          >

            <div
              className="
                absolute
                inset-0
                rounded-4xl
                bg-cyan-500/10
                blur-3xl
              "
            />

            <div
              className="
                relative
                overflow-hidden
                rounded-4xl
                border
                border-white/10
              "
            >

              <Image
                src="/images/frank-schoenau.jpg"
                alt="Frank Schönau"
                width={800}
                height={1000}
                className="h-auto w-full object-cover"
                priority
              />

            </div>

          </div>

        </div>

        {/* SO ARBEITE ICH */}

        <div
          className="
            mt-24
            rounded-4xl
            border
            border-white/10
            bg-white/3
            p-10
          "
        >

          <p
            className="
              text-sm
              font-medium
              uppercase
              tracking-wider
              text-cyan-400
            "
          >
            Mein Ansatz
          </p>

          <h3 className="mt-3 text-3xl font-semibold">
            So arbeite ich
          </h3>

          <div
            className="
              mt-10
              grid
              gap-8
              md:grid-cols-2
            "
          >

            <div className="flex gap-4">
              <span className="text-cyan-400">✓</span>

              <p className="text-slate-300">
                Business-Prozesse zuerst,
                Technologie danach.
              </p>
            </div>

            <div className="flex gap-4">
              <span className="text-cyan-400">✓</span>

              <p className="text-slate-300">
                Fokus auf praktikable Lösungen
                statt theoretischer Konzepte.
              </p>
            </div>

            <div className="flex gap-4">
              <span className="text-cyan-400">✓</span>

              <p className="text-slate-300">
                Integration in bestehende Abläufe
                statt isolierter Insellösungen.
              </p>
            </div>

            <div className="flex gap-4">
              <span className="text-cyan-400">✓</span>

              <p className="text-slate-300">
                Klare Kommunikation zwischen
                Fachbereich und IT.
              </p>
            </div>

            <div className="flex gap-4">
              <span className="text-cyan-400">✓</span>

              <p className="text-slate-300">
                Messbare Ergebnisse statt reiner
                Implementierung.
              </p>
            </div>

            <div className="flex gap-4">
              <span className="text-cyan-400">✓</span>

              <p className="text-slate-300">
                Strukturierte Umsetzung mit
                langfristigem Nutzen.
              </p>
            </div>

          </div>

        </div>

      </Container>
    </section>
  );
}