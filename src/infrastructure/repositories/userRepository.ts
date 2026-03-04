import getDb from "../../db";
import { User, Role } from "../../domain/models";

export class UserRepository {
  async findByUsername(username: string): Promise<User | undefined> {
    const db = await getDb();
    return db.get<User>("SELECT * FROM users WHERE username = ?", username);
  }

  async create(
    username: string,
    password: string,
    roleId?: number,
  ): Promise<void> {
    const db = await getDb();
    await db.run(
      "INSERT INTO users (username, password, role_id) VALUES (?, ?, ?)",
      username,
      password,
      roleId || null,
    );
  }

  async listAll(): Promise<User[]> {
    const db = await getDb();
    return db.all<User[]>(
      "SELECT id, username, password, role_id FROM users ORDER BY id DESC",
    );
  }

  async listAllWithRoles(): Promise<Array<User & { role?: Role }>> {
    const db = await getDb();
    return db.all<Array<User & { role?: Role }>>(
      `SELECT u.*, r.* FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       ORDER BY u.id DESC`,
    );
  }

  async findById(id: number): Promise<User | undefined> {
    const db = await getDb();
    return db.get<User>("SELECT * FROM users WHERE id = ?", id);
  }

  async findByIdWithRole(
    id: number,
  ): Promise<(User & { role?: Role }) | undefined> {
    const db = await getDb();
    return db.get<User & { role?: Role }>(
      `SELECT u.*, r.id as role_id, r.name, r.description FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      id,
    );
  }

  async update(id: number, username: string, password?: string): Promise<void> {
    const db = await getDb();
    if (typeof password !== "undefined") {
      await db.run(
        "UPDATE users SET username = ?, password = ? WHERE id = ?",
        username,
        password,
        id,
      );
    } else {
      await db.run("UPDATE users SET username = ? WHERE id = ?", username, id);
    }
  }

  async assignRole(userId: number, roleId: number): Promise<void> {
    const db = await getDb();
    await db.run("UPDATE users SET role_id = ? WHERE id = ?", roleId, userId);
  }

  async removeRole(userId: number): Promise<void> {
    const db = await getDb();
    await db.run("UPDATE users SET role_id = NULL WHERE id = ?", userId);
  }

  async delete(id: number): Promise<void> {
    const db = await getDb();
    await db.run("DELETE FROM users WHERE id = ?", id);
  }
}
