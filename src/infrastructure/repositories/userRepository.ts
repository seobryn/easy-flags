import getDb from "../../db";
import { User } from "../../domain/models";

export class UserRepository {
  async findByUsername(username: string): Promise<User | undefined> {
    const db = await getDb();
    return db.get<User>("SELECT * FROM users WHERE username = ?", username);
  }

  async create(username: string, password: string): Promise<void> {
    const db = await getDb();
    await db.run(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      username,
      password,
    );
  }

  async listAll(): Promise<User[]> {
    const db = await getDb();
    return db.all<User[]>(
      "SELECT id, username, password FROM users ORDER BY id DESC",
    );
  }

  async findById(id: number): Promise<User | undefined> {
    const db = await getDb();
    return db.get<User>("SELECT * FROM users WHERE id = ?", id);
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

  async delete(id: number): Promise<void> {
    const db = await getDb();
    await db.run("DELETE FROM users WHERE id = ?", id);
  }
}
