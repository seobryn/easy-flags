/**
 * API Handler - Team Members
 */

import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import { unauthorizedResponse } from "@/utils/api";
import { checkSpaceAdminAuth } from "@/utils/permissions";
import { TeamMemberService, SpaceService, EmailService } from "@application/services";
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
    const { params } = context;
    const spaceSlug = params.spaceId as string;

    // Verify space exists
    const spaceService = new SpaceService();
    const space = await spaceService.getSpaceBySlug(spaceSlug);
    if (!space) {
      return new Response(JSON.stringify({ error: "Space not found" }), {
        status: 404,
      });
    }

    const teamMemberService = new TeamMemberService();
    const members = await teamMemberService.getTeamMembers(space.id);
    return new Response(JSON.stringify(members), { status: 200 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 },
    );
  }
};

export const POST: APIRoute = async (context) => {
  const user = getUserFromContext(context);
  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  try {
    const { params } = context;
    const spaceSlug = params.spaceId as string;

    // Verify space exists
    const spaceService = new SpaceService();
    const space = await spaceService.getSpaceBySlug(spaceSlug);
    if (!space) {
      return new Response(JSON.stringify({ error: "Space not found" }), {
        status: 404,
      });
    }

    // Only space admins can add team members
    const { isAuthorized } = await checkSpaceAdminAuth(context, space.id);
    if (!isAuthorized) {
      return new Response(
        JSON.stringify({
          error: "Insufficient permissions to manage team members",
        }),
        { status: 403 },
      );
    }

    const teamMemberService = new TeamMemberService();
    const registry = getRepositoryRegistry();
    const body = await context.request.json();

    // Find user by email
    const userRepo = registry.getUserRepository();
    let targetUser = await userRepo.findByEmail(body.email);

     // If user doesn't exist, create a new account
     if (!targetUser) {
       targetUser = await userRepo.create({
         username: body.email.split('@')[0],
         email: body.email,
         is_verified: false,
       });
     }

    const token = await teamMemberService.generateInvitationToken(
      space.id,
      targetUser.email,
      body.role_id || 4
    );

    await EmailService.getInstance().sendTeamInvitationEmail(
      targetUser.email,
      targetUser.username,
      token
    );
    return new Response(JSON.stringify({ message: "Invitation sent" }), { status: 201 });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 },
    );
  }
};
