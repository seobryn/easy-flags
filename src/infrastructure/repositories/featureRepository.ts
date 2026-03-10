import getDb from "../../db";
import { Feature } from "../../domain/models";

export class FeatureRepository {
  async listAll(): Promise<Feature[]> {
    const db = await getDb();
    return db.all<Feature>("SELECT * FROM features");
  }

  async listBySpaceId(spaceId: number): Promise<Feature[]> {
    const db = await getDb();
    return db.all<Feature>(
      "SELECT * FROM features WHERE space_id = ? ORDER BY key",
      spaceId,
    );
  }

  async create(
    key: string,
    description?: string,
    spaceId?: number,
  ): Promise<Feature> {
    const db = await getDb();
    if (!spaceId) {
      throw new Error(
        "spaceId is required - all features must belong to a space",
      );
    }
    const info = await db.run(
      "INSERT INTO features (key, description, space_id) VALUES (?, ?, ?)",
      key,
      description || null,
      spaceId,
    );
    const created = await db.get<Feature>(
      "SELECT * FROM features WHERE id = ?",
      info.lastID,
    );
    return created as Feature;
  }

  async findById(id: number): Promise<Feature | undefined> {
    const db = await getDb();
    return db.get<Feature>("SELECT * FROM features WHERE id = ?", id);
  }

  async findByIdAndSpaceId(
    id: number,
    spaceId: number,
  ): Promise<Feature | undefined> {
    const db = await getDb();
    return db.get<Feature>(
      "SELECT * FROM features WHERE id = ? AND space_id = ?",
      [id, spaceId],
    );
  }

  async findByKey(key: string, spaceId?: number): Promise<Feature | undefined> {
    const db = await getDb();
    if (spaceId) {
      return db.get<Feature>(
        "SELECT * FROM features WHERE key = ? AND space_id = ?",
        key,
        spaceId,
      );
    }
    return db.get<Feature>("SELECT * FROM features WHERE key = ?", key);
  }

  async deleteById(id: number): Promise<boolean> {
    const db = await getDb();
    const info = await db.run("DELETE FROM features WHERE id = ?", id);
    return Boolean(info.changes && info.changes > 0);
  }

  async deleteByIdAndSpaceId(id: number, spaceId: number): Promise<boolean> {
    const db = await getDb();
    const info = await db.run(
      "DELETE FROM features WHERE id = ? AND space_id = ?",
      [id, spaceId],
    );
    return Boolean(info.changes && info.changes > 0);
  }

  async deleteByIds(featureIds: number[]): Promise<void> {
    if (featureIds.length === 0) return;
    const db = await getDb();
    const placeholders = featureIds.map(() => "?").join(", ");
    await db.run(
      `DELETE FROM features WHERE id IN (${placeholders})`,
      ...featureIds,
    );
  }

  async deleteAll(): Promise<void> {
    const db = await getDb();
    await db.run("DELETE FROM features");
  }

  async countBySpaceId(spaceId: number): Promise<number> {
    const db = await getDb();
    const row = await db.get<{ count: number }>(
      "SELECT COUNT(*) AS count FROM features WHERE space_id = ?",
      spaceId,
    );
    return row?.count ?? 0;
  }
}
