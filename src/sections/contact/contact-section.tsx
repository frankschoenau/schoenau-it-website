import Container from "@/components/layout/container";

export default function ContactSection() {
  return (
    <section   id="kontakt"  className="py-32" >
      <Container>

        <div
                className="
                    rounded-[40px]
                    border
                    border-white/10
                    bg-white/3
                    p-8
                    md:p-16
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
            KONTAKT
          </p>

          <h2
            className="
                mt-4
                text-4xl
                md:text-5xl
                font-bold
                leading-tight
            "
            >
            Lassen Sie uns über Ihr Projekt sprechen.
          </h2>

          <p
            className="
              mx-auto
              mt-8
              max-w-3xl
              text-lg
              leading-relaxed
              text-slate-400
            "
          >
            Ob Prozessoptimierung, Automatisierung,
            Systemintegration oder KI-Lösungen –
            gemeinsam finden wir heraus, wie sich
            Ihre Abläufe effizienter und
            zukunftssicher gestalten lassen.
          </p>
            <div
  className="
    mt-12
    flex
    flex-col
    items-center
    gap-6
  "
>

  <a
    href="mailto:info@schoenau-it.de"
    className="
      inline-flex
      items-center
      justify-center
      rounded-xl
      bg-cyan-500
      px-8
      py-4
      text-lg
      font-medium
      text-slate-950
      transition-all
      duration-300
      hover:scale-105
    "
  >
    Kostenloses Erstgespräch vereinbaren
  </a>

 <div
  className="
    flex
    flex-col
    items-center
    gap-2
  "
>

  <p className="font-semibold text-white">
    Frank Schönau
  </p>

  <p className="text-slate-400">
    Berater für Digitalisierung, Automatisierung und KI
  </p>
    <p className="text-slate-400">
    Groß-Zimmern · Rhein-Main
    </p>
  <a
    href="mailto:frank@schoenau-it.de"
    className="mt-2 text-slate-400 hover:text-cyan-400"
  >
    info@schoenau-it.de
  </a>
  <a
  href="tel:+4915152450742"
  className="text-slate-400 hover:text-cyan-400"
>
  0151 / 52450742
</a>

  <a
    href="https://www.linkedin.com/in/frankschoenau2025"
    target="_blank"
    rel="noopener noreferrer"
    className="text-slate-400 hover:text-cyan-400"
  >
    LinkedIn Profil
  </a>

</div>

</div>
        </div>

      </Container>
    </section>
  );
}