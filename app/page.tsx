import type { Metadata } from "next";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Faq } from "@/components/landing/Faq";
import { Cta } from "@/components/landing/Cta";
import { Footer } from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "AIStack Auditor — Audit Your AI Tool Spending",
  description:
    "Discover hidden costs, redundant tools, and smarter alternatives across your entire AI stack — free, no sign-up required.",
};

export default function Home() {
  return (
    <main className="min-h-screen w-full overflow-x-hidden">
      <Hero />
      <Features />
      <HowItWorks />
      <Faq />
      <Cta />
      <Footer />
    </main>
  );
}
