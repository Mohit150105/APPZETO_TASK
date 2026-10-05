import { describe, it, expect } from 'vitest';
import request from 'supertest';
import {
  setupTestDB,
  app,
  createTestUser,
  createTestOrg,
  createTestProject,
  addTestMember,
} from '../setup';
import { notificationService } from '../../backend/src/services/notification.service';

describe('Integration: Notification APIs', () => {
  setupTestDB();

  it('GET /api/notifications returns user notifications with unread count', async () => {
    const { user, token } = await createTestUser('notif_user@test.com');
    const { org } = await createTestOrg(user._id.toString(), 'Notif Org');

    // Create notification directly via service
    await notificationService.notify({
      recipientId: user._id.toString(),
      organizationId: org._id.toString(),
      type: 'TASK_ASSIGNED',
      message: 'You have a new task waiting!',
    });

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.unreadCount).toBe(1);
    expect(res.body.data[0].read).toBe(false);
  });

  it('PATCH /api/notifications/:id/read marks notification as read', async () => {
    const { user, token } = await createTestUser('notif_read@test.com');
    const { org } = await createTestOrg(user._id.toString(), 'Read Org');

    const notif = await notificationService.notify({
      recipientId: user._id.toString(),
      organizationId: org._id.toString(),
      type: 'TASK_STATUS_CHANGED',
      message: 'Status updated to DONE',
    });

    const res = await request(app)
      .patch(`/api/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.read).toBe(true);
  });
});
