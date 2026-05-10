import { describe, it, expect, vi, beforeEach } from "vitest";
import { TeamMemberService } from "@/application/services";
import { getRepositoryRegistry } from "@infrastructure/registry";

// Mock the getRepositoryRegistry function
vi.mock("@infrastructure/registry", () => ({
  getRepositoryRegistry: vi.fn().mockReturnValue({
    getPendingInvitationRepository: vi.fn().mockReturnValue({
      create: vi.fn().mockResolvedValue({
        id: 1,
        space_id: 1,
        email: "test@example.com",
        role_id: 4,
        token: "test-token",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }),
    }),
  }),
}));

// Since generateUniqueToken is private, we'll test the actual behavior
// by checking that a token is generated and has the expected format

describe("TeamMemberService", () => {
  let teamMemberService: TeamMemberService;
  let mockRegistry: any;

  beforeEach(() => {
    mockRegistry = getRepositoryRegistry();
    teamMemberService = new TeamMemberService();
  });

  describe("generateInvitationToken", () => {
     it("should generate an invitation token and store it in the database", async () => {
       const spaceId = 1;
       const email = "test@example.com";
       const roleId = 4;

       const token = await teamMemberService.generateInvitationToken(spaceId, email, roleId);

       // Check that a token was generated (it will be a random string)
       expect(token).toBeTruthy();
       expect(token.length).toBeGreaterThan(0);
       
       // Check that the repository was called with the correct parameters
       expect(mockRegistry.getPendingInvitationRepository().create).toHaveBeenCalledWith({
         space_id: spaceId,
         email,
         role_id: roleId,
         token: token,
         expires_at: expect.any(Date),
       });
     });

     it("should generate a token that expires in 7 days", async () => {
       const spaceId = 1;
       const email = "test@example.com";
       const roleId = 4;

       const now = Date.now();
       const token = await teamMemberService.generateInvitationToken(spaceId, email, roleId);

       // Check that expires_at is approximately 7 days from now (allowing some margin for execution time)
       const expectedExpiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000);
       const actualCall = mockRegistry.getPendingInvitationRepository().create.mock.calls[0][0];
       
       expect(actualCall.expires_at.getTime()).toBeCloseTo(expectedExpiresAt.getTime(), -2);
     });
  });
});