import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import { unauthorizedResponse } from "@/utils/api";
import { isSuperUser, FEATURES, hasFeatureAccess } from "@/utils/permissions";
import { getDatabase } from "@/lib/db";

interface FeaturePermissionsRequest {
  action: "getPermissions" | "getAvailableFeatures" | "checkFeatureAccess";
  feature?: string;
}

export const GET: APIRoute = async (context) => {
  const user = getUserFromContext(context);

  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const db = await getDatabase();

    if (!user.role_id) {
      return new Response(JSON.stringify({ error: "User role not found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user's feature permissions from database
    const result = await db.execute({
      sql: `
        SELECT fp.feature_name 
        FROM feature_permissions fp
        WHERE fp.role_id = ?
      `,
      args: [user.role_id],
    });

    const allowedFeatures = result.rows.map(
      (row) => row.feature_name as string,
    );

    return new Response(
      JSON.stringify({
        userId: user.id,
        roleId: user.role_id,
        isSuperUser: isSuperUser(user),
        allowedFeatures,
        allFeatures: Object.values(FEATURES),
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async (context) => {
  const user = getUserFromContext(context);

  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Only super users can manage permissions
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
    const body = (await context.request.json()) as FeaturePermissionsRequest;
    const db = await getDatabase();

    if (body.action === "getPermissions") {
      const result = await db.execute(
        "SELECT role_id, GROUP_CONCAT(feature_name) as features FROM feature_permissions GROUP BY role_id",
      );

      const permissions = result.rows.map((row) => ({
        roleId: row.role_id as number,
        features: (row.features as string).split(","),
      }));

      return new Response(JSON.stringify({ permissions }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (body.action === "checkFeatureAccess") {
      if (!body.feature) {
        return new Response(
          JSON.stringify({ error: "Feature name is required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const hasAccess = hasFeatureAccess(user, body.feature as any);

      return new Response(
        JSON.stringify({
          feature: body.feature,
          hasAccess,
          message: hasAccess
            ? `User has access to ${body.feature}`
            : `User does not have access to ${body.feature}`,
        }),
        {
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
