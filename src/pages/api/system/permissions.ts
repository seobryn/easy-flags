/**
 * API Handler - Feature Permissions Management
 * Only super users can manage feature permissions
 */

import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import { unauthorizedResponse } from "@/utils/api";
import { isSuperUser, ROLES, FEATURES } from "@/utils/permissions";
import { getDatabase } from "@/lib/db";

interface FeaturePermissionRequest {
  action:
    | "getPermissions"
    | "getAllRoles"
    | "assignFeature"
    | "removeFeature"
    | "getFeaturesByRole";
  roleId?: number;
  featureName?: string;
}

export const prerender = false;

/**
 * GET - Retrieve all feature permissions or permissions for a specific role
 */
export const GET: APIRoute = async (context) => {
  const user = getUserFromContext(context);

  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Only super users can view feature permissions
  if (!isSuperUser(user)) {
    return new Response(
      JSON.stringify({
        error: "Only super users can view feature permissions",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const db = await getDatabase();
    const url = new URL(context.request.url);
    const roleId = url.searchParams.get("roleId");

    if (roleId) {
      // Get features for a specific role
      const result = await db.execute({
        sql: `
          SELECT fp.id, fp.role_id, fp.feature_name, fp.created_at, r.name as role_name
          FROM feature_permissions fp
          JOIN roles r ON fp.role_id = r.id
          WHERE fp.role_id = ?
          ORDER BY fp.feature_name
        `,
        args: [parseInt(roleId)],
      });

      return new Response(JSON.stringify({ permissions: result.rows }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get all permissions grouped by role
    const result = await db.execute({
      sql: `
      SELECT 
        r.id,
        r.name,
        r.description,
        GROUP_CONCAT(fp.feature_name) as features
      FROM roles r
      LEFT JOIN feature_permissions fp ON r.id = fp.role_id
      WHERE r.id != ?
      GROUP BY r.id, r.name, r.description
      ORDER BY r.id
    `,
      args: [ROLES.SUPER_USER],
    });

    const permissions = result.rows.map((row: any) => ({
      roleId: row.id,
      roleName: row.name,
      roleDescription: row.description,
      features: row.features ? row.features.split(",") : [],
    }));

    return new Response(JSON.stringify({ permissions }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

/**
 * POST - Manage feature permissions (assign or remove)
 */
export const POST: APIRoute = async (context) => {
  const user = getUserFromContext(context);

  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Only super users can manage feature permissions
  if (!isSuperUser(user)) {
    return new Response(
      JSON.stringify({
        error: "Only super users can manage feature permissions",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const body = (await context.request.json()) as FeaturePermissionRequest;
    const db = await getDatabase();

    if (body.action === "getPermissions") {
      // Same as GET, returning all permissions grouped by role
      const result = await db.execute({
        sql: `
        SELECT 
          r.id,
          r.name,
          r.description,
          GROUP_CONCAT(fp.feature_name) as features
        FROM roles r
        LEFT JOIN feature_permissions fp ON r.id = fp.role_id
        WHERE r.id != ?
        GROUP BY r.id, r.name, r.description
        ORDER BY r.id
      `,
        args: [ROLES.SUPER_USER],
      });

      const permissions = result.rows.map((row: any) => ({
        roleId: row.id,
        roleName: row.name,
        roleDescription: row.description,
        features: row.features ? row.features.split(",") : [],
      }));

      return new Response(JSON.stringify({ permissions }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (body.action === "getAllRoles") {
      // Get all roles except super_user
      const result = await db.execute({
        sql: "SELECT id, name, description FROM roles WHERE id != ? ORDER BY id",
        args: [ROLES.SUPER_USER],
      });

      const roles = result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        description: row.description,
      }));

      // Enrich with available features
      return new Response(
        JSON.stringify({
          roles,
          availableFeatures: Object.values(FEATURES),
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (body.action === "getFeaturesByRole") {
      if (!body.roleId) {
        return new Response(JSON.stringify({ error: "roleId is required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const result = await db.execute({
        sql: `
          SELECT feature_name FROM feature_permissions WHERE role_id = ?
        `,
        args: [body.roleId],
      });

      const features = result.rows.map((row: any) => row.feature_name);

      return new Response(JSON.stringify({ roleId: body.roleId, features }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (body.action === "assignFeature") {
      if (!body.roleId || !body.featureName) {
        return new Response(
          JSON.stringify({
            error: "roleId and featureName are required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Prevent modification of super_user role
      if (body.roleId === ROLES.SUPER_USER) {
        return new Response(
          JSON.stringify({
            error: "Cannot modify Super User role permissions",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      try {
        await db.execute({
          sql: `
            INSERT INTO feature_permissions (role_id, feature_name)
            VALUES (?, ?)
          `,
          args: [body.roleId, body.featureName],
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: `Feature '${body.featureName}' assigned to role ID ${body.roleId}`,
          }),
          {
            status: 201,
            headers: { "Content-Type": "application/json" },
          },
        );
      } catch (error: any) {
        if (error.message.includes("UNIQUE constraint failed")) {
          return new Response(
            JSON.stringify({
              error: `Feature '${body.featureName}' is already assigned to this role`,
            }),
            {
              status: 409,
              headers: { "Content-Type": "application/json" },
            },
          );
        }
        throw error;
      }
    }

    if (body.action === "removeFeature") {
      if (!body.roleId || !body.featureName) {
        return new Response(
          JSON.stringify({
            error: "roleId and featureName are required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Prevent modification of super_user role
      if (body.roleId === ROLES.SUPER_USER) {
        return new Response(
          JSON.stringify({
            error: "Cannot modify Super User role permissions",
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      await db.execute({
        sql: `
          DELETE FROM feature_permissions 
          WHERE role_id = ? AND feature_name = ?
        `,
        args: [body.roleId, body.featureName],
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: `Feature '${body.featureName}' removed from role ID ${body.roleId}`,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
