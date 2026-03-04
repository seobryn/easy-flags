import { Permission } from "../../domain/models";
import { PermissionRepository } from "../../infrastructure/repositories/permissionRepository";

export class PermissionService {
  constructor(private readonly permissionRepository: PermissionRepository) {}

  async listPermissions(): Promise<Permission[]> {
    return this.permissionRepository.listAll();
  }

  async createPermission(name: string, description?: string): Promise<void> {
    // Check if permission already exists
    const existing = await this.permissionRepository.findByName(name);
    if (existing) {
      throw new Error(`Permission "${name}" already exists`);
    }
    await this.permissionRepository.create(name, description);
  }

  async updatePermission(
    id: number,
    name: string,
    description?: string,
  ): Promise<void> {
    // Check if permission with this name already exists
    const existing = await this.permissionRepository.findByName(name);
    if (existing && existing.id !== id) {
      throw new Error(`Permission "${name}" already exists`);
    }
    await this.permissionRepository.update(id, name, description);
  }

  async deletePermission(id: number): Promise<void> {
    const permission = await this.permissionRepository.findById(id);
    if (!permission) {
      throw new Error("Permission not found");
    }
    await this.permissionRepository.delete(id);
  }

  async getRolePermissions(roleId: number): Promise<Permission[]> {
    return this.permissionRepository.getRolePermissions(roleId);
  }
}
