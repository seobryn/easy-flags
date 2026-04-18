/**
 * Port Layer - Repository Interfaces
 * These define the contracts for data access, independent of implementation
 */

import type {
  Environment,
  EnvironmentConfig,
  ApiKey,
  Feature,
  FeatureFlag,
  Space,
  SpaceMember,
  User,
  Role,
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
  PaymentStatus,
  PaymentTransaction,
} from "@domain/entities";

// ====================
// User Repository Port
// ====================

export interface UserRepository {
  findById(id: number): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  create(user: Partial<User>): Promise<User>;
  update(id: number, updates: Partial<User>): Promise<User>;
  delete(id: number): Promise<void>;
}

// ====================
// Role Repository Port
// ====================

export interface RoleRepository {
  findById(id: number): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  findAll(): Promise<Role[]>;
}

// ====================
// Space Repository Port
// ====================

export interface SpaceRepository {
  findById(id: number): Promise<Space | null>;
  findBySlug(slug: string): Promise<Space | null>;
  findByOwnerId(ownerId: number): Promise<Space[]>;
  findAll(): Promise<Space[]>;
  create(dto: CreateSpaceDTO, ownerId: number): Promise<Space>;
  update(id: number, dto: UpdateSpaceDTO): Promise<Space>;
  delete(id: number): Promise<void>;
}

// ====================
// Space Member Repository Port
// ====================

export interface SpaceMemberRepository {
  findById(id: number): Promise<SpaceMember | null>;
  findBySpaceId(spaceId: number): Promise<SpaceMember[]>;
  findByUserId(userId: number): Promise<SpaceMember[]>;
  findBySpaceAndUser(
    spaceId: number,
    userId: number,
  ): Promise<SpaceMember | null>;
  create(spaceId: number, userId: number, roleId: number): Promise<SpaceMember>;
  update(id: number, roleId: number): Promise<SpaceMember>;
  delete(id: number): Promise<void>;
  deleteBySpaceAndUser(spaceId: number, userId: number): Promise<void>;
}

// ====================
// Environment Repository Port
// ====================

export interface EnvironmentRepository {
  findById(id: number): Promise<Environment | null>;
  findBySlug(spaceId: number, slug: string): Promise<Environment | null>;
  findBySpaceId(spaceId: number): Promise<Environment[]>;
  create(spaceId: number, dto: CreateEnvironmentDTO): Promise<Environment>;
  update(id: number, dto: Partial<CreateEnvironmentDTO>): Promise<Environment>;
  delete(id: number): Promise<void>;
  regenerateApiKey(id: number): Promise<Environment>;
}

// ====================
// Environment Config Repository Port
// ====================

export interface EnvironmentConfigRepository {
  findById(id: number): Promise<EnvironmentConfig | null>;
  findByEnvironmentId(environmentId: number): Promise<EnvironmentConfig[]>;
  create(
    environmentId: number,
    config: Partial<EnvironmentConfig>,
  ): Promise<EnvironmentConfig>;
  update(
    id: number,
    config: Partial<EnvironmentConfig>,
  ): Promise<EnvironmentConfig>;
  delete(id: number): Promise<void>;
}

// ====================
// API Key Repository Port
// ====================

export interface ApiKeyRepository {
  findById(id: number): Promise<ApiKey | null>;
  findByKey(key: string): Promise<ApiKey | null>;
  findByEnvironmentId(environmentId: number): Promise<ApiKey[]>;
  create(environmentId: number): Promise<ApiKey>;
  updateLastUsed(id: number): Promise<void>;
  delete(id: number): Promise<void>;
}

// ====================
// Feature Repository Port
// ====================

export interface FeatureRepository {
  findById(id: number): Promise<Feature | null>;
  findBySpaceId(spaceId: number): Promise<Feature[]>;
  findByKey(spaceId: number, key: string): Promise<Feature | null>;
  create(spaceId: number, dto: CreateFeatureDTO): Promise<Feature>;
  update(id: number, dto: UpdateFeatureDTO): Promise<Feature>;
  delete(id: number): Promise<void>;
}

// ====================
// Feature Flag Repository Port
// ====================

export interface FeatureFlagRepository {
  findById(id: number): Promise<FeatureFlag | null>;
  findByFeatureAndEnvironment(
    featureId: number,
    environmentId: number,
  ): Promise<FeatureFlag | null>;
  findByEnvironmentId(environmentId: number): Promise<FeatureFlag[]>;
  findByFeatureId(featureId: number): Promise<FeatureFlag[]>;
  create(featureId: number, environmentId: number): Promise<FeatureFlag>;
  update(id: number, updates: Partial<FeatureFlag>): Promise<FeatureFlag>;
  delete(id: number): Promise<void>;
}

// ====================
// Advanced Configuration Repository Port
// ====================

export interface AdvancedConfigRepository {
  findById(id: number): Promise<AdvancedConfiguration | null>;
  findByFeatureFlagId(
    featureFlagId: number,
  ): Promise<AdvancedConfiguration | null>;
  create(dto: CreateAdvancedConfigDTO): Promise<AdvancedConfiguration>;
  update(
    id: number,
    updates: Partial<AdvancedConfiguration>,
  ): Promise<AdvancedConfiguration>;
  delete(id: number): Promise<void>;
}

// ====================
// Targeting Rule Repository Port
// ====================

export interface TargetingRuleRepository {
  findById(id: number): Promise<TargetingRule | null>;
  findByFeatureFlagId(featureFlagId: number): Promise<TargetingRule[]>;
  create(
    featureFlagId: number,
    rule: Omit<TargetingRule, "id" | "created_at">,
  ): Promise<TargetingRule>;
  update(
    id: number,
    rule: Partial<Omit<TargetingRule, "id" | "created_at">>,
  ): Promise<TargetingRule>;
  delete(id: number): Promise<void>;
  deleteByFeatureFlagId(featureFlagId: number): Promise<void>;
}

// ====================
// Flag Evaluation Repository Port
// ====================

export interface FlagEvaluationRepository {
  create(dto: CreateFlagEvaluationDTO): Promise<FlagEvaluation>;
  findById(id: number): Promise<FlagEvaluation | null>;
  findByFilters(filters: AnalyticsQueryFilters): Promise<FlagEvaluation[]>;
  findRecentByEnvironment(
    environmentId: number,
    limit: number,
  ): Promise<FlagEvaluation[]>;
  deleteOlderThan(days: number): Promise<number>;
}

// ====================
// Flag Usage Metric Repository Port
// ====================

export interface FlagUsageMetricRepository {
  create(
    metric: Omit<FlagUsageMetric, "id" | "created_at" | "updated_at">,
  ): Promise<FlagUsageMetric>;
  findById(id: number): Promise<FlagUsageMetric | null>;
  findByFilters(filters: AnalyticsQueryFilters): Promise<FlagUsageMetric[]>;
  findLatestByFeature(
    featureId: number,
    days: number,
  ): Promise<FlagUsageMetric[]>;
  findBySpaceAndDate(
    spaceId: number,
    dateFrom: string,
    dateTo: string,
  ): Promise<FlagUsageMetric[]>;
  upsert(
    metric: Omit<FlagUsageMetric, "id" | "created_at" | "updated_at">,
  ): Promise<FlagUsageMetric>;
}

// ====================
// Performance Metric Repository Port
// ====================

export interface PerformanceMetricRepository {
  create(
    metric: Omit<PerformanceMetric, "id" | "created_at">,
  ): Promise<PerformanceMetric>;
  findById(id: number): Promise<PerformanceMetric | null>;
  findByMetricType(
    metricType: PerformanceMetric["metric_type"],
    limit: number,
  ): Promise<PerformanceMetric[]>;
  findAverageByEndpoint(endpoint: string, hours: number): Promise<number>;
  deleteOlderThan(days: number): Promise<number>;
}

// ====================
// Audit Log Repository Port
// ====================

export interface AuditLogRepository {
  create(dto: CreateAuditLogDTO): Promise<AuditLog>;
  findById(id: number): Promise<AuditLog | null>;
  findByFilters(filters: AuditLogQueryFilters): Promise<AuditLog[]>;
  findBySpaceId(spaceId: number, limit?: number): Promise<AuditLog[]>;
  findByUserId(userId: number, limit?: number): Promise<AuditLog[]>;
  findBySeverity(severity: string, limit?: number): Promise<AuditLog[]>;
  deleteOlderThan(days: number): Promise<number>;
}

// ====================
// Permission Denial Log Repository Port
// ====================

export interface PermissionDenialLogRepository {
  create(
    log: Omit<PermissionDenialLog, "id" | "created_at">,
  ): Promise<PermissionDenialLog>;
  findById(id: number): Promise<PermissionDenialLog | null>;
  findByUserId(userId: number, limit?: number): Promise<PermissionDenialLog[]>;
  findBySpaceId(
    spaceId: number,
    limit?: number,
  ): Promise<PermissionDenialLog[]>;
  findRecentByUser(
    userId: number,
    hours: number,
  ): Promise<PermissionDenialLog[]>;
  deleteOlderThan(days: number): Promise<number>;
}

// ====================
// Compliance Report Repository Port
// ====================

export interface ComplianceReportRepository {
  create(
    report: Omit<ComplianceReport, "id" | "created_at">,
  ): Promise<ComplianceReport>;
  findById(id: number): Promise<ComplianceReport | null>;
  findByFilters(
    filters: ComplianceReportQueryFilters,
  ): Promise<ComplianceReport[]>;
  findLatestBySpaceAndType(
    spaceId: number,
    reportType: ComplianceReport["report_type"],
  ): Promise<ComplianceReport | null>;
  findBySpaceId(spaceId: number): Promise<ComplianceReport[]>;
}

// ====================
// Pricing Plan Repository Port
// ====================

export interface PricingPlanRepository {
  create(dto: CreatePricingPlanDTO): Promise<PricingPlan>;
  findById(id: number): Promise<PricingPlan | null>;
  findBySlug(slug: string): Promise<PricingPlan | null>;
  findAll(includeInactive?: boolean): Promise<PricingPlan[]>;
  findActive(): Promise<PricingPlan[]>;
  update(id: number, dto: UpdatePricingPlanDTO): Promise<PricingPlan>;
  delete(id: number): Promise<void>;
  findByIdWithDetails(id: number): Promise<PricingPlan | null>;
  updateSortOrder(
    plans: Array<{ id: number; sort_order: number }>,
  ): Promise<void>;
}

// ====================
// Pricing Plan Feature Repository Port
// ====================

export interface PricingPlanFeatureRepository {
  create(dto: CreatePricingPlanFeatureDTO): Promise<PricingPlanFeature>;
  findById(id: number): Promise<PricingPlanFeature | null>;
  findByPricingPlanId(pricingPlanId: number): Promise<PricingPlanFeature[]>;
  update(
    id: number,
    feature: Partial<PricingPlanFeature>,
  ): Promise<PricingPlanFeature>;
  delete(id: number): Promise<void>;
  deleteByPricingPlanId(pricingPlanId: number): Promise<void>;
  updateSortOrder(
    features: Array<{ id: number; sort_order: number }>,
  ): Promise<void>;
}

// ====================
// Pricing Plan Limit Repository Port
// ====================

export interface PricingPlanLimitRepository {
  create(dto: CreatePricingPlanLimitDTO): Promise<PricingPlanLimit>;
  findById(id: number): Promise<PricingPlanLimit | null>;
  findByPricingPlanId(pricingPlanId: number): Promise<PricingPlanLimit[]>;
  findLimitByPlanAndName(
    pricingPlanId: number,
    limitName: string,
  ): Promise<PricingPlanLimit | null>;
  update(
    id: number,
    limit: Partial<PricingPlanLimit>,
  ): Promise<PricingPlanLimit>;
  delete(id: number): Promise<void>;
  deleteByPricingPlanId(pricingPlanId: number): Promise<void>;
}

// ====================
// User Subscription Repository Port
// ====================

export interface UserSubscriptionRepository {
  create(dto: CreateUserSubscriptionDTO): Promise<UserSubscription>;
  findById(id: number): Promise<UserSubscription | null>;
  findByUserId(userId: number): Promise<UserSubscription | null>;
  findByPricingPlanId(pricingPlanId: number): Promise<UserSubscription[]>;
  findByStatus(status: string): Promise<UserSubscription[]>;
  update(
    id: number,
    dto: UpdateUserSubscriptionDTO,
  ): Promise<UserSubscription>;
  delete(id: number): Promise<void>;
  findByUserIdWithDetails(userId: number): Promise<UserSubscription | null>;
  findAll(): Promise<UserSubscription[]>;
}

// ====================
// Payment Repository Port
// ====================

export interface PaymentRepository {
  create(
    payment: Omit<PaymentTransaction, "id" | "created_at" | "updated_at">,
  ): Promise<PaymentTransaction>;
  update(
    id: number,
    updates: Partial<PaymentTransaction>,
  ): Promise<PaymentTransaction>;
  findById(id: number): Promise<PaymentTransaction | null>;
  findByReference(reference: string): Promise<PaymentTransaction | null>;
}

// ====================
// Payment Gateway Port
// ====================

export interface PaymentGateway {
  getPublicKey(): string;
  getMerchantInfo(): Promise<any>;
  createTransaction(payload: any): Promise<any>;
  getTransactionStatus(transactionId: string): Promise<any>;
  generateIntegritySignature(
    reference: string,
    amountInCents: number,
    currency: string,
  ): string;
  verifyWebhookSignature(payload: any, signature: string): boolean;
}

// ====================
// Repository Registry Port
// ====================

export interface RepositoryRegistry {
  getUserRepository(): UserRepository;
  getRoleRepository(): RoleRepository;
  getSpaceRepository(): SpaceRepository;
  getSpaceMemberRepository(): SpaceMemberRepository;
  getEnvironmentRepository(): EnvironmentRepository;
  getEnvironmentConfigRepository(): EnvironmentConfigRepository;
  getApiKeyRepository(): ApiKeyRepository;
  getFeatureRepository(): FeatureRepository;
  getFeatureFlagRepository(): FeatureFlagRepository;
  getAdvancedConfigRepository(): AdvancedConfigRepository;
  getTargetingRuleRepository(): TargetingRuleRepository;
  getFlagEvaluationRepository(): FlagEvaluationRepository;
  getFlagUsageMetricRepository(): FlagUsageMetricRepository;
  getPerformanceMetricRepository(): PerformanceMetricRepository;
  getAuditLogRepository(): AuditLogRepository;
  getPermissionDenialLogRepository(): PermissionDenialLogRepository;
  getComplianceReportRepository(): ComplianceReportRepository;
  getPricingPlanRepository(): PricingPlanRepository;
  getPricingPlanFeatureRepository(): PricingPlanFeatureRepository;
  getPricingPlanLimitRepository(): PricingPlanLimitRepository;
  getUserSubscriptionRepository(): UserSubscriptionRepository;
  getPaymentRepository(): PaymentRepository;
}
