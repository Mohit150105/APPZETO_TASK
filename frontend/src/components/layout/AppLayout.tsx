import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { CreateOrgModal } from '../orgs/CreateOrgModal';
import { OrgMembersModal } from '../orgs/OrgMembersModal';

export const AppLayout: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [orgModalOpen, setOrgModalOpen] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: 'var(--bg-app)',
          color: 'var(--text-muted)',
        }}
      >
        Loading workspace...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-container">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main App Canvas */}
      <div className="main-content">
        <Navbar
          onOpenOrgModal={() => setOrgModalOpen(true)}
          onOpenMembersModal={() => setMembersModalOpen(true)}
        />

        <main style={{ flex: 1 }}>
          <Outlet />
        </main>
      </div>

      {/* Modals */}
      <CreateOrgModal
        isOpen={orgModalOpen}
        onClose={() => setOrgModalOpen(false)}
      />

      <OrgMembersModal
        isOpen={membersModalOpen}
        onClose={() => setMembersModalOpen(false)}
      />
    </div>
  );
};
