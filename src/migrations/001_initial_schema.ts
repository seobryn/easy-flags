import { Migration, DatabaseWrapper } from "./runner";

/**
 * Initial migration - Creates all base tables
 * This migration sets up the complete database schema for:
 * - Roles and permissions (RBAC)
 * - Users
 * - Environments
 * - Features and feature flags
 * - Subscriptions
 */
const migration: Migration = {
  async up(db: DatabaseWrapper) {
    // Create roles table
    await db.exec(
      `CREATE TABLE IF NOT EXISTS roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT
      )`,
    );

    // Create permissions table
    await db.exec(
      `CREATE TABLE IF NOT EXISTS permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT
      )`,
    );

    // Create role_permissions mapping table
    await db.exec(
      `CREATE TABLE IF NOT EXISTS role_permissions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_id INTEGER NOT NULL,
        permission_id INTEGER NOT NULL,
        UNIQUE(role_id, permission_id),
        FOREIGN KEY(role_id) REFERENCES roles(id),
        FOREIGN KEY(permission_id) REFERENCES permissions(id)
      )`,
    );

    // Create users table
    await db.exec(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role_id INTEGER,
        FOREIGN KEY(role_id) REFERENCES roles(id)
      )`,
    );

    // Create environments table
    await db.exec(
      `CREATE TABLE IF NOT EXISTS environments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL
      )`,
    );

    // Create features table
    await db.exec(
      `CREATE TABLE IF NOT EXISTS features (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        description TEXT
      )`,
    );

    // Create feature_values table
    await db.exec(
      `CREATE TABLE IF NOT EXISTS feature_values (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_id INTEGER NOT NULL,
        environment_id INTEGER NOT NULL,
        value INTEGER NOT NULL,
        UNIQUE(feature_id, environment_id)
      )`,
    );

    // Create subscriptions table
    await db.exec(
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

    // Seed default roles
    const rolesCount = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM roles",
    );

    if (!rolesCount || rolesCount.count === 0) {
      await db.run("INSERT INTO roles (name, description) VALUES (?, ?)", [
        "Admin",
        "Administrator with full access",
      ]);
      await db.run("INSERT INTO roles (name, description) VALUES (?, ?)", [
        "Editor",
        "Can create and edit features and flags",
      ]);
      await db.run("INSERT INTO roles (name, description) VALUES (?, ?)", [
        "Viewer",
        "Read-only access to features and flags",
      ]);
    }

    // Seed default permissions
    const permissionsCount = await db.get<{ count: number }>(
      "SELECT COUNT(*) as count FROM permissions",
    );

    if (!permissionsCount || permissionsCount.count === 0) {
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
        await db.run(
          "INSERT INTO permissions (name, description) VALUES (?, ?)",
          [name, desc],
        );
      }

      // Assign all permissions to Admin role
      const adminRole = await db.get<{ id: number }>(
        "SELECT id FROM roles WHERE name = ?",
        ["Admin"],
      );
      const allPerms = await db.all<{ id: number }>(
        "SELECT id FROM permissions",
      );
      for (const perm of allPerms) {
        await db.run(
          "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
          [adminRole?.id, perm.id],
        );
      }

      // Assign permissions to Editor role
      const editorRole = await db.get<{ id: number }>(
        "SELECT id FROM roles WHERE name = ?",
        ["Editor"],
      );
      const editorPerms = await db.all<{ id: number }>(
        "SELECT id FROM permissions WHERE name IN (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
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
        ],
      );
      for (const perm of editorPerms) {
        await db.run(
          "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
          [editorRole?.id, perm.id],
        );
      }

      // Assign permissions to Viewer role
      const viewerRole = await db.get<{ id: number }>(
        "SELECT id FROM roles WHERE name = ?",
        ["Viewer"],
      );
      const viewerPerms = await db.all<{ id: number }>(
        "SELECT id FROM permissions WHERE name = ?",
        ["view_features"],
      );
      for (const perm of viewerPerms) {
        await db.run(
          "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
          [viewerRole?.id, perm.id],
        );
      }
    }
  },

  async down(db: DatabaseWrapper) {
    // Drop all tables in reverse order (respecting foreign keys)
    await db.exec("DROP TABLE IF EXISTS subscriptions");
    await db.exec("DROP TABLE IF EXISTS feature_values");
    await db.exec("DROP TABLE IF EXISTS features");
    await db.exec("DROP TABLE IF EXISTS environments");
    await db.exec("DROP TABLE IF EXISTS users");
    await db.exec("DROP TABLE IF EXISTS role_permissions");
    await db.exec("DROP TABLE IF EXISTS permissions");
    await db.exec("DROP TABLE IF EXISTS roles");
  },
};

export default migration;
