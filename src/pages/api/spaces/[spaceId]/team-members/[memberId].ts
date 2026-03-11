/**
 * API Handler - Single Team Member
 */

import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import { unauthorizedResponse } from "@/utils/api";
import { checkSpaceAdminAuth } from "@/utils/permissions";
import { TeamMemberService } from "@application/services";
import { getRepositoryRegistry } from "@infrastructure/registry";

export const prerender = false;

export const PUT: APIRoute = async (context) => {
  const user = getUserFromContext(context);
  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  try {
    const { params } = context;
    const spaceId = parseInt(params.spaceId as string);

    // Only space admins can modify team member roles
    const { isAuthorized } = await checkSpaceAdminAuth(context, spaceId);
    if (!isAuthorized) {
      return new Response(
        JSON.stringify({
          error: "Insufficient permissions to modify team member roles",
        }),
        { status: 403 },
      );
    }

    const teamMemberService = new TeamMemberService();
    const body = await context.request.json();
    const memberId = parseInt(params.memberId as string);
    const member = await teamMemberService.updateTeamMemberRole(
      memberId,
      body.role_id,
    );
    return new Response(JSON.stringify(member), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 },
    );
  }
};

export const DELETE: APIRoute = async (context) => {
  const user = getUserFromContext(context);
  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  try {
    const { params } = context;
    const spaceId = parseInt(params.spaceId as string);

    // Only space admins can remove team members
    const { isAuthorized } = await checkSpaceAdminAuth(context, spaceId);
    if (!isAuthorized) {
      return new Response(
        JSON.stringify({
          error: "Insufficient permissions to remove team members",
        }),
        { status: 403 },
      );
    }

    const teamMemberService = new TeamMemberService();
    const registry = getRepositoryRegistry();
    const memberId = parseInt(params.memberId as string);

    // Get the space member to find the user ID
    const spaceMemberRepo = registry.getSpaceMemberRepository();
    const member = await spaceMemberRepo.findById(memberId);

    if (!member) {
      return new Response(JSON.stringify({ error: "Team member not found" }), {
        status: 404,
      });
    }

    await teamMemberService.removeTeamMember(spaceId, member.user_id);
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 },
    );
  }
};
