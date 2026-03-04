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

export interface Environment {
  id: number;
  name: string;
}

export interface Feature {
  id: number;
  key: string;
  description: string | null;
}

export interface FeatureValue {
  id: number;
  feature_id: number;
  environment_id: number;
  value: number;
}
