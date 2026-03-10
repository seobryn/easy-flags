import { Space, SpaceUser } from "../../domain/models";
import getDb from "../../db";

export class SpaceRepository {
  async create(
    name: string,
    ownerId: number,
    description?: string,
  ): Promise<Space> {
    const db = await getDb();
    const result = await db.run(
      `INSERT INTO spaces (name, description, owner_id) 
       VALUES (?, ?, ?)`,
      [name, description || null, ownerId],
    );

    const space = await this.findById(result.lastID!);
    if (!space) throw new Error("Failed to create space");
    return space;
  }

  async findById(id: number): Promise<Space | undefined> {
    const db = await getDb();
    return db.get<Space>(
      `SELECT id, name, description, owner_id, created_at 
       FROM spaces WHERE id = ?`,
      [id],
    );
  }

  async findByOwnerId(ownerId: number): Promise<Space[]> {
    const db = await getDb();
    return db.all<Space>(
      `SELECT id, name, description, owner_id, created_at 
       FROM spaces WHERE owner_id = ?
       ORDER BY created_at DESC`,
      [ownerId],
    );
  }

  async listByUserId(userId: number): Promise<Space[]> {
    const db = await getDb();
    return db.all<Space>(
      `SELECT DISTINCT s.id, s.name, s.description, s.owner_id, s.created_at
       FROM spaces s
       LEFT JOIN space_users su ON s.id = su.space_id
       WHERE s.owner_id = ? OR su.user_id = ?
       ORDER BY s.created_at DESC`,
      [userId, userId],
    );
  }

  async update(
    id: number,
    name?: string,
    description?: string,
  ): Promise<Space | undefined> {
    const db = await getDb();
    if (name || description) {
      let query = "UPDATE spaces SET ";
      const updates = [];
      const params = [];

      if (name) {
        updates.push("name = ?");
        params.push(name);
      }
      if (description) {
        updates.push("description = ?");
        params.push(description);
      }

      query += updates.join(", ") + " WHERE id = ?";
      params.push(id);

      await db.run(query, params);
    }

    return this.findById(id);
  }

  async deleteById(id: number): Promise<boolean> {
    const db = await getDb();
    await db.run("DELETE FROM spaces WHERE id = ?", [id]);
    return true;
  }

  async addUser(
    spaceId: number,
    userId: number,
    roleId: number,
  ): Promise<SpaceUser> {
    const db = await getDb();
    const result = await db.run(
      `INSERT INTO space_users (space_id, user_id, role_id) 
       VALUES (?, ?, ?)`,
      [spaceId, userId, roleId],
    );

    const spaceUser = await this.findSpaceUserById(result.lastID!);
    if (!spaceUser) throw new Error("Failed to add user to space");
    return spaceUser;
  }

  async removeUser(spaceId: number, userId: number): Promise<boolean> {
    const db = await getDb();
    await db.run("DELETE FROM space_users WHERE space_id = ? AND user_id = ?", [
      spaceId,
      userId,
    ]);
    return true;
  }

  async updateUserRole(
    spaceId: number,
    userId: number,
    roleId: number,
  ): Promise<SpaceUser | undefined> {
    const db = await getDb();
    await db.run(
      `UPDATE space_users SET role_id = ? 
       WHERE space_id = ? AND user_id = ?`,
      [roleId, spaceId, userId],
    );

    return db.get<SpaceUser>(
      `SELECT id, space_id, user_id, role_id, created_at
       FROM space_users WHERE space_id = ? AND user_id = ?`,
      [spaceId, userId],
    );
  }

  async getSpaceUsers(spaceId: number): Promise<SpaceUser[]> {
    const db = await getDb();
    return db.all<SpaceUser>(
      `SELECT id, space_id, user_id, role_id, created_at
       FROM space_users WHERE space_id = ?
       ORDER BY created_at`,
      [spaceId],
    );
  }

  async findSpaceUser(
    spaceId: number,
    userId: number,
  ): Promise<SpaceUser | undefined> {
    const db = await getDb();
    return db.get<SpaceUser>(
      `SELECT id, space_id, user_id, role_id, created_at
       FROM space_users WHERE space_id = ? AND user_id = ?`,
      [spaceId, userId],
    );
  }

  private async findSpaceUserById(id: number): Promise<SpaceUser | undefined> {
    const db = await getDb();
    return db.get<SpaceUser>(
      `SELECT id, space_id, user_id, role_id, created_at
       FROM space_users WHERE id = ?`,
      [id],
    );
  }

  async getUserRole(
    spaceId: number,
    userId: number,
  ): Promise<number | undefined> {
    const db = await getDb();
    const result = await db.get<{ role_id: number }>(
      `SELECT role_id FROM space_users WHERE space_id = ? AND user_id = ?`,
      [spaceId, userId],
    );
    return result?.role_id;
  }

  async isUserInSpace(spaceId: number, userId: number): Promise<boolean> {
    const db = await getDb();
    const result = await db.get<{ id: number }>(
      `SELECT id FROM space_users WHERE space_id = ? AND user_id = ?`,
      [spaceId, userId],
    );
    return !!result;
  }

  async isSpaceOwner(spaceId: number, userId: number): Promise<boolean> {
    const space = await this.findById(spaceId);
    return !!space && space.owner_id === userId;
  }
}
