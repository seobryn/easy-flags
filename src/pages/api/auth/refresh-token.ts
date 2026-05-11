import type { APIRoute } from "astro";
import {
  rotateRefreshToken,
  getRefreshTokenFromCookies,
  setAuthCookie,
  setRefreshTokenCookie,
} from "@/utils/auth";
import { successResponse, unauthorizedResponse } from "@/utils/api";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  try {
    const refreshToken = getRefreshTokenFromCookies(context);

    if (!refreshToken) {
      return new Response(
        JSON.stringify(unauthorizedResponse()),
        { status: 401 },
      );
    }

    const result = await rotateRefreshToken(refreshToken);

    if (!result) {
      return new Response(
        JSON.stringify(unauthorizedResponse()),
        { status: 401 },
      );
    }

    setAuthCookie(context, result.accessToken);
    setRefreshTokenCookie(context, result.refreshToken);

    return new Response(
      JSON.stringify(
        successResponse({
          token: result.accessToken,
          refreshToken: result.refreshToken,
          expiresIn: 3600,
        }),
      ),
      { status: 200 },
    );
  } catch (error) {
    console.error("Error refreshing token:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to refresh token",
      }),
      { status: 500 },
    );
  }
};