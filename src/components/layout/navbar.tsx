import Container from "./container";

export default function Navbar() {
  return (
    <header
      className="
        sticky
        top-0
        z-50
        border-b
        border-white/5
        bg-[#0b1120]/80
        backdrop-blur-xl
      "
    >
      <Container>

        <div
          className="
            flex
            h-20
            items-center
            justify-between
          "
        >

          {/* LOGO */}

          <div
            className="
              text-lg
              font-semibold
              tracking-tight
            "
          >
            Schönau IT
          </div>

          {/* NAVIGATION */}

          <nav
            className="
              hidden
              gap-8
              md:flex
            "
          >
            <a href="#">
              Leistungen
            </a>

            <a href="#">
              Projekte
            </a>

            <a href="#">
              Über mich
            </a>

            <a href="#">
              Kontakt
            </a>
          </nav>

          {/* CTA BUTTON */}

          <button
            className="
              rounded-full
              bg-blue-600
              px-5
              py-2
              text-sm
              font-medium
              transition
              hover:bg-blue-700
            "
          >
            Erstgespräch
          </button>

        </div>

      </Container>
    </header>
  );
}