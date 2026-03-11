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
}
