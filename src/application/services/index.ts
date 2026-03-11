/**
 * Application Layer - Use Cases / Services
 * Contains business logic and orchestrates repository access
 */

import { getRepositoryRegistry } from "@infrastructure/registry";
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
