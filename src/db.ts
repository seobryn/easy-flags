import path from "path";
import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

const dbFile = path.resolve(process.cwd(), "data.db");

let dbInstance: Database<sqlite3.Database> | null = null;

export async function getDb() {
  if (dbInstance) return dbInstance;
  dbInstance = await open({ filename: dbFile, driver: sqlite3.Database });
  await dbInstance.exec("PRAGMA journal_mode = WAL");

  await dbInstance.exec(
    `CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT
    )`,
  );

  await dbInstance.exec(
    `CREATE TABLE IF NOT EXISTS permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT
    )`,
  );

  await dbInstance.exec(
    `CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      UNIQUE(role_id, permission_id),
      FOREIGN KEY(role_id) REFERENCES roles(id),
      FOREIGN KEY(permission_id) REFERENCES permissions(id)
    )`,
  );

  await dbInstance.exec(
    `CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role_id INTEGER,
      FOREIGN KEY(role_id) REFERENCES roles(id)
    )`,
  );

  await dbInstance.exec(
    `CREATE TABLE IF NOT EXISTS environments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    )`,
  );

  await dbInstance.exec(
    `CREATE TABLE IF NOT EXISTS features (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      description TEXT
    )`,
  );

  await dbInstance.exec(
    `CREATE TABLE IF NOT EXISTS feature_values (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feature_id INTEGER NOT NULL,
      environment_id INTEGER NOT NULL,
      value INTEGER NOT NULL,
      UNIQUE(feature_id, environment_id)
    )`,
  );

  await dbInstance.exec(
    `CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      price_id TEXT,
      status TEXT,
      current_period_end INTEGER,
      metadata TEXT
    )`,
  );

  // Seed default roles and permissions
  const rolesCount = await dbInstance.get<{
    count: number;
  }>("SELECT COUNT(*) as count FROM roles");
  const permissionsCount = await dbInstance.get<{
    count: number;
  }>("SELECT COUNT(*) as count FROM permissions");

  if (rolesCount?.count === 0) {
    // Create default roles
    await dbInstance.run(
      "INSERT INTO roles (name, description) VALUES (?, ?)",
      "Admin",
      "Administrator with full access",
    );
    await dbInstance.run(
      "INSERT INTO roles (name, description) VALUES (?, ?)",
      "Editor",
      "Can create and edit features and flags",
    );
    await dbInstance.run(
      "INSERT INTO roles (name, description) VALUES (?, ?)",
      "Viewer",
      "Read-only access to features and flags",
    );
  }

  // Seed permissions if missing (separate from roles seeding)
  if (permissionsCount?.count === 0) {
    // Create default permissions (CRUD split)
    const permissions = [
      ["create_roles", "Create roles"],
      ["update_roles", "Update roles"],
      ["delete_roles", "Delete roles"],
      ["view_roles", "View roles page"],
      ["manage_permissions", "Manage permissions for roles"],
      ["create_users", "Create users"],
      ["update_users", "Update users"],
      ["delete_users", "Delete users"],
      ["view_users", "View users page"],
      ["create_features", "Create features"],
      ["update_features", "Update features"],
      ["delete_features", "Delete features"],
      ["view_features", "View features and flag values"],
      ["create_environments", "Create environments"],
      ["update_environments", "Update environments"],
      ["delete_environments", "Delete environments"],
      ["view_environments", "View environments page"],
      ["manage_flags", "Update feature flag values"],
      ["manage_billing", "Access billing and subscription management"],
    ];

    for (const [name, desc] of permissions) {
      await dbInstance.run(
        "INSERT INTO permissions (name, description) VALUES (?, ?)",
        name,
        desc,
      );
    }

    // Assign all permissions to Admin role
    const adminRole = await dbInstance.get<{ id: number }>(
      "SELECT id FROM roles WHERE name = ?",
      "Admin",
    );
    const allPerms = await dbInstance.all<Array<{ id: number }>>(
      "SELECT id FROM permissions",
    );
    for (const perm of allPerms) {
      await dbInstance.run(
        "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
        adminRole?.id,
        perm.id,
      );
    }

    // Assign permissions to Editor role (CRUD: create/update/delete features, environments, flags, and view features)
    const editorRole = await dbInstance.get<{ id: number }>(
      "SELECT id FROM roles WHERE name = ?",
      "Editor",
    );
    const editorPerms = await dbInstance.all<Array<{ id: number }>>(
      "SELECT id FROM permissions WHERE name IN (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      "create_features",
      "update_features",
      "delete_features",
      "create_environments",
      "update_environments",
      "delete_environments",
      "manage_flags",
      "view_features",
      "create_users",
      "update_users",
    );
    for (const perm of editorPerms) {
      await dbInstance.run(
        "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
        editorRole?.id,
        perm.id,
      );
    }

    // Assign permissions to Viewer role (view only)
    const viewerRole = await dbInstance.get<{ id: number }>(
      "SELECT id FROM roles WHERE name = ?",
      "Viewer",
    );
    const viewerPerms = await dbInstance.all<Array<{ id: number }>>(
      "SELECT id FROM permissions WHERE name = ?",
      "view_features",
    );
    for (const perm of viewerPerms) {
      await dbInstance.run(
        "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
        viewerRole?.id,
        perm.id,
      );
    }
  }

  return dbInstance;
}

export default getDb;
