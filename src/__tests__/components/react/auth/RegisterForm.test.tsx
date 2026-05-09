import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import RegisterForm from "@components/react/auth/RegisterForm";
import { vi } from "vitest";

describe("RegisterForm", () => {
  it("shows error when passwords do not match", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/unique codename/i), "jose");
    await user.type(screen.getByLabelText(/digital mailbox/i), "jose@example.com");
    await user.type(screen.getByLabelText(/security key/i), "password123");
    await user.type(screen.getByLabelText(/verify key/i), "password999");

    await user.click(screen.getByRole("button", { name: /initialize account/i }));

    expect(screen.getByText("Passphrase mismatch detected.")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits registration and shows API error message", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ error: "User already exists" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<RegisterForm />);

    await user.type(screen.getByLabelText(/unique codename/i), "jose");
    await user.type(screen.getByLabelText(/digital mailbox/i), "jose@example.com");
    await user.type(screen.getByLabelText(/security key/i), "password123");
    await user.type(screen.getByLabelText(/verify key/i), "password123");

    await user.click(screen.getByRole("button", { name: /initialize account/i }));

    expect(fetchMock).toHaveBeenCalledWith("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        username: "jose",
        email: "jose@example.com",
        password: "password123",
      }),
    });

    expect(await screen.findByText("User already exists")).toBeInTheDocument();
  });
});
