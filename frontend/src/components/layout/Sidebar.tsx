import React from 'react';
import { NavLink } from 'react-router-dom';
import { useOrganization } from '../../context/OrganizationContext';
import {
  FolderKanban,
  LayoutGrid,
  ShieldAlert,
  Layers,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeOrg, isAdmin, isOwner } = useOrganization();
  const canViewAuditLogs = isAdmin || isOwner;

  return (
    <aside
      style={{
        width: '240px',
        background: '#090d16',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '1.25rem 0.75rem',
      }}
    >
      <div>
        {/* Brand Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.5rem 0.75rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 2px 10px rgba(99, 102, 241, 0.4)',
            }}
          >
            <Layers size={18} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.02em' }}>
              CollabSpace
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Multi-Tenant SaaS</div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <NavLink
            to="/projects"
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.85rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 600,
              textDecoration: 'none',
              color: isActive ? '#ffffff' : 'var(--text-muted)',
              background: isActive ? 'var(--primary-light)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
              transition: 'all var(--transition-fast)',
            })}
          >
            <LayoutGrid size={18} /> Projects
          </NavLink>

          {/* Audit Logs navigation: Visible only to authorized roles */}
          {canViewAuditLogs && (
            <NavLink
              to="/audit-logs"
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: 600,
                textDecoration: 'none',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                background: isActive ? 'var(--primary-light)' : 'transparent',
                borderLeft: isActive ? '3px solid var(--primary)' : '3px solid transparent',
                transition: 'all var(--transition-fast)',
              })}
            >
              <ShieldAlert size={18} /> Audit Logs
            </NavLink>
          )}
        </nav>
      </div>

      {/* Organization Badge footer */}
      {activeOrg && (
        <div
          style={{
            background: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
          }}
        >
          <FolderKanban size={18} style={{ color: 'var(--primary)' }} />
          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                fontSize: '0.8rem',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {activeOrg.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
              Active Workspace
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
