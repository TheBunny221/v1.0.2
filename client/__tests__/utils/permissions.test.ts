import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canViewComplaint,
  canModifyComplaint,
  getAuthorizedNavigation,
  DataFilters,
} from '../../utils/permissions';

describe('Permission utilities', () => {
  describe('hasPermission', () => {
    test('should return true for valid administrator permissions', () => {
      expect(hasPermission('ADMINISTRATOR', 'complaint:view:all')).toBe(true);
      expect(hasPermission('ADMINISTRATOR', 'user:view:all')).toBe(true);
      expect(hasPermission('ADMINISTRATOR', 'system:admin')).toBe(true);
    });

    test('should return false for invalid permissions', () => {
      expect(hasPermission('CITIZEN', 'system:admin')).toBe(false);
      expect(hasPermission('WARD_OFFICER', 'user:view:all')).toBe(false);
    });

    test('should return true for citizen own permissions', () => {
      expect(hasPermission('CITIZEN', 'complaint:create')).toBe(true);
      expect(hasPermission('CITIZEN', 'complaint:view:own')).toBe(true);
      expect(hasPermission('CITIZEN', 'user:update:own')).toBe(true);
    });
  });

  describe('hasAnyPermission', () => {
    test('should return true if user has any of the permissions', () => {
      const permissions = ['complaint:view:all', 'complaint:view:own'];
      expect(hasAnyPermission('ADMINISTRATOR', permissions)).toBe(true);
      expect(hasAnyPermission('CITIZEN', permissions)).toBe(true);
    });

    test('should return false if user has none of the permissions', () => {
      const permissions = ['system:admin', 'user:view:all'];
      expect(hasAnyPermission('CITIZEN', permissions)).toBe(false);
    });
  });

  describe('hasAllPermissions', () => {
    test('should return true if user has all permissions', () => {
      const permissions = ['complaint:view:own', 'complaint:create'];
      expect(hasAllPermissions('CITIZEN', permissions)).toBe(true);
    });

    test('should return false if user missing any permission', () => {
      const permissions = ['complaint:view:all', 'complaint:create'];
      expect(hasAllPermissions('CITIZEN', permissions)).toBe(false);
    });
  });

  describe('canViewComplaint', () => {
    const mockComplaint = {
      id: '1',
      submittedById: 'user-1',
      assignedToId: 'user-2',
      wardId: 'ward-1',
      status: 'REGISTERED',
    };

    test('should allow admin to view any complaint', () => {
      expect(canViewComplaint('ADMINISTRATOR', 'any-user', mockComplaint)).toBe(true);
    });

    test('should allow citizen to view own complaint', () => {
      expect(canViewComplaint('CITIZEN', 'user-1', mockComplaint)).toBe(true);
    });

    test('should not allow citizen to view others complaint', () => {
      expect(canViewComplaint('CITIZEN', 'user-3', mockComplaint)).toBe(false);
    });

    test('should allow ward officer to view ward complaints', () => {
      expect(canViewComplaint('WARD_OFFICER', 'user-3', mockComplaint, 'ward-1')).toBe(true);
    });

    test('should not allow ward officer to view other ward complaints', () => {
      expect(canViewComplaint('WARD_OFFICER', 'user-3', mockComplaint, 'ward-2')).toBe(false);
    });
  });

  describe('canModifyComplaint', () => {
    const mockComplaint = {
      submittedById: 'user-1',
      assignedToId: 'user-2',
      wardId: 'ward-1',
      status: 'REGISTERED',
    };

    test('should allow admin to modify any complaint', () => {
      expect(canModifyComplaint('ADMINISTRATOR', 'any-user', mockComplaint)).toBe(true);
    });

    test('should allow citizen to modify own registered complaint', () => {
      expect(canModifyComplaint('CITIZEN', 'user-1', mockComplaint)).toBe(true);
    });

    test('should not allow citizen to modify resolved complaint', () => {
      const resolvedComplaint = { ...mockComplaint, status: 'RESOLVED' };
      expect(canModifyComplaint('CITIZEN', 'user-1', resolvedComplaint)).toBe(false);
    });

    test('should allow ward officer to modify ward complaints', () => {
      expect(canModifyComplaint('WARD_OFFICER', 'user-3', mockComplaint, 'ward-1')).toBe(true);
    });
  });

  describe('getAuthorizedNavigation', () => {
    test('should return correct navigation for citizen', () => {
      const nav = getAuthorizedNavigation('CITIZEN');
      expect(nav).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: '/' }),
          expect.objectContaining({ path: '/dashboard' }),
          expect.objectContaining({ path: '/complaints' }),
        ])
      );
    });

    test('should include admin routes for administrator', () => {
      const nav = getAuthorizedNavigation('ADMINISTRATOR');
      expect(nav).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: '/admin/users' }),
          expect.objectContaining({ path: '/admin/config' }),
          expect.objectContaining({ path: '/reports' }),
        ])
      );
    });

    test('should include ward management for ward officer', () => {
      const nav = getAuthorizedNavigation('WARD_OFFICER');
      expect(nav).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: '/ward' }),
          expect.objectContaining({ path: '/reports' }),
        ])
      );
    });
  });

  describe('DataFilters', () => {
    const mockComplaints = [
      { id: '1', submittedById: 'user-1', wardId: 'ward-1' },
      { id: '2', submittedById: 'user-2', wardId: 'ward-1' },
      { id: '3', submittedById: 'user-3', wardId: 'ward-2' },
    ];

    test('should filter complaints for citizen to own only', () => {
      const filtered = DataFilters.filterComplaints(mockComplaints, 'CITIZEN', 'user-1');
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    test('should return all complaints for administrator', () => {
      const filtered = DataFilters.filterComplaints(mockComplaints, 'ADMINISTRATOR', 'admin-user');
      expect(filtered).toHaveLength(3);
    });

    test('should filter complaints by ward for ward officer', () => {
      const filtered = DataFilters.filterComplaints(mockComplaints, 'WARD_OFFICER', 'ward-officer', 'ward-1');
      expect(filtered).toHaveLength(2);
    });
  });
});
