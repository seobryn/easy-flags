import getDb from "../../db";
import { Environment } from "../../domain/models";

export class EnvironmentRepository {
  async listAll(): Promise<Environment[]> {
    const db = await getDb();
    return db.all<Environment>("SELECT * FROM environments");
  }

  async listBySpaceId(spaceId: number): Promise<Environment[]> {
    const db = await getDb();
    return db.all<Environment>(
      "SELECT * FROM environments WHERE space_id = ? ORDER BY name",
      spaceId,
    );
  }

  async create(name: string, spaceId: number): Promise<Environment> {
    const db = await getDb();
    if (!spaceId) {
      throw new Error(
        "spaceId is required - all environments must belong to a space",
      );
    }
    const info = await db.run(
      "INSERT INTO environments (name, space_id) VALUES (?, ?)",
      name,
      spaceId,
    );
    const created = await db.get<Environment>(
      "SELECT * FROM environments WHERE id = ?",
      info.lastID,
    );
    return created as Environment;
  }

  async findByName(
    name: string,
    spaceId?: number,
  ): Promise<Environment | undefined> {
    const db = await getDb();
    if (spaceId) {
      return db.get<Environment>(
        "SELECT * FROM environments WHERE name = ? AND space_id = ?",
        name,
        spaceId,
      );
    }
    return db.get<Environment>(
      "SELECT * FROM environments WHERE name = ?",
      name,
    );
  }

  async findById(id: number): Promise<Environment | undefined> {
    const db = await getDb();
    return db.get<Environment>("SELECT * FROM environments WHERE id = ?", id);
  }

  async findByIdAndSpaceId(
    id: number,
    spaceId: number,
  ): Promise<Environment | undefined> {
    const db = await getDb();
    return db.get<Environment>(
      "SELECT * FROM environments WHERE id = ? AND space_id = ?",
      [id, spaceId],
    );
  }

  async updateName(id: number, name: string): Promise<boolean> {
    const db = await getDb();
    const info = await db.run(
      "UPDATE environments SET name = ? WHERE id = ?",
      name,
      id,
    );
    return Boolean(info.changes && info.changes > 0);
  }

  async deleteById(id: number): Promise<boolean> {
    const db = await getDb();
    const info = await db.run("DELETE FROM environments WHERE id = ?", id);
    return Boolean(info.changes && info.changes > 0);
  }

  async deleteByIdAndSpaceId(id: number, spaceId: number): Promise<boolean> {
    const db = await getDb();
    const info = await db.run(
      "DELETE FROM environments WHERE id = ? AND space_id = ?",
      [id, spaceId],
    );
    return Boolean(info.changes && info.changes > 0);
  }

  async countAll(): Promise<number> {
    const db = await getDb();
    const row = await db.get<{ count: number }>(
      "SELECT COUNT(*) AS count FROM environments",
    );
    return row?.count ?? 0;
  }

  async countBySpaceId(spaceId: number): Promise<number> {
    const db = await getDb();
    const row = await db.get<{ count: number }>(
      "SELECT COUNT(*) AS count FROM environments WHERE space_id = ?",
      spaceId,
    );
    return row?.count ?? 0;
  }
}
