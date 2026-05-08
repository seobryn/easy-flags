/**
 * Pricing Service
 * Handles pricing plan management and pricing tier configuration
 */

import { getRepositoryRegistry } from "@infrastructure/registry";
import type {
  PricingPlan,
  CreatePricingPlanDTO,
  UpdatePricingPlanDTO,
  CreatePricingPlanFeatureDTO,
  CreatePricingPlanLimitDTO,
} from "@domain/entities";

export class PricingService {
  private static instance: PricingService;

  static getInstance(): PricingService {
    if (!PricingService.instance) {
      PricingService.instance = new PricingService();
    }
    return PricingService.instance;
  }

  /**
   * Initialize default pricing plans (Lab, Basic, Pro)
   * If plans already exist, this will be skipped
   */
  async initializeDefaultPricing(): Promise<void> {
    const registry = getRepositoryRegistry();
    const planRepo = registry.getPricingPlanRepository();
    const featureRepo = registry.getPricingPlanFeatureRepository();
    const limitRepo = registry.getPricingPlanLimitRepository();

    // Check if plans already exist
    const existingPlans = await planRepo.findAll(true);
    if (existingPlans.length > 0) {
      console.log("Pricing plans already initialized");
      return;
    }

    console.log("Initializing default pricing plans...");

    // CREATE LAB PLAN
    const labPlan = await planRepo.create({
      slug: "lab",
      name: "Lab",
      description: "Perfect for testing and learning",
      price_usd: 0,
      price_cop: 0,
      billing_period: "monthly",
      is_active: true,
      is_recommended: false,
      sort_order: 1,
    });

    // Lab Features
    await featureRepo.create({
      pricing_plan_id: labPlan.id,
      feature_name: "Up to 5 feature flags",
      sort_order: 1,
    });
    await featureRepo.create({
      pricing_plan_id: labPlan.id,
      feature_name: "1 environment",
      sort_order: 2,
    });
    await featureRepo.create({
      pricing_plan_id: labPlan.id,
      feature_name: "Basic analytics",
      sort_order: 3,
    });
    await featureRepo.create({
      pricing_plan_id: labPlan.id,
      feature_name: "Community support",
      sort_order: 4,
    });

    // Lab Limits
    await limitRepo.create({
      pricing_plan_id: labPlan.id,
      limit_name: "max_flags",
      limit_value: 5,
      limit_description: "Maximum number of feature flags",
    });
    await limitRepo.create({
      pricing_plan_id: labPlan.id,
      limit_name: "max_environments",
      limit_value: 1,
      limit_description: "Maximum number of environments",
    });
    await limitRepo.create({
      pricing_plan_id: labPlan.id,
      limit_name: "api_requests_per_month",
      limit_value: 1000,
      limit_description: "API requests allowed per month",
    });
    await limitRepo.create({
      pricing_plan_id: labPlan.id,
      limit_name: "max_team_members",
      limit_value: 1,
      limit_description: "Maximum team members including owner",
    });
    await limitRepo.create({
      pricing_plan_id: labPlan.id,
      limit_name: "max_api_keys",
      limit_value: 1,
      limit_description: "Maximum API keys per environment",
    });
    await limitRepo.create({
      pricing_plan_id: labPlan.id,
      limit_name: "max_audit_logs_days",
      limit_value: 7,
      limit_description: "Days to keep audit logs",
    });

    // CREATE BASIC PLAN
    const basicPlan = await planRepo.create({
      slug: "basic",
      name: "Basic",
      description: "Essential features for your project",
      price_usd: 9.99,
      price_cop: 40000,
      billing_period: "monthly",
      is_active: true,
      is_recommended: true,
      sort_order: 2,
    });

    // Basic Features
    await featureRepo.create({
      pricing_plan_id: basicPlan.id,
      feature_name: "Up to 50 feature flags",
      sort_order: 1,
    });
    await featureRepo.create({
      pricing_plan_id: basicPlan.id,
      feature_name: "3 environments",
      sort_order: 2,
    });
    await featureRepo.create({
      pricing_plan_id: basicPlan.id,
      feature_name: "Advanced analytics",
      sort_order: 3,
    });
    await featureRepo.create({
      pricing_plan_id: basicPlan.id,
      feature_name: "Email support",
      sort_order: 4,
    });
    await featureRepo.create({
      pricing_plan_id: basicPlan.id,
      feature_name: "API access",
      sort_order: 5,
    });
    await featureRepo.create({
      pricing_plan_id: basicPlan.id,
      feature_name: "API access",
      sort_order: 5,
    });

    // Basic Limits
    await limitRepo.create({
      pricing_plan_id: basicPlan.id,
      limit_name: "max_flags",
      limit_value: 50,
      limit_description: "Maximum number of feature flags",
    });
    await limitRepo.create({
      pricing_plan_id: basicPlan.id,
      limit_name: "max_environments",
      limit_value: 3,
      limit_description: "Maximum number of environments",
    });
    await limitRepo.create({
      pricing_plan_id: basicPlan.id,
      limit_name: "api_requests_per_month",
      limit_value: 100000,
      limit_description: "API requests allowed per month",
    });
    await limitRepo.create({
      pricing_plan_id: basicPlan.id,
      limit_name: "max_team_members",
      limit_value: 3,
      limit_description: "Maximum team members including owner",
    });
    await limitRepo.create({
      pricing_plan_id: basicPlan.id,
      limit_name: "max_api_keys",
      limit_value: 5,
      limit_description: "Maximum API keys per environment",
    });
    await limitRepo.create({
      pricing_plan_id: basicPlan.id,
      limit_name: "max_audit_logs_days",
      limit_value: 30,
      limit_description: "Days to keep audit logs",
    });

    // CREATE PRO PLAN
    const proPlan = await planRepo.create({
      slug: "pro",
      name: "Pro",
      description: "Advanced features for growing teams",
      price_usd: 29.99,
      price_cop: 120000,
      billing_period: "monthly",
      is_active: true,
      is_recommended: false,
      sort_order: 3,
    });

    // Pro Features
    await featureRepo.create({
      pricing_plan_id: proPlan.id,
      feature_name: "Unlimited flags",
      sort_order: 1,
    });
    await featureRepo.create({
      pricing_plan_id: proPlan.id,
      feature_name: "Unlimited environments",
      sort_order: 2,
    });
    await featureRepo.create({
      pricing_plan_id: proPlan.id,
      feature_name: "Advanced analytics",
      sort_order: 3,
    });
    await featureRepo.create({
      pricing_plan_id: proPlan.id,
      feature_name: "Priority support",
      sort_order: 4,
    });
    await featureRepo.create({
      pricing_plan_id: proPlan.id,
      feature_name: "Advanced API",
      sort_order: 5,
    });
    await featureRepo.create({
      pricing_plan_id: proPlan.id,
      feature_name: "Team collaboration",
      sort_order: 6,
    });
    await featureRepo.create({
      pricing_plan_id: proPlan.id,
      feature_name: "Team collaboration",
      sort_order: 6,
    });

    // Pro Limits
    await limitRepo.create({
      pricing_plan_id: proPlan.id,
      limit_name: "max_flags",
      limit_value: -1, // -1 means unlimited
      limit_description: "Maximum number of feature flags",
    });
    await limitRepo.create({
      pricing_plan_id: proPlan.id,
      limit_name: "max_environments",
      limit_value: -1,
      limit_description: "Maximum number of environments",
    });
    await limitRepo.create({
      pricing_plan_id: proPlan.id,
      limit_name: "api_requests_per_month",
      limit_value: 1000000,
      limit_description: "API requests allowed per month",
    });
    await limitRepo.create({
      pricing_plan_id: proPlan.id,
      limit_name: "max_team_members",
      limit_value: -1,
      limit_description: "Maximum team members including owner",
    });
    await limitRepo.create({
      pricing_plan_id: proPlan.id,
      limit_name: "max_api_keys",
      limit_value: -1,
      limit_description: "Maximum API keys per environment",
    });
    await limitRepo.create({
      pricing_plan_id: proPlan.id,
      limit_name: "max_audit_logs_days",
      limit_value: 90,
      limit_description: "Days to keep audit logs",
    });

    console.log("✓ Default pricing plans initialized");
  }

  /**
   * Get all active pricing plans with their features and limits
   */
  async getAllPricingPlans(): Promise<PricingPlan[]> {
    const registry = getRepositoryRegistry();
    const planRepo = registry.getPricingPlanRepository();
    const plans = await planRepo.findActive();

    // Load details for each plan
    const plansWithDetails = await Promise.all(
      plans.map((plan) => planRepo.findByIdWithDetails(plan.id)),
    );

    return plansWithDetails.filter((p) => p !== null) as PricingPlan[];
  }

  /**
   * Get a specific pricing plan by slug
   */
  async getPricingPlanBySlug(slug: string): Promise<PricingPlan | null> {
    const registry = getRepositoryRegistry();
    const planRepo = registry.getPricingPlanRepository();
    const plan = await planRepo.findBySlug(slug);
    return plan ? planRepo.findByIdWithDetails(plan.id) : null;
  }

  /**
   * Create a new pricing plan
   */
  async createPricingPlan(
    dto: CreatePricingPlanDTO,
    features: CreatePricingPlanFeatureDTO[],
    limits: CreatePricingPlanLimitDTO[],
  ): Promise<PricingPlan> {
    const registry = getRepositoryRegistry();
    const planRepo = registry.getPricingPlanRepository();
    const featureRepo = registry.getPricingPlanFeatureRepository();
    const limitRepo = registry.getPricingPlanLimitRepository();

    // Create plan
    const plan = await planRepo.create(dto);

    // Add features
    for (const featureDto of features) {
      await featureRepo.create({
        ...featureDto,
        pricing_plan_id: plan.id,
      });
    }

    // Add limits
    for (const limitDto of limits) {
      await limitRepo.create({
        ...limitDto,
        pricing_plan_id: plan.id,
      });
    }

    return planRepo.findByIdWithDetails(plan.id) as Promise<PricingPlan>;
  }

  /**
   * Update a pricing plan
   */
  async updatePricingPlan(
    id: number,
    dto: UpdatePricingPlanDTO,
  ): Promise<PricingPlan> {
    const registry = getRepositoryRegistry();
    const planRepo = registry.getPricingPlanRepository();
    await planRepo.update(id, dto);
    return planRepo.findByIdWithDetails(id) as Promise<PricingPlan>;
  }

  /**
   * Reorder pricing plans by sort_order
   */
  async reorderPricingPlans(planIds: number[]): Promise<void> {
    const registry = getRepositoryRegistry();
    const planRepo = registry.getPricingPlanRepository();

    const updates = planIds.map((id, index) => ({
      id,
      sort_order: index + 1,
    }));

    await planRepo.updateSortOrder(updates);
  }

  /**
   * Assign a pricing plan to a user (create subscription)
   */
  async assignPlanToUser(userId: number, planSlug: string): Promise<void> {
    const registry = getRepositoryRegistry();
    const planRepo = registry.getPricingPlanRepository();
    const subRepo = registry.getUserSubscriptionRepository();

    const plan = await planRepo.findBySlug(planSlug);
    if (!plan) throw new Error(`Pricing plan '${planSlug}' not found`);

    // Check if user already has a subscription
    const existing = await subRepo.findByUserId(userId);
    if (existing) {
      // Update existing subscription
      await subRepo.update(existing.id, {
        pricing_plan_id: plan.id,
        status: "active",
      });
    } else {
      // Create new subscription
      await subRepo.create({
        user_id: userId,
        pricing_plan_id: plan.id,
        status: "active",
      });
    }
  }

  /**
   * Get user subscription with plan details
   */
  async getUserSubscription(userId: number) {
    const registry = getRepositoryRegistry();
    const subRepo = registry.getUserSubscriptionRepository();
    return subRepo.findByUserIdWithDetails(userId);
  }

  /**
   * Get the pricing limit for a space (based on the space owner's subscription)
   */
  async getSpaceLimit(
    spaceId: number,
    limitName: string,
  ): Promise<number | null> {
    const registry = getRepositoryRegistry();
    const spaceRepo = registry.getSpaceRepository();
    const subRepo = registry.getUserSubscriptionRepository();
    const limitRepo = registry.getPricingPlanLimitRepository();

    const space = await spaceRepo.findById(spaceId);
    if (!space) return null;

    const subscription = await subRepo.findByUserId(space.owner_id);
    if (!subscription) {
      // Default to Lab (Free) plan limits if no subscription
      const labPlan = await registry.getPricingPlanRepository().findBySlug("lab");
      if (!labPlan) return null;
      
      const limit = await limitRepo.findLimitByPlanAndName(labPlan.id, limitName);
      return limit ? limit.limit_value : null;
    }

    const limit = await limitRepo.findLimitByPlanAndName(
      subscription.pricing_plan_id,
      limitName,
    );
    return limit ? limit.limit_value : null;
  }

  /**
   * Check if a space has a specific feature enabled (based on the space owner's subscription)
   */
  async hasSpaceFeature(
    spaceId: number,
    featureName: string,
  ): Promise<boolean> {
    const registry = getRepositoryRegistry();
    const spaceRepo = registry.getSpaceRepository();
    const subRepo = registry.getUserSubscriptionRepository();
    const planRepo = registry.getPricingPlanRepository();

    const space = await spaceRepo.findById(spaceId);
    if (!space) return false;

    const subscription = await subRepo.findByUserId(space.owner_id);
    
    let planSlug: string;
    if (!subscription) {
      planSlug = "lab";
    } else {
      const plan = await planRepo.findById(subscription.pricing_plan_id);
      planSlug = plan?.slug || "lab";
    }

    // Logic based on plan capabilities (not just marketing text)
    const normalizedFeature = featureName.toLowerCase();
    
    if (normalizedFeature.includes("targeting") || normalizedFeature.includes("scheduling")) {
      return planSlug === "basic" || planSlug === "pro";
    }
    
    if (normalizedFeature.includes("collaboration")) {
      return planSlug === "pro";
    }
    
    if (normalizedFeature.includes("analytics")) {
      return true; // All plans have at least basic analytics
    }
    
    if (normalizedFeature.includes("api")) {
      return planSlug === "basic" || planSlug === "pro";
    }

    // Fallback to checking marketing features list if any custom ones are added
    const features = await registry.getPricingPlanFeatureRepository().findByPricingPlanId(
      subscription?.pricing_plan_id || (await planRepo.findBySlug("lab"))?.id || 0
    );
    return features.some(f => f.feature_name.toLowerCase().includes(normalizedFeature));
  }
}
