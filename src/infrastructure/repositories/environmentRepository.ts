import getDb from "../../db";
import { Environment } from "../../domain/models";

export class EnvironmentRepository {
  async listAll(): Promise<Environment[]> {
    const db = await getDb();
    return db.all<Environment>("SELECT * FROM environments");
  }

  async create(name: string): Promise<Environment> {
    const db = await getDb();
    const info = await db.run(
      "INSERT INTO environments (name) VALUES (?)",
      name,
    );
    const created = await db.get<Environment>(
      "SELECT * FROM environments WHERE id = ?",
      info.lastID,
    );
    return created as Environment;
  }

  async findByName(name: string): Promise<Environment | undefined> {
    const db = await getDb();
    return db.get<Environment>(
      "SELECT * FROM environments WHERE name = ?",
      name,
    );
  }

  async findById(id: number): Promise<Environment | undefined> {
    const db = await getDb();
    return db.get<Environment>("SELECT * FROM environments WHERE id = ?", id);
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

  async countAll(): Promise<number> {
    const db = await getDb();
    const row = await db.get<{ count: number }>(
      "SELECT COUNT(*) AS count FROM environments",
    );
    return row?.count ?? 0;
  }
}
