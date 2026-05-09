import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import SettingsView from "@components/react/SettingsView";

const meResponse = {
  data: {
    id: 1,
    username: "jose",
    email: "jose@example.com",
    role_id: 1,
    is_active: true,
    created_at: "2026-01-10T12:00:00.000Z",
  },
};

const apiKeysResponse = { data: [] };

const preferencesResponse = {
  data: {
    id: 1,
    user_id: 1,
    email_notifications: true,
    security_alerts: true,
    created_at: "2026-01-10T12:00:00.000Z",
    updated_at: "2026-01-10T12:00:00.000Z",
  },
};

describe("SettingsView", () => {
  it("loads and displays profile information", async () => {
    const fetchMock = vi.fn((input: string | URL) => {
      const url = String(input);

      if (url === "/api/auth/me") {
        return Promise.resolve({
          ok: true,
          json: async () => meResponse,
        });
      }

      if (url === "/api/auth/api-keys") {
        return Promise.resolve({
          ok: true,
          json: async () => apiKeysResponse,
        });
      }

      if (url === "/api/auth/preferences") {
        return Promise.resolve({
          ok: true,
          json: async () => preferencesResponse,
        });
      }

      return Promise.resolve({ ok: false, json: async () => ({}) });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<SettingsView />);

    await screen.findByRole("heading", { name: /settings/i });

    expect(screen.getByText("jose")).toBeInTheDocument();
    expect(screen.getByText("jose@example.com")).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/me", {
        credentials: "include",
      });
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/api-keys", {
        credentials: "include",
      });
      expect(fetchMock).toHaveBeenCalledWith("/api/auth/preferences", {
        credentials: "include",
      });
    });
  });

  it("switches tabs and renders security form", async () => {
    const user = userEvent.setup();

    const fetchMock = vi.fn((input: string | URL) => {
      const url = String(input);
      if (url === "/api/auth/me") {
        return Promise.resolve({ ok: true, json: async () => meResponse });
      }
      if (url === "/api/auth/api-keys") {
        return Promise.resolve({ ok: true, json: async () => apiKeysResponse });
      }
      if (url === "/api/auth/preferences") {
        return Promise.resolve({
          ok: true,
          json: async () => preferencesResponse,
        });
      }
      return Promise.resolve({ ok: false, json: async () => ({}) });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<SettingsView />);

    await screen.findByRole("heading", { name: /settings/i });

    await user.click(screen.getByRole("button", { name: /security/i }));

    expect(
      screen.getByRole("heading", { name: /change password/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/enter your current password/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /change password/i }),
    ).toBeInTheDocument();
  });
});
