import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { taskService } from '../../services/task.service';
import { orgService } from '../../services/org.service';
import { useOrganization } from '../../context/OrganizationContext';
import { Task, TaskPriority, TaskStatus, OrganizationMember } from '../../types';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  initialStatus?: TaskStatus;
  onTaskCreated: (task: Task) => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  projectId,
  initialStatus = 'TODO',
  onTaskCreated,
}) => {
  const { activeOrg } = useOrganization();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>(initialStatus);
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [labelInput, setLabelInput] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialStatus) setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    if (isOpen && activeOrg) {
      orgService.getMembers(activeOrg.id).then(setMembers).catch(console.error);
    }
  }, [isOpen, activeOrg?.id]);

  const handleAddLabel = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = labelInput.trim();
      if (val && !labels.includes(val)) {
        setLabels([...labels, val]);
        setLabelInput('');
      }
    }
  };

  const handleRemoveLabel = (tag: string) => {
    setLabels(labels.filter((l) => l !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId) return;

    try {
      setLoading(true);
      setError(null);
      const created = await taskService.createTask({
        projectId,
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assigneeId: assigneeId || null,
        labels,
        dueDate: dueDate || null,
      });

      onTaskCreated(created);
      setTitle('');
      setDescription('');
      setLabels([]);
      setAssigneeId('');
      setDueDate('');
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Task" maxWidth="640px">
      <form onSubmit={handleSubmit}>
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

        <div className="form-group">
          <label className="form-label">Title</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Implement OAuth2 login"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="form-textarea"
            rows={3}
            placeholder="Detailed specifications, criteria, and notes"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="REVIEW">Review</option>
              <option value="DONE">Done</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Priority</label>
            <select
              className="form-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Assignee</label>
            <select
              className="form-select"
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
            >
              <option value="">Unassigned</option>
              {members.map((m) =>
                m.user ? (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name} ({m.role})
                  </option>
                ) : null
              )}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input
              type="date"
              className="form-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Labels (press Enter or comma)</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Frontend, Urgent, Bug"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyDown={handleAddLabel}
          />
          {labels.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
              {labels.map((l) => (
                <span
                  key={l}
                  onClick={() => handleRemoveLabel(l)}
                  style={{
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {l} ✕
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="modal-footer" style={{ margin: '1.5rem -1.5rem -1.5rem -1.5rem' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={loading || !title.trim()} className="btn btn-primary">
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
