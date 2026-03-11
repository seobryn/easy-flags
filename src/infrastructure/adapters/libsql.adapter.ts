/**
 * Adapter Layer - LibSQL Database Implementations
 * These implement the port interfaces using LibSQL as the database
 */

import { getDatabase } from "@lib/db";
import type { Client, InArgs } from "@libsql/client";
import type {
  User,
  Role,
  Space,
  SpaceMember,
  Environment,
  CreateSpaceDTO,
  UpdateSpaceDTO,
  CreateEnvironmentDTO,
} from "@domain/entities";
import type {
  UserRepository,
  RoleRepository,
  SpaceRepository,
  SpaceMemberRepository,
  EnvironmentRepository,
} from "@application/ports/repositories";

// ====================
// User Repository Adapter
// ====================

export class LibSqlUserRepository implements UserRepository {
  private db: Client | null = null;

  private async getDb(): Promise<Client> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  async findById(id: number): Promise<User | null> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: "SELECT * FROM users WHERE id = ?",
      args: [id],
    });
    return (result.rows[0] as never as User) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: "SELECT * FROM users WHERE email = ?",
      args: [email],
    });
    return (result.rows[0] as never as User) || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: "SELECT * FROM users WHERE username = ?",
      args: [username],
    });
    return (result.rows[0] as never as User) || null;
  }

  async create(user: Partial<User>): Promise<User> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `INSERT INTO users (username, email, password_hash, role_id, is_active) 
            VALUES (?, ?, ?, ?, ?)`,
      args: [user.username!, user.email!, "", user.role_id || 1, 1],
    });
    const newUser = await this.findById(Number(result.lastInsertRowid));
    if (!newUser) throw new Error("Failed to create user");
    return newUser;
  }

  async update(id: number, updates: Partial<User>): Promise<User> {
    const db = await this.getDb();
    const fields: string[] = [];
    const args: unknown[] = [];

    if (updates.username) {
      fields.push("username = ?");
      args.push(updates.username);
    }
    if (updates.email) {
      fields.push("email = ?");
      args.push(updates.email);
    }
    if (updates.role_id) {
      fields.push("role_id = ?");
      args.push(updates.role_id);
    }
    if (updates.is_active !== undefined) {
      fields.push("is_active = ?");
      args.push(updates.is_active ? 1 : 0);
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");
    args.push(id);

    await db.execute({
      sql: `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      args: args as InArgs,
    });

    const updated = await this.findById(id);
    if (!updated) throw new Error("Failed to update user");
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute({
      sql: "DELETE FROM users WHERE id = ?",
      args: [id],
    });
  }
}

// ====================
// Role Repository Adapter
// ====================

export class LibSqlRoleRepository implements RoleRepository {
  private db: Client | null = null;

  private async getDb(): Promise<Client> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  async findById(id: number): Promise<Role | null> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: "SELECT * FROM roles WHERE id = ?",
      args: [id],
    });
    return (result.rows[0] as never as Role) || null;
  }

  async findByName(name: string): Promise<Role | null> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: "SELECT * FROM roles WHERE name = ?",
      args: [name],
    });
    return (result.rows[0] as never as Role) || null;
  }

  async findAll(): Promise<Role[]> {
    const db = await this.getDb();
    const result = await db.execute("SELECT * FROM roles");
    return result.rows as never as Role[];
  }
}

// ====================
// Space Repository Adapter
// ====================

export class LibSqlSpaceRepository implements SpaceRepository {
  private db: Client | null = null;

  private async getDb(): Promise<Client> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  async findById(id: number): Promise<Space | null> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: "SELECT * FROM spaces WHERE id = ?",
      args: [id],
    });
    return (result.rows[0] as never as Space) || null;
  }

  async findByOwnerId(ownerId: number): Promise<Space[]> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: "SELECT * FROM spaces WHERE owner_id = ? ORDER BY created_at DESC",
      args: [ownerId],
    });
    return result.rows as never as Space[];
  }

  async findAll(): Promise<Space[]> {
    const db = await this.getDb();
    const result = await db.execute("SELECT * FROM spaces");
    return result.rows as never as Space[];
  }

  async create(dto: CreateSpaceDTO, ownerId: number): Promise<Space> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `INSERT INTO spaces (name, description, owner_id) VALUES (?, ?, ?)`,
      args: [dto.name, dto.description || null, ownerId],
    });
    const created = await this.findById(Number(result.lastInsertRowid));
    if (!created) throw new Error("Failed to create space");
    return created;
  }

  async update(id: number, dto: UpdateSpaceDTO): Promise<Space> {
    const db = await this.getDb();
    const updates: string[] = [];
    const args: unknown[] = [];

    if (dto.name) {
      updates.push("name = ?");
      args.push(dto.name);
    }
    if (dto.description !== undefined) {
      updates.push("description = ?");
      args.push(dto.description || null);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    args.push(id);

    await db.execute({
      sql: `UPDATE spaces SET ${updates.join(", ")} WHERE id = ?`,
      args: args as InArgs,
    });

    const updated = await this.findById(id);
    if (!updated) throw new Error("Failed to update space");
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute({
      sql: "DELETE FROM spaces WHERE id = ?",
      args: [id],
    });
  }
}

// ====================
// Space Member Repository Adapter
// ====================

export class LibSqlSpaceMemberRepository implements SpaceMemberRepository {
  private db: Client | null = null;

  private async getDb(): Promise<Client> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  async findById(id: number): Promise<SpaceMember | null> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `SELECT sm.*, u.* FROM space_members sm
            LEFT JOIN users u ON sm.user_id = u.id
            WHERE sm.id = ?`,
      args: [id],
    });
    return (result.rows[0] as never as SpaceMember) || null;
  }

  async findBySpaceId(spaceId: number): Promise<SpaceMember[]> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `SELECT sm.*, u.*, r.* FROM space_members sm
            JOIN users u ON sm.user_id = u.id
            LEFT JOIN roles r ON sm.role_id = r.id
            WHERE sm.space_id = ? ORDER BY sm.created_at DESC`,
      args: [spaceId],
    });
    return result.rows as never as SpaceMember[];
  }

  async findByUserId(userId: number): Promise<SpaceMember[]> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `SELECT sm.*, s.* FROM space_members sm
            JOIN spaces s ON sm.space_id = s.id
            WHERE sm.user_id = ?`,
      args: [userId],
    });
    return result.rows as never as SpaceMember[];
  }

  async findBySpaceAndUser(
    spaceId: number,
    userId: number,
  ): Promise<SpaceMember | null> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `SELECT * FROM space_members WHERE space_id = ? AND user_id = ?`,
      args: [spaceId, userId],
    });
    return (result.rows[0] as never as SpaceMember) || null;
  }

  async create(
    spaceId: number,
    userId: number,
    roleId: number,
  ): Promise<SpaceMember> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `INSERT INTO space_members (space_id, user_id, role_id) VALUES (?, ?, ?)`,
      args: [spaceId, userId, roleId],
    });
    const created = await this.findById(Number(result.lastInsertRowid));
    if (!created) throw new Error("Failed to create space member");
    return created;
  }

  async update(id: number, roleId: number): Promise<SpaceMember> {
    const db = await this.getDb();
    await db.execute({
      sql: `UPDATE space_members SET role_id = ? WHERE id = ?`,
      args: [roleId, id],
    });
    const updated = await this.findById(id);
    if (!updated) throw new Error("Failed to update space member");
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute({
      sql: "DELETE FROM space_members WHERE id = ?",
      args: [id],
    });
  }

  async deleteBySpaceAndUser(spaceId: number, userId: number): Promise<void> {
    const db = await this.getDb();
    await db.execute({
      sql: "DELETE FROM space_members WHERE space_id = ? AND user_id = ?",
      args: [spaceId, userId],
    });
  }
}

// ====================
// Environment Repository Adapter
// ====================

export class LibSqlEnvironmentRepository implements EnvironmentRepository {
  private db: Client | null = null;

  private async getDb(): Promise<Client> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  async findById(id: number): Promise<Environment | null> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: "SELECT * FROM environments WHERE id = ?",
      args: [id],
    });
    return (result.rows[0] as never as Environment) || null;
  }

  async findBySpaceId(spaceId: number): Promise<Environment[]> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: "SELECT * FROM environments WHERE space_id = ? ORDER BY created_at DESC",
      args: [spaceId],
    });
    return result.rows as never as Environment[];
  }

  async create(
    spaceId: number,
    dto: CreateEnvironmentDTO,
  ): Promise<Environment> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `INSERT INTO environments (space_id, name, description, type) VALUES (?, ?, ?, ?)`,
      args: [spaceId, dto.name, dto.description || null, dto.type || "other"],
    });
    const created = await this.findById(Number(result.lastInsertRowid));
    if (!created) throw new Error("Failed to create environment");
    return created;
  }

  async update(
    id: number,
    dto: Partial<CreateEnvironmentDTO>,
  ): Promise<Environment> {
    const db = await this.getDb();
    const updates: string[] = [];
    const args: unknown[] = [];

    if (dto.name) {
      updates.push("name = ?");
      args.push(dto.name);
    }
    if (dto.description !== undefined) {
      updates.push("description = ?");
      args.push(dto.description || null);
    }
    if (dto.type) {
      updates.push("type = ?");
      args.push(dto.type);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    args.push(id);

    await db.execute({
      sql: `UPDATE environments SET ${updates.join(", ")} WHERE id = ?`,
      args: args as InArgs,
    });

    const updated = await this.findById(id);
    if (!updated) throw new Error("Failed to update environment");
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute({
      sql: "DELETE FROM environments WHERE id = ?",
      args: [id],
    });
  }
}
