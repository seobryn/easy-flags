/**
 * Adapter Layer - LibSQL Pricing Implementation
 * Implements pricing plan, features, limits, and subscription repositories
 */

import { getDatabase } from "@lib/db";
import type { Client, InArgs } from "@libsql/client";
import type {
  PricingPlan,
  PricingPlanFeature,
  PricingPlanLimit,
  UserSubscription,
  CreatePricingPlanDTO,
  UpdatePricingPlanDTO,
  CreatePricingPlanFeatureDTO,
  CreatePricingPlanLimitDTO,
  CreateUserSubscriptionDTO,
  UpdateUserSubscriptionDTO,
  SubscriptionStatus,
} from "@domain/entities";
import type {
  PricingPlanRepository,
  PricingPlanFeatureRepository,
  PricingPlanLimitRepository,
  UserSubscriptionRepository,
} from "@application/ports/repositories";

// ====================
// Pricing Plan Repository Adapter
// ====================

export class LibSqlPricingPlanRepository implements PricingPlanRepository {
  private db: Client | null = null;

  private async getDb(): Promise<Client> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  async create(dto: CreatePricingPlanDTO): Promise<PricingPlan> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `INSERT INTO pricing_plans (slug, name, description, price_usd, price_cop, billing_period, is_active, is_recommended, sort_order, stripe_price_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        dto.slug,
        dto.name,
        dto.description || null,
        dto.price_usd,
        dto.price_cop,
        dto.billing_period,
        dto.is_active !== false ? 1 : 0,
        dto.is_recommended ? 1 : 0,
        dto.sort_order || 0,
        dto.stripe_price_id || null,
      ],
    });

    const newPlan = await this.findById(Number(result.lastInsertRowid));
    if (!newPlan) throw new Error("Failed to create pricing plan");
    return newPlan;
  }

  async findById(id: number): Promise<PricingPlan | null> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `SELECT id, slug, name, description, price_usd, price_cop, billing_period, is_active, is_recommended, sort_order, stripe_price_id, created_at, updated_at
            FROM pricing_plans WHERE id = ?`,
      args: [id],
    });

    if (result.rows.length === 0) return null;

    const row = result.rows[0] as Record<string, unknown>;
    return {
      id: Number(row.id),
      slug: row.slug as string,
      name: row.name as string,
      description: row.description as string | undefined,
      price_usd: Number(row.price_usd),
      price_cop: Number(row.price_cop),
      billing_period: row.billing_period as "monthly" | "yearly" | "one-time",
      is_active: (row.is_active as number) === 1,
      is_recommended: (row.is_recommended as number) === 1,
      sort_order: Number(row.sort_order),
      stripe_price_id: row.stripe_price_id as string | undefined,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
  }

  async findBySlug(slug: string): Promise<PricingPlan | null> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `SELECT id, slug, name, description, price_usd, price_cop, billing_period, is_active, is_recommended, sort_order, stripe_price_id, created_at, updated_at
            FROM pricing_plans WHERE slug = ?`,
      args: [slug],
    });

    if (result.rows.length === 0) return null;

    const row = result.rows[0] as Record<string, unknown>;
    return {
      id: Number(row.id),
      slug: row.slug as string,
      name: row.name as string,
      description: row.description as string | undefined,
      price_usd: Number(row.price_usd),
      price_cop: Number(row.price_cop),
      billing_period: row.billing_period as "monthly" | "yearly" | "one-time",
      is_active: (row.is_active as number) === 1,
      is_recommended: (row.is_recommended as number) === 1,
      sort_order: Number(row.sort_order),
      stripe_price_id: row.stripe_price_id as string | undefined,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
  }

  async findAll(includeInactive: boolean = false): Promise<PricingPlan[]> {
    const db = await this.getDb();
    const query = includeInactive
      ? `SELECT id, slug, name, description, price_usd, price_cop, billing_period, is_active, is_recommended, sort_order, stripe_price_id, created_at, updated_at
         FROM pricing_plans ORDER BY sort_order ASC`
      : `SELECT id, slug, name, description, price_usd, price_cop, billing_period, is_active, is_recommended, sort_order, stripe_price_id, created_at, updated_at
         FROM pricing_plans WHERE is_active = 1 ORDER BY sort_order ASC`;

    const result = await db.execute(query);
    return result.rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: Number(r.id),
        slug: r.slug as string,
        name: r.name as string,
        description: r.description as string | undefined,
        price_usd: Number(r.price_usd),
        price_cop: Number(r.price_cop),
        billing_period: r.billing_period as "monthly" | "yearly" | "one-time",
        is_active: (r.is_active as number) === 1,
        is_recommended: (r.is_recommended as number) === 1,
        sort_order: Number(r.sort_order),
        stripe_price_id: r.stripe_price_id as string | undefined,
        created_at: r.created_at as string,
        updated_at: r.updated_at as string,
      };
    });
  }

  async findActive(): Promise<PricingPlan[]> {
    return this.findAll(false);
  }

  async update(id: number, dto: UpdatePricingPlanDTO): Promise<PricingPlan> {
    const db = await this.getDb();
    const fields: string[] = [];
    const args: unknown[] = [];

    if (dto.name) {
      fields.push("name = ?");
      args.push(dto.name);
    }
    if (dto.description !== undefined) {
      fields.push("description = ?");
      args.push(dto.description || null);
    }
    if (dto.price_usd !== undefined) {
      fields.push("price_usd = ?");
      args.push(dto.price_usd);
    }
    if (dto.price_cop !== undefined) {
      fields.push("price_cop = ?");
      args.push(dto.price_cop);
    }
    if (dto.is_active !== undefined) {
      fields.push("is_active = ?");
      args.push(dto.is_active ? 1 : 0);
    }
    if (dto.is_recommended !== undefined) {
      fields.push("is_recommended = ?");
      args.push(dto.is_recommended ? 1 : 0);
    }
    if (dto.sort_order !== undefined) {
      fields.push("sort_order = ?");
      args.push(dto.sort_order);
    }
    if (dto.stripe_price_id !== undefined) {
      fields.push("stripe_price_id = ?");
      args.push(dto.stripe_price_id || null);
    }

    if (fields.length === 0) {
      return (await this.findById(id))!;
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");
    args.push(id);

    await db.execute({
      sql: `UPDATE pricing_plans SET ${fields.join(", ")} WHERE id = ?`,
      args: args as InArgs,
    });

    const updated = await this.findById(id);
    if (!updated) throw new Error("Failed to update pricing plan");
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute({
      sql: "DELETE FROM pricing_plans WHERE id = ?",
      args: [id],
    });
  }

  async findByIdWithDetails(id: number): Promise<PricingPlan | null> {
    const plan = await this.findById(id);
    if (!plan) return null;

    // Fetch features and limits
    const featureRepo = new LibSqlPricingPlanFeatureRepository();
    const limitRepo = new LibSqlPricingPlanLimitRepository();

    plan.features = await featureRepo.findByPricingPlanId(id);
    plan.limits = await limitRepo.findByPricingPlanId(id);

    return plan;
  }

  async updateSortOrder(
    plans: Array<{ id: number; sort_order: number }>,
  ): Promise<void> {
    const db = await this.getDb();
    for (const plan of plans) {
      await db.execute({
        sql: "UPDATE pricing_plans SET sort_order = ? WHERE id = ?",
        args: [plan.sort_order, plan.id],
      });
    }
  }
}

// ====================
// Pricing Plan Feature Repository Adapter
// ====================

export class LibSqlPricingPlanFeatureRepository implements PricingPlanFeatureRepository {
  private db: Client | null = null;

  private async getDb(): Promise<Client> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  async create(dto: CreatePricingPlanFeatureDTO): Promise<PricingPlanFeature> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `INSERT INTO pricing_plan_features (pricing_plan_id, feature_name, feature_description, feature_value, sort_order)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        dto.pricing_plan_id,
        dto.feature_name,
        dto.feature_description || null,
        dto.feature_value || null,
        dto.sort_order || 0,
      ],
    });

    const newFeature = await this.findById(Number(result.lastInsertRowid));
    if (!newFeature) throw new Error("Failed to create pricing plan feature");
    return newFeature;
  }

  async findById(id: number): Promise<PricingPlanFeature | null> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `SELECT id, pricing_plan_id, feature_name, feature_description, feature_value, sort_order, created_at
            FROM pricing_plan_features WHERE id = ?`,
      args: [id],
    });

    if (result.rows.length === 0) return null;

    const row = result.rows[0] as Record<string, unknown>;
    return {
      id: Number(row.id),
      pricing_plan_id: Number(row.pricing_plan_id),
      feature_name: row.feature_name as string,
      feature_description: row.feature_description as string | undefined,
      feature_value: row.feature_value as string | undefined,
      sort_order: Number(row.sort_order),
      created_at: row.created_at as string,
    };
  }

  async findByPricingPlanId(
    pricingPlanId: number,
  ): Promise<PricingPlanFeature[]> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `SELECT id, pricing_plan_id, feature_name, feature_description, feature_value, sort_order, created_at
            FROM pricing_plan_features WHERE pricing_plan_id = ? ORDER BY sort_order ASC`,
      args: [pricingPlanId],
    });

    return result.rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: Number(r.id),
        pricing_plan_id: Number(r.pricing_plan_id),
        feature_name: r.feature_name as string,
        feature_description: r.feature_description as string | undefined,
        feature_value: r.feature_value as string | undefined,
        sort_order: Number(r.sort_order),
        created_at: r.created_at as string,
      };
    });
  }

  async update(
    id: number,
    feature: Partial<PricingPlanFeature>,
  ): Promise<PricingPlanFeature> {
    const db = await this.getDb();
    const fields: string[] = [];
    const args: unknown[] = [];

    if (feature.feature_name) {
      fields.push("feature_name = ?");
      args.push(feature.feature_name);
    }
    if (feature.feature_description !== undefined) {
      fields.push("feature_description = ?");
      args.push(feature.feature_description || null);
    }
    if (feature.feature_value !== undefined) {
      fields.push("feature_value = ?");
      args.push(feature.feature_value || null);
    }
    if (feature.sort_order !== undefined) {
      fields.push("sort_order = ?");
      args.push(feature.sort_order);
    }

    if (fields.length === 0) {
      return (await this.findById(id))!;
    }

    args.push(id);
    await db.execute({
      sql: `UPDATE pricing_plan_features SET ${fields.join(", ")} WHERE id = ?`,
      args: args as InArgs,
    });

    const updated = await this.findById(id);
    if (!updated) throw new Error("Failed to update pricing plan feature");
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute({
      sql: "DELETE FROM pricing_plan_features WHERE id = ?",
      args: [id],
    });
  }

  async deleteByPricingPlanId(pricingPlanId: number): Promise<void> {
    const db = await this.getDb();
    await db.execute({
      sql: "DELETE FROM pricing_plan_features WHERE pricing_plan_id = ?",
      args: [pricingPlanId],
    });
  }

  async updateSortOrder(
    features: Array<{ id: number; sort_order: number }>,
  ): Promise<void> {
    const db = await this.getDb();
    for (const feature of features) {
      await db.execute({
        sql: "UPDATE pricing_plan_features SET sort_order = ? WHERE id = ?",
        args: [feature.sort_order, feature.id],
      });
    }
  }
}

// ====================
// Pricing Plan Limit Repository Adapter
// ====================

export class LibSqlPricingPlanLimitRepository implements PricingPlanLimitRepository {
  private db: Client | null = null;

  private async getDb(): Promise<Client> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  async create(dto: CreatePricingPlanLimitDTO): Promise<PricingPlanLimit> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `INSERT INTO pricing_plan_limits (pricing_plan_id, limit_name, limit_value, limit_description)
            VALUES (?, ?, ?, ?)`,
      args: [
        dto.pricing_plan_id,
        dto.limit_name,
        dto.limit_value,
        dto.limit_description || null,
      ],
    });

    const newLimit = await this.findById(Number(result.lastInsertRowid));
    if (!newLimit) throw new Error("Failed to create pricing plan limit");
    return newLimit;
  }

  async findById(id: number): Promise<PricingPlanLimit | null> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `SELECT id, pricing_plan_id, limit_name, limit_value, limit_description, created_at, updated_at
            FROM pricing_plan_limits WHERE id = ?`,
      args: [id],
    });

    if (result.rows.length === 0) return null;

    const row = result.rows[0] as Record<string, unknown>;
    return {
      id: Number(row.id),
      pricing_plan_id: Number(row.pricing_plan_id),
      limit_name: row.limit_name as string,
      limit_value: Number(row.limit_value),
      limit_description: row.limit_description as string | undefined,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
  }

  async findByPricingPlanId(
    pricingPlanId: number,
  ): Promise<PricingPlanLimit[]> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `SELECT id, pricing_plan_id, limit_name, limit_value, limit_description, created_at, updated_at
            FROM pricing_plan_limits WHERE pricing_plan_id = ?`,
      args: [pricingPlanId],
    });

    return result.rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: Number(r.id),
        pricing_plan_id: Number(r.pricing_plan_id),
        limit_name: r.limit_name as string,
        limit_value: Number(r.limit_value),
        limit_description: r.limit_description as string | undefined,
        created_at: r.created_at as string,
        updated_at: r.updated_at as string,
      };
    });
  }

  async findLimitByPlanAndName(
    pricingPlanId: number,
    limitName: string,
  ): Promise<PricingPlanLimit | null> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `SELECT id, pricing_plan_id, limit_name, limit_value, limit_description, created_at, updated_at
            FROM pricing_plan_limits WHERE pricing_plan_id = ? AND limit_name = ?`,
      args: [pricingPlanId, limitName],
    });

    if (result.rows.length === 0) return null;

    const row = result.rows[0] as Record<string, unknown>;
    return {
      id: Number(row.id),
      pricing_plan_id: Number(row.pricing_plan_id),
      limit_name: row.limit_name as string,
      limit_value: Number(row.limit_value),
      limit_description: row.limit_description as string | undefined,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
  }

  async update(
    id: number,
    limit: Partial<PricingPlanLimit>,
  ): Promise<PricingPlanLimit> {
    const db = await this.getDb();
    const fields: string[] = [];
    const args: unknown[] = [];

    if (limit.limit_name) {
      fields.push("limit_name = ?");
      args.push(limit.limit_name);
    }
    if (limit.limit_value !== undefined) {
      fields.push("limit_value = ?");
      args.push(limit.limit_value);
    }
    if (limit.limit_description !== undefined) {
      fields.push("limit_description = ?");
      args.push(limit.limit_description || null);
    }

    if (fields.length === 0) {
      return (await this.findById(id))!;
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");
    args.push(id);

    await db.execute({
      sql: `UPDATE pricing_plan_limits SET ${fields.join(", ")} WHERE id = ?`,
      args: args as InArgs,
    });

    const updated = await this.findById(id);
    if (!updated) throw new Error("Failed to update pricing plan limit");
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute({
      sql: "DELETE FROM pricing_plan_limits WHERE id = ?",
      args: [id],
    });
  }

  async deleteByPricingPlanId(pricingPlanId: number): Promise<void> {
    const db = await this.getDb();
    await db.execute({
      sql: "DELETE FROM pricing_plan_limits WHERE pricing_plan_id = ?",
      args: [pricingPlanId],
    });
  }
}

// ====================
// User Subscription Repository Adapter
// ====================

export class LibSqlUserSubscriptionRepository implements UserSubscriptionRepository {
  private db: Client | null = null;

  private async getDb(): Promise<Client> {
    if (!this.db) {
      this.db = await getDatabase();
    }
    return this.db;
  }

  async create(dto: CreateUserSubscriptionDTO): Promise<UserSubscription> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `INSERT INTO user_subscriptions (user_id, pricing_plan_id, status, trial_start_date, trial_end_date)
            VALUES (?, ?, ?, ?, ?)`,
      args: [
        dto.user_id,
        dto.pricing_plan_id,
        dto.status || "active",
        dto.trial_start_date || null,
        dto.trial_end_date || null,
      ],
    });

    const newSubscription = await this.findById(Number(result.lastInsertRowid));
    if (!newSubscription)
      throw new Error("Failed to create user subscription");
    return newSubscription;
  }

  async findById(id: number): Promise<UserSubscription | null> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `SELECT id, user_id, pricing_plan_id, status, trial_start_date, trial_end_date, current_period_start, current_period_end, cancellation_date, canceled_at, created_at, updated_at
            FROM user_subscriptions WHERE id = ?`,
      args: [id],
    });

    if (result.rows.length === 0) return null;

    const row = result.rows[0] as Record<string, unknown>;
    return {
      id: Number(row.id),
      user_id: Number(row.user_id),
      pricing_plan_id: Number(row.pricing_plan_id),
      status: row.status as SubscriptionStatus,
      trial_start_date: row.trial_start_date as string | undefined,
      trial_end_date: row.trial_end_date as string | undefined,
      current_period_start: row.current_period_start as string | undefined,
      current_period_end: row.current_period_end as string | undefined,
      cancellation_date: row.cancellation_date as string | undefined,
      canceled_at: row.canceled_at as string | undefined,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
  }

  async findByUserId(userId: number): Promise<UserSubscription | null> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `SELECT id, user_id, pricing_plan_id, status, trial_start_date, trial_end_date, current_period_start, current_period_end, cancellation_date, canceled_at, created_at, updated_at
            FROM user_subscriptions WHERE user_id = ?`,
      args: [userId],
    });

    if (result.rows.length === 0) return null;

    const row = result.rows[0] as Record<string, unknown>;
    return {
      id: Number(row.id),
      user_id: Number(row.user_id),
      pricing_plan_id: Number(row.pricing_plan_id),
      status: row.status as SubscriptionStatus,
      trial_start_date: row.trial_start_date as string | undefined,
      trial_end_date: row.trial_end_date as string | undefined,
      current_period_start: row.current_period_start as string | undefined,
      current_period_end: row.current_period_end as string | undefined,
      cancellation_date: row.cancellation_date as string | undefined,
      canceled_at: row.canceled_at as string | undefined,
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    };
  }

  async findByPricingPlanId(
    pricingPlanId: number,
  ): Promise<UserSubscription[]> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `SELECT id, user_id, pricing_plan_id, status, trial_start_date, trial_end_date, current_period_start, current_period_end, cancellation_date, canceled_at, created_at, updated_at
            FROM user_subscriptions WHERE pricing_plan_id = ?`,
      args: [pricingPlanId],
    });

    return result.rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: Number(r.id),
        user_id: Number(r.user_id),
        pricing_plan_id: Number(r.pricing_plan_id),
        status: r.status as SubscriptionStatus,
        trial_start_date: r.trial_start_date as string | undefined,
        trial_end_date: r.trial_end_date as string | undefined,
        current_period_start: r.current_period_start as string | undefined,
        current_period_end: r.current_period_end as string | undefined,
        cancellation_date: r.cancellation_date as string | undefined,
        canceled_at: r.canceled_at as string | undefined,
        created_at: r.created_at as string,
        updated_at: r.updated_at as string,
      };
    });
  }

  async findByStatus(status: string): Promise<UserSubscription[]> {
    const db = await this.getDb();
    const result = await db.execute({
      sql: `SELECT id, user_id, pricing_plan_id, status, trial_start_date, trial_end_date, current_period_start, current_period_end, cancellation_date, canceled_at, created_at, updated_at
            FROM user_subscriptions WHERE status = ?`,
      args: [status],
    });

    return result.rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: Number(r.id),
        user_id: Number(r.user_id),
        pricing_plan_id: Number(r.pricing_plan_id),
        status: r.status as SubscriptionStatus,
        trial_start_date: r.trial_start_date as string | undefined,
        trial_end_date: r.trial_end_date as string | undefined,
        current_period_start: r.current_period_start as string | undefined,
        current_period_end: r.current_period_end as string | undefined,
        cancellation_date: r.cancellation_date as string | undefined,
        canceled_at: r.canceled_at as string | undefined,
        created_at: r.created_at as string,
        updated_at: r.updated_at as string,
      };
    });
  }

  async update(
    id: number,
    dto: UpdateUserSubscriptionDTO,
  ): Promise<UserSubscription> {
    const db = await this.getDb();
    const fields: string[] = [];
    const args: unknown[] = [];

    if (dto.pricing_plan_id) {
      fields.push("pricing_plan_id = ?");
      args.push(dto.pricing_plan_id);
    }
    if (dto.status) {
      fields.push("status = ?");
      args.push(dto.status);
    }
    if (dto.current_period_start !== undefined) {
      fields.push("current_period_start = ?");
      args.push(dto.current_period_start || null);
    }
    if (dto.current_period_end !== undefined) {
      fields.push("current_period_end = ?");
      args.push(dto.current_period_end || null);
    }
    if (dto.cancellation_date !== undefined) {
      fields.push("cancellation_date = ?");
      args.push(dto.cancellation_date || null);
    }
    if (dto.canceled_at !== undefined) {
      fields.push("canceled_at = ?");
      args.push(dto.canceled_at || null);
    }

    if (fields.length === 0) {
      return (await this.findById(id))!;
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");
    args.push(id);

    await db.execute({
      sql: `UPDATE user_subscriptions SET ${fields.join(", ")} WHERE id = ?`,
      args: args as InArgs,
    });

    const updated = await this.findById(id);
    if (!updated) throw new Error("Failed to update user subscription");
    return updated;
  }

  async delete(id: number): Promise<void> {
    const db = await this.getDb();
    await db.execute({
      sql: "DELETE FROM user_subscriptions WHERE id = ?",
      args: [id],
    });
  }

  async findByUserIdWithDetails(
    userId: number,
  ): Promise<UserSubscription | null> {
    const subscription = await this.findByUserId(userId);
    if (!subscription) return null;

    // Fetch the pricing plan details
    const planRepo = new LibSqlPricingPlanRepository();
    subscription.plan =
      (await planRepo.findByIdWithDetails(subscription.pricing_plan_id)) ||
      undefined;

    return subscription;
  }

  async findAll(): Promise<UserSubscription[]> {
    const db = await this.getDb();
    const result = await db.execute(
      `SELECT id, user_id, pricing_plan_id, status, trial_start_date, trial_end_date, current_period_start, current_period_end, cancellation_date, canceled_at, created_at, updated_at
       FROM user_subscriptions ORDER BY created_at DESC`,
    );

    return result.rows.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: Number(r.id),
        user_id: Number(r.user_id),
        pricing_plan_id: Number(r.pricing_plan_id),
        status: r.status as SubscriptionStatus,
        trial_start_date: r.trial_start_date as string | undefined,
        trial_end_date: r.trial_end_date as string | undefined,
        current_period_start: r.current_period_start as string | undefined,
        current_period_end: r.current_period_end as string | undefined,
        cancellation_date: r.cancellation_date as string | undefined,
        canceled_at: r.canceled_at as string | undefined,
        created_at: r.created_at as string,
        updated_at: r.updated_at as string,
      };
    });
  }
}
