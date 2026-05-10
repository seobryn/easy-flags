/**
 * API Handler - Delete Pending Invitation
 */

import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import { unauthorizedResponse } from "@/utils/api";
import { getRepositoryRegistry } from "@infrastructure/registry";


export const prerender = false;


export const DELETE: APIRoute = async (context) => {
  const user = getUserFromContext(context);
  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  try {
    const {
      params,
    } = context;
    const invitationId = params.invitationId as string;

    const registry = getRepositoryRegistry();
    await registry
      .getPendingInvitationRepository()
      .delete(parseInt(invitationId));

    return new Response(JSON.stringify({ message: "Invitation removed" }), {
      status: 200,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
      },
    );
  }

};
