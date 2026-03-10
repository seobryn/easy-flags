export interface User {
  id: number;
  username: string;
  password: string;
  role_id?: number;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
}

export interface RolePermission {
  id: number;
  role_id: number;
  permission_id: number;
}

export interface Space {
  id: number;
  name: string;
  description?: string;
  owner_id: number;
  created_at: string;
}

export interface SpaceUser {
  id: number;
  space_id: number;
  user_id: number;
  role_id: number;
  created_at: string;
}

export interface Environment {
  id: number;
  name: string;
  space_id?: number;
}

export interface Feature {
  id: number;
  key: string;
  description: string | null;
  space_id?: number;
}

export interface FeatureValue {
  id: number;
  feature_id: number;
  environment_id: number;
  value: number;
}
