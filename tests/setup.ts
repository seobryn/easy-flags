import {
  User,
  Role,
  Permission,
  Feature,
  FeatureValue,
  Environment,
} from "../src/domain/models";

/**
 * Test Fixtures - Mock data for testing
 */
export const mockUsers = {
  admin: {
    id: 1,
    username: "admin",
    password: "$2a$10$mock_hashed_password",
    role_id: 1,
  } as User,
  editor: {
    id: 2,
    username: "editor",
    password: "$2a$10$mock_hashed_password",
    role_id: 2,
  } as User,
  viewer: {
    id: 3,
    username: "viewer",
    password: "$2a$10$mock_hashed_password",
    role_id: 3,
  } as User,
};

export const mockRoles = {
  admin: {
    id: 1,
    name: "Admin",
    description: "Administrator role with full access",
  } as Role,
  editor: {
    id: 2,
    name: "Editor",
    description: "Editor role with limited access",
  } as Role,
  viewer: {
    id: 3,
    name: "Viewer",
    description: "Viewer role with read-only access",
  } as Role,
};

export const mockPermissions = {
  createFeature: {
    id: 1,
    name: "CREATE_FEATURE",
    description: "Permission to create features",
  } as Permission,
  deleteFeature: {
    id: 2,
    name: "DELETE_FEATURE",
    description: "Permission to delete features",
  } as Permission,
  editFeature: {
    id: 3,
    name: "EDIT_FEATURE",
    description: "Permission to edit features",
  } as Permission,
  viewFeature: {
    id: 4,
    name: "VIEW_FEATURE",
    description: "Permission to view features",
  } as Permission,
};

export const mockFeatures = {
  betaFeature: {
    id: 1,
    key: "BETA_FEATURE",
    description: "Beta feature for testing",
  } as Feature,
  darkMode: {
    id: 2,
    key: "DARK_MODE",
    description: "Dark mode toggle",
  } as Feature,
};

export const mockEnvironments = {
  development: {
    id: 1,
    name: "development",
  } as Environment,
  staging: {
    id: 2,
    name: "staging",
  } as Environment,
  production: {
    id: 3,
    name: "production",
  } as Environment,
};

export const mockFeatureValues = {
  betaEnabled: {
    id: 1,
    feature_id: 1,
    environment_id: 1,
    value: 1,
  } as FeatureValue,
  darkModeDisabled: {
    id: 2,
    feature_id: 2,
    environment_id: 1,
    value: 0,
  } as FeatureValue,
};

/**
 * Mock Repository Factory - Creates mock implementations of repositories
 */
export const createMockUserRepository = () => ({
  findByUsername: jest.fn(),
  create: jest.fn(),
  listAll: jest.fn(),
  listAllWithRoles: jest.fn(),
  findById: jest.fn(),
  findByIdWithRole: jest.fn(),
  update: jest.fn(),
  assignRole: jest.fn(),
  removeRole: jest.fn(),
  delete: jest.fn(),
});

export const createMockFeatureRepository = () => ({
  listAll: jest.fn(),
  listBySpaceId: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdAndSpaceId: jest.fn(),
  findByKey: jest.fn(),
  deleteById: jest.fn(),
  deleteByIdAndSpaceId: jest.fn(),
  deleteByIds: jest.fn(),
  deleteAll: jest.fn(),
  countBySpaceId: jest.fn(),
});

export const createMockFeatureValueRepository = () => ({
  upsert: jest.fn(),
  upsertWithSpaceValidation: jest.fn(),
  deleteByFeatureId: jest.fn(),
  deleteByEnvironmentId: jest.fn(),
  deleteAll: jest.fn(),
  listFeatureIdsByEnvironmentId: jest.fn(),
  deleteByFeatureIds: jest.fn(),
  findByFeatureAndEnvironment: jest.fn(),
  findByFeatureAndEnvironmentAndSpaceId: jest.fn(),
  findValueByFeatureAndEnvironment: jest.fn(),
});

export const createMockRoleRepository = () => ({
  listAll: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  getRoleWithPermissions: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
});

export const createMockPermissionRepository = () => ({
  listAll: jest.fn(),
  findById: jest.fn(),
  findByName: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  assignToRole: jest.fn(),
  removeFromRole: jest.fn(),
  getRolePermissions: jest.fn(),
});

export const createMockEnvironmentRepository = () => ({
  listAll: jest.fn(),
  listBySpaceId: jest.fn(),
  findById: jest.fn(),
  findByIdAndSpaceId: jest.fn(),
  findByName: jest.fn(),
  create: jest.fn(),
  updateName: jest.fn(),
  deleteById: jest.fn(),
  deleteByIdAndSpaceId: jest.fn(),
  countAll: jest.fn(),
  countBySpaceId: jest.fn(),
});
