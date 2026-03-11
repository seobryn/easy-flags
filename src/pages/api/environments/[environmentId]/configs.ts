/**
 * API Handler - Environment Configs and API Keys
 */

import type { APIRoute } from "astro";
import { getUserFromContext } from "@/utils/auth";
import { unauthorizedResponse } from "@/utils/api";
import { EnvironmentConfigService, ApiKeyService } from "@application/services";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const user = getUserFromContext(context);
  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
    });
  }

  try {
    const envConfigService = new EnvironmentConfigService();
    const { params } = context;
    const environmentId = parseInt(params.environmentId as string);

    // Check if requesting configs or API keys
    const url = new URL(params.toString());
    if (
      url.searchParams.has("type") &&
      url.searchParams.get("type") === "api-keys"
    ) {
      const apiKeyService = new ApiKeyService();
      const keys = await apiKeyService.getEnvironmentApiKeys(environmentId);
      return new Response(JSON.stringify(keys), { status: 200 });
    } else {
      const configs =
        await envConfigService.getEnvironmentConfigs(environmentId);
      return new Response(JSON.stringify(configs), { status: 200 });
    }
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
    const body = await context.request.json();
    const { params } = context;
    const environmentId = parseInt(params.environmentId as string);

    if (body.type === "api-key") {
      // Generate API key
      const apiKeyService = new ApiKeyService();
      const key = await apiKeyService.generateApiKey(environmentId);
      return new Response(JSON.stringify(key), { status: 201 });
    } else {
      // Create config
      const envConfigService = new EnvironmentConfigService();
      const config = await envConfigService.createConfig(
        environmentId,
        body.key,
        body.value,
      );
      return new Response(JSON.stringify(config), { status: 201 });
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 },
    );
  }
};
