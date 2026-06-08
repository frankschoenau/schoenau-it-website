"use client";

import { useState } from "react";
import Container from "./container";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            h-16
            items-center
            justify-between
          "
        >
          {/* LOGO */}

          <div
            className="
              text-base
              font-semibold
              tracking-tight
            "
          >
            Schönau IT
          </div>

          {/* DESKTOP NAVIGATION */}

          <nav
            className="
              hidden
              gap-8
              md:flex
              md:items-center
            "
          >
            <a href="#leistungen">
              Leistungen
            </a>

            <a href="#referenzen">
              Referenzen
            </a>

            <a href="#ueber-mich">
              Über mich
            </a>

            <a href="#kontakt">
              Kontakt
            </a>
          </nav>

          {/* DESKTOP CTA */}

          <a
            href="#kontakt"
            className="
              hidden
              md:inline-flex

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
            Kostenloses Erstgespräch
          </a>

          {/* MOBILE HAMBURGER */}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="
              flex
              md:hidden

              items-center
              justify-center

              h-10
              w-10

              rounded-full
              border
              border-white/10

              text-lg
            "
          >
            ☰
          </button>
        </div>
      </Container>

      {/* MOBILE MENU */}

      {mobileMenuOpen && (
        <div
          className="
            md:hidden

            border-t
            border-white/5

            bg-[#0b1120]
          "
        >
          <div
            className="
              flex
              flex-col

              gap-3
              p-4
            "
          >
            <a
              href="#leistungen"
              onClick={() => setMobileMenuOpen(false)}
            >
              Leistungen
            </a>

            <a
              href="#referenzen"
              onClick={() => setMobileMenuOpen(false)}
            >
              Referenzen
            </a>

            <a
              href="#ueber-mich"
              onClick={() => setMobileMenuOpen(false)}
            >
              Über mich
            </a>

            <a
              href="#kontakt"
              onClick={() => setMobileMenuOpen(false)}
            >
              Kontakt
            </a>

            {/* CTA getrennt */}

            <div
              className="
                mt-2
                border-t
                border-white/10
                pt-4
              "
            >
              <a
                href="#kontakt"
                onClick={() => setMobileMenuOpen(false)}
                className="
                  block

                  rounded-xl
                  bg-blue-600

                  px-4
                  py-2.5

                  text-center
                  text-sm
                  font-medium

                  transition
                  hover:bg-blue-700
                "
              >
                Kostenloses Erstgespräch
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}