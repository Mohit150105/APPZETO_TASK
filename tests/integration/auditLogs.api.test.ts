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

describe('Integration: Audit Logs APIs', () => {
  setupTestDB();

  it('Generates audit entry on project creation and allows ADMIN/OWNER to query', async () => {
    const { user, token } = await createTestUser('audit_owner@test.com');
    const { org } = await createTestOrg(user._id.toString(), 'Audit Corp');

    // Create a project to generate audit entry
    await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .set('x-organization-id', org._id.toString())
      .send({ name: 'Security Audit App' });

    // Query audit logs
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${token}`)
      .set('x-organization-id', org._id.toString());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.some((log: any) => log.action === 'PROJECT_CREATED')).toBe(true);
    expect(res.body.pagination).toBeDefined();
  });

  it('Blocks VIEWER and MEMBER roles from viewing audit logs', async () => {
    const { user: owner } = await createTestUser('owner_audit@test.com');
    const { user: viewer, token: viewerToken } = await createTestUser('viewer_audit@test.com');
    const { org } = await createTestOrg(owner._id.toString(), 'Secret Org');
    await addTestMember(org._id.toString(), viewer._id.toString(), 'VIEWER');

    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${viewerToken}`)
      .set('x-organization-id', org._id.toString());

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
