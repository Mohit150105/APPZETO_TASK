import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { setupTestDB, app, createTestUser, createTestOrg, addTestMember } from '../setup';

describe('Integration: Organization & Membership APIs', () => {
  setupTestDB();

  it('POST /api/organizations creates org and assigns creator as OWNER', async () => {
    const { token } = await createTestUser('owner@test.com');

    const res = await request(app)
      .post('/api/organizations')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Acme Global' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Acme Global');
    expect(res.body.data.role).toBe('OWNER');
  });

  it('GET /api/organizations lists all organizations user belongs to', async () => {
    const { user, token } = await createTestUser('multi@test.com');
    await createTestOrg(user._id.toString(), 'Org Alpha');
    await createTestOrg(user._id.toString(), 'Org Beta');

    const res = await request(app)
      .get('/api/organizations')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  it('POST /api/organizations/:id/members allows OWNER to add new member', async () => {
    const { user: owner, token: ownerToken } = await createTestUser('owner2@test.com');
    const { user: invitedUser } = await createTestUser('invited@test.com');
    const { org } = await createTestOrg(owner._id.toString(), 'Corp');

    const res = await request(app)
      .post(`/api/organizations/${org._id}/members`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('x-organization-id', org._id.toString())
      .send({
        email: 'invited@test.com',
        role: 'MEMBER',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('MEMBER');
    expect(res.body.data.user.email).toBe('invited@test.com');
  });

  it('DELETE /api/organizations/:id/members/:userId allows removing member', async () => {
    const { user: owner, token: ownerToken } = await createTestUser('owner3@test.com');
    const { user: member } = await createTestUser('member3@test.com');
    const { org } = await createTestOrg(owner._id.toString(), 'Tech Org');
    await addTestMember(org._id.toString(), member._id.toString(), 'MEMBER');

    const res = await request(app)
      .delete(`/api/organizations/${org._id}/members/${member._id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .set('x-organization-id', org._id.toString());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('Rejects non-admin/non-owner from adding members (RBAC)', async () => {
    const { user: owner } = await createTestUser('owner4@test.com');
    const { user: member, token: memberToken } = await createTestUser('regular@test.com');
    const { user: other } = await createTestUser('other@test.com');
    const { org } = await createTestOrg(owner._id.toString(), 'Giga Org');
    await addTestMember(org._id.toString(), member._id.toString(), 'MEMBER');

    const res = await request(app)
      .post(`/api/organizations/${org._id}/members`)
      .set('Authorization', `Bearer ${memberToken}`)
      .set('x-organization-id', org._id.toString())
      .send({ email: other.email, role: 'MEMBER' });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
