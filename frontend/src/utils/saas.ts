import type { Permit, Tenant, TenantScopedRecord, UserProfile } from '../types';

export const DEFAULT_TENANTS: Tenant[] = [
  {
    id: 'tenant-demo',
    name: 'Demo Manufacturing Co.',
    plan: 'ENTERPRISE',
    maxUsers: 250,
    status: 'ACTIVE'
  },
  {
    id: 'tenant-solar',
    name: 'Solar Grid Operations',
    plan: 'GROWTH',
    maxUsers: 100,
    status: 'TRIAL'
  }
];

export function ensureTenantScope<T extends TenantScopedRecord>(record: T, tenantId: string): T {
  return { ...record, tenantId: record.tenantId || tenantId };
}

export function filterTenantRecords<T extends TenantScopedRecord>(records: T[], tenantId: string): T[] {
  return records.filter((record) => (record.tenantId || 'tenant-demo') === tenantId);
}

export function hasSaaSPermission(user?: UserProfile, permission?: string): boolean {
  if (!user || !permission) {
    return false;
  }

  const permissions = user.permissions ?? [];
  return permissions.includes(permission);
}

export function canManageUsers(user?: UserProfile): boolean {
  return hasSaaSPermission(user, 'users.manage') || user?.username === 'admin';
}

export function canApprovePermits(user?: UserProfile): boolean {
  return hasSaaSPermission(user, 'permits.approve') || Boolean(user?.canApproveSafety || user?.canApproveElectrical || user?.canApproveProduction);
}

export function scopeRecordsByTenant<T extends TenantScopedRecord>(records: T[], tenantId: string): T[] {
  return records.map((record) => ensureTenantScope(record, tenantId));
}

export function getTenantDisplayName(tenant?: Tenant): string {
  return tenant?.name || 'Default Tenant';
}

export function isTenantActive(tenant?: Tenant): boolean {
  return tenant?.status === 'ACTIVE' || tenant?.status === 'TRIAL';
}

export function getTenantPlanLabel(tenant?: Tenant): string {
  if (!tenant) {
    return 'Starter';
  }

  switch (tenant.plan) {
    case 'ENTERPRISE':
      return 'Enterprise';
    case 'GROWTH':
      return 'Growth';
    default:
      return 'Starter';
  }
}

export function getTenantFeatureHints(tenant?: Tenant): string[] {
  if (!tenant) {
    return ['Basic permits', 'Basic reporting'];
  }

  switch (tenant.plan) {
    case 'ENTERPRISE':
      return ['Advanced AI recommendations', 'Audit exports', 'Multi-user governance'];
    case 'GROWTH':
      return ['Advanced AI recommendations', 'Expanded user seats'];
    default:
      return ['Basic permits', 'Basic reporting'];
  }
}
