import Container from "./container";

export default function Footer() {
  return (
    <footer
      className="
        border-t
        border-white/5
        py-10
      "
    >
      <Container>

        <div
          className="
            flex
            flex-col
            gap-4
            md:flex-row
            md:items-center
            md:justify-between
          "
        >

          <div>

            <div className="font-semibold">
              Schönau IT
            </div>

            <div
              className="
                text-sm
                text-slate-400
              "
            >
              Moderne IT- &
              AI-Beratung
            </div>

          </div>

          <div
            className="
              text-sm
              text-slate-500
            "
          >
            © 2026 Schönau IT
          </div>

        </div>

      </Container>
    </footer>
  );
}