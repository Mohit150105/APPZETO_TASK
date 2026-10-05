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

describe('Integration: Task & Comment APIs', () => {
  setupTestDB();

  it('POST /api/tasks creates task in project', async () => {
    const { user, token } = await createTestUser('task_creator@test.com');
    const { org } = await createTestOrg(user._id.toString(), 'Tech Studio');
    const project = await createTestProject(org._id.toString(), user._id.toString());

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .set('x-organization-id', org._id.toString())
      .send({
        projectId: project._id.toString(),
        title: 'Build Login Form',
        description: 'Implement validation and JWT storing',
        status: 'TODO',
        priority: 'HIGH',
        labels: ['Frontend', 'Auth'],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Build Login Form');
    expect(res.body.data.status).toBe('TODO');
    expect(res.body.data.priority).toBe('HIGH');
    expect(res.body.data.version).toBe(1);
  });

  it('GET /api/tasks supports advanced search & combined filters', async () => {
    const { user, token } = await createTestUser('searcher@test.com');
    const { org } = await createTestOrg(user._id.toString(), 'Search Studio');
    const project = await createTestProject(org._id.toString(), user._id.toString());

    // Create 3 tasks
    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .set('x-organization-id', org._id.toString())
      .send({
        projectId: project._id.toString(),
        title: 'Optimize Database Query Indexes',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
      });

    await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .set('x-organization-id', org._id.toString())
      .send({
        projectId: project._id.toString(),
        title: 'Write Documentation',
        status: 'TODO',
        priority: 'LOW',
      });

    // Query with combined filters: status=IN_PROGRESS and priority=HIGH
    const res = await request(app)
      .get(`/api/tasks?projectId=${project._id}&status=IN_PROGRESS&priority=HIGH`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-organization-id', org._id.toString());

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('Optimize Database Query Indexes');
    expect(res.body.pagination).toBeDefined();

    // Text search filter
    const searchRes = await request(app)
      .get(`/api/tasks?search=Documentation`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-organization-id', org._id.toString());

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.length).toBe(1);
    expect(searchRes.body.data[0].title).toBe('Write Documentation');
  });

  it('PUT /api/tasks/:id atomically updates status and increments version', async () => {
    const { user, token } = await createTestUser('mover@test.com');
    const { org } = await createTestOrg(user._id.toString(), 'Kanban Org');
    const project = await createTestProject(org._id.toString(), user._id.toString());
    const task = await createTestTask(org._id.toString(), project._id.toString(), user._id.toString());

    const res = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-organization-id', org._id.toString())
      .send({
        status: 'DONE',
        version: 1,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('DONE');
    expect(res.body.data.version).toBe(2);
  });

  it('POST /api/tasks/:id/comments adds comment with mentions', async () => {
    const { user, token } = await createTestUser('commenter@test.com');
    const { user: mentioned } = await createTestUser('mentioned@test.com');
    const { org } = await createTestOrg(user._id.toString(), 'Comment Org');
    const project = await createTestProject(org._id.toString(), user._id.toString());
    const task = await createTestTask(org._id.toString(), project._id.toString(), user._id.toString());

    const res = await request(app)
      .post(`/api/tasks/${task._id}/comments`)
      .set('Authorization', `Bearer ${token}`)
      .set('x-organization-id', org._id.toString())
      .send({
        content: 'This task is ready for final review!',
        mentions: [mentioned._id.toString()],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.content).toBe('This task is ready for final review!');
  });
});
