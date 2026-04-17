/**
 * Application Layer - Use Cases / Services
 * Contains business logic and orchestrates repository access
 */

import { getRepositoryRegistry } from "@infrastructure/registry";
import { FlagEvaluationService } from "./evaluation.service";
import { PaymentService } from "./payment.service";
export { FlagEvaluationService, PaymentService };
import type {
  Space,
  Feature,
  FeatureFlag,
  Environment,
  SpaceMember,
  AdvancedConfiguration,
  TargetingRule,
  CreateSpaceDTO,
  UpdateSpaceDTO,
  CreateEnvironmentDTO,
  CreateFeatureDTO,
  UpdateFeatureDTO,
  CreateAdvancedConfigDTO,
  AddTeamMemberDTO,
  UpdateTeamMemberDTO,
  FlagEvaluation,
  FlagUsageMetric,
  PerformanceMetric,
  FlagImpactAnalysis,
  CreateFlagEvaluationDTO,
  AnalyticsQueryFilters,
  AuditLog,
  ComplianceReport,
  PermissionDenialLog,
  CreateAuditLogDTO,
  AuditLogQueryFilters,
  ComplianceReportQueryFilters,
  AuditSeverity,
} from "@domain/entities";

// ====================
// Space Service
// ====================

export class SpaceService {
  private registry = getRepositoryRegistry();

  async createSpace(ownerId: number, dto: CreateSpaceDTO): Promise<Space> {
    return this.registry.getSpaceRepository().create(dto, ownerId);
  }

  async getSpace(id: number): Promise<Space | null> {
    return this.registry.getSpaceRepository().findById(id);
  }

  async getSpaceBySlug(slug: string): Promise<Space | null> {
    return this.registry.getSpaceRepository().findBySlug(slug);
  }

  async getUserSpaces(userId: number): Promise<Space[]> {
    return this.registry.getSpaceRepository().findByOwnerId(userId);
  }

  async updateSpace(id: number, dto: UpdateSpaceDTO): Promise<Space> {
    return this.registry.getSpaceRepository().update(id, dto);
  }

  async deleteSpace(id: number): Promise<void> {
    return this.registry.getSpaceRepository().delete(id);
  }

  async getAllSpaces(): Promise<Space[]> {
    return this.registry.getSpaceRepository().findAll();
  }
}

// ====================
// Team Member Service
// ====================

export class TeamMemberService {
  private registry = getRepositoryRegistry();

  async getTeamMembers(spaceId: number): Promise<SpaceMember[]> {
    return this.registry.getSpaceMemberRepository().findBySpaceId(spaceId);
  }

  async addTeamMember(
    spaceId: number,
    userId: number,
    roleId: number,
  ): Promise<SpaceMember> {
    return this.registry
      .getSpaceMemberRepository()
      .create(spaceId, userId, roleId);
  }

  async updateTeamMemberRole(
    memberId: number,
    roleId: number,
  ): Promise<SpaceMember> {
    return this.registry.getSpaceMemberRepository().update(memberId, roleId);
  }

  async removeTeamMember(spaceId: number, userId: number): Promise<void> {
    return this.registry
      .getSpaceMemberRepository()
      .deleteBySpaceAndUser(spaceId, userId);
  }

  async isUserSpaceMember(spaceId: number, userId: number): Promise<boolean> {
    const member = await this.registry
      .getSpaceMemberRepository()
      .findBySpaceAndUser(spaceId, userId);
    return member !== null;
  }
}

// ====================
// Environment Service
// ====================

export class EnvironmentService {
  private registry = getRepositoryRegistry();

  async createEnvironment(
    spaceId: number,
    dto: CreateEnvironmentDTO,
  ): Promise<Environment> {
    return this.registry.getEnvironmentRepository().create(spaceId, dto);
  }

  async getEnvironment(id: number): Promise<Environment | null> {
    return this.registry.getEnvironmentRepository().findById(id);
  }

  async getEnvironmentBySlug(
    spaceId: number,
    slug: string,
  ): Promise<Environment | null> {
    return this.registry.getEnvironmentRepository().findBySlug(spaceId, slug);
  }

  async getSpaceEnvironments(spaceId: number): Promise<Environment[]> {
    return this.registry.getEnvironmentRepository().findBySpaceId(spaceId);
  }

  async updateEnvironment(
    id: number,
    dto: Partial<CreateEnvironmentDTO>,
  ): Promise<Environment> {
    return this.registry.getEnvironmentRepository().update(id, dto);
  }

  async deleteEnvironment(id: number): Promise<void> {
    return this.registry.getEnvironmentRepository().delete(id);
  }

  async regenerateApiKey(id: number): Promise<Environment> {
    return this.registry.getEnvironmentRepository().regenerateApiKey(id);
  }
}

// ====================
// Feature Service
// ====================

export class FeatureService {
  private registry = getRepositoryRegistry();

  async createFeature(
    spaceId: number,
    dto: CreateFeatureDTO,
  ): Promise<Feature> {
    return this.registry.getFeatureRepository().create(spaceId, dto);
  }

  async getFeature(id: number): Promise<Feature | null> {
    return this.registry.getFeatureRepository().findById(id);
  }

  async getFeatureByKey(
    spaceId: number,
    key: string,
  ): Promise<Feature | null> {
    return this.registry.getFeatureRepository().findByKey(spaceId, key);
  }

  async getSpaceFeatures(spaceId: number): Promise<Feature[]> {
    return this.registry.getFeatureRepository().findBySpaceId(spaceId);
  }

  async updateFeature(id: number, dto: UpdateFeatureDTO): Promise<Feature> {
    return this.registry.getFeatureRepository().update(id, dto);
  }

  async deleteFeature(id: number): Promise<void> {
    return this.registry.getFeatureRepository().delete(id);
  }
}

// ====================
// Feature Flag Service
// ====================

export class FeatureFlagService {
  private registry = getRepositoryRegistry();

  async createFeatureFlag(
    featureId: number,
    environmentId: number,
  ): Promise<FeatureFlag> {
    return this.registry
      .getFeatureFlagRepository()
      .create(featureId, environmentId);
  }

  async getFeatureFlag(id: number): Promise<FeatureFlag | null> {
    return this.registry.getFeatureFlagRepository().findById(id);
  }

  async getFeatureFlagByFeatureAndEnvironment(
    featureId: number,
    environmentId: number,
  ): Promise<FeatureFlag | null> {
    return this.registry
      .getFeatureFlagRepository()
      .findByFeatureAndEnvironment(featureId, environmentId);
  }

  async getEnvironmentFlags(environmentId: number): Promise<FeatureFlag[]> {
    return this.registry
      .getFeatureFlagRepository()
      .findByEnvironmentId(environmentId);
  }

  async getFeatureFlags(featureId: number): Promise<FeatureFlag[]> {
    return this.registry.getFeatureFlagRepository().findByFeatureId(featureId);
  }

  async updateFeatureFlag(
    id: number,
    updates: Partial<FeatureFlag>,
  ): Promise<FeatureFlag> {
    return this.registry.getFeatureFlagRepository().update(id, updates);
  }

  async deleteFeatureFlag(id: number): Promise<void> {
    return this.registry.getFeatureFlagRepository().delete(id);
  }
}

// ====================
// Advanced Configuration Service
// ====================

export class AdvancedConfigService {
  private registry = getRepositoryRegistry();

  async createAdvancedConfig(
    dto: CreateAdvancedConfigDTO,
  ): Promise<AdvancedConfiguration> {
    const config = await this.registry
      .getAdvancedConfigRepository()
      .create(dto);

    // Create targeting rules if provided
    if (dto.targeting_rules && dto.targeting_rules.length > 0) {
      for (const rule of dto.targeting_rules) {
        await this.registry
          .getTargetingRuleRepository()
          .create(config.feature_flag_id, rule);
      }
    }

    return config;
  }

  async getAdvancedConfig(id: number): Promise<AdvancedConfiguration | null> {
    return this.registry.getAdvancedConfigRepository().findById(id);
  }

  async getAdvancedConfigByFeatureFlag(
    featureFlagId: number,
  ): Promise<AdvancedConfiguration | null> {
    return this.registry
      .getAdvancedConfigRepository()
      .findByFeatureFlagId(featureFlagId);
  }

  async updateAdvancedConfig(
    id: number,
    updates: Partial<AdvancedConfiguration>,
  ): Promise<AdvancedConfiguration> {
    return this.registry.getAdvancedConfigRepository().update(id, updates);
  }

  async deleteAdvancedConfig(id: number): Promise<void> {
    // Delete associated targeting rules first
    const config = await this.getAdvancedConfig(id);
    if (config) {
      await this.registry
        .getTargetingRuleRepository()
        .deleteByFeatureFlagId(config.feature_flag_id);
    }
    return this.registry.getAdvancedConfigRepository().delete(id);
  }
}

// ====================
// Targeting Rule Service
// ====================

export class TargetingRuleService {
  private registry = getRepositoryRegistry();

  async getTargetingRules(featureFlagId: number): Promise<TargetingRule[]> {
    return this.registry
      .getTargetingRuleRepository()
      .findByFeatureFlagId(featureFlagId);
  }

  async addTargetingRule(
    featureFlagId: number,
    rule: Omit<TargetingRule, "id" | "created_at">,
  ): Promise<TargetingRule> {
    return this.registry
      .getTargetingRuleRepository()
      .create(featureFlagId, rule);
  }

  async updateTargetingRule(
    id: number,
    updates: Partial<Omit<TargetingRule, "id" | "created_at">>,
  ): Promise<TargetingRule> {
    return this.registry.getTargetingRuleRepository().update(id, updates);
  }

  async removeTargetingRule(id: number): Promise<void> {
    return this.registry.getTargetingRuleRepository().delete(id);
  }
}

// ====================
// Environment Config Service
// ====================

export class EnvironmentConfigService {
  private registry = getRepositoryRegistry();

  async getEnvironmentConfigs(environmentId: number) {
    return this.registry
      .getEnvironmentConfigRepository()
      .findByEnvironmentId(environmentId);
  }

  async createConfig(environmentId: number, key: string, value: string) {
    return this.registry
      .getEnvironmentConfigRepository()
      .create(environmentId, { key, default_value: value });
  }

  async updateConfig(id: number, updates: any) {
    return this.registry.getEnvironmentConfigRepository().update(id, updates);
  }

  async deleteConfig(id: number) {
    return this.registry.getEnvironmentConfigRepository().delete(id);
  }
}

// ====================
// API Key Service
// ====================

export class ApiKeyService {
  private registry = getRepositoryRegistry();

  async generateApiKey(environmentId: number) {
    return this.registry.getApiKeyRepository().create(environmentId);
  }

  async getEnvironmentApiKeys(environmentId: number) {
    return this.registry
      .getApiKeyRepository()
      .findByEnvironmentId(environmentId);
  }

  async deleteApiKey(id: number) {
    return this.registry.getApiKeyRepository().delete(id);
  }

  async validateApiKey(key: string) {
    return this.registry.getApiKeyRepository().findByKey(key);
  }
}

// ====================
// Analytics & Observability Service
// ====================

export class AnalyticsService {
  private registry = getRepositoryRegistry();

  // ---- Flag Evaluation Tracking ----

  async trackFlagEvaluation(dto: CreateFlagEvaluationDTO): Promise<FlagEvaluation> {
    return this.registry.getFlagEvaluationRepository().create(dto);
  }

  async getFlagEvaluations(filters: AnalyticsQueryFilters): Promise<FlagEvaluation[]> {
    return this.registry
      .getFlagEvaluationRepository()
      .findByFilters(filters);
  }

  async getRecentEvaluations(
    environmentId: number,
    limit: number = 100,
  ): Promise<FlagEvaluation[]> {
    return this.registry
      .getFlagEvaluationRepository()
      .findRecentByEnvironment(environmentId, limit);
  }

  async cleanupOldEvaluations(days: number = 90): Promise<number> {
    return this.registry
      .getFlagEvaluationRepository()
      .deleteOlderThan(days);
  }

  // ---- Usage Metrics ----

  async recordUsageMetric(
    metric: Omit<FlagUsageMetric, "id" | "created_at" | "updated_at">,
  ): Promise<FlagUsageMetric> {
    return this.registry
      .getFlagUsageMetricRepository()
      .upsert(metric);
  }

  async getUsageMetrics(filters: AnalyticsQueryFilters): Promise<FlagUsageMetric[]> {
    return this.registry
      .getFlagUsageMetricRepository()
      .findByFilters(filters);
  }

  async getFeatureUsageTrend(
    featureId: number,
    days: number = 30,
  ): Promise<FlagUsageMetric[]> {
    return this.registry
      .getFlagUsageMetricRepository()
      .findLatestByFeature(featureId, days);
  }

  async getSpaceMetricsSummary(
    spaceId: number,
    dateFrom: string,
    dateTo: string,
  ): Promise<FlagUsageMetric[]> {
    return this.registry
      .getFlagUsageMetricRepository()
      .findBySpaceAndDate(spaceId, dateFrom, dateTo);
  }

  // ---- Performance Metrics ----

  async recordPerformanceMetric(
    metric: Omit<PerformanceMetric, "id" | "created_at">,
  ): Promise<PerformanceMetric> {
    return this.registry
      .getPerformanceMetricRepository()
      .create(metric);
  }

  async getPerformanceMetrics(
    metricType: PerformanceMetric["metric_type"],
    limit: number = 1000,
  ): Promise<PerformanceMetric[]> {
    return this.registry
      .getPerformanceMetricRepository()
      .findByMetricType(metricType, limit);
  }

  async getEndpointMetrics(endpoint: string, hours: number = 24): Promise<number> {
    return this.registry
      .getPerformanceMetricRepository()
      .findAverageByEndpoint(endpoint, hours);
  }

  async cleanupOldPerformanceMetrics(days: number = 90): Promise<number> {
    return this.registry
      .getPerformanceMetricRepository()
      .deleteOlderThan(days);
  }

  // ---- Impact Analysis ----

  async analyzeFlagImpact(
    featureId: number,
    environmentId: number,
  ): Promise<FlagImpactAnalysis | null> {
    const feature = await this.registry.getFeatureRepository().findById(featureId);
    if (!feature) return null;

    const metrics = await this.registry
      .getFlagUsageMetricRepository()
      .findLatestByFeature(featureId, 30);

    if (metrics.length === 0) {
      return null;
    }

    const totalEvaluations = metrics.reduce(
      (sum, m) => sum + m.total_evaluations,
      0,
    );
    const totalEnabled = metrics.reduce((sum, m) => sum + m.enabled_count, 0);
    const totalErrors = metrics.reduce((sum, m) => sum + m.error_count, 0);
    const avgTime =
      metrics.reduce((sum, m) => sum + m.avg_evaluation_time_ms, 0) /
      metrics.length;

    // Calculate trend by comparing first half to second half
    const midpoint = Math.floor(metrics.length / 2);
    const firstHalf = metrics
      .slice(0, midpoint)
      .reduce((sum, m) => sum + m.enabled_count, 0);
    const secondHalf = metrics
      .slice(midpoint)
      .reduce((sum, m) => sum + m.enabled_count, 0);

    const trend: "increasing" | "decreasing" | "stable" = 
      secondHalf > firstHalf * 1.1 
        ? "increasing"
        : secondHalf < firstHalf * 0.9 
        ? "decreasing"
        : "stable";

    return {
      feature_id: featureId,
      feature_name: feature.name,
      space_id: feature.space_id,
      environment_id: environmentId,
      total_evaluations_30d: totalEvaluations,
      enabled_percentage: totalEvaluations > 0 ? (totalEnabled / totalEvaluations) * 100 : 0,
      unique_api_keys: metrics.length, // Approximation
      avg_response_time_ms: avgTime,
      error_rate: totalEvaluations > 0 ? (totalErrors / totalEvaluations) * 100 : 0,
      last_evaluated_at: metrics[0]?.created_at || new Date().toISOString(),
      trend_30d: trend,
    };
  }
}

// ====================
// Audit Service
// ====================

export class AuditService {
  private registry = getRepositoryRegistry();

  /**
   * Log an audit event
   */
  async logAudit(dto: CreateAuditLogDTO): Promise<AuditLog> {
    return this.registry.getAuditLogRepository().create(dto);
  }

  /**
   * Log a permission denial event
   */
  async logPermissionDenial(
    userId: number,
    resourceType: string,
    resourceId: number,
    requiredPermission: string,
    options?: {
      spaceId?: number;
      userRole?: string;
      ipAddress?: string;
    },
  ): Promise<PermissionDenialLog> {
    return this.registry.getPermissionDenialLogRepository().create({
      user_id: userId,
      space_id: options?.spaceId,
      resource_type: resourceType,
      resource_id: resourceId,
      required_permission: requiredPermission,
      user_role: options?.userRole,
      ip_address: options?.ipAddress,
    });
  }

  /**
   * Get audit logs with filtering
   */
  async getAuditLogs(filters: AuditLogQueryFilters): Promise<AuditLog[]> {
    return this.registry.getAuditLogRepository().findByFilters(filters);
  }

  /**
   * Get audit logs for a space
   */
  async getSpaceAuditLogs(spaceId: number, limit = 100): Promise<AuditLog[]> {
    return this.registry.getAuditLogRepository().findBySpaceId(spaceId, limit);
  }

  /**
   * Get audit logs for a user
   */
  async getUserAuditLogs(userId: number, limit = 100): Promise<AuditLog[]> {
    return this.registry.getAuditLogRepository().findByUserId(userId, limit);
  }

  /**
   * Get critical audit logs (security issues, failures, etc.)
   */
  async getCriticalAuditLogs(limit = 100): Promise<AuditLog[]> {
    return this.registry.getAuditLogRepository().findBySeverity("critical", limit);
  }

  /**
   * Get recent permission denial logs for a user
   */
  async getUserRecentDenials(
    userId: number,
    hoursAgo = 24,
  ): Promise<PermissionDenialLog[]> {
    return this.registry
      .getPermissionDenialLogRepository()
      .findRecentByUser(userId, hoursAgo);
  }

  /**
   * Get permission denial logs for a space
   */
  async getSpaceDenialLogs(spaceId: number, limit = 100): Promise<PermissionDenialLog[]> {
    return this.registry
      .getPermissionDenialLogRepository()
      .findBySpaceId(spaceId, limit);
  }

  /**
   * Detect suspicious activity (repeated permission denials)
   */
  async detectSuspiciousActivity(
    userId: number,
    thresholdDenials = 5,
    timeWindow = 1, // hours
  ): Promise<boolean> {
    const recentDenials = await this.getUserRecentDenials(userId, timeWindow);
    return recentDenials.length >= thresholdDenials;
  }

  /**
   * Create a compliance report
   */
  async createComplianceReport(
    spaceId: number,
    report: Omit<ComplianceReport, "id" | "created_at">,
  ): Promise<ComplianceReport> {
    return this.registry.getComplianceReportRepository().create(report);
  }

  /**
   * Get compliance reports for a space
   */
  async getComplianceReports(
    filters: ComplianceReportQueryFilters,
  ): Promise<ComplianceReport[]> {
    return this.registry.getComplianceReportRepository().findByFilters(filters);
  }

  /**
   * Get latest compliance report of a specific type
   */
  async getLatestComplianceReport(
    spaceId: number,
    reportType: ComplianceReport["report_type"],
  ): Promise<ComplianceReport | null> {
    return this.registry
      .getComplianceReportRepository()
      .findLatestBySpaceAndType(spaceId, reportType);
  }

  /**
   * Generate compliance report from audit logs
   */
  async generateComplianceReport(
    spaceId: number,
    dateFrom: string,
    dateTo: string,
    reportType: ComplianceReport["report_type"] = "compliance_snapshot",
  ): Promise<ComplianceReport> {
    const auditLogs = await this.registry.getAuditLogRepository().findByFilters({
      spaceId,
      dateFrom,
      dateTo,
    });

    const criticalActions = auditLogs.filter((log) => log.severity === "critical")
      .length;
    const failedActions = auditLogs.filter((log) => log.status === "failure")
      .length;
    const uniqueUsers = new Set(auditLogs.map((log) => log.user_id)).size;

    const reportData = {
      period: { from: dateFrom, to: dateTo },
      summary: {
        total: auditLogs.length,
        critical: criticalActions,
        failed: failedActions,
        uniqueUsers,
      },
      actionBreakdown: this.groupAuditsByAction(auditLogs),
      userActivity: this.groupAuditsByUser(auditLogs),
    };

    return this.createComplianceReport(spaceId, {
      space_id: spaceId,
      report_type: reportType,
      period_start: dateFrom,
      period_end: dateTo,
      total_actions: auditLogs.length,
      critical_actions: criticalActions,
      failed_actions: failedActions,
      unique_users: uniqueUsers,
      data: JSON.stringify(reportData),
    });
  }

  /**
   * Clean up old audit logs
   */
  async cleanupOldLogs(daysToKeep = 90): Promise<number> {
    return this.registry.getAuditLogRepository().deleteOlderThan(daysToKeep);
  }

  /**
   * Clean up old permission denial logs
   */
  async cleanupOldDenials(daysToKeep = 90): Promise<number> {
    return this.registry
      .getPermissionDenialLogRepository()
      .deleteOlderThan(daysToKeep);
  }

  private groupAuditsByAction(logs: AuditLog[]): Record<string, number> {
    return logs.reduce(
      (acc, log) => {
        acc[log.action] = (acc[log.action] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private groupAuditsByUser(logs: AuditLog[]): Record<number, number> {
    return logs.reduce(
      (acc, log) => {
        acc[log.user_id] = (acc[log.user_id] || 0) + 1;
        return acc;
      },
      {} as Record<number, number>,
    );
  }
}
