/**
 * API Handler - Pending Invitations
 */

import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import { unauthorizedResponse } from "@/utils/api";
import { getRepositoryRegistry } from "@infrastructure/registry";


export const prerender = false;


export const GET: APIRoute = async (context) => {
  const user = getUserFromContext(context);
  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  try {
    const registry = getRepositoryRegistry();
    const pendingInvitations = await registry
      .getPendingInvitationRepository()
      .findBySpaceId(user.id);

    return new Response(JSON.stringify(pendingInvitations), { status: 200 });
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
