import getDb from "../../db";
import { Role, Permission, RolePermission } from "../../domain/models";

export class RoleRepository {
  async findById(id: number): Promise<Role | undefined> {
    const db = await getDb();
    return db.get<Role>("SELECT * FROM roles WHERE id = ?", id);
  }

  async findByName(name: string): Promise<Role | undefined> {
    const db = await getDb();
    return db.get<Role>("SELECT * FROM roles WHERE name = ?", name);
  }

  async listAll(): Promise<Role[]> {
    const db = await getDb();
    return db.all<Role>("SELECT * FROM roles ORDER BY name");
  }

  async create(name: string, description?: string): Promise<void> {
    const db = await getDb();
    await db.run(
      "INSERT INTO roles (name, description) VALUES (?, ?)",
      name,
      description || null,
    );
  }

  async update(id: number, name: string, description?: string): Promise<void> {
    const db = await getDb();
    await db.run(
      "UPDATE roles SET name = ?, description = ? WHERE id = ?",
      name,
      description || null,
      id,
    );
  }

  async delete(id: number): Promise<void> {
    const db = await getDb();
    // Delete role_permissions first due to foreign key
    await db.run("DELETE FROM role_permissions WHERE role_id = ?", id);
    // Then delete the role
    await db.run("DELETE FROM roles WHERE id = ?", id);
  }

  async getRoleWithPermissions(
    id: number,
  ): Promise<(Role & { permissions: Permission[] }) | undefined> {
    const db = await getDb();
    const role = await db.get<Role>("SELECT * FROM roles WHERE id = ?", id);
    if (!role) return undefined;

    const permissions = await db.all<Permission>(
      `SELECT p.* FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = ?`,
      id,
    );

    return { ...role, permissions };
  }
}
