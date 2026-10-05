import React, { useState, useEffect } from 'react';
import { Modal } from '../ui/Modal';
import { Task, TaskPriority, TaskStatus, Comment, OrganizationMember } from '../../types';
import { taskService } from '../../services/task.service';
import { orgService } from '../../services/org.service';
import { useOrganization } from '../../context/OrganizationContext';
import { useSocket } from '../../context/SocketContext';
import { StatusBadge, PriorityBadge } from '../ui/Badge';
import {
  Trash2,
  Paperclip,
  Send,
  Upload,
} from 'lucide-react';

interface TaskModalProps {
  taskId: string | null;
  onClose: () => void;
  onTaskUpdated: (task: Task) => void;
  onTaskDeleted: (taskId: string) => void;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  taskId,
  onClose,
  onTaskUpdated,
  onTaskDeleted,
}) => {
  const { activeOrg, canDeleteTasks, isViewer } = useOrganization();
  const { socket } = useSocket();

  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('TODO');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [assigneeId, setAssigneeId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');

  // Load task & comments
  const loadTask = async () => {
    if (!taskId) return;
    try {
      setLoading(true);
      setError(null);
      const [taskData, commentsData] = await Promise.all([
        taskService.getTaskById(taskId),
        taskService.getComments(taskId),
      ]);

      setTask(taskData);
      setTitle(taskData.title);
      setDescription(taskData.description);
      setStatus(taskData.status);
      setPriority(taskData.priority);
      setAssigneeId(taskData.assignee?.id || '');
      setDueDate(taskData.dueDate ? taskData.dueDate.slice(0, 10) : '');
      setComments(commentsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      loadTask();
      if (activeOrg) {
        orgService.getMembers(activeOrg.id).then(setMembers).catch(console.error);
      }
    }
  }, [taskId, activeOrg?.id]);

  // Real-time comment listener
  useEffect(() => {
    if (!socket || !taskId) return;

    const handleCommentCreated = (newC: Comment) => {
      if (newC.taskId === taskId) {
        setComments((prev) => {
          if (prev.some((c) => c.id === newC.id)) return prev;
          return [...prev, newC];
        });
      }
    };

    socket.on('comment:created', handleCommentCreated);

    return () => {
      socket.off('comment:created', handleCommentCreated);
    };
  }, [socket, taskId]);

  const handleSave = async () => {
    if (!task) return;
    try {
      setSaving(true);
      setError(null);
      const updated = await taskService.updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assigneeId: assigneeId || null,
        dueDate: dueDate || null,
        version: task.version, // Optimistic Concurrency Control
      });

      setTask(updated);
      onTaskUpdated(updated);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError('⚠️ Concurrency Conflict: This task was modified by another user. Reloading latest...');
        await loadTask();
      } else {
        setError(err.response?.data?.message || 'Failed to update task');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!task) return;
    if (!window.confirm(`Are you sure you want to permanently delete task "${task.title}"?`)) return;

    try {
      await taskService.deleteTask(task.id);
      onTaskDeleted(task.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !newComment.trim()) return;

    // Detect @mentions by user ID or name in text
    const mentions: string[] = [];
    members.forEach((m) => {
      if (m.user && newComment.includes(`@${m.user.name}`)) {
        mentions.push(m.user.id);
      }
    });

    try {
      const added = await taskService.addComment(task.id, {
        content: newComment.trim(),
        mentions,
      });
      setComments((prev) => [...prev, added]);
      setNewComment('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!task || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      setSaving(true);
      const updated = await taskService.uploadAttachment(task.id, file);
      setTask(updated);
      onTaskUpdated(updated);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload attachment');
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  if (!taskId) return null;

  return (
    <Modal isOpen={Boolean(taskId)} onClose={onClose} title={task?.title || 'Task Details'} maxWidth="760px">
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

      {loading ? (
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-subtle)' }}>
          Loading task details...
        </div>
      ) : task ? (
        <div>
          {/* Top metadata strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              paddingBottom: '0.75rem',
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <StatusBadge status={status} />
              <PriorityBadge priority={priority} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                Version {task.version}
              </span>
            </div>

            {canDeleteTasks && (
              <button
                onClick={handleDelete}
                className="btn btn-danger"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              >
                <Trash2 size={14} /> Delete Task
              </button>
            )}
          </div>

          {/* Title & Description */}
          <div className="form-group">
            <label className="form-label">Task Title</label>
            <input
              type="text"
              className="form-input"
              value={title}
              disabled={isViewer}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-textarea"
              rows={3}
              value={description}
              disabled={isViewer}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Grid: Status, Priority, Assignee, Due Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={status}
                disabled={isViewer}
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
                disabled={isViewer}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select
                className="form-select"
                value={assigneeId}
                disabled={isViewer}
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
                disabled={isViewer}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          {/* Save Button */}
          {!isViewer && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || !title.trim()}
                className="btn btn-primary"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {/* Attachments Section */}
          <div style={{ marginBottom: '1.75rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>
                <Paperclip size={16} style={{ color: 'var(--primary)' }} />
                <span>Attachments ({task.attachments?.length || 0})</span>
              </div>

              {!isViewer && (
                <label className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', cursor: 'pointer' }}>
                  <Upload size={14} /> Upload File
                  <input type="file" onChange={handleFileUpload} style={{ display: 'none' }} />
                </label>
              )}
            </div>

            {task.attachments && task.attachments.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {task.attachments.map((att) => (
                  <a
                    key={att.id}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0.45rem 0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.8rem',
                      color: 'var(--text-main)',
                      textDecoration: 'none',
                    }}
                  >
                    <Paperclip size={13} style={{ color: 'var(--primary)' }} />
                    <span style={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {att.name}
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                      ({Math.round(att.size / 1024)} KB)
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>No files attached</div>
            )}
          </div>

          {/* Comments Thread Section */}
          <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Discussion ({comments.length})
            </h3>

            {/* Existing Comments */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '240px', overflowY: 'auto', marginBottom: '1rem' }}>
              {comments.length === 0 ? (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', padding: '0.5rem 0' }}>
                  No comments yet. Start the conversation!
                </div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '0.75rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="avatar" style={{ width: '22px', height: '22px', fontSize: '0.65rem' }}>
                          {c.user?.name?.slice(0, 2).toUpperCase() || 'U'}
                        </div>
                        <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{c.user?.name}</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                        {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.4 }}>
                      {c.content}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Post Comment Input (Members, Admins, Owners) */}
            {!isViewer && (
              <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Write a comment... (use @Name to mention)"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button type="submit" disabled={!newComment.trim()} className="btn btn-primary" style={{ padding: '0 1rem' }}>
                  <Send size={15} />
                </button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
};
