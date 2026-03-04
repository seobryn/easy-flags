import bcrypt from "bcryptjs";
import { User } from "../../domain/models";
import { UserRepository } from "../../infrastructure/repositories/userRepository";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async listUsers(): Promise<Pick<User, "id" | "username">[]> {
    const users = await this.userRepository.listAll();
    return users.map((u) => ({ id: u.id, username: u.username }));
  }

  async createUser(username: string, password: string): Promise<void> {
    const hash = bcrypt.hashSync(password, 10);
    await this.userRepository.create(username, hash);
  }

  async findUser(id: number): Promise<Pick<User, "id" | "username"> | null> {
    const u = await this.userRepository.findById(id);
    if (!u) return null;
    return { id: u.id, username: u.username };
  }

  async updateUser(
    id: number,
    username: string,
    password?: string,
  ): Promise<void> {
    if (password) {
      const hash = bcrypt.hashSync(password, 10);
      await this.userRepository.update(id, username, hash);
    } else {
      await this.userRepository.update(id, username);
    }
  }

  async deleteUser(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}
