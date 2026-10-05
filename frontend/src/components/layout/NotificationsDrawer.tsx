import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { Check, Bell, X } from 'lucide-react';

export const NotificationsDrawer: React.FC = () => {
  const {
    notifications,
    unreadCount,
    isOpen,
    closeNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'absolute',
        top: '64px',
        right: '24px',
        width: '380px',
        maxHeight: '480px',
        background: '#0f172a',
        border: '1px solid var(--glass-border)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow-xl)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.9rem 1.2rem',
          borderBottom: '1px solid var(--border-subtle)',
          background: 'rgba(0, 0, 0, 0.2)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Bell size={18} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Notifications</span>
          {unreadCount > 0 && (
            <span
              style={{
                background: 'var(--primary)',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: 700,
                borderRadius: '10px',
                padding: '1px 6px',
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn btn-secondary"
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
            >
              <Check size={14} /> Mark all read
            </button>
          )}
          <button
            onClick={closeNotifications}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', maxHeight: '400px' }}>
        {notifications.length === 0 ? (
          <div
            style={{
              padding: '2.5rem 1rem',
              textAlign: 'center',
              color: 'var(--text-subtle)',
              fontSize: '0.9rem',
            }}
          >
            No notifications yet
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && markAsRead(n.id)}
              style={{
                padding: '0.85rem 1.2rem',
                borderBottom: '1px solid var(--border-subtle)',
                background: n.read ? 'transparent' : 'rgba(99, 102, 241, 0.07)',
                cursor: n.read ? 'default' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.3rem',
                transition: 'background var(--transition-fast)',
              }}
            >
              <div
                style={{
                  fontSize: '0.85rem',
                  color: n.read ? 'var(--text-muted)' : 'var(--text-main)',
                  fontWeight: n.read ? 400 : 600,
                  lineHeight: 1.4,
                }}
              >
                {n.message}
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {!n.read && (
                  <span
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                    }}
                  />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
