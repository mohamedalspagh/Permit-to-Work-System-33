import test from 'node:test';
import assert from 'node:assert/strict';
import { createTenantContext, filterTenantData, getUserPermissions, hasPermission } from '../saas.ts';

test('grants admin permissions and blocks tenant leakage', () => {
  const tenant = createTenantContext({
    id: 'tenant-a',
    name: 'Alpha Works',
    plan: 'ENTERPRISE',
    maxUsers: 250,
    status: 'ACTIVE'
  });

  const admin = {
    id: 'user-1',
    username: 'admin',
    tenantId: 'tenant-a',
    role: 'SUPER_ADMIN',
    permissions: ['users.manage', 'permits.approve', 'tenants.view']
  };

  assert.deepEqual(getUserPermissions(admin), ['users.manage', 'permits.approve', 'tenants.view']);
  assert.equal(hasPermission(admin, 'users.manage'), true);
  assert.equal(hasPermission(admin, 'permits.create'), false);

  const records = [
    { id: 'one', tenantId: 'tenant-a', title: 'Permit A' },
    { id: 'two', tenantId: 'tenant-b', title: 'Permit B' }
  ];

  assert.deepEqual(filterTenantData(records, tenant.id), [{ id: 'one', tenantId: 'tenant-a', title: 'Permit A' }]);
});
