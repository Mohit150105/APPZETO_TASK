import React, { createContext, useContext, useState, useEffect } from 'react';
import { Organization, UserRole } from '../types';
import { orgService } from '../services/org.service';
import { useAuth } from './AuthContext';

interface OrgContextType {
  organizations: Organization[];
  activeOrg: Organization | null;
  activeRole: UserRole | null;
  isLoading: boolean;
  switchOrg: (orgId: string) => void;
  createOrg: (name: string) => Promise<Organization>;
  refreshOrgs: () => Promise<void>;
  // Granular Permission Helpers
  isOwner: boolean;
  isAdmin: boolean;
  isMember: boolean;
  isViewer: boolean;
  canManageOrg: boolean;
  canManageMembers: boolean;
  canManageProjects: boolean;
  canDeleteTasks: boolean;
  canCreateTasks: boolean;
}

const OrganizationContext = createContext<OrgContextType | undefined>(undefined);

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [activeOrg, setActiveOrg] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshOrgs = async () => {
    if (!user) {
      setOrganizations([]);
      setActiveOrg(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const list = await orgService.getOrganizations();
      setOrganizations(list);

      const savedOrgId = localStorage.getItem('activeOrgId');
      const matched = list.find((o) => o.id === savedOrgId);

      if (matched) {
        setActiveOrg(matched);
      } else if (list.length > 0) {
        setActiveOrg(list[0]);
        localStorage.setItem('activeOrgId', list[0].id);
      } else {
        setActiveOrg(null);
        localStorage.removeItem('activeOrgId');
      }
    } catch (err) {
      console.error('Failed to load organizations', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshOrgs();
  }, [user]);

  const switchOrg = (orgId: string) => {
    const target = organizations.find((o) => o.id === orgId);
    if (target) {
      setActiveOrg(target);
      localStorage.setItem('activeOrgId', target.id);
    }
  };

  const createOrg = async (name: string): Promise<Organization> => {
    const created = await orgService.createOrganization(name);
    await refreshOrgs();
    switchOrg(created.id);
    return created;
  };

  const activeRole: UserRole | null = activeOrg?.role || null;
  const isOwner = activeRole === 'OWNER';
  const isAdmin = activeRole === 'ADMIN' || isOwner;
  const isMember = activeRole === 'MEMBER' || isAdmin;
  const isViewer = activeRole === 'VIEWER';

  const canManageOrg = isOwner;
  const canManageMembers = isAdmin;
  const canManageProjects = isAdmin;
  const canDeleteTasks = isAdmin;
  const canCreateTasks = isMember;

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        activeOrg,
        activeRole,
        isLoading,
        switchOrg,
        createOrg,
        refreshOrgs,
        isOwner,
        isAdmin,
        isMember,
        isViewer,
        canManageOrg,
        canManageMembers,
        canManageProjects,
        canDeleteTasks,
        canCreateTasks,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = (): OrgContextType => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within an OrganizationProvider');
  }
  return context;
};
