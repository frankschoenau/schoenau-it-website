import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

export default function HomePage() {

  return (
    <>

      <Navbar />

      <main>

        <section
          className="
            section-spacing
          "
        >

          <div className="container-custom">

            <h1
              className="
                text-6xl
                font-semibold
                tracking-tight
              "
            >
              Schönau IT
            </h1>

          </div>

        </section>

      </main>

      <Footer />

    </>
  );
}