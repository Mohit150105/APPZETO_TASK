import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';
import { useSocket } from '../../context/SocketContext';
import { useNotifications } from '../../context/NotificationContext';
import { RoleBadge } from '../ui/Badge';
import { NotificationsDrawer } from './NotificationsDrawer';
import {
  Bell,
  ChevronDown,
  Building,
  Plus,
  LogOut,
  Users,
} from 'lucide-react';

interface NavbarProps {
  onOpenOrgModal: () => void;
  onOpenMembersModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenOrgModal, onOpenMembersModal }) => {
  const { user, logout } = useAuth();
  const { organizations, activeOrg, activeRole, switchOrg, canManageMembers } = useOrganization();
  const { isConnected } = useSocket();
  const { unreadCount, toggleOpen } = useNotifications();

  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);

  return (
    <header
      style={{
        height: '64px',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Left: Organization Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', position: 'relative' }}>
        <div
          onClick={() => setOrgDropdownOpen((prev) => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.45rem 0.85rem',
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <Building size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
            {activeOrg?.name || 'Select Organization'}
          </span>
          {activeRole && <RoleBadge role={activeRole} />}
          <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
        </div>

        {/* Organization Switcher Dropdown */}
        {orgDropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: '48px',
              left: 0,
              width: '240px',
              background: '#0f172a',
              border: '1px solid var(--glass-border)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-lg)',
              zIndex: 50,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)' }}>
                YOUR ORGANIZATIONS
              </span>
            </div>
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {organizations.map((org) => (
                <div
                  key={org.id}
                  onClick={() => {
                    switchOrg(org.id);
                    setOrgDropdownOpen(false);
                  }}
                  style={{
                    padding: '0.65rem 0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    background: org.id === activeOrg?.id ? 'var(--primary-light)' : 'transparent',
                    fontSize: '0.875rem',
                    fontWeight: org.id === activeOrg?.id ? 700 : 500,
                  }}
                >
                  <span>{org.name}</span>
                  <RoleBadge role={org.role} />
                </div>
              ))}
            </div>
            <div
              onClick={() => {
                setOrgDropdownOpen(false);
                onOpenOrgModal();
              }}
              style={{
                padding: '0.65rem 0.85rem',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--primary)',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                background: 'rgba(0,0,0,0.15)',
              }}
            >
              <Plus size={15} /> Create Organization
            </div>
          </div>
        )}

        {/* Manage Members button (only for ADMIN/OWNER) */}
        {canManageMembers && (
          <button
            onClick={onOpenMembersModal}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem' }}
          >
            <Users size={15} /> Members
          </button>
        )}
      </div>

      {/* Right: Real-time Indicator, Notifications, User info, Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
        {/* Real-time WebSocket connection pulse */}
        <div
          title={isConnected ? 'Live Socket: Connected' : 'Socket: Disconnected'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            color: isConnected ? '#10b981' : '#94a3b8',
            background: 'rgba(15, 23, 42, 0.5)',
            padding: '4px 8px',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <span
            className={isConnected ? 'pulse-dot' : ''}
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: isConnected ? '#10b981' : '#64748b',
            }}
          />
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </div>

        {/* Notifications Icon with Badge */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={toggleOpen}
            style={{
              background: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.5rem',
              color: 'var(--text-main)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--primary)',
                  color: 'white',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  borderRadius: '10px',
                  padding: '1px 5px',
                  boxShadow: '0 0 8px rgba(99, 102, 241, 0.8)',
                }}
              >
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        {/* User Avatar & Logout */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div className="avatar">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} />
            ) : (
              user?.name?.slice(0, 2).toUpperCase() || 'U'
            )}
          </div>
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{user?.name}</span>

          <button
            onClick={logout}
            title="Log Out"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-subtle)',
              cursor: 'pointer',
              display: 'flex',
              padding: '4px',
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Notifications Drawer Component */}
      <NotificationsDrawer />
    </header>
  );
};
