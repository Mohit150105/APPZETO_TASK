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

describe('Edge Case: Multi-Tenant Data Isolation Boundary', () => {
  setupTestDB();

  it('Strictly isolates projects across organizations (User A cannot access Org B Project)', async () => {
    // Org A setup
    const { user: userA, token: tokenA } = await createTestUser('userA@orgA.com');
    const { org: orgA } = await createTestOrg(userA._id.toString(), 'Organization Alpha');
    const projectA = await createTestProject(orgA._id.toString(), userA._id.toString(), 'Alpha Project');

    // Org B setup
    const { user: userB, token: tokenB } = await createTestUser('userB@orgB.com');
    const { org: orgB } = await createTestOrg(userB._id.toString(), 'Organization Beta');
    const projectB = await createTestProject(orgB._id.toString(), userB._id.toString(), 'Beta Project');

    // 1. User A tries to access Org B project using Org A header -> Must return 404 (not in this org)
    const crossAccessAttempt1 = await request(app)
      .get(`/api/projects/${projectB._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-organization-id', orgA._id.toString());

    expect(crossAccessAttempt1.status).toBe(404);
    expect(crossAccessAttempt1.body.success).toBe(false);

    // 2. User A tries to spoof Org B header -> Must return 403 (User A is not a member of Org B)
    const spoofHeaderAttempt = await request(app)
      .get(`/api/projects/${projectB._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-organization-id', orgB._id.toString());

    expect(spoofHeaderAttempt.status).toBe(403);
    expect(spoofHeaderAttempt.body.success).toBe(false);
    expect(spoofHeaderAttempt.body.code).toBe('TENANT_ACCESS_DENIED');
  });

  it('Strictly isolates tasks across organizations (User A cannot view or edit Org B Task)', async () => {
    // Org A & B
    const { user: userA, token: tokenA } = await createTestUser('alice@orgA.com');
    const { org: orgA } = await createTestOrg(userA._id.toString(), 'Org A');

    const { user: userB } = await createTestUser('bob@orgB.com');
    const { org: orgB } = await createTestOrg(userB._id.toString(), 'Org B');
    const projectB = await createTestProject(orgB._id.toString(), userB._id.toString());
    const taskB = await createTestTask(orgB._id.toString(), projectB._id.toString(), userB._id.toString(), 'Secret Org B Task');

    // User A attempts to view Task B with Org A context
    const viewAttempt = await request(app)
      .get(`/api/tasks/${taskB._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-organization-id', orgA._id.toString());

    expect(viewAttempt.status).toBe(404);
    expect(viewAttempt.body.success).toBe(false);

    // User A attempts to mutate Task B
    const editAttempt = await request(app)
      .put(`/api/tasks/${taskB._id}`)
      .set('Authorization', `Bearer ${tokenA}`)
      .set('x-organization-id', orgA._id.toString())
      .send({ title: 'Hacked Title' });

    expect(editAttempt.status).toBe(404);
    expect(editAttempt.body.success).toBe(false);
  });
});
