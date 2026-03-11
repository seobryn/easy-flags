/**
 * Domain Layer - Core Business Entities
 * These entities represent the pure business logic and domain concepts
 */

// ====================
// User & Access Control
// ====================

export interface Role {
  id: number;
  name: "admin" | "editor" | "viewer";
  description: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ====================
// Spaces (Workspaces)
// ====================

export interface Space {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  created_at: string;
  updated_at: string;
}

export interface SpaceMember {
  id: number;
  space_id: number;
  user_id: number;
  role_id: number;
  created_at: string;
  user?: User;
  role?: Role;
}

// ====================
// Environments
// ====================

export type EnvironmentType =
  | "production"
  | "staging"
  | "development"
  | "other";

export interface Environment {
  id: number;
  space_id: number;
  name: string;
  description?: string;
  type: EnvironmentType;
  created_at: string;
  updated_at: string;
}

export interface EnvironmentConfig {
  id: number;
  environment_id: number;
  key: string;
  default_value: string;
  overridden_value?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiKey {
  id: number;
  environment_id: number;
  key: string;
  last_used?: string;
  created_at: string;
}

// ====================
// Features & Flags
// ====================

export interface Feature {
  id: number;
  space_id: number;
  key: string;
  name: string;
  description?: string;
  type: "boolean" | "string" | "json";
  default_value: string;
  created_at: string;
  updated_at: string;
}

export interface FeatureFlag {
  id: number;
  feature_id: number;
  environment_id: number;
  is_enabled: boolean;
  rollout_percentage: number;
  value?: string;
  created_at: string;
  updated_at: string;
}

// ====================
// Advanced Configuration
// ====================

export type TargetingRuleType =
  | "email_domain"
  | "user_id"
  | "user_segment"
  | "percentage";
export type RuleOperator = "equals" | "contains" | "greater_than";

export interface TargetingRule {
  id: number;
  feature_flag_id: number;
  rule_type: TargetingRuleType;
  rule_value: string;
  operator: RuleOperator;
  created_at: string;
}

export interface RolloutConfig {
  percentage: number;
  startDate: string;
  endDate: string;
}

export interface AdvancedConfiguration {
  id: number;
  feature_flag_id: number;
  rollout_percentage: number;
  rollout_start_date?: string;
  rollout_end_date?: string;
  default_value: string;
  scheduling_enabled: boolean;
  schedule_start_date?: string;
  schedule_start_time?: string;
  schedule_end_date?: string;
  schedule_end_time?: string;
  created_at: string;
  updated_at: string;
  targeting_rules?: TargetingRule[];
}

// ====================
// DTOs (Data Transfer Objects)
// ====================

export interface CreateSpaceDTO {
  name: string;
  description?: string;
}

export interface UpdateSpaceDTO {
  name?: string;
  description?: string;
}

export interface CreateEnvironmentDTO {
  name: string;
  description?: string;
  type: EnvironmentType;
}

export interface CreateFeatureDTO {
  key: string;
  name: string;
  description?: string;
  type: "boolean" | "string" | "json";
  default_value: string;
}

export interface UpdateFeatureDTO {
  name?: string;
  description?: string;
  default_value?: string;
}

export interface CreateAdvancedConfigDTO {
  feature_flag_id: number;
  rollout_percentage: number;
  rollout_start_date?: string;
  rollout_end_date?: string;
  default_value: string;
  scheduling_enabled: boolean;
  schedule_start_date?: string;
  schedule_start_time?: string;
  schedule_end_date?: string;
  schedule_end_time?: string;
  targeting_rules?: Omit<TargetingRule, "id" | "created_at">[];
}

export interface AddTeamMemberDTO {
  email: string;
  role_id: number;
}

export interface UpdateTeamMemberDTO {
  role_id: number;
}
