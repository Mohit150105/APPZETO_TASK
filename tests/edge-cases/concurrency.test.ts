import { describe, it, expect } from 'vitest';
import request from 'supertest';
import {
  setupTestDB,
  app,
  createTestUser,
  createTestOrg,
  createTestProject,
  createTestTask,
} from '../setup';

describe('Edge Case: Concurrency & Optimistic Locking', () => {
  setupTestDB();

  it('Detects concurrent edit conflict and returns 409 Conflict with meaningful message', async () => {
    const { user, token } = await createTestUser('concurrent_user@test.com');
    const { org } = await createTestOrg(user._id.toString(), 'Concurrency Org');
    const project = await createTestProject(org._id.toString(), user._id.toString());
    const task = await createTestTask(org._id.toString(), project._id.toString(), user._id.toString(), 'Shared Task');

    // User A modifies task with version 1 -> succeeds, version becomes 2
    const userAUpdate = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-organization-id', org._id.toString())
      .send({
        status: 'IN_PROGRESS',
        version: 1,
      });

    expect(userAUpdate.status).toBe(200);
    expect(userAUpdate.body.data.version).toBe(2);

    // User B attempts to modify with stale version 1 -> Must reject with 409 Conflict
    const userBUpdate = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-organization-id', org._id.toString())
      .send({
        priority: 'URGENT',
        version: 1, // Stale version!
      });

    expect(userBUpdate.status).toBe(409);
    expect(userBUpdate.body.success).toBe(false);
    expect(userBUpdate.body.code).toBe('CONCURRENT_MODIFICATION');
  });

  it('Allows atomic partial updates without overwriting untouched fields', async () => {
    const { user, token } = await createTestUser('atomic_user@test.com');
    const { org } = await createTestOrg(user._id.toString(), 'Atomic Org');
    const project = await createTestProject(org._id.toString(), user._id.toString());
    const task = await createTestTask(org._id.toString(), project._id.toString(), user._id.toString(), 'Atomic Task');

    // Update only priority
    const priorityUpdate = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-organization-id', org._id.toString())
      .send({ priority: 'HIGH' });

    expect(priorityUpdate.status).toBe(200);
    expect(priorityUpdate.body.data.priority).toBe('HIGH');
    expect(priorityUpdate.body.data.status).toBe('TODO'); // Status remains unchanged

    // Update only status
    const statusUpdate = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-organization-id', org._id.toString())
      .send({ status: 'REVIEW' });

    expect(statusUpdate.status).toBe(200);
    expect(statusUpdate.body.data.status).toBe('REVIEW');
    expect(statusUpdate.body.data.priority).toBe('HIGH'); // Priority preserved
  });
});
