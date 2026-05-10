/**
 * API Handler - Accept Invite
 */

import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import { unauthorizedResponse } from "@/utils/api";
import { validateEmail } from "@domain/validators/email.validator";
import { TeamMemberService } from "@application/services";
import { getRepositoryRegistry } from "@infrastructure/registry";


export const prerender = false;


export const POST: APIRoute = async (context) => {
  const user = getUserFromContext(context);
  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  try {
    const {
      params,
      request,
    } = context;
    const {
      token,
      username,
      email,
      password,
    } = await request.json();

    // Verify token exists and is not expired
    const registry = getRepositoryRegistry();
    const pendingInvite = await registry
      .getPendingInvitationRepository()
      .findByToken(token);

    if (!pendingInvite || new Date(pendingInvite.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 400,
      });
    }

    // Check if user exists
    const userRepo = registry.getUserRepository();
    let targetUser = await userRepo.findByEmail(pendingInvite.email);

    // If user doesn't exist, create a new account
    if (!targetUser && username && email && password) {
      // Validate email before creating user
      if (!validateEmail(email)) {
        return new Response(JSON.stringify({ error: "Invalid email address" }), {
          status: 400,
        });
      }

      targetUser = await userRepo.create({
        username,
        email,
        is_verified: true,
      });
    }

    if (!targetUser) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
      });
    }

    // Add user to team
    const teamMemberService = new TeamMemberService();
    await teamMemberService.addTeamMember(
      pendingInvite.space_id,
      targetUser.id,
      pendingInvite.role_id
    );

    // Update token as accepted
    await registry
      .getPendingInvitationRepository()
      .update(pendingInvite.id, { accepted_at: new Date() });

    return new Response(JSON.stringify({ message: "Invitation accepted" }), {
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
