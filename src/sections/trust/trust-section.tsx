import Container from "@/components/layout/container";

export default function TrustSection() {
  return (
    <section className="py-32">
      <Container>

        <div className="max-w-3xl">

          <p className="font-medium text-cyan-400">
            VERTRAUEN & EXPERTISE
          </p>

          <h2 className="mt-4 text-5xl font-bold">
            Technologie, Prozesse und
            strukturierte Umsetzung.
          </h2>

          <p className="mt-8 text-lg leading-relaxed text-slate-400">
            Moderne Lösungen entstehen durch die
            Kombination aus Fachwissen,
            Technologieverständnis und einer
            strukturierten Vorgehensweise.
          </p>

        </div>

        <div
  className="
    mt-20
    grid
    gap-8
    md:grid-cols-2
  "
>

  {/* TECHNOLOGIEN */}

  <div
    className="
      rounded-3xl
      border
      border-white/10
      bg-white/3
      p-8
    "
  >

    <h3 className="text-2xl font-semibold">
      Technologien
    </h3>

    <div
      className="
        mt-6
        flex
        flex-wrap
        gap-3
      "
    >
      <span className="rounded-full border border-white/10 px-4 py-2 text-sm">
        n8n
      </span>

      <span className="rounded-full border border-white/10 px-4 py-2 text-sm">
        OpenAI
      </span>

      <span className="rounded-full border border-white/10 px-4 py-2 text-sm">
        APIs
      </span>

      <span className="rounded-full border border-white/10 px-4 py-2 text-sm">
        Python
      </span>

      <span className="rounded-full border border-white/10 px-4 py-2 text-sm">
        SQL
      </span>

      <span className="rounded-full border border-white/10 px-4 py-2 text-sm">
        Microsoft 365
      </span>
    </div>

  </div>

  {/* BRANCHEN */}

  <div
    className="
      rounded-3xl
      border
      border-white/10
      bg-white/3
      p-8
    "
  >

    <h3 className="text-2xl font-semibold">
      Branchen
    </h3>

    <ul className="mt-6 space-y-3 text-slate-300">

      <li>Industrie</li>

      <li>Mittelstand</li>

      <li>Dienstleistung</li>

      <li>Finanzumfeld</li>

    </ul>

  </div>

  {/* PROJEKTARTEN */}

  <div
    className="
      rounded-3xl
      border
      border-white/10
      bg-white/3
      p-8
    "
  >

    <h3 className="text-2xl font-semibold">
      Projektarten
    </h3>

    <ul className="mt-6 space-y-3 text-slate-300">

      <li>Prozessautomatisierung</li>

      <li>Systemintegration</li>

      <li>Workflow-Optimierung</li>

      <li>AI-gestützte Lösungen</li>

    </ul>

  </div>

  {/* METHODIK */}

  <div
    className="
      rounded-3xl
      border
      border-white/10
      bg-white/3
      p-8
    "
  >

    <h3 className="text-2xl font-semibold">
      Methodik
    </h3>

    <ul className="mt-6 space-y-3 text-slate-300">

      <li>Analyse</li>

      <li>Konzeption</li>

      <li>Umsetzung</li>

      <li>Optimierung</li>

    </ul>

  </div>

</div>

      </Container>
    </section>
  );
}