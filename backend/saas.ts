export type TenantPlan = 'STARTER' | 'GROWTH' | 'ENTERPRISE';
export type TenantStatus = 'ACTIVE' | 'SUSPENDED' | 'TRIAL';

export interface TenantContext {
  id: string;
  name: string;
  plan: TenantPlan;
  maxUsers: number;
  status: TenantStatus;
}

export interface SaaSUser {
  id: string;
  username: string;
  tenantId: string;
  role: string;
  permissions: string[];
}

export interface TenantScopedRecord {
  tenantId: string;
  [key: string]: unknown;
}

export function createTenantContext(tenant: TenantContext): TenantContext {
  return {
    ...tenant,
    status: tenant.status ?? 'TRIAL'
  };
}

export function getUserPermissions(user: SaaSUser): string[] {
  return user.permissions ?? [];
}

export function hasPermission(user: SaaSUser, permission: string): boolean {
  return getUserPermissions(user).includes(permission);
}

export function filterTenantData<T extends TenantScopedRecord>(records: T[], tenantId: string): T[] {
  return records.filter((record) => record.tenantId === tenantId);
}

export function buildTenantScopedQuery(baseQuery: string, tenantId: string): string {
  return `${baseQuery} WHERE tenant_id = '${tenantId}'`;
}
