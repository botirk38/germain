import type { Metadata } from "next";
import { Closing } from "@/components/pages/landing/closing";
import { Footer } from "@/components/pages/landing/footer";
import { Hero } from "@/components/pages/landing/hero";
import { Nav } from "@/components/pages/landing/nav";
import { StatusLanguage } from "@/components/pages/landing/status-language";
import { TrustBar } from "@/components/pages/landing/trust-bar";
import { TrustSecurity } from "@/components/pages/landing/trust-security";
import { Workflow } from "@/components/pages/landing/workflow";

export const metadata: Metadata = {
  title: "Attache — stop losing weeks to visa paperwork",
  description:
    "Attache is an AI visa agent that checks your documents, fills the official application, and books your embassy appointment. From upload to decision in days, not weeks.",
};

export default function Home() {
  return (
    <div className="landing">
      <Nav />
      <Hero />
      <TrustBar />
      <Workflow />
      <StatusLanguage />
      <TrustSecurity />
      <Closing />
      <Footer />
    </div>
  );
}
