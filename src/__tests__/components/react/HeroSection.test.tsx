import { render, screen } from "@testing-library/react";
import HeroSection from "@components/react/HeroSection";
import { describe, it, expect } from "vitest";

describe("HeroSection", () => {
  it("renders heading, CTAs, and hero illustration", () => {
    render(<HeroSection />);

    expect(
      screen.getByRole("heading", { name: /launch ideas/i }),
    ).toBeInTheDocument();

    const getStartedHref = screen.getByRole("link", { name: /get started/i }).getAttribute("href");
    expect(getStartedHref).toMatch(/\/create-account$/);

    const docsHref = screen.getByRole("link", { name: /documentation/i }).getAttribute("href");
    expect(docsHref).toMatch(/\/docs$/);

    expect(screen.getByAltText(/illustration/i)).toBeInTheDocument();
  });
});
