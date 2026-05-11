import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/pages/api/spaces/[spaceId]/team-members/index";
import { getUserFromContext } from "@/utils/auth";
import { checkSpaceAdminAuth } from "@/utils/permissions";

// Import the actual services to mock their prototypes
import { TeamMemberService, SpaceService, EmailService } from "@application/services";
import { getRepositoryRegistry } from "@infrastructure/registry";

// Mock utils
vi.mock("@/utils/auth", () => ({
  getUserFromContext: vi.fn(),
}));

vi.mock("@/utils/permissions", () => ({
  checkSpaceAdminAuth: vi.fn(),
}));

// Mock the registry
vi.mock("@infrastructure/registry", () => ({
  getRepositoryRegistry: vi.fn(),
}));

describe("POST /api/spaces/[spaceId]/team-members", () => {
  let mockGenerateInvitationToken: any;
  let mockGetSpaceBySlug: any;
  let mockSendTeamInvitationEmail: any;
  let mockFindByEmail: any;
  let mockCreateUser: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock functions
    mockGenerateInvitationToken = vi.fn().mockResolvedValue("test-token");
    mockGetSpaceBySlug = vi.fn().mockResolvedValue({
      id: 1,
      name: "Test Space",
      slug: "test-space",
      owner_id: 1,
    });
    mockSendTeamInvitationEmail = vi.fn().mockResolvedValue(undefined);
    
    mockFindByEmail = vi.fn().mockResolvedValue({
      id: 1,
      username: "testuser",
      email: "test@example.com",
    });
    mockCreateUser = vi.fn().mockResolvedValue({
      id: 1,
      username: "testuser",
      email: "test@example.com",
    });
    
    // Mock prototype methods to intercept new instance calls
    vi.spyOn(TeamMemberService.prototype, 'generateInvitationToken').mockImplementation(mockGenerateInvitationToken);
    vi.spyOn(SpaceService.prototype, 'getSpaceBySlug').mockImplementation(mockGetSpaceBySlug);
    vi.spyOn(EmailService.prototype, 'sendTeamInvitationEmail').mockImplementation(mockSendTeamInvitationEmail);
    
    // Mock the registry
    vi.mocked(getRepositoryRegistry).mockReturnValue({
      getUserRepository: vi.fn().mockReturnValue({
        findByEmail: mockFindByEmail,
        create: mockCreateUser,
      }),
    } as any);
  });

  it("should return 401 if the user is not authenticated", async () => {
    vi.mocked(getUserFromContext).mockReturnValue(null);

    const context = {
      params: { spaceId: "test-space" },
      request: {
        json: vi.fn().mockResolvedValue({ email: "test@example.com", role_id: 4 }),
      },
    };

    const response = await POST(context as any);
    expect(response.status).toBe(401);
  });

  it("should return 404 if the space is not found", async () => {
    vi.mocked(getUserFromContext).mockReturnValue({ 
      id: 1, 
      username: "testuser",
      email: "test@example.com"
    });
    mockGetSpaceBySlug.mockResolvedValue(null);

    const context = {
      params: { spaceId: "test-space" },
      request: {
        json: vi.fn().mockResolvedValue({ email: "test@example.com", role_id: 4 }),
      },
    };

    const response = await POST(context as any);
    expect(response.status).toBe(404);
  });

  it("should return 403 if the user is not authorized to manage team members", async () => {
    vi.mocked(getUserFromContext).mockReturnValue({ 
      id: 1, 
      username: "testuser",
      email: "test@example.com"
    });
    vi.mocked(checkSpaceAdminAuth).mockResolvedValue({ 
      isAuthorized: false,
      user: null 
    });
    mockGetSpaceBySlug.mockResolvedValue({
      id: 1,
      name: "Test Space",
      slug: "test-space",
      owner_id: 1,
    });

    const context = {
      params: { spaceId: "test-space" },
      request: {
        json: vi.fn().mockResolvedValue({ email: "test@example.com", role_id: 4 }),
      },
    };

    const response = await POST(context as any);
    expect(response.status).toBe(403);
  });

  it("should return 201 if the team member is added successfully", async () => {
    vi.mocked(getUserFromContext).mockReturnValue({ 
      id: 1, 
      username: "testuser",
      email: "test@example.com"
    });
    vi.mocked(checkSpaceAdminAuth).mockResolvedValue({ 
      isAuthorized: true,
      user: {
        id: 1,
        username: "testuser",
        email: "test@example.com"
      }
    });
    mockGetSpaceBySlug.mockResolvedValue({
      id: 1,
      name: "Test Space",
      slug: "test-space",
      owner_id: 1,
    });
    mockFindByEmail.mockResolvedValue(null); // User doesn't exist
    mockCreateUser.mockResolvedValue({
      id: 1,
      username: "testuser",
      email: "test@example.com",
    });

    const context = {
      params: { spaceId: "test-space" },
      request: {
        json: vi.fn().mockResolvedValue({ email: "test@example.com", role_id: 4 }),
      },
    };

    const response = await POST(context as any);
    expect(response.status).toBe(201);
  });
});