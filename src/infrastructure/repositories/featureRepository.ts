import getDb from "../../db";
import { Feature } from "../../domain/models";

export class FeatureRepository {
  async listAll(): Promise<Feature[]> {
    const db = await getDb();
    return db.all<Feature>("SELECT * FROM features");
  }

  async create(key: string, description?: string): Promise<Feature> {
    const db = await getDb();
    const info = await db.run(
      "INSERT INTO features (key, description) VALUES (?, ?)",
      key,
      description || null,
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

  async findByKey(key: string): Promise<Feature | undefined> {
    const db = await getDb();
    return db.get<Feature>("SELECT * FROM features WHERE key = ?", key);
  }

  async deleteById(id: number): Promise<boolean> {
    const db = await getDb();
    const info = await db.run("DELETE FROM features WHERE id = ?", id);
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
}
