import { Sprout } from "lucide-react";

import { HeroLanding } from "@/components/ui/hero-1";
import type { HeroLandingProps } from "@/components/ui/hero-1";

export default function Demo() {
  const heroProps: HeroLandingProps = {
    logo: {
      icon: Sprout,
      companyName: "SKYLOOK",
    },
    navigation: [],
    loginText: "",
    loginHref: "",
    title: (
      <span className="flex flex-col items-center gap-3">
        <span className="text-[0.58em] tracking-[0.45em] text-foreground/90">
          SKYLOOK
        </span>
        <span className="text-[0.38em] tracking-[0.1em] text-foreground">
          AgriSense Smart Downlink
        </span>
      </span>
    ),
    description: "Satellite intelligence for bandwidth-aware agricultural response.",
    announcementBanner: {
      text: "TerraMind Tiny mission workflow is live.",
      linkText: "Jump to the command dashboard",
      linkHref: "#summary",
    },
    callToActions: [
      {
        text: "Stage Batch",
        href: "#intake",
        variant: "primary",
      },
      {
        text: "Review Results",
        href: "#results",
        variant: "secondary",
      },
    ],
    titleSize: "large",
    gradientColors: {
      from: "oklch(0.62 0.16 197)",
      to: "oklch(0.73 0.17 96)",
    },
  };

  return <HeroLanding {...heroProps} />;
}
