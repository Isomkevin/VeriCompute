import { LandingNav } from "@/components/landing/LandingNav";
import { HeroSection } from "@/components/landing/HeroSection";
import { TrustBar } from "@/components/landing/TrustBar";
import { ProblemSolutionSection } from "@/components/landing/ProblemSolutionSection";
import { FlowSection } from "@/components/landing/FlowSection";
import { UseCasesSection } from "@/components/landing/UseCasesSection";
import { CTASection } from "@/components/landing/CTASection";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { RoadmapSection } from "@/components/RoadmapSection";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#060608] text-white">
      <div className="landing-grid pointer-events-none fixed inset-0 z-0" aria-hidden />
      <div className="relative z-10">
        <LandingNav />
        <HeroSection />
        <TrustBar />
        <ProblemSolutionSection />
        <FlowSection />
        <UseCasesSection />
        <div className="mx-auto max-w-6xl px-6">
          <RoadmapSection />
        </div>
        <CTASection />
        <LandingFooter />
      </div>
    </div>
  );
}
