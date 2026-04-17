import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CheckoutButton from "@components/react/billing/CheckoutButton";
import type { PricingPlan } from "@domain/entities";
import { vi, describe, it, expect, beforeEach } from "vitest";

const basePlan: PricingPlan = {
  id: 1,
  slug: "pro",
  name: "Pro",
  description: "Pro plan",
  price_usd: 20,
  price_cop: 80000,
  billing_period: "monthly",
  is_active: true,
  is_recommended: false,
  sort_order: 1,
  stripe_price_id: "price_123",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

describe("CheckoutButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    // Mock window.location
    const location = new URL("http://localhost");
    vi.stubGlobal("location", location);
  });

  it("renders a button for free plans", () => {
    render(
      <CheckoutButton
        plan={{ ...basePlan, name: "Free", price_usd: 0 }}
        action="checkout"
        initialLocale="en"
      />
    );

    expect(
      screen.getByRole("button", { name: /get started/i })
    ).toBeInTheDocument();
  });

  it("checks auth and initializes checkout for paid plans", async () => {
    const user = userEvent.setup();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ id: 1 }) }) // /api/auth/me
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              currency: "COP",
              amountInCents: 200000,
              publicKey: "pub_test",
              transaction: { reference: "EF-123" },
              acceptance: {
                acceptanceToken: "token1",
                acceptanceText: "text1",
                dataPrivacyToken: "token2",
                dataPrivacyText: "text2",
              },
            },
          }),
      }); // /api/payments/checkout

    vi.stubGlobal("fetch", fetchMock);

    render(
      <CheckoutButton plan={basePlan} action="checkout" initialLocale="es" />
    );

    await user.click(screen.getByRole("button", { name: /empezar ahora/i }));

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/me", {
      credentials: "include",
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/payments/checkout",
        expect.any(Object)
      );
    });

    // Check if modal title is present (meaning it opened)
    expect(
      await screen.findByText("Datos del Cliente")
    ).toBeInTheDocument();
  });

  it('renders "Upgrade" for upgrade action', () => {
    render(
      <CheckoutButton
        plan={basePlan}
        action="upgrade"
        initialLocale="en"
      />
    );
    expect(
      screen.getByRole("button", { name: /upgrade/i })
    ).toBeInTheDocument();
  });

  it('renders "Downgrade" for downgrade action', () => {
    render(
      <CheckoutButton
        plan={basePlan}
        action="downgrade"
        initialLocale="en"
      />
    );
    expect(
      screen.getByRole("button", { name: /downgrade/i })
    ).toBeInTheDocument();
  });

  it('renders "Current Plan" and is disabled for current action', () => {
    render(
      <CheckoutButton
        plan={basePlan}
        action="current"
        initialLocale="en"
      />
    );
    const button = screen.getByRole("button", { name: /current plan/i });
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('renders "Get Started" for login action', () => {
    render(
      <CheckoutButton
        plan={basePlan}
        action="login"
        initialLocale="en"
      />
    );
    expect(
      screen.getByRole("button", { name: /get started/i })
    ).toBeInTheDocument();
  });

  it('renders "Get Started" for checkout action', () => {
    render(
      <CheckoutButton
        plan={basePlan}
        action="checkout"
        initialLocale="en"
      />
    );
    expect(
      screen.getByRole("button", { name: /get started/i })
    ).toBeInTheDocument();
  });
});

