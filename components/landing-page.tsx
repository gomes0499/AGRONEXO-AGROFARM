"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-50 bg-transparent">
        <nav className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-2 w-64 h-24">
                <Image
                  src="/logo.svg"
                  alt="Logo"
                  width={1000}
                  height={1000}
                  quality={100}
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                href="/auth/login"
                className="bg-[#1a1f5a] hover:bg-[#2a3270] text-white px-6 py-2.5 rounded-full font-medium transition-colors flex items-center space-x-2"
              >
                <span>Login</span>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-[#17134F] hover:text-[#2a3270] focus:outline-none"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={
                      isMenuOpen
                        ? "M6 18L18 6M6 6l12 12"
                        : "M4 6h16M4 12h16M4 18h16"
                    }
                  />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <Image
            src="/cover.jpg"
            alt="Background"
            width={1280}
            height={1280}
            className="object-cover w-full h-full"
            quality={100}
          />
        </div>

        {/* Content */}
        <div className="relative z-20 container mx-auto px-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#1a1f5a] leading-tight mb-6">
              TECNOLOGIA QUE
              <br />
              TRANSFORMA O<br />
              AGRO
            </h1>

            <p className="text-lg md:text-xl text-gray-100 mb-8 leading-relaxed">
              Nossa plataforma integrada moderniza suas operações, oferecendo
              controle total, desde o planejamento da safra até a análise
              financeira estratégica, para impulsionar seus resultados no
              agronegócio.
            </p>

            <button className="bg-[#17134F] hover:bg-[#2a3270] text-white px-8 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center space-x-2 group">
              <span>Solicite uma demonstração</span>
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}