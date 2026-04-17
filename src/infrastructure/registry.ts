/**
 * Repository Registry - Inversion of Control Container
 * Manages all repository instances and provides a single point of access
 */

import type { RepositoryRegistry } from "@application/ports/repositories";
import type {
  UserRepository,
  RoleRepository,
  SpaceRepository,
  SpaceMemberRepository,
  EnvironmentRepository,
  EnvironmentConfigRepository,
  ApiKeyRepository,
  FeatureRepository,
  FeatureFlagRepository,
  AdvancedConfigRepository,
  TargetingRuleRepository,
  FlagEvaluationRepository,
  FlagUsageMetricRepository,
  PerformanceMetricRepository,
  AuditLogRepository,
  PermissionDenialLogRepository,
  ComplianceReportRepository,
  PricingPlanRepository,
  PricingPlanFeatureRepository,
  PricingPlanLimitRepository,
  SpaceSubscriptionRepository,
} from "@application/ports/repositories";
import { LibSqlUserRepository } from "./adapters/libsql.adapter";
import { LibSqlRoleRepository } from "./adapters/libsql.adapter";
import { LibSqlSpaceRepository } from "./adapters/libsql.adapter";
import { LibSqlSpaceMemberRepository } from "./adapters/libsql.adapter";
import { LibSqlEnvironmentRepository } from "./adapters/libsql.adapter";
import { LibSqlEnvironmentConfigRepository } from "./adapters/libsql-additional.adapter";
import { LibSqlApiKeyRepository } from "./adapters/libsql-additional.adapter";
import { LibSqlFeatureRepository } from "./adapters/libsql-additional.adapter";
import { LibSqlFeatureFlagRepository } from "./adapters/libsql-additional.adapter";
import { LibSqlAdvancedConfigRepository } from "./adapters/libsql-additional.adapter";
import { LibSqlTargetingRuleRepository } from "./adapters/libsql-additional.adapter";
import {
  LibSqlFlagEvaluationRepository,
  LibSqlFlagUsageMetricRepository,
  LibSqlPerformanceMetricRepository,
} from "./adapters/libsql-analytics.adapter";
import {
  LibSqlAuditLogRepository,
  LibSqlPermissionDenialLogRepository,
  LibSqlComplianceReportRepository,
} from "./adapters/libsql-audit.adapter";
import {
  LibSqlPricingPlanRepository,
  LibSqlPricingPlanFeatureRepository,
  LibSqlPricingPlanLimitRepository,
  LibSqlSpaceSubscriptionRepository,
} from "./adapters/libsql-pricing.adapter";
import { LibSqlPaymentRepository } from "./adapters/libsql-payment.adapter";

class LibSqlRepositoryRegistry implements RepositoryRegistry {
  private userRepository: UserRepository | null = null;
  private roleRepository: RoleRepository | null = null;
  private spaceRepository: SpaceRepository | null = null;
  private spaceMemberRepository: SpaceMemberRepository | null = null;
  private environmentRepository: EnvironmentRepository | null = null;
  private environmentConfigRepository: EnvironmentConfigRepository | null =
    null;
  private apiKeyRepository: ApiKeyRepository | null = null;
  private featureRepository: FeatureRepository | null = null;
  private featureFlagRepository: FeatureFlagRepository | null = null;
  private advancedConfigRepository: AdvancedConfigRepository | null = null;
  private targetingRuleRepository: TargetingRuleRepository | null = null;
  private flagEvaluationRepository: FlagEvaluationRepository | null = null;
  private flagUsageMetricRepository: FlagUsageMetricRepository | null = null;
  private performanceMetricRepository: PerformanceMetricRepository | null =
    null;
  private auditLogRepository: AuditLogRepository | null = null;
  private permissionDenialLogRepository: PermissionDenialLogRepository | null =
    null;
  private complianceReportRepository: ComplianceReportRepository | null = null;
  private pricingPlanRepository: PricingPlanRepository | null = null;
  private pricingPlanFeatureRepository: PricingPlanFeatureRepository | null =
    null;
  private pricingPlanLimitRepository: PricingPlanLimitRepository | null = null;
  private spaceSubscriptionRepository: SpaceSubscriptionRepository | null =
    null;
  private paymentRepository: PaymentRepository | null = null;

  getUserRepository(): UserRepository {
    if (!this.userRepository) {
      this.userRepository = new LibSqlUserRepository();
    }
    return this.userRepository;
  }

  getRoleRepository(): RoleRepository {
    if (!this.roleRepository) {
      this.roleRepository = new LibSqlRoleRepository();
    }
    return this.roleRepository;
  }

  getSpaceRepository(): SpaceRepository {
    if (!this.spaceRepository) {
      this.spaceRepository = new LibSqlSpaceRepository();
    }
    return this.spaceRepository;
  }

  getSpaceMemberRepository(): SpaceMemberRepository {
    if (!this.spaceMemberRepository) {
      this.spaceMemberRepository = new LibSqlSpaceMemberRepository();
    }
    return this.spaceMemberRepository;
  }

  getEnvironmentRepository(): EnvironmentRepository {
    if (!this.environmentRepository) {
      this.environmentRepository = new LibSqlEnvironmentRepository();
    }
    return this.environmentRepository;
  }

  getEnvironmentConfigRepository(): EnvironmentConfigRepository {
    if (!this.environmentConfigRepository) {
      this.environmentConfigRepository =
        new LibSqlEnvironmentConfigRepository();
    }
    return this.environmentConfigRepository;
  }

  getApiKeyRepository(): ApiKeyRepository {
    if (!this.apiKeyRepository) {
      this.apiKeyRepository = new LibSqlApiKeyRepository();
    }
    return this.apiKeyRepository;
  }

  getFeatureRepository(): FeatureRepository {
    if (!this.featureRepository) {
      this.featureRepository = new LibSqlFeatureRepository();
    }
    return this.featureRepository;
  }

  getFeatureFlagRepository(): FeatureFlagRepository {
    if (!this.featureFlagRepository) {
      this.featureFlagRepository = new LibSqlFeatureFlagRepository();
    }
    return this.featureFlagRepository;
  }

  getAdvancedConfigRepository(): AdvancedConfigRepository {
    if (!this.advancedConfigRepository) {
      this.advancedConfigRepository = new LibSqlAdvancedConfigRepository();
    }
    return this.advancedConfigRepository;
  }

  getTargetingRuleRepository(): TargetingRuleRepository {
    if (!this.targetingRuleRepository) {
      this.targetingRuleRepository = new LibSqlTargetingRuleRepository();
    }
    return this.targetingRuleRepository;
  }

  getFlagEvaluationRepository(): FlagEvaluationRepository {
    if (!this.flagEvaluationRepository) {
      this.flagEvaluationRepository = new LibSqlFlagEvaluationRepository();
    }
    return this.flagEvaluationRepository;
  }

  getFlagUsageMetricRepository(): FlagUsageMetricRepository {
    if (!this.flagUsageMetricRepository) {
      this.flagUsageMetricRepository = new LibSqlFlagUsageMetricRepository();
    }
    return this.flagUsageMetricRepository;
  }

  getPerformanceMetricRepository(): PerformanceMetricRepository {
    if (!this.performanceMetricRepository) {
      this.performanceMetricRepository =
        new LibSqlPerformanceMetricRepository();
    }
    return this.performanceMetricRepository;
  }

  getAuditLogRepository(): AuditLogRepository {
    if (!this.auditLogRepository) {
      this.auditLogRepository = new LibSqlAuditLogRepository();
    }
    return this.auditLogRepository;
  }

  getPermissionDenialLogRepository(): PermissionDenialLogRepository {
    if (!this.permissionDenialLogRepository) {
      this.permissionDenialLogRepository =
        new LibSqlPermissionDenialLogRepository();
    }
    return this.permissionDenialLogRepository;
  }

  getComplianceReportRepository(): ComplianceReportRepository {
    if (!this.complianceReportRepository) {
      this.complianceReportRepository = new LibSqlComplianceReportRepository();
    }
    return this.complianceReportRepository;
  }

  getPricingPlanRepository(): PricingPlanRepository {
    if (!this.pricingPlanRepository) {
      this.pricingPlanRepository = new LibSqlPricingPlanRepository();
    }
    return this.pricingPlanRepository;
  }

  getPricingPlanFeatureRepository(): PricingPlanFeatureRepository {
    if (!this.pricingPlanFeatureRepository) {
      this.pricingPlanFeatureRepository =
        new LibSqlPricingPlanFeatureRepository();
    }
    return this.pricingPlanFeatureRepository;
  }

  getPricingPlanLimitRepository(): PricingPlanLimitRepository {
    if (!this.pricingPlanLimitRepository) {
      this.pricingPlanLimitRepository = new LibSqlPricingPlanLimitRepository();
    }
    return this.pricingPlanLimitRepository;
  }

  getSpaceSubscriptionRepository(): SpaceSubscriptionRepository {
    if (!this.spaceSubscriptionRepository) {
      this.spaceSubscriptionRepository =
        new LibSqlSpaceSubscriptionRepository();
    }
    return this.spaceSubscriptionRepository;
  }

  getPaymentRepository(): PaymentRepository {
    if (!this.paymentRepository) {
      this.paymentRepository = new LibSqlPaymentRepository();
    }
    return this.paymentRepository;
  }
}

// Global registry instance
let registry: RepositoryRegistry | null = null;

export function getRepositoryRegistry(): RepositoryRegistry {
  if (!registry) {
    registry = new LibSqlRepositoryRegistry();
  }
  return registry;
}

export function resetRegistry(): void {
  registry = null;
}
