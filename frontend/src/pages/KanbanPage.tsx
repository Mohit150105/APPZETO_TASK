import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectService } from '../services/project.service';
import { taskService } from '../services/task.service';
import { orgService } from '../services/org.service';
import { useOrganization } from '../context/OrganizationContext';
import { Project, Task, TaskPriority, TaskStatus, OrganizationMember } from '../types';
import { KanbanBoard } from '../components/kanban/KanbanBoard';
import { TaskModal } from '../components/tasks/TaskModal';
import { CreateTaskModal } from '../components/tasks/CreateTaskModal';
import {
  ArrowLeft,
  Plus,
  Search,
  X,
} from 'lucide-react';

export const KanbanPage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { activeOrg, canCreateTasks } = useOrganization();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [dueDateFilter, setDueDateFilter] = useState<string>('');

  // Modals state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [targetColumnStatus, setTargetColumnStatus] = useState<TaskStatus>('TODO');

  // Debounce search term by 300ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load project details
  useEffect(() => {
    if (!projectId || !activeOrg) return;

    projectService
      .getProjectById(projectId)
      .then(setProject)
      .catch((err) => {
        console.error('Failed to load project', err);
        navigate('/projects');
      });

    orgService.getMembers(activeOrg.id).then(setMembers).catch(console.error);
  }, [projectId, activeOrg?.id]);

  // Load tasks with filters
  const loadTasks = useCallback(async () => {
    if (!projectId || !activeOrg) return;
    try {
      setLoading(true);
      const res = await taskService.getTasks({
        projectId,
        search: debouncedSearch || undefined,
        priority: (priorityFilter as TaskPriority) || undefined,
        assignee: assigneeFilter || undefined,
        dueDate: dueDateFilter || undefined,
        limit: 100,
      });
      setTasks(res.data);
    } catch (err) {
      console.error('Failed to load tasks', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, activeOrg?.id, debouncedSearch, priorityFilter, assigneeFilter, dueDateFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleOpenCreateModal = (status?: TaskStatus) => {
    setTargetColumnStatus(status || 'TODO');
    setCreateModalOpen(true);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setDebouncedSearch('');
    setPriorityFilter('');
    setAssigneeFilter('');
    setDueDateFilter('');
  };

  const hasActiveFilters = Boolean(
    searchTerm || priorityFilter || assigneeFilter || dueDateFilter
  );

  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <button
            onClick={() => navigate('/projects')}
            className="btn btn-secondary"
            style={{ padding: '0.45rem 0.75rem' }}
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              {project?.name || 'Project Kanban'}
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {project?.description || 'Real-time collaborative task board'}
            </p>
          </div>
        </div>

        {canCreateTasks && (
          <button onClick={() => handleOpenCreateModal('TODO')} className="btn btn-primary">
            <Plus size={16} /> New Task
          </button>
        )}
      </div>

      {/* Advanced Search & Filtering Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          background: 'rgba(15, 23, 42, 0.5)',
          padding: '0.65rem 1rem',
          borderRadius: '10px',
          border: '1px solid var(--border-subtle)',
        }}
      >
        {/* Debounced Search Input */}
        <div style={{ position: 'relative', width: '220px' }}>
          <Search
            size={14}
            style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-subtle)' }}
          />
          <input
            type="text"
            className="form-input"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2rem', paddingRight: '0.5rem', height: '34px', fontSize: '0.85rem' }}
          />
        </div>

        {/* Priority Filter */}
        <select
          className="form-select"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          style={{ width: '130px', height: '34px', fontSize: '0.825rem' }}
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>

        {/* Assignee Filter */}
        <select
          className="form-select"
          value={assigneeFilter}
          onChange={(e) => setAssigneeFilter(e.target.value)}
          style={{ width: '150px', height: '34px', fontSize: '0.825rem' }}
        >
          <option value="">All Assignees</option>
          <option value="unassigned">Unassigned</option>
          {members.map((m) =>
            m.user ? (
              <option key={m.user.id} value={m.user.id}>
                {m.user.name}
              </option>
            ) : null
          )}
        </select>

        {/* Due Date Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <input
            type="date"
            className="form-input"
            value={dueDateFilter}
            onChange={(e) => setDueDateFilter(e.target.value)}
            style={{ width: '140px', height: '34px', fontSize: '0.825rem' }}
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="btn btn-secondary"
            style={{ height: '34px', padding: '0 0.65rem', fontSize: '0.8rem' }}
          >
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Kanban Board Canvas */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {loading && tasks.length === 0 ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-subtle)' }}>
            Loading board tasks...
          </div>
        ) : projectId ? (
          <KanbanBoard
            projectId={projectId}
            tasks={tasks}
            setTasks={setTasks}
            onTaskClick={(task) => setSelectedTaskId(task.id)}
            onOpenCreateModal={handleOpenCreateModal}
          />
        ) : null}
      </div>

      {/* Task Details Modal */}
      {selectedTaskId && (
        <TaskModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdated={(updated) =>
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)))
          }
          onTaskDeleted={(deletedId) =>
            setTasks((prev) => prev.filter((t) => t.id !== deletedId))
          }
        />
      )}

      {/* Create Task Modal */}
      {projectId && (
        <CreateTaskModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          projectId={projectId}
          initialStatus={targetColumnStatus}
          onTaskCreated={(newTask) => setTasks((prev) => [newTask, ...prev])}
        />
      )}
    </div>
  );
};
