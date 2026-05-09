import { render, screen } from "@testing-library/react";
import QuickStartSection from "@components/react/QuickStartSection";

describe("QuickStartSection", () => {
  it("renders quick-start resources with expected links", () => {
    render(<QuickStartSection />);

    expect(
      screen.getByRole("heading", { name: /quick start/i }),
    ).toBeInTheDocument();

    const docsHref = screen.getByRole("link", { name: /documentation/i }).getAttribute("href");
    expect(docsHref).toMatch(/\/docs$/);

    const apiHref = screen.getByRole("link", { name: /api reference/i }).getAttribute("href");
    expect(apiHref).toMatch(/\/api-reference$/);

    const supportHref = screen.getByRole("link", { name: /support/i }).getAttribute("href");
    expect(supportHref).toMatch(/\/contact$/);
  });
});
