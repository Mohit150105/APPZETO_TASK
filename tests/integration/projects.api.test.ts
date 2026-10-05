import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { setupTestDB, app, createTestUser, createTestOrg, createTestProject } from '../setup';

describe('Integration: Project APIs', () => {
  setupTestDB();

  it('POST /api/projects creates a project within an organization', async () => {
    const { user, token } = await createTestUser('proj_owner@test.com');
    const { org } = await createTestOrg(user._id.toString(), 'Software House');

    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .set('x-organization-id', org._id.toString())
      .send({
        name: 'Backend Microservices',
        description: 'New service mesh architecture',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Backend Microservices');
    expect(res.body.data.organizationId).toBe(org._id.toString());
  });

  it('GET /api/projects/:id returns project details and task status metrics', async () => {
    const { user, token } = await createTestUser('proj_viewer@test.com');
    const { org } = await createTestOrg(user._id.toString(), 'Cloud Co');
    const project = await createTestProject(org._id.toString(), user._id.toString(), 'Web Portal');

    const res = await request(app)
      .get(`/api/projects/${project._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-organization-id', org._id.toString());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Web Portal');
    expect(res.body.data.metrics).toBeDefined();
    expect(res.body.data.metrics.total).toBe(0);
  });
});
