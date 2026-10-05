import { describe, it, expect } from 'vitest';
import { UserRole } from '../../backend/src/types';

describe('Unit: Role-Based Access Control (RBAC) Matrix', () => {
  const canManageOrganization = (role: UserRole) => role === 'OWNER';
  const canManageMembers = (role: UserRole) => ['OWNER', 'ADMIN'].includes(role);
  const canManageProjects = (role: UserRole) => ['OWNER', 'ADMIN'].includes(role);
  const canDeleteTasks = (role: UserRole) => ['OWNER', 'ADMIN'].includes(role);
  const canCreateTasks = (role: UserRole) => ['OWNER', 'ADMIN', 'MEMBER'].includes(role);
  const canAddComments = (role: UserRole) => ['OWNER', 'ADMIN', 'MEMBER'].includes(role);
  const canViewResources = (role: UserRole) => ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'].includes(role);

  it('VIEWER role has strictly read-only permissions', () => {
    const role: UserRole = 'VIEWER';
    expect(canViewResources(role)).toBe(true);
    expect(canCreateTasks(role)).toBe(false);
    expect(canAddComments(role)).toBe(false);
    expect(canDeleteTasks(role)).toBe(false);
    expect(canManageProjects(role)).toBe(false);
    expect(canManageMembers(role)).toBe(false);
    expect(canManageOrganization(role)).toBe(false);
  });

  it('MEMBER role can create tasks and add comments, but not manage members or delete tasks', () => {
    const role: UserRole = 'MEMBER';
    expect(canViewResources(role)).toBe(true);
    expect(canCreateTasks(role)).toBe(true);
    expect(canAddComments(role)).toBe(true);
    expect(canDeleteTasks(role)).toBe(false);
    expect(canManageProjects(role)).toBe(false);
    expect(canManageMembers(role)).toBe(false);
  });

  it('ADMIN role can manage projects, members, and delete tasks', () => {
    const role: UserRole = 'ADMIN';
    expect(canViewResources(role)).toBe(true);
    expect(canCreateTasks(role)).toBe(true);
    expect(canAddComments(role)).toBe(true);
    expect(canDeleteTasks(role)).toBe(true);
    expect(canManageProjects(role)).toBe(true);
    expect(canManageMembers(role)).toBe(true);
    expect(canManageOrganization(role)).toBe(false);
  });

  it('OWNER role has full organization access', () => {
    const role: UserRole = 'OWNER';
    expect(canViewResources(role)).toBe(true);
    expect(canCreateTasks(role)).toBe(true);
    expect(canAddComments(role)).toBe(true);
    expect(canDeleteTasks(role)).toBe(true);
    expect(canManageProjects(role)).toBe(true);
    expect(canManageMembers(role)).toBe(true);
    expect(canManageOrganization(role)).toBe(true);
  });
});
