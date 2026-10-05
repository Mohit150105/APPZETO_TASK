import React, { useState, useEffect } from 'react';
import { useOrganization } from '../context/OrganizationContext';
import { auditService } from '../services/audit.service';
import { AuditLog } from '../types';
import {
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Clock,
} from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const { activeOrg, isAdmin, isOwner } = useOrganization();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters
  const [entityFilter, setEntityFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const loadAuditLogs = async () => {
    if (!activeOrg) return;
    try {
      setLoading(true);
      const res = await auditService.getAuditLogs({
        entity: entityFilter || undefined,
        action: actionFilter || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 15,
      });

      setLogs(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalRecords(res.pagination.total);
    } catch (err) {
      console.error('Failed to load audit logs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [activeOrg?.id, page, entityFilter, actionFilter, startDate, endDate]);

  if (!isAdmin && !isOwner) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <ShieldAlert size={48} style={{ color: '#ef4444', marginBottom: '1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          Access Restricted
        </h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Audit logs are strictly restricted to organization Administrators and Owners.
        </p>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          Audit Logs
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Immutable compliance history of security, task, project, and membership changes in {activeOrg?.name}
        </p>
      </div>

      {/* Filters Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          background: 'rgba(15, 23, 42, 0.5)',
          padding: '0.85rem 1rem',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Entity</label>
          <select
            className="form-select"
            value={entityFilter}
            onChange={(e) => {
              setEntityFilter(e.target.value);
              setPage(1);
            }}
            style={{ height: '34px', fontSize: '0.8rem', width: '150px' }}
          >
            <option value="">All Entities</option>
            <option value="Task">Task</option>
            <option value="Project">Project</option>
            <option value="OrganizationMember">Member</option>
            <option value="Organization">Organization</option>
            <option value="Comment">Comment</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Action</label>
          <select
            className="form-select"
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            style={{ height: '34px', fontSize: '0.8rem', width: '180px' }}
          >
            <option value="">All Actions</option>
            <option value="TASK_CREATED">TASK_CREATED</option>
            <option value="TASK_STATUS_CHANGED">TASK_STATUS_CHANGED</option>
            <option value="TASK_ASSIGNED">TASK_ASSIGNED</option>
            <option value="TASK_UPDATED">TASK_UPDATED</option>
            <option value="TASK_DELETED">TASK_DELETED</option>
            <option value="PROJECT_CREATED">PROJECT_CREATED</option>
            <option value="PROJECT_UPDATED">PROJECT_UPDATED</option>
            <option value="MEMBER_ADDED">MEMBER_ADDED</option>
            <option value="MEMBER_REMOVED">MEMBER_REMOVED</option>
          </select>
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>From Date</label>
          <input
            type="date"
            className="form-input"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            style={{ height: '34px', fontSize: '0.8rem', width: '135px' }}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>To Date</label>
          <input
            type="date"
            className="form-input"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            style={{ height: '34px', fontSize: '0.8rem', width: '135px' }}
          />
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                background: 'rgba(0,0,0,0.2)',
                fontSize: '0.75rem',
                color: 'var(--text-subtle)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              <th style={{ padding: '0.85rem 1rem' }}>Timestamp</th>
              <th style={{ padding: '0.85rem 1rem' }}>User</th>
              <th style={{ padding: '0.85rem 1rem' }}>Action</th>
              <th style={{ padding: '0.85rem 1rem' }}>Entity</th>
              <th style={{ padding: '0.85rem 1rem' }}>Changes / Payload</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-subtle)' }}>
                  Loading audit logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-subtle)' }}>
                  No audit log entries match the selected filters.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: '1px solid var(--border-subtle)',
                    fontSize: '0.85rem',
                  }}
                >
                  <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={13} style={{ color: 'var(--text-subtle)' }} />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className="avatar" style={{ width: '22px', height: '22px', fontSize: '0.65rem' }}>
                        {log.userId?.name?.slice(0, 2).toUpperCase() || 'U'}
                      </div>
                      <span style={{ fontWeight: 600 }}>{log.userId?.name || 'System'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.725rem',
                        fontWeight: 700,
                        background: 'rgba(99, 102, 241, 0.15)',
                        color: 'var(--primary)',
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>
                    {log.entity}
                  </td>
                  <td style={{ padding: '0.85rem 1rem' }}>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '0.75rem',
                        background: 'rgba(0,0,0,0.3)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        maxWidth: '380px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {log.newValue ? JSON.stringify(log.newValue) : log.oldValue ? `Old: ${JSON.stringify(log.oldValue)}` : '-'}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.85rem 1rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(0,0,0,0.1)',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
          }}
        >
          <div>
            Showing {logs.length} of {totalRecords} records
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.6rem' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontWeight: 600 }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.6rem' }}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
