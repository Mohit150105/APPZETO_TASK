import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { useOrganization } from '../../context/OrganizationContext';
import { orgService } from '../../services/org.service';
import { OrganizationMember, UserRole } from '../../types';
import { RoleBadge } from '../ui/Badge';
import { UserPlus, Trash2 } from 'lucide-react';

interface OrgMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrgMembersModal: React.FC<OrgMembersModalProps> = ({ isOpen, onClose }) => {
  const { activeOrg, canManageMembers } = useOrganization();
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('MEMBER');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = async () => {
    if (!activeOrg) return;
    try {
      setLoading(true);
      const data = await orgService.getMembers(activeOrg.id);
      setMembers(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadMembers();
  }, [isOpen, activeOrg?.id]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrg || !email.trim()) return;

    try {
      setError(null);
      await orgService.addMember(activeOrg.id, {
        email: email.trim(),
        role,
      });
      setEmail('');
      await loadMembers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!activeOrg) return;
    if (!window.confirm('Are you sure you want to remove this member?')) return;

    try {
      await orgService.removeMember(activeOrg.id, userId);
      await loadMembers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove member');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Organization Members - ${activeOrg?.name || ''}`} maxWidth="680px">
      {error && (
        <div
          style={{
            padding: '0.65rem 0.85rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            color: '#ef4444',
            fontSize: '0.85rem',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Invite Member Section (ADMIN/OWNER only) */}
      {canManageMembers && (
        <form
          onSubmit={handleAddMember}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '10px',
            padding: '1rem',
            marginBottom: '1.5rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ flex: 1 }}>
            <label className="form-label" style={{ marginBottom: '4px' }}>
              Add by Email
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div style={{ width: '130px' }}>
            <label className="form-label" style={{ marginBottom: '4px' }}>
              Role
            </label>
            <select
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
            >
              <option value="VIEWER">Viewer</option>
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <button type="submit" disabled={!email.trim()} className="btn btn-primary" style={{ height: '40px' }}>
            <UserPlus size={16} /> Add
          </button>
        </form>
      )}

      {/* Members List */}
      <div>
        <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
          CURRENT MEMBERS ({members.length})
        </h3>

        {loading ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-subtle)' }}>
            Loading members...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
            {members.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  background: 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="avatar">
                    {m.user?.avatarUrl ? (
                      <img src={m.user.avatarUrl} alt={m.user.name} />
                    ) : (
                      m.user?.name?.slice(0, 2).toUpperCase() || 'U'
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{m.user?.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{m.user?.email}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <RoleBadge role={m.role} />
                  {canManageMembers && m.role !== 'OWNER' && m.user && (
                    <button
                      onClick={() => handleRemoveMember(m.user!.id)}
                      title="Remove member"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-subtle)',
                        cursor: 'pointer',
                        padding: '4px',
                      }}
                    >
                      <Trash2 size={16} style={{ color: '#ef4444' }} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem -1.5rem' }}>
        <button onClick={onClose} className="btn btn-secondary">
          Close
        </button>
      </div>
    </Modal>
  );
};
