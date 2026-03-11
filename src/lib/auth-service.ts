import bcrypt from "bcryptjs";
import { getDatabase } from "./db";

export interface User {
  id: number;
  username: string;
  email: string;
  role_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const rounds = 10;
  return bcrypt.hash(password, rounds);
}

/**
 * Compare a password with a hash
 */
export async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  try {
    console.log(`   🔑 comparePassword called`);
    console.log(`      Password length: ${password?.length}`);
    console.log(`      Hash length: ${hash?.length}`);
    console.log(`      Hash type: ${typeof hash}`);
    console.log(`      Hash prefix: ${hash?.substring(0, 10)}`);

    const result = await bcrypt.compare(password, hash);
    console.log(`      Compare result: ${result}`);
    return result;
  } catch (error) {
    console.error("❌ Error comparing passwords:", error);
    if (error instanceof Error) {
      console.error(`   Error message: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get user by username
 */
export async function getUserByUsername(
  username: string,
): Promise<User | null> {
  try {
    const db = await getDatabase();
    const result = await db.execute({
      sql: "SELECT id, username, email, role_id, is_active, created_at, updated_at FROM users WHERE username = ?",
      args: [username],
    });

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id as number,
      username: row.username as string,
      email: row.email as string,
      role_id: row.role_id as number,
      is_active: (row.is_active as number) === 1,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
  } catch (error) {
    console.error("Error getting user by username:", error);
    throw error;
  }
}

/**
 * Get user by ID
 */
export async function getUserById(id: number): Promise<User | null> {
  try {
    const db = await getDatabase();
    const result = await db.execute({
      sql: "SELECT id, username, email, role_id, is_active, created_at, updated_at FROM users WHERE id = ?",
      args: [id],
    });

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id as number,
      username: row.username as string,
      email: row.email as string,
      role_id: row.role_id as number,
      is_active: (row.is_active as number) === 1,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
  } catch (error) {
    console.error("Error getting user by ID:", error);
    throw error;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const db = await getDatabase();
    const result = await db.execute({
      sql: "SELECT id, username, email, role_id, is_active, created_at, updated_at FROM users WHERE email = ?",
      args: [email],
    });

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id as number,
      username: row.username as string,
      email: row.email as string,
      role_id: row.role_id as number,
      is_active: (row.is_active as number) === 1,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
  } catch (error) {
    console.error("Error getting user by email:", error);
    throw error;
  }
}

/**
 * Verify login credentials
 * Returns user if credentials are valid, null otherwise
 */
export async function verifyCredentials(
  username: string,
  password: string,
): Promise<User | null> {
  try {
    console.log(`🔐 verifyCredentials - Checking username: ${username}`);
    const db = await getDatabase();
    console.log(`✅ Database connection established`);

    // Get user with password hash
    const result = await db.execute({
      sql: "SELECT id, username, email, password_hash, role_id, is_active, created_at, updated_at FROM users WHERE username = ? AND is_active = 1",
      args: [username],
    });

    console.log(`📊 Query result rows: ${result.rows.length}`);

    if (result.rows.length === 0) {
      console.log(`❌ User not found or inactive: ${username}`);
      return null;
    }

    const row = result.rows[0];
    const passwordHash = row.password_hash as string;
    console.log(`✅ User found: ${username}`);
    console.log(`   Password hash exists: ${!!passwordHash}`);
    console.log(`   Hash length: ${passwordHash?.length}`);
    console.log(`   Hash preview: ${passwordHash?.substring(0, 20)}...`);

    // Verify password
    console.log(`🔑 Comparing passwords...`);
    const isPasswordValid = await comparePassword(password, passwordHash);
    console.log(
      `   Comparison result: ${isPasswordValid ? "✅ VALID" : "❌ INVALID"}`,
    );

    if (!isPasswordValid) {
      console.log(`❌ Invalid password for user: ${username}`);
      return null;
    }

    // Password is valid, return user data
    const user: User = {
      id: row.id as number,
      username: row.username as string,
      email: row.email as string,
      role_id: row.role_id as number,
      is_active: (row.is_active as number) === 1,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };

    console.log(`✅ Authentication successful for: ${username}`);
    return user;
  } catch (error) {
    console.error("❌ Error verifying credentials:", error);
    if (error instanceof Error) {
      console.error(`   Error message: ${error.message}`);
      console.error(`   Error stack: ${error.stack}`);
    }
    throw error;
  }
}

/**
 * Create a new user
 */
export async function createUser(
  username: string,
  email: string,
  password: string,
  roleId: number = 2, // Default to editor role
): Promise<User> {
  try {
    if (!username || !email || !password) {
      throw new Error("Username, email, and password are required");
    }

    // Check if user already exists
    const existingUsername = await getUserByUsername(username);
    if (existingUsername) {
      throw new Error("Username already exists");
    }

    const existingEmail = await getUserByEmail(email);
    if (existingEmail) {
      throw new Error("Email already exists");
    }

    const db = await getDatabase();
    const passwordHash = await hashPassword(password);

    const result = await db.execute({
      sql: `INSERT INTO users (username, email, password_hash, role_id, is_active) 
            VALUES (?, ?, ?, ?, 1)`,
      args: [username, email, passwordHash, roleId],
    });

    const userId = parseInt(result.lastInsertRowid?.toString(10) || "0", 10);

    // Return created user
    const user = await getUserById(userId);
    if (!user) {
      throw new Error("Failed to retrieve created user");
    }

    console.log(`✅ User created: ${username} (ID: ${userId})`);
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

/**
 * Update user password
 */
export async function updateUserPassword(
  userId: number,
  newPassword: string,
): Promise<void> {
  try {
    const db = await getDatabase();
    const passwordHash = await hashPassword(newPassword);

    await db.execute({
      sql: "UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      args: [passwordHash, userId],
    });

    console.log(`✅ Password updated for user ID: ${userId}`);
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
}

/**
 * Update user email
 */
export async function updateUserEmail(
  userId: number,
  newEmail: string,
): Promise<void> {
  try {
    // Check if new email is already in use
    const existingUser = await getUserByEmail(newEmail);
    if (existingUser && existingUser.id !== userId) {
      throw new Error("Email already in use");
    }

    const db = await getDatabase();

    await db.execute({
      sql: "UPDATE users SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      args: [newEmail, userId],
    });

    console.log(`✅ Email updated for user ID: ${userId}`);
  } catch (error) {
    console.error("Error updating email:", error);
    throw error;
  }
}

/**
 * Generate a random API key
 */
function generateApiKey(): string {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface UserApiKey {
  id: number;
  key: string;
  last_used?: string;
  created_at: string;
}

/**
 * Create a new user API key
 */
export async function createUserApiKey(userId: number): Promise<UserApiKey> {
  try {
    const db = await getDatabase();
    const key = generateApiKey();

    const result = await db.execute({
      sql: "INSERT INTO user_api_keys (user_id, key) VALUES (?, ?)",
      args: [userId, key],
    });

    const keyId = parseInt(result.lastInsertRowid?.toString(10) || "0", 10);

    console.log(`✅ API key created for user ID: ${userId}`);
    return {
      id: keyId,
      key,
      created_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error creating API key:", error);
    throw error;
  }
}

/**
 * Get all API keys for a user
 */
export async function getUserApiKeys(userId: number): Promise<UserApiKey[]> {
  try {
    const db = await getDatabase();
    const result = await db.execute({
      sql: "SELECT id, key, last_used, created_at FROM user_api_keys WHERE user_id = ? ORDER BY created_at DESC",
      args: [userId],
    });

    return result.rows.map((row) => ({
      id: row.id as number,
      key: row.key as string,
      last_used: row.last_used as string | undefined,
      created_at: row.created_at as string,
    }));
  } catch (error) {
    console.error("Error fetching API keys:", error);
    throw error;
  }
}

/**
 * Delete a user API key
 */
export async function deleteUserApiKey(
  userId: number,
  keyId: number,
): Promise<void> {
  try {
    const db = await getDatabase();

    await db.execute({
      sql: "DELETE FROM user_api_keys WHERE id = ? AND user_id = ?",
      args: [keyId, userId],
    });

    console.log(`✅ API key deleted for user ID: ${userId}`);
  } catch (error) {
    console.error("Error deleting API key:", error);
    throw error;
  }
}

export interface UserPreferences {
  id: number;
  user_id: number;
  email_notifications: boolean;
  security_alerts: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get user preferences
 */
export async function getUserPreferences(
  userId: number,
): Promise<UserPreferences> {
  try {
    const db = await getDatabase();
    const result = await db.execute({
      sql: "SELECT * FROM user_preferences WHERE user_id = ?",
      args: [userId],
    });

    if (result.rows.length === 0) {
      return createUserPreferences(userId);
    }

    const row = result.rows[0];
    return {
      id: row.id as number,
      user_id: row.user_id as number,
      email_notifications: (row.email_notifications as number) === 1,
      security_alerts: (row.security_alerts as number) === 1,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    throw error;
  }
}

/**
 * Create default user preferences
 */
export async function createUserPreferences(
  userId: number,
): Promise<UserPreferences> {
  try {
    const db = await getDatabase();
    const result = await db.execute({
      sql: "INSERT INTO user_preferences (user_id, email_notifications, security_alerts) VALUES (?, 1, 1)",
      args: [userId],
    });

    const id = parseInt(result.lastInsertRowid?.toString(10) || "0", 10);
    return {
      id,
      user_id: userId,
      email_notifications: true,
      security_alerts: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.log("Preferences might already exist, continuing...");
    return getUserPreferences(userId);
  }
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: number,
  preferences: Partial<
    Omit<UserPreferences, "id" | "user_id" | "created_at" | "updated_at">
  >,
): Promise<UserPreferences> {
  try {
    const db = await getDatabase();
    const updates: string[] = [];
    const args: any[] = [];

    if (typeof preferences.email_notifications !== "undefined") {
      updates.push("email_notifications = ?");
      args.push(preferences.email_notifications ? 1 : 0);
    }

    if (typeof preferences.security_alerts !== "undefined") {
      updates.push("security_alerts = ?");
      args.push(preferences.security_alerts ? 1 : 0);
    }

    if (updates.length === 0) {
      return getUserPreferences(userId);
    }

    updates.push("updated_at = CURRENT_TIMESTAMP");
    args.push(userId);

    const sql = `UPDATE user_preferences SET ${updates.join(", ")} WHERE user_id = ?`;
    await db.execute({ sql, args });

    console.log(`✅ Preferences updated for user ID: ${userId}`);
    return getUserPreferences(userId);
  } catch (error) {
    console.error("Error updating preferences:", error);
    throw error;
  }
}

/**
 * Deactivate user
 */
export async function deactivateUser(userId: number): Promise<void> {
  try {
    const db = await getDatabase();

    await db.execute({
      sql: "UPDATE users SET is_active = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      args: [userId],
    });

    console.log(`✅ User deactivated: ID ${userId}`);
  } catch (error) {
    console.error("Error deactivating user:", error);
    throw error;
  }
}
