import type { APIRoute } from 'astro';
import { PricingService } from '@application/services/pricing.service';
import { getUserFromContext } from '@/utils/auth';

export const POST: APIRoute = async ({ request, locals }) => {
  const user = getUserFromContext(locals);

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { planSlug } = await request.json();

  if (!planSlug) {
    return new Response(JSON.stringify({ error: 'planSlug is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const pricingService = PricingService.getInstance();
    await pricingService.assignPlanToUser(user.id, planSlug);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error assigning plan to user:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
