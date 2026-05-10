import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import WhyLoveSection from "@components/react/WhyLoveSection";

// Mock the i18n context
vi.mock("@/infrastructure/i18n/context", () => ({
  useTranslate: () => (key: string) => {
    const translations: Record<string, string> = {
      "whyLove.title": "Why Choose Easy Flags?",
      "whyLove.subtitle": "Engineered for performance, built for developers, and designed to give you absolute control over your release cycle.",
      "whyLove.instantRollout": "Instant Rollback",
      "whyLove.instantRollbackDesc": "Roll back any feature instantly without redeploying your application.",
      "whyLove.targetedRollout": "Targeted Rollout",
      "whyLove.targetedRolloutDesc": "Release features to specific user segments and gradually increase visibility.",
      "whyLove.realTimeAnalytics": "Real-time Analytics",
      "whyLove.realTimeAnalyticsDesc": "Monitor feature adoption and user behavior in real-time dashboards.",
      "whyLove.enterpriseSecurity": "Enterprise Security",
      "whyLove.enterpriseSecurityDesc": "Role-based access control with granular permissions for your team.",
      "whyLove.highPerformance": "High Performance",
      "whyLove.highPerformanceDesc": "Lightning-fast flag evaluations with edge caching support.",
      "whyLove.easyIntegration": "Easy Integration",
      "whyLove.easyIntegrationDesc": "Simple API and SDK libraries for all major programming languages.",
    };
    return translations[key] || key;
  },
}));

describe("WhyLoveSection", () => {
  it("renders all key product benefits", () => {
    render(<WhyLoveSection />);

    expect(
      screen.getByRole("heading", { name: /why choose easy flags/i }),
    ).toBeInTheDocument();

    expect(screen.getByText("Instant Rollback")).toBeInTheDocument();
    expect(screen.getByText("Targeted Rollout")).toBeInTheDocument();
    expect(screen.getByText("Real-time Analytics")).toBeInTheDocument();
    expect(screen.getByText("Enterprise Security")).toBeInTheDocument();
    expect(screen.getByText("High Performance")).toBeInTheDocument();
    expect(screen.getByText("Easy Integration")).toBeInTheDocument();
  });
});
