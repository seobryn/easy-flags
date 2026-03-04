import bcrypt from "bcryptjs";
import { User } from "../../domain/models";
import { UserRepository } from "../../infrastructure/repositories/userRepository";

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async listUsers(): Promise<
    Array<Pick<User, "id" | "username"> & { role_id?: number }>
  > {
    const users = await this.userRepository.listAll();
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      role_id: u.role_id,
    }));
  }

  async listUsersWithRoles(): Promise<Array<any>> {
    const users = await this.userRepository.listAllWithRoles();
    return users.map((u) => ({
      id: u.id,
      username: u.username,
      role_id: u.role_id,
      role: u.role,
    }));
  }

  async createUser(
    username: string,
    password: string,
    roleId?: number,
  ): Promise<void> {
    const hash = bcrypt.hashSync(password, 10);
    await this.userRepository.create(username, hash, roleId);
  }

  async findUser(
    id: number,
  ): Promise<(Pick<User, "id" | "username"> & { role_id?: number }) | null> {
    const u = await this.userRepository.findById(id);
    if (!u) return null;
    return { id: u.id, username: u.username, role_id: u.role_id };
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

  async assignRoleToUser(userId: number, roleId: number): Promise<void> {
    await this.userRepository.assignRole(userId, roleId);
  }

  async removeRoleFromUser(userId: number): Promise<void> {
    await this.userRepository.removeRole(userId);
  }

  async deleteUser(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}
