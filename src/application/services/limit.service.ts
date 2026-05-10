/**
 * Limit Enforcement Service
 * Checks and enforces plan limits for spaces/users
 */

import { getDatabase } from "@lib/db";
import { PricingService } from "./pricing.service";

const pricingService = PricingService.getInstance();

export interface LimitResult {
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
  error?: string;
}

export class LimitService {
  private static instance: LimitService;

  static getInstance(): LimitService {
    if (!LimitService.instance) {
      LimitService.instance = new LimitService();
    }
    return LimitService.instance;
  }

  /**
   * Check if creating a resource would exceed the plan limit
   */
  async checkLimit(spaceId: number, limitName: string): Promise<LimitResult> {
    const limitValue = await pricingService.getSpaceLimit(spaceId, limitName);
    
    if (limitValue === null) {
      return {
        allowed: false,
        current: 0,
        limit: 0,
        remaining: 0,
        error: `Limit '${limitName}' not configured`,
      };
    }

    const isUnlimited = limitValue === -1;
    const current = await this.getCurrentUsage(spaceId, limitName);
    const remaining = isUnlimited ? -1 : limitValue - current;
    
    return {
      allowed: isUnlimited || current < limitValue,
      current,
      limit: limitValue,
      remaining: isUnlimited ? -1 : remaining,
      error: !isUnlimited && current >= limitValue 
        ? `Limit reached for '${limitName}'` 
        : undefined,
    };
  }

  /**
   * Get current usage count for a limit type
   */
  private async getCurrentUsage(spaceId: number, limitName: string): Promise<number> {
    const db = await getDatabase();

    switch (limitName) {
      case "max_flags": {
        const result = await db.execute({
          sql: "SELECT COUNT(*) as count FROM features WHERE space_id = ?",
          args: [spaceId],
        });
        return Number(result.rows[0]?.count || 0);
      }

      case "max_environments": {
        const result = await db.execute({
          sql: "SELECT COUNT(*) as count FROM environments WHERE space_id = ?",
          args: [spaceId],
        });
        return Number(result.rows[0]?.count || 0);
      }

      case "max_team_members": {
        const result = await db.execute({
          sql: "SELECT COUNT(*) as count FROM space_members WHERE space_id = ?",
          args: [spaceId],
        });
        return Number(result.rows[0]?.count || 0);
      }

      case "max_api_keys": {
        const result = await db.execute({
          sql: `SELECT COUNT(*) as count FROM api_keys ae 
                JOIN environments e ON ae.environment_id = e.id 
                WHERE e.space_id = ?`,
          args: [spaceId],
        });
        return Number(result.rows[0]?.count || 0);
      }

      default:
        return 0;
    }
  }

  /**
   * Check if API requests limit is available for the space (monthly)
   */
  async checkApiRateLimit(spaceId: number): Promise<LimitResult> {
    const limitValue = await pricingService.getSpaceLimit(spaceId, "api_requests_per_month");
    
    if (limitValue === null) {
      return {
        allowed: false,
        current: 0,
        limit: 0,
        remaining: 0,
        error: "API rate limit not configured",
      };
    }

    const isUnlimited = limitValue === -1;
    const current = await this.getCurrentMonthApiCalls(spaceId);
    const remaining = isUnlimited ? -1 : limitValue - current;

    return {
      allowed: isUnlimited || current < limitValue,
      current,
      limit: limitValue,
      remaining: isUnlimited ? -1 : remaining,
      error: !isUnlimited && current >= limitValue
        ? "Monthly API request limit reached"
        : undefined,
    };
  }

  /**
   * Get API calls count for current month
   */
  private async getCurrentMonthApiCalls(spaceId: number): Promise<number> {
    const db = await getDatabase();
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const result = await db.execute({
      sql: `SELECT COUNT(*) as count FROM flag_evaluations 
            WHERE space_id = ? AND created_at >= ?`,
      args: [spaceId, startOfMonth.toISOString()],
    });

    return Number(result.rows[0]?.count || 0);
  }

  /**
   * Record an API call for rate limiting
   */
  async recordApiCall(spaceId: number): Promise<void> {
    const db = await getDatabase();
    const now = new Date().toISOString();
    
    // This is already recorded by analytics middleware
    // This method is for explicit tracking if needed
  }

  /**
   * Get plan limits for a specific plan ID
   */
  async getPlanLimits(planId: number): Promise<any[]> {
    const db = await getDatabase();
    const result = await db.execute({
      sql: `SELECT limit_name, limit_value, limit_description 
            FROM pricing_plan_limits 
            WHERE pricing_plan_id = ?`,
      args: [planId],
    });
    return result.rows as any[];
  }

  /**
   * Get API call usage for a user and time period
   */
  async getApiCallUsage(userId: number, spaceId: number | undefined, periodStart: Date, periodEnd: Date): Promise<number> {
    const db = await getDatabase();
    
    let sql = `SELECT COUNT(*) as count FROM flag_evaluations 
               WHERE created_at BETWEEN ? AND ?`;
    let args = [periodStart.toISOString(), periodEnd.toISOString()];
    
    if (spaceId) {
      sql += " AND space_id = ?";
      args.push(spaceId);
    } else {
      // Get all spaces for the user
      const spacesResult = await db.execute({
        sql: `SELECT id FROM spaces WHERE owner_id = ? 
              UNION 
              SELECT space_id FROM space_members WHERE user_id = ?`,
        args: [userId, userId],
      });
      
      const spaceIds = spacesResult.rows.map(row => row.id);
      if (spaceIds.length > 0) {
        sql += ` AND space_id IN (${spaceIds.map(() => "?").join(",")})`;
        args.push(...spaceIds);
      } else {
        return 0;
      }
    }
    
    const result = await db.execute({ sql, args });
    return Number(result.rows[0]?.count || 0);
  }

  /**
   * Get feature flag count for a user
   */
  async getFeatureFlagCount(userId: number, spaceId: number | undefined): Promise<number> {
    const db = await getDatabase();
    
    let sql = `SELECT COUNT(*) as count FROM features`;
    let args: any[] = [];
    
    if (spaceId) {
      sql += " WHERE space_id = ?";
      args.push(spaceId);
    } else {
      // Get all spaces for the user
      const spacesResult = await db.execute({
        sql: `SELECT id FROM spaces WHERE owner_id = ? 
              UNION 
              SELECT space_id FROM space_members WHERE user_id = ?`,
        args: [userId, userId],
      });
      
      const spaceIds = spacesResult.rows.map(row => row.id);
      if (spaceIds.length > 0) {
        sql += ` WHERE space_id IN (${spaceIds.map(() => "?").join(",")})`;
        args.push(...spaceIds);
      } else {
        return 0;
      }
    }
    
    const result = await db.execute({ sql, args });
    return Number(result.rows[0]?.count || 0);
  }

  /**
   * Get environment count for a user
   */
  async getEnvironmentCount(userId: number, spaceId: number | undefined): Promise<number> {
    const db = await getDatabase();
    
    let sql = `SELECT COUNT(*) as count FROM environments`;
    let args: any[] = [];
    
    if (spaceId) {
      sql += " WHERE space_id = ?";
      args.push(spaceId);
    } else {
      // Get all spaces for the user
      const spacesResult = await db.execute({
        sql: `SELECT id FROM spaces WHERE owner_id = ? 
              UNION 
              SELECT space_id FROM space_members WHERE user_id = ?`,
        args: [userId, userId],
      });
      
      const spaceIds = spacesResult.rows.map(row => row.id);
      if (spaceIds.length > 0) {
        sql += ` WHERE space_id IN (${spaceIds.map(() => "?").join(",")})`;
        args.push(...spaceIds);
      } else {
        return 0;
      }
    }
    
    const result = await db.execute({ sql, args });
    return Number(result.rows[0]?.count || 0);
  }

  /**
   * Get team member count for a user
   */
  async getTeamMemberCount(userId: number, spaceId: number | undefined): Promise<number> {
    const db = await getDatabase();
    
    let sql = `SELECT COUNT(*) as count FROM space_members`;
    let args: any[] = [];
    
    if (spaceId) {
      sql += " WHERE space_id = ?";
      args.push(spaceId);
    } else {
      // Get all spaces for the user
      const spacesResult = await db.execute({
        sql: `SELECT id FROM spaces WHERE owner_id = ? 
              UNION 
              SELECT space_id FROM space_members WHERE user_id = ?`,
        args: [userId, userId],
      });
      
      const spaceIds = spacesResult.rows.map(row => row.id);
      if (spaceIds.length > 0) {
        sql += ` WHERE space_id IN (${spaceIds.map(() => "?").join(",")})`;
        args.push(...spaceIds);
      } else {
        return 0;
      }
    }
    
    const result = await db.execute({ sql, args });
    return Number(result.rows[0]?.count || 0);
  }

  /**
   * Get all limits for a space
   */
  async getAllLimits(spaceId: number): Promise<Record<string, LimitResult>> {
    const limits = [
      "max_flags",
      "max_environments", 
      "max_team_members",
      "max_api_keys",
      "api_requests_per_month",
    ];

    const results: Record<string, LimitResult> = {};

    for (const limit of limits) {
      if (limit === "api_requests_per_month") {
        results[limit] = await this.checkApiRateLimit(spaceId);
      } else {
        results[limit] = await this.checkLimit(spaceId, limit);
      }
    }

    return results;
  }
}