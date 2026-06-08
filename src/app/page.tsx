import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ServicesSection from "@/sections/services/services-section";
import HeroSection from "@/sections/hero/hero-section";
import ProcessSection from "@/sections/process/process-section";
import CaseStudiesSection from "@/sections/case-studies/case-studies-section";
import AboutSection from "@/sections/about/about-section";
import ContactSection from "@/sections/contact/contact-section";

export default function HomePage() {

  return (
    <>

      <Navbar />

      <main>

  <HeroSection />
  <ServicesSection />
  <ProcessSection />
  <CaseStudiesSection />
  <AboutSection />
  <ContactSection />
</main>

      <Footer />

    </>
  );
}