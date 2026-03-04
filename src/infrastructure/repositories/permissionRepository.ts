import getDb from "../../db";
import { Permission, RolePermission } from "../../domain/models";

export class PermissionRepository {
  async findById(id: number): Promise<Permission | undefined> {
    const db = await getDb();
    return db.get<Permission>("SELECT * FROM permissions WHERE id = ?", id);
  }

  async findByName(name: string): Promise<Permission | undefined> {
    const db = await getDb();
    return db.get<Permission>("SELECT * FROM permissions WHERE name = ?", name);
  }

  async listAll(): Promise<Permission[]> {
    const db = await getDb();
    return db.all<Permission[]>("SELECT * FROM permissions ORDER BY name");
  }

  async create(name: string, description?: string): Promise<void> {
    const db = await getDb();
    await db.run(
      "INSERT INTO permissions (name, description) VALUES (?, ?)",
      name,
      description || null,
    );
  }

  async update(id: number, name: string, description?: string): Promise<void> {
    const db = await getDb();
    await db.run(
      "UPDATE permissions SET name = ?, description = ? WHERE id = ?",
      name,
      description || null,
      id,
    );
  }

  async delete(id: number): Promise<void> {
    const db = await getDb();
    // Delete role_permissions first due to foreign key
    await db.run("DELETE FROM role_permissions WHERE permission_id = ?", id);
    // Then delete the permission
    await db.run("DELETE FROM permissions WHERE id = ?", id);
  }

  async assignToRole(roleId: number, permissionId: number): Promise<void> {
    const db = await getDb();
    await db.run(
      "INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
      roleId,
      permissionId,
    );
  }

  async removeFromRole(roleId: number, permissionId: number): Promise<void> {
    const db = await getDb();
    await db.run(
      "DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?",
      roleId,
      permissionId,
    );
  }

  async getRolePermissions(roleId: number): Promise<Permission[]> {
    const db = await getDb();
    return db.all<Permission[]>(
      `SELECT p.* FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?`,
      roleId,
    );
  }
}
