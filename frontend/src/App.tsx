import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { OrganizationProvider } from './context/OrganizationContext';
import { SocketProvider } from './context/SocketContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { KanbanPage } from './pages/KanbanPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OrganizationProvider>
          <SocketProvider>
            <NotificationProvider>
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Protected Application Layout */}
                <Route path="/" element={<AppLayout />}>
                  <Route index element={<Navigate to="/projects" replace />} />
                  <Route path="projects" element={<ProjectsPage />} />
                  <Route path="projects/:id" element={<KanbanPage />} />
                  <Route path="audit-logs" element={<AuditLogsPage />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </NotificationProvider>
          </SocketProvider>
        </OrganizationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
