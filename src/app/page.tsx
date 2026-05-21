import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ServicesSection from "@/sections/services/services-section";
import HeroSection from "@/sections/hero/hero-section";
import ProcessSection from "@/sections/process/process-section";

export default function HomePage() {

  return (
    <>

      <Navbar />

      <main>

  <HeroSection />
  <ServicesSection />
  <ProcessSection />
</main>

      <Footer />

    </>
  );
}