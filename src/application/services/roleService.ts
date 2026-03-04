import { Role, Permission } from "../../domain/models";
import { RoleRepository } from "../../infrastructure/repositories/roleRepository";
import { PermissionRepository } from "../../infrastructure/repositories/permissionRepository";

export class RoleService {
  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly permissionRepository: PermissionRepository,
  ) {}

  async listRoles(): Promise<Role[]> {
    return this.roleRepository.listAll();
  }

  async getRoleWithPermissions(
    id: number,
  ): Promise<(Role & { permissions: Permission[] }) | null> {
    const role = await this.roleRepository.getRoleWithPermissions(id);
    return role || null;
  }

  async createRole(name: string, description?: string): Promise<void> {
    // Check if role already exists
    const existing = await this.roleRepository.findByName(name);
    if (existing) {
      throw new Error(`Role "${name}" already exists`);
    }
    await this.roleRepository.create(name, description);
  }

  async updateRole(
    id: number,
    name: string,
    description?: string,
  ): Promise<void> {
    // Check if role with this name already exists
    const existing = await this.roleRepository.findByName(name);
    if (existing && existing.id !== id) {
      throw new Error(`Role "${name}" already exists`);
    }
    await this.roleRepository.update(id, name, description);
  }

  async deleteRole(id: number): Promise<void> {
    // Prevent deletion of default roles
    const role = await this.roleRepository.findById(id);
    if (role && ["Admin", "Editor", "Viewer"].includes(role.name)) {
      throw new Error(`Cannot delete default role "${role.name}"`);
    }
    await this.roleRepository.delete(id);
  }

  async assignPermissionToRole(
    roleId: number,
    permissionId: number,
  ): Promise<void> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) throw new Error("Role not found");

    const permission = await this.permissionRepository.findById(permissionId);
    if (!permission) throw new Error("Permission not found");

    await this.permissionRepository.assignToRole(roleId, permissionId);
  }

  async removePermissionFromRole(
    roleId: number,
    permissionId: number,
  ): Promise<void> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) throw new Error("Role not found");

    const permission = await this.permissionRepository.findById(permissionId);
    if (!permission) throw new Error("Permission not found");

    await this.permissionRepository.removeFromRole(roleId, permissionId);
  }

  async setRolePermissions(
    roleId: number,
    permissionIds: number[],
  ): Promise<void> {
    const role = await this.roleRepository.findById(roleId);
    if (!role) throw new Error("Role not found");

    // Get current permissions
    const currentPerms =
      await this.permissionRepository.getRolePermissions(roleId);
    const currentPermIds = currentPerms.map((p) => p.id);

    // Remove permissions not in the new list
    for (const permId of currentPermIds) {
      if (!permissionIds.includes(permId)) {
        await this.permissionRepository.removeFromRole(roleId, permId);
      }
    }

    // Add new permissions
    for (const permId of permissionIds) {
      if (!currentPermIds.includes(permId)) {
        await this.assignPermissionToRole(roleId, permId);
      }
    }
  }
}
