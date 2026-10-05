import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '../context/OrganizationContext';
import { useSocket } from '../context/SocketContext';
import { projectService } from '../services/project.service';
import { Project } from '../types';
import { CreateProjectModal } from '../components/projects/CreateProjectModal';
import {
  FolderKanban,
  Plus,
  Search,
  CheckCircle2,
  ListTodo,
} from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeOrg, canManageProjects } = useOrganization();
  const { socket } = useSocket();

  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const loadProjects = async () => {
    if (!activeOrg) return;
    try {
      setLoading(true);
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [activeOrg?.id]);

  // Real-time socket updates for projects
  useEffect(() => {
    if (!socket) return;

    const handleProjectCreated = (newProj: Project) => {
      setProjects((prev) => [newProj, ...prev]);
    };

    const handleProjectUpdated = (updProj: Project) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === updProj.id ? { ...p, ...updProj } : p))
      );
    };

    const handleProjectDeleted = ({ projectId }: { projectId: string }) => {
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    };

    socket.on('project:created', handleProjectCreated);
    socket.on('project:updated', handleProjectUpdated);
    socket.on('project:deleted', handleProjectDeleted);

    return () => {
      socket.off('project:created', handleProjectCreated);
      socket.off('project:updated', handleProjectUpdated);
      socket.off('project:deleted', handleProjectDeleted);
    };
  }, [socket]);

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="page-wrapper">
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
            Projects
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Manage and track active initiatives in {activeOrg?.name || 'organization'}
          </p>
        </div>

        {canManageProjects && (
          <button onClick={() => setModalOpen(true)} className="btn btn-primary">
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {/* Filter / Search Bar */}
      <div style={{ marginBottom: '1.5rem', maxWidth: '380px', position: 'relative' }}>
        <Search
          size={16}
          style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-subtle)' }}
        />
        <input
          type="text"
          className="form-input"
          placeholder="Filter projects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ paddingLeft: '2.25rem' }}
        />
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-subtle)' }}>
          Loading projects...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div
          className="glass-card"
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <FolderKanban size={48} style={{ color: 'var(--text-subtle)' }} />
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem' }}>
              No projects found
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              {canManageProjects
                ? 'Create your first project to start organizing tasks on the Kanban board.'
                : 'No projects have been created in this organization yet.'}
            </p>
          </div>
          {canManageProjects && (
            <button onClick={() => setModalOpen(true)} className="btn btn-primary">
              <Plus size={16} /> Create Project
            </button>
          )}
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {filteredProjects.map((project) => {
            const total = project.taskCount || 0;
            const done = project.doneCount || 0;
            const progress = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <div
                key={project.id}
                className="glass-card"
                onClick={() => navigate(`/projects/${project.id}`)}
                style={{
                  padding: '1.5rem',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '190px',
                }}
              >
                <div>
                  <h3
                    style={{
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      marginBottom: '0.45rem',
                      color: 'var(--text-main)',
                    }}
                  >
                    {project.name}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.45,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      marginBottom: '1rem',
                    }}
                  >
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                <div>
                  {/* Progress Bar */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.75rem',
                        color: 'var(--text-subtle)',
                        marginBottom: '4px',
                      }}
                    >
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        borderRadius: '3px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${progress}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #6366f1, #10b981)',
                          borderRadius: '3px',
                          transition: 'width 300ms ease',
                        }}
                      />
                    </div>
                  </div>

                  {/* Task counts footer */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.775rem',
                      color: 'var(--text-subtle)',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <ListTodo size={14} />
                      <span>{total} tasks</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                      <span>{done} done</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <CreateProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onProjectCreated={(newProject) => setProjects([newProject, ...projects])}
      />
    </div>
  );
};
