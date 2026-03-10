import { Space, SpaceUser } from "../../domain/models";
import { SpaceRepository } from "../../infrastructure/repositories/spaceRepository";

export class SpaceService {
  constructor(private readonly spaceRepository: SpaceRepository) {}

  async createSpace(
    name: string,
    ownerId: number,
    description?: string,
  ): Promise<Space> {
    if (!name || name.trim().length === 0) {
      throw new Error("Space name is required");
    }
    return this.spaceRepository.create(name, ownerId, description);
  }

  async getSpaceById(id: number): Promise<Space | undefined> {
    return this.spaceRepository.findById(id);
  }

  async getUserSpaces(userId: number): Promise<Space[]> {
    return this.spaceRepository.listByUserId(userId);
  }

  async getOwnedSpaces(userId: number): Promise<Space[]> {
    return this.spaceRepository.findByOwnerId(userId);
  }

  async updateSpace(
    id: number,
    userId: number,
    name?: string,
    description?: string,
  ): Promise<Space | undefined> {
    // Check if user is the owner
    const isOwner = await this.spaceRepository.isSpaceOwner(id, userId);
    if (!isOwner) {
      throw new Error("Only space owner can update space");
    }

    return this.spaceRepository.update(id, name, description);
  }

  async deleteSpace(id: number, userId: number): Promise<boolean> {
    // Check if user is the owner
    const isOwner = await this.spaceRepository.isSpaceOwner(id, userId);
    if (!isOwner) {
      throw new Error("Only space owner can delete space");
    }

    return this.spaceRepository.deleteById(id);
  }

  async addUserToSpace(
    spaceId: number,
    userId: number,
    roleId: number,
    requestedByUserId: number,
  ): Promise<SpaceUser> {
    // Check if requester is space owner or admin
    const isOwner = await this.spaceRepository.isSpaceOwner(
      spaceId,
      requestedByUserId,
    );
    if (!isOwner) {
      throw new Error("Only space owner can add users to space");
    }

    // Check if user already exists in space
    const exists = await this.spaceRepository.isUserInSpace(spaceId, userId);
    if (exists) {
      throw new Error("User is already a member of this space");
    }

    return this.spaceRepository.addUser(spaceId, userId, roleId);
  }

  async removeUserFromSpace(
    spaceId: number,
    userId: number,
    requestedByUserId: number,
  ): Promise<boolean> {
    // Check if requester is space owner
    const isOwner = await this.spaceRepository.isSpaceOwner(
      spaceId,
      requestedByUserId,
    );
    if (!isOwner) {
      throw new Error("Only space owner can remove users from space");
    }

    // Prevent removing owner
    const targetIsOwner = await this.spaceRepository.isSpaceOwner(
      spaceId,
      userId,
    );
    if (targetIsOwner) {
      throw new Error("Cannot remove space owner");
    }

    return this.spaceRepository.removeUser(spaceId, userId);
  }

  async updateUserRole(
    spaceId: number,
    userId: number,
    roleId: number,
    requestedByUserId: number,
  ): Promise<SpaceUser | undefined> {
    // Check if requester is space owner
    const isOwner = await this.spaceRepository.isSpaceOwner(
      spaceId,
      requestedByUserId,
    );
    if (!isOwner) {
      throw new Error("Only space owner can update user roles");
    }

    // Prevent changing owner's role
    const targetIsOwner = await this.spaceRepository.isSpaceOwner(
      spaceId,
      userId,
    );
    if (targetIsOwner) {
      throw new Error("Cannot change space owner role");
    }

    return this.spaceRepository.updateUserRole(spaceId, userId, roleId);
  }

  async getSpaceUsers(
    spaceId: number,
    requestedByUserId: number,
  ): Promise<SpaceUser[]> {
    // Check if user is in space
    const isInSpace = await this.spaceRepository.isUserInSpace(
      spaceId,
      requestedByUserId,
    );
    const isOwner = await this.spaceRepository.isSpaceOwner(
      spaceId,
      requestedByUserId,
    );

    if (!isInSpace && !isOwner) {
      throw new Error("You must be a member of this space");
    }

    return this.spaceRepository.getSpaceUsers(spaceId);
  }

  async getUserRoleInSpace(
    spaceId: number,
    userId: number,
  ): Promise<number | undefined> {
    return this.spaceRepository.getUserRole(spaceId, userId);
  }

  async isUserInSpace(spaceId: number, userId: number): Promise<boolean> {
    return this.spaceRepository.isUserInSpace(spaceId, userId);
  }

  async isSpaceOwner(spaceId: number, userId: number): Promise<boolean> {
    return this.spaceRepository.isSpaceOwner(spaceId, userId);
  }
}
