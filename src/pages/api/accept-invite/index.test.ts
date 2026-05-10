import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/pages/api/accept-invite/index";
import { getUserFromContext } from "@/utils/auth";
import { TeamMemberService } from "@application/services";
import { getRepositoryRegistry } from "@infrastructure/registry";

// Mock the getUserFromContext function
vi.mock("@/utils/auth", () => ({
  getUserFromContext: vi.fn(),
}));

// Mock the TeamMemberService
vi.mock("@application/services", () => {
  const mockAddTeamMember = vi.fn().mockResolvedValue({ id: 1, space_id: 1, user_id: 1, role_id: 4, created_at: new Date().toISOString() });
  
  const TeamMemberService = vi.fn().mockImplementation(function() {
    this.addTeamMember = mockAddTeamMember;
  });
  
  return { TeamMemberService };
});

// Mock the getRepositoryRegistry function
vi.mock("@infrastructure/registry", () => ({
  getRepositoryRegistry: vi.fn().mockReturnValue({
    getPendingInvitationRepository: vi.fn().mockReturnValue({
      findByToken: vi.fn().mockResolvedValue({
        id: 1,
        space_id: 1,
        email: "test@example.com",
        role_id: 4,
        token: "test-token",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }),
      update: vi.fn().mockResolvedValue(undefined),
    }),
    getUserRepository: vi.fn().mockReturnValue({
      findByEmail: vi.fn().mockResolvedValue({
        id: 1,
        username: "testuser",
        email: "test@example.com",
      }),
    }),
  }),
}));

describe("POST /api/accept-invite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if the user is not authenticated", async () => {
    vi.mocked(getUserFromContext).mockReturnValue(null);

    const context = {
      params: {},
      request: {
        json: vi.fn().mockResolvedValue({ token: "test-token" }),
      },
    };

    const response = await POST(context as any);

    expect(response.status).toBe(401);
  });

  it("should return 400 if the token is invalid or expired", async () => {
    vi.mocked(getUserFromContext).mockReturnValue({ id: 1 });
    vi.mocked(getRepositoryRegistry).mockReturnValue({
      getPendingInvitationRepository: vi.fn().mockReturnValue({
        findByToken: vi.fn().mockResolvedValue(null),
      }),
      getUserRepository: vi.fn().mockReturnValue({
        findByEmail: vi.fn().mockResolvedValue(null),
      }),
    });

    const context = {
      params: {},
      request: {
        json: vi.fn().mockResolvedValue({ token: "invalid-token" }),
      },
    };

    const response = await POST(context as any);

    expect(response.status).toBe(400);
  });

  it("should return 200 if the invitation is accepted successfully", async () => {
    vi.mocked(getUserFromContext).mockReturnValue({ id: 1 });
    vi.mocked(getRepositoryRegistry).mockReturnValue({
      getPendingInvitationRepository: vi.fn().mockReturnValue({
        findByToken: vi.fn().mockResolvedValue({
          id: 1,
          space_id: 1,
          email: "test@example.com",
          role_id: 4,
          token: "test-token",
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }),
        update: vi.fn().mockResolvedValue(undefined),
      }),
      getUserRepository: vi.fn().mockReturnValue({
        findByEmail: vi.fn().mockResolvedValue({
          id: 1,
          username: "testuser",
          email: "test@example.com",
        }),
      }),
    });

    const context = {
      params: {},
      request: {
        json: vi.fn().mockResolvedValue({ token: "test-token" }),
      },
    };

     const response = await POST(context as any);

     console.log("Response status:", response.status);
     if (response.status === 500) {
       const body = await response.json();
       console.log("Error body:", body);
     }

     expect(response.status).toBe(200);
  });
});